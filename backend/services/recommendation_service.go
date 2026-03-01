package services

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

// RecommendationService 智能推荐服务
type RecommendationService struct {
	ctx          context.Context
	skillsService *SkillsService
}

// RecommendationType 推荐类型
type RecommendationType string

const (
	RecommendationTypeProject   RecommendationType = "project-based"
	RecommendationTypeUsage     RecommendationType = "usage-based"
	RecommendationTypeCommunity RecommendationType = "community"
	RecommendationTypeRelated   RecommendationType = "related"
)

// EnhancedRecommendation 增强的推荐结果
type EnhancedRecommendation struct {
	SkillName   string             `json:"skillName"`
	FullName    string             `json:"fullName"`
	Description string             `json:"description"`
	Reason      string             `json:"reason"`
	Score       float64            `json:"score"`
	Type        RecommendationType `json:"type"`
	Tags        []string           `json:"tags"`
	Language    string             `json:"language"`
	Framework   string             `json:"framework"`
	Installs    int                `json:"installs"`
	Rating      float64            `json:"rating"`
	CreatedAt   time.Time          `json:"createdAt"`
}

// ProjectTypeDetection 项目类型检测结果
type ProjectTypeDetection struct {
	ProjectPath     string            `json:"projectPath"`
	DetectedTypes   []string          `json:"detectedTypes"`
	Languages       map[string]int    `json:"languages"`       // 语言及其文件数量
	Frameworks      []string          `json:"frameworks"`
	ConfigFiles     []string          `json:"configFiles"`
	Dependencies    map[string]string `json:"dependencies"`    // 依赖包及其版本
	SuggestedSkills []string          `json:"suggestedSkills"`
	Confidence      float64           `json:"confidence"`
}

// UsagePattern 使用模式
type UsagePattern struct {
	SkillName     string            `json:"skillName"`
	UsageCount    int               `json:"usageCount"`
	LastUsed      time.Time         `json:"lastUsed"`
	Frequency     float64           `json:"frequency"`     // 使用频率 (次/天)
	Context       map[string]string `json:"context"`       // 使用上下文
	RelatedSkills []string          `json:"relatedSkills"` // 经常一起使用的技能
}

func NewRecommendationService(skillsService *SkillsService) *RecommendationService {
	return &RecommendationService{
		skillsService: skillsService,
	}
}

func (rs *RecommendationService) Startup(ctx context.Context) {
	rs.ctx = ctx
}

// GetRecommendations 获取综合推荐
func (rs *RecommendationService) GetRecommendations(projectPath string, limit int) ([]EnhancedRecommendation, error) {
	if limit <= 0 {
		limit = 10
	}
	
	var allRecommendations []EnhancedRecommendation
	
	// 1. 基于项目类型的推荐
	if projectPath != "" {
		projectRecs, err := rs.getProjectBasedRecommendations(projectPath)
		if err == nil {
			allRecommendations = append(allRecommendations, projectRecs...)
		}
	}
	
	// 2. 基于使用频率的推荐
	usageRecs, err := rs.getUsageBasedRecommendations()
	if err == nil {
		allRecommendations = append(allRecommendations, usageRecs...)
	}
	
	// 3. 基于关联性的推荐
	relatedRecs, err := rs.getRelatedSkillRecommendations()
	if err == nil {
		allRecommendations = append(allRecommendations, relatedRecs...)
	}
	
	// 4. 基于社区热度的推荐
	communityRecs, err := rs.getCommunityRecommendations()
	if err == nil {
		allRecommendations = append(allRecommendations, communityRecs...)
	}
	
	// 去重并按分数排序
	uniqueRecs := rs.deduplicateRecommendations(allRecommendations)
	sort.Slice(uniqueRecs, func(i, j int) bool {
		return uniqueRecs[i].Score > uniqueRecs[j].Score
	})
	
	// 限制返回数量
	if len(uniqueRecs) > limit {
		uniqueRecs = uniqueRecs[:limit]
	}
	
	return uniqueRecs, nil
}

// DetectProjectType 检测项目类型
func (rs *RecommendationService) DetectProjectType(projectPath string) (*ProjectTypeDetection, error) {
	if projectPath == "" {
		return nil, fmt.Errorf("project path is required")
	}
	
	detection := &ProjectTypeDetection{
		ProjectPath:   projectPath,
		DetectedTypes: []string{},
		Languages:     make(map[string]int),
		Frameworks:    []string{},
		ConfigFiles:   []string{},
		Dependencies:  make(map[string]string),
	}
	
	// 扫描项目文件
	err := filepath.Walk(projectPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // 忽略错误，继续扫描
		}
		
		// 跳过隐藏目录和 node_modules
		if info.IsDir() {
			name := info.Name()
			if strings.HasPrefix(name, ".") || name == "node_modules" || name == "vendor" {
				return filepath.SkipDir
			}
			return nil
		}
		
		fileName := info.Name()
		ext := filepath.Ext(fileName)
		
		// 统计语言文件
		rs.countLanguageFiles(ext, detection)
		
		// 检测配置文件
		rs.detectConfigFiles(fileName, path, detection)
		
		return nil
	})
	
	if err != nil {
		return nil, fmt.Errorf("failed to scan project: %w", err)
	}
	
	// 分析检测结果
	rs.analyzeDetectionResults(detection)
	
	return detection, nil
}

// countLanguageFiles 统计语言文件
func (rs *RecommendationService) countLanguageFiles(ext string, detection *ProjectTypeDetection) {
	languageMap := map[string]string{
		".js":   "JavaScript",
		".jsx":  "JavaScript",
		".ts":   "TypeScript",
		".tsx":  "TypeScript",
		".py":   "Python",
		".go":   "Go",
		".java": "Java",
		".cpp":  "C++",
		".c":    "C",
		".cs":   "C#",
		".php":  "PHP",
		".rb":   "Ruby",
		".rs":   "Rust",
		".kt":   "Kotlin",
		".swift": "Swift",
		".dart": "Dart",
		".vue":  "Vue",
	}
	
	if language, exists := languageMap[ext]; exists {
		detection.Languages[language]++
	}
}

// detectConfigFiles 检测配置文件
func (rs *RecommendationService) detectConfigFiles(fileName, fullPath string, detection *ProjectTypeDetection) {
	configFiles := map[string][]string{
		"package.json":     {"Node.js", "JavaScript", "TypeScript"},
		"go.mod":          {"Go"},
		"requirements.txt": {"Python"},
		"Pipfile":         {"Python"},
		"pom.xml":         {"Java", "Maven"},
		"build.gradle":    {"Java", "Gradle"},
		"Cargo.toml":      {"Rust"},
		"composer.json":   {"PHP"},
		"Gemfile":         {"Ruby"},
		"pubspec.yaml":    {"Dart", "Flutter"},
		"angular.json":    {"Angular"},
		"vue.config.js":   {"Vue"},
		"nuxt.config.js":  {"Nuxt"},
		"next.config.js":  {"Next.js"},
		"vite.config.js":  {"Vite"},
		"webpack.config.js": {"Webpack"},
		"tsconfig.json":   {"TypeScript"},
		"Dockerfile":      {"Docker"},
		"docker-compose.yml": {"Docker"},
		"k8s.yaml":        {"Kubernetes"},
		".gitignore":      {"Git"},
	}
	
	if types, exists := configFiles[fileName]; exists {
		detection.ConfigFiles = append(detection.ConfigFiles, fileName)
		for _, t := range types {
			if !containsStr(detection.DetectedTypes, t) {
				detection.DetectedTypes = append(detection.DetectedTypes, t)
			}
		}
		
		// 解析依赖文件
		rs.parseDependencies(fileName, fullPath, detection)
	}
}

// parseDependencies 解析依赖文件
func (rs *RecommendationService) parseDependencies(fileName, fullPath string, detection *ProjectTypeDetection) {
	switch fileName {
	case "package.json":
		rs.parsePackageJson(fullPath, detection)
	case "go.mod":
		rs.parseGoMod(fullPath, detection)
	case "requirements.txt":
		rs.parseRequirementsTxt(fullPath, detection)
	}
}

// parsePackageJson 解析 package.json
func (rs *RecommendationService) parsePackageJson(filePath string, detection *ProjectTypeDetection) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return
	}
	
	var pkg struct {
		Dependencies    map[string]string `json:"dependencies"`
		DevDependencies map[string]string `json:"devDependencies"`
		Scripts         map[string]string `json:"scripts"`
	}
	
	if err := json.Unmarshal(data, &pkg); err != nil {
		return
	}
	
	// 检测框架
	frameworks := map[string]string{
		"react":     "React",
		"vue":       "Vue",
		"angular":   "Angular",
		"next":      "Next.js",
		"nuxt":      "Nuxt",
		"express":   "Express",
		"fastify":   "Fastify",
		"nestjs":    "NestJS",
		"svelte":    "Svelte",
	}
	
	for dep := range pkg.Dependencies {
		for key, framework := range frameworks {
			if strings.Contains(dep, key) {
				if !containsStr(detection.Frameworks, framework) {
					detection.Frameworks = append(detection.Frameworks, framework)
				}
				detection.Dependencies[dep] = pkg.Dependencies[dep]
			}
		}
	}
	
	for dep := range pkg.DevDependencies {
		for key, framework := range frameworks {
			if strings.Contains(dep, key) {
				if !containsStr(detection.Frameworks, framework) {
					detection.Frameworks = append(detection.Frameworks, framework)
				}
				detection.Dependencies[dep] = pkg.DevDependencies[dep]
			}
		}
	}
}

// parseGoMod 解析 go.mod
func (rs *RecommendationService) parseGoMod(filePath string, detection *ProjectTypeDetection) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return
	}
	
	content := string(data)
	lines := strings.Split(content, "\n")
	
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "require") || strings.Contains(line, "github.com") {
			// 检测 Go 框架
			if strings.Contains(line, "gin") {
				detection.Frameworks = append(detection.Frameworks, "Gin")
			} else if strings.Contains(line, "echo") {
				detection.Frameworks = append(detection.Frameworks, "Echo")
			} else if strings.Contains(line, "fiber") {
				detection.Frameworks = append(detection.Frameworks, "Fiber")
			} else if strings.Contains(line, "grpc") {
				detection.Frameworks = append(detection.Frameworks, "gRPC")
			}
		}
	}
}

// parseRequirementsTxt 解析 requirements.txt
func (rs *RecommendationService) parseRequirementsTxt(filePath string, detection *ProjectTypeDetection) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return
	}
	
	content := string(data)
	lines := strings.Split(content, "\n")
	
	frameworks := map[string]string{
		"django":    "Django",
		"flask":     "Flask",
		"fastapi":   "FastAPI",
		"tornado":   "Tornado",
		"pandas":    "Pandas",
		"numpy":     "NumPy",
		"tensorflow": "TensorFlow",
		"pytorch":   "PyTorch",
		"scikit-learn": "Scikit-learn",
	}
	
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		
		parts := strings.Split(line, "==")
		if len(parts) > 0 {
			pkg := strings.ToLower(parts[0])
			version := ""
			if len(parts) > 1 {
				version = parts[1]
			}
			
			for key, framework := range frameworks {
				if strings.Contains(pkg, key) {
					if !containsStr(detection.Frameworks, framework) {
						detection.Frameworks = append(detection.Frameworks, framework)
					}
					detection.Dependencies[pkg] = version
				}
			}
		}
	}
}

// analyzeDetectionResults 分析检测结果
func (rs *RecommendationService) analyzeDetectionResults(detection *ProjectTypeDetection) {
	// 计算置信度
	totalFiles := 0
	for _, count := range detection.Languages {
		totalFiles += count
	}
	
	if totalFiles > 0 {
		detection.Confidence = float64(len(detection.DetectedTypes)) / 10.0
		if detection.Confidence > 1.0 {
			detection.Confidence = 1.0
		}
	}
	
	// 生成推荐技能
	detection.SuggestedSkills = rs.generateSuggestedSkills(detection)
}

// generateSuggestedSkills 生成推荐技能
func (rs *RecommendationService) generateSuggestedSkills(detection *ProjectTypeDetection) []string {
	var skills []string
	
	// 基于语言推荐
	languageSkills := map[string][]string{
		"JavaScript": {"javascript-best-practices", "node-development"},
		"TypeScript": {"typescript-guidelines", "type-safety"},
		"React":      {"react-best-practices", "react-hooks"},
		"Vue":        {"vue-best-practices", "vue-composition"},
		"Python":     {"python-best-practices", "python-testing"},
		"Go":         {"golang-pro", "go-concurrency"},
		"Java":       {"java-best-practices", "spring-boot"},
	}
	
	// 基于框架推荐
	frameworkSkills := map[string][]string{
		"React":    {"react-performance", "react-testing"},
		"Vue":      {"vue-testing", "vue-performance"},
		"Next.js":  {"nextjs-optimization", "ssr-best-practices"},
		"Express":  {"express-security", "node-api-design"},
		"Django":   {"django-best-practices", "python-web"},
		"FastAPI":  {"fastapi-development", "python-async"},
	}
	
	// 收集推荐技能
	for language := range detection.Languages {
		if langSkills, exists := languageSkills[language]; exists {
			skills = append(skills, langSkills...)
		}
	}
	
	for _, framework := range detection.Frameworks {
		if frameSkills, exists := frameworkSkills[framework]; exists {
			skills = append(skills, frameSkills...)
		}
	}
	
	// 去重
	return removeDuplicates(skills)
}

// getProjectBasedRecommendations 基于项目类型的推荐
func (rs *RecommendationService) getProjectBasedRecommendations(projectPath string) ([]EnhancedRecommendation, error) {
	detection, err := rs.DetectProjectType(projectPath)
	if err != nil {
		return nil, err
	}
	
	var recommendations []EnhancedRecommendation
	
	for _, skillName := range detection.SuggestedSkills {
		// 搜索远程技能
		remoteSkills, err := rs.skillsService.FindRemoteSkills(skillName)
		if err != nil {
			continue
		}
		
		for _, skill := range remoteSkills {
			if skill.Installed {
				continue
			}
			
			rec := EnhancedRecommendation{
				SkillName:   skill.Name,
				FullName:    skill.FullName,
				Description: skill.Description,
				Reason:      fmt.Sprintf("Recommended for %s project", strings.Join(detection.DetectedTypes, ", ")),
				Score:       0.8 * detection.Confidence,
				Type:        RecommendationTypeProject,
				Installs:    skill.Installs,
				CreatedAt:   time.Now(),
			}
			
			recommendations = append(recommendations, rec)
		}
	}
	
	return recommendations, nil
}

// getUsageBasedRecommendations 基于使用频率的推荐
func (rs *RecommendationService) getUsageBasedRecommendations() ([]EnhancedRecommendation, error) {
	patterns, err := rs.getUsagePatterns()
	if err != nil {
		return nil, err
	}
	
	// 一次性获取所有已安装 skills，构建 set，避免循环内重复调用
	allSkills, err := rs.skillsService.GetAllAgentSkills()
	if err != nil {
		return nil, err
	}
	installedSet := make(map[string]bool, len(allSkills))
	for _, s := range allSkills {
		installedSet[s.Name] = true
	}
	
	var recommendations []EnhancedRecommendation
	
	// 基于使用模式推荐相关技能
	for _, pattern := range patterns {
		for _, relatedSkill := range pattern.RelatedSkills {
			if installedSet[relatedSkill] {
				continue
			}
			
			rec := EnhancedRecommendation{
				SkillName:   relatedSkill,
				Description: fmt.Sprintf("Often used with %s", pattern.SkillName),
				Reason:      fmt.Sprintf("Users who use %s also use this skill", pattern.SkillName),
				Score:       0.7 * pattern.Frequency,
				Type:        RecommendationTypeUsage,
				CreatedAt:   time.Now(),
			}
			
			recommendations = append(recommendations, rec)
		}
	}
	
	return recommendations, nil
}

// getRelatedSkillRecommendations 基于关联性的推荐
func (rs *RecommendationService) getRelatedSkillRecommendations() ([]EnhancedRecommendation, error) {
	// 获取已安装的技能
	skills, err := rs.skillsService.GetAllAgentSkills()
	if err != nil {
		return nil, err
	}
	
	var recommendations []EnhancedRecommendation
	
	// 基于标签和框架推荐相关技能
	for _, skill := range skills {
		// 搜索相关技能
		searchTerms := []string{skill.Language, skill.Framework}
		tags, _ := rs.skillsService.GetSkillTags(skill.Name)
		searchTerms = append(searchTerms, tags...)
		
		for _, term := range searchTerms {
			if term == "" {
				continue
			}
			
			remoteSkills, err := rs.skillsService.FindRemoteSkills(term)
			if err != nil {
				continue
			}
			
			for _, remoteSkill := range remoteSkills {
				if remoteSkill.Installed {
					continue
				}
				
				rec := EnhancedRecommendation{
					SkillName:   remoteSkill.Name,
					FullName:    remoteSkill.FullName,
					Description: remoteSkill.Description,
					Reason:      fmt.Sprintf("Related to %s (%s)", skill.Name, term),
					Score:       0.6,
					Type:        RecommendationTypeRelated,
					Language:    skill.Language,
					Framework:   skill.Framework,
					Installs:    remoteSkill.Installs,
					CreatedAt:   time.Now(),
				}
				
				recommendations = append(recommendations, rec)
			}
		}
	}
	
	return recommendations, nil
}

// getCommunityRecommendations 基于社区热度的推荐
func (rs *RecommendationService) getCommunityRecommendations() ([]EnhancedRecommendation, error) {
	// 搜索热门技能
	popularTerms := []string{"react", "vue", "python", "golang", "typescript", "javascript"}
	
	var recommendations []EnhancedRecommendation
	
	for _, term := range popularTerms {
		remoteSkills, err := rs.skillsService.FindRemoteSkills(term)
		if err != nil {
			continue
		}
		
		// 选择安装量最高的技能
		sort.Slice(remoteSkills, func(i, j int) bool {
			return remoteSkills[i].Installs > remoteSkills[j].Installs
		})
		
		for i, skill := range remoteSkills {
			if i >= 2 || skill.Installed { // 每个类别最多推荐2个
				break
			}
			
			score := 0.5 + float64(skill.Installs)/1000.0
			if score > 1.0 {
				score = 1.0
			}
			
			rec := EnhancedRecommendation{
				SkillName:   skill.Name,
				FullName:    skill.FullName,
				Description: skill.Description,
				Reason:      fmt.Sprintf("Popular in community (%d installs)", skill.Installs),
				Score:       score,
				Type:        RecommendationTypeCommunity,
				Installs:    skill.Installs,
				CreatedAt:   time.Now(),
			}
			
			recommendations = append(recommendations, rec)
		}
	}
	
	return recommendations, nil
}

// getUsagePatterns 获取使用模式
func (rs *RecommendationService) getUsagePatterns() ([]UsagePattern, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get home directory: %w", err)
	}
	
	configDir := filepath.Join(homeDir, ".skills-manager")
	patternsFile := filepath.Join(configDir, "usage-patterns.json")
	
	if _, err := os.Stat(patternsFile); os.IsNotExist(err) {
		return []UsagePattern{}, nil
	}
	
	data, err := os.ReadFile(patternsFile)
	if err != nil {
		return nil, fmt.Errorf("failed to read usage patterns: %w", err)
	}
	
	var patterns []UsagePattern
	if err := json.Unmarshal(data, &patterns); err != nil {
		return nil, fmt.Errorf("failed to parse usage patterns: %w", err)
	}
	
	return patterns, nil
}

// isSkillInstalled 检查技能是否已安装
func (rs *RecommendationService) isSkillInstalled(skillName string) (bool, error) {
	skills, err := rs.skillsService.GetAllAgentSkills()
	if err != nil {
		return false, err
	}
	
	for _, skill := range skills {
		if skill.Name == skillName {
			return true, nil
		}
	}
	
	return false, nil
}

// deduplicateRecommendations 去重推荐结果
func (rs *RecommendationService) deduplicateRecommendations(recommendations []EnhancedRecommendation) []EnhancedRecommendation {
	seen := make(map[string]bool)
	var unique []EnhancedRecommendation
	
	for _, rec := range recommendations {
		key := rec.SkillName
		if rec.FullName != "" {
			key = rec.FullName
		}
		
		if !seen[key] {
			seen[key] = true
			unique = append(unique, rec)
		}
	}
	
	return unique
}

// 辅助函数
func containsStr(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func removeDuplicates(slice []string) []string {
	seen := make(map[string]bool)
	var result []string
	
	for _, item := range slice {
		if !seen[item] {
			seen[item] = true
			result = append(result, item)
		}
	}
	
	return result
}