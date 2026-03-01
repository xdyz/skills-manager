package services

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// DependencyService 依赖管理服务
type DependencyService struct {
	ctx           context.Context
	skillsService *SkillsService
}

// SkillDependency 技能依赖关系
type SkillDependency struct {
	Name         string   `json:"name"`
	Dependencies []string `json:"dependencies"`
	Conflicts    []string `json:"conflicts"`
	Optional     []string `json:"optional"`
	Version      string   `json:"version"`
	Description  string   `json:"description"`
}

// DependencyGraph 依赖图
type DependencyGraph struct {
	Nodes []DependencyNode `json:"nodes"`
	Edges []DependencyEdge `json:"edges"`
}

// DependencyNode 依赖节点
type DependencyNode struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Type        string            `json:"type"` // skill, framework, language
	Installed   bool              `json:"installed"`
	Version     string            `json:"version"`
	Description string            `json:"description"`
	Metadata    map[string]string `json:"metadata"`
	Level       int               `json:"level"` // 依赖层级
}

// DependencyEdge 依赖边
type DependencyEdge struct {
	Source     string `json:"source"`
	Target     string `json:"target"`
	Type       string `json:"type"`       // requires, conflicts, optional
	Constraint string `json:"constraint"` // 版本约束
}

// ConflictInfo 冲突信息
type ConflictInfo struct {
	SkillA      string   `json:"skillA"`
	SkillB      string   `json:"skillB"`
	Type        string   `json:"type"`        // version, feature, resource
	Description string   `json:"description"`
	Severity    string   `json:"severity"`    // low, medium, high, critical
	Solutions   []string `json:"solutions"`
}

// DependencyAnalysis 依赖分析结果
type DependencyAnalysis struct {
	TotalSkills     int            `json:"totalSkills"`
	TotalDeps       int            `json:"totalDeps"`
	CircularDeps    [][]string     `json:"circularDeps"`
	Conflicts       []ConflictInfo `json:"conflicts"`
	MissingDeps     []string       `json:"missingDeps"`
	OptionalDeps    []string       `json:"optionalDeps"`
	MaxDepthLevel   int            `json:"maxDepthLevel"`
	HealthScore     float64        `json:"healthScore"`
	Recommendations []string       `json:"recommendations"`
}

// InstallPlan 安装计划
type InstallPlan struct {
	SkillName        string   `json:"skillName"`
	RequiredDeps     []string `json:"requiredDeps"`
	OptionalDeps     []string `json:"optionalDeps"`
	ConflictingSkills []string `json:"conflictingSkills"`
	InstallOrder     []string `json:"installOrder"`
	Warnings         []string `json:"warnings"`
	CanInstall       bool     `json:"canInstall"`
}

func NewDependencyService(skillsService *SkillsService) *DependencyService {
	return &DependencyService{
		skillsService: skillsService,
	}
}

func (ds *DependencyService) Startup(ctx context.Context) {
	ds.ctx = ctx
}

// GetDependencyGraph 获取依赖图
func (ds *DependencyService) GetDependencyGraph() (*DependencyGraph, error) {
	// 获取所有已安装的技能
	skills, err := ds.skillsService.GetAllAgentSkills()
	if err != nil {
		return nil, fmt.Errorf("failed to get skills: %w", err)
	}
	
	// 获取依赖信息
	dependencies, err := ds.loadDependencies()
	if err != nil {
		return nil, fmt.Errorf("failed to load dependencies: %w", err)
	}
	
	graph := &DependencyGraph{
		Nodes: []DependencyNode{},
		Edges: []DependencyEdge{},
	}
	
	nodeMap := make(map[string]bool)
	
	// 创建技能节点
	for _, skill := range skills {
		node := DependencyNode{
			ID:          skill.Name,
			Name:        skill.Name,
			Type:        "skill",
			Installed:   true,
			Description: skill.Desc,
			Metadata: map[string]string{
				"language":  skill.Language,
				"framework": skill.Framework,
				"source":    skill.Source,
			},
		}
		
		graph.Nodes = append(graph.Nodes, node)
		nodeMap[skill.Name] = true
	}
	
	// 创建依赖关系
	for _, dep := range dependencies {
		if !nodeMap[dep.Name] {
			continue // 跳过未安装的技能
		}
		
		// 添加依赖边
		for _, reqDep := range dep.Dependencies {
			// 如果依赖的技能也已安装，创建边
			if nodeMap[reqDep] {
				edge := DependencyEdge{
					Source: dep.Name,
					Target: reqDep,
					Type:   "requires",
				}
				graph.Edges = append(graph.Edges, edge)
			} else {
				// 添加缺失的依赖节点
				missingNode := DependencyNode{
					ID:        reqDep,
					Name:      reqDep,
					Type:      "skill",
					Installed: false,
				}
				graph.Nodes = append(graph.Nodes, missingNode)
				nodeMap[reqDep] = true
				
				edge := DependencyEdge{
					Source: dep.Name,
					Target: reqDep,
					Type:   "requires",
				}
				graph.Edges = append(graph.Edges, edge)
			}
		}
		
		// 添加冲突边
		for _, conflict := range dep.Conflicts {
			if nodeMap[conflict] {
				edge := DependencyEdge{
					Source: dep.Name,
					Target: conflict,
					Type:   "conflicts",
				}
				graph.Edges = append(graph.Edges, edge)
			}
		}
		
		// 添加可选依赖边
		for _, optional := range dep.Optional {
			if nodeMap[optional] {
				edge := DependencyEdge{
					Source: dep.Name,
					Target: optional,
					Type:   "optional",
				}
				graph.Edges = append(graph.Edges, edge)
			}
		}
	}
	
	// 计算节点层级
	ds.calculateNodeLevels(graph)
	
	return graph, nil
}

// AnalyzeDependencies 分析依赖关系
func (ds *DependencyService) AnalyzeDependencies() (*DependencyAnalysis, error) {
	graph, err := ds.GetDependencyGraph()
	if err != nil {
		return nil, err
	}
	
	analysis := &DependencyAnalysis{
		TotalSkills:     len(graph.Nodes),
		TotalDeps:       len(graph.Edges),
		CircularDeps:    [][]string{},
		Conflicts:       []ConflictInfo{},
		MissingDeps:     []string{},
		OptionalDeps:    []string{},
		Recommendations: []string{},
	}
	
	// 检测循环依赖
	analysis.CircularDeps = ds.detectCircularDependencies(graph)
	
	// 检测冲突
	analysis.Conflicts = ds.detectConflicts(graph)
	
	// 检测缺失依赖
	analysis.MissingDeps = ds.detectMissingDependencies(graph)
	
	// 检测可选依赖
	analysis.OptionalDeps = ds.detectOptionalDependencies(graph)
	
	// 计算最大深度
	analysis.MaxDepthLevel = ds.calculateMaxDepth(graph)
	
	// 计算健康分数
	analysis.HealthScore = ds.calculateHealthScore(analysis)
	
	// 生成建议
	analysis.Recommendations = ds.generateRecommendations(analysis)
	
	return analysis, nil
}

// CreateInstallPlan 创建安装计划
func (ds *DependencyService) CreateInstallPlan(skillName string) (*InstallPlan, error) {
	// 获取技能依赖信息
	dep, err := ds.getSkillDependency(skillName)
	if err != nil {
		return nil, fmt.Errorf("failed to get skill dependency: %w", err)
	}
	
	plan := &InstallPlan{
		SkillName:        skillName,
		RequiredDeps:     dep.Dependencies,
		OptionalDeps:     dep.Optional,
		ConflictingSkills: []string{},
		InstallOrder:     []string{},
		Warnings:         []string{},
		CanInstall:       true,
	}
	
	// 检查冲突
	installedSkills, err := ds.skillsService.GetAllAgentSkills()
	if err != nil {
		return nil, err
	}
	
	for _, skill := range installedSkills {
		for _, conflict := range dep.Conflicts {
			if skill.Name == conflict {
				plan.ConflictingSkills = append(plan.ConflictingSkills, skill.Name)
				plan.Warnings = append(plan.Warnings, fmt.Sprintf("Conflicts with installed skill: %s", skill.Name))
			}
		}
	}
	
	// 如果有冲突，不能安装
	if len(plan.ConflictingSkills) > 0 {
		plan.CanInstall = false
		return plan, nil
	}
	
	// 计算安装顺序
	plan.InstallOrder, err = ds.calculateInstallOrder(skillName, dep.Dependencies)
	if err != nil {
		plan.Warnings = append(plan.Warnings, fmt.Sprintf("Failed to calculate install order: %v", err))
	}
	
	return plan, nil
}

// AutoInstallDependencies 自动安装依赖
func (ds *DependencyService) AutoInstallDependencies(skillName string, agents []string) error {
	plan, err := ds.CreateInstallPlan(skillName)
	if err != nil {
		return fmt.Errorf("failed to create install plan: %w", err)
	}
	
	if !plan.CanInstall {
		return fmt.Errorf("cannot install %s due to conflicts: %v", skillName, plan.ConflictingSkills)
	}
	
	// 一次性获取所有已安装 skills，构建 set，避免循环内重复调用 GetAllAgentSkills
	allSkills, err := ds.skillsService.GetAllAgentSkills()
	if err != nil {
		return fmt.Errorf("failed to get installed skills: %w", err)
	}
	installedSet := make(map[string]bool, len(allSkills))
	for _, s := range allSkills {
		installedSet[s.Name] = true
	}
	
	// 按顺序安装依赖
	for _, depSkill := range plan.InstallOrder {
		if depSkill == skillName {
			continue // 跳过主技能本身
		}
		
		if !installedSet[depSkill] {
			// 尝试安装依赖技能
			err = ds.skillsService.InstallRemoteSkill(depSkill, agents)
			if err != nil {
				return fmt.Errorf("failed to install dependency %s: %w", depSkill, err)
			}
		}
	}
	
	return nil
}

// UpdateDependencyInfo 更新依赖信息
func (ds *DependencyService) UpdateDependencyInfo(skillName string, dep SkillDependency) error {
	dependencies, err := ds.loadDependencies()
	if err != nil {
		return fmt.Errorf("failed to load dependencies: %w", err)
	}
	
	// 更新或添加依赖信息
	found := false
	for i, d := range dependencies {
		if d.Name == skillName {
			dependencies[i] = dep
			found = true
			break
		}
	}
	
	if !found {
		dependencies = append(dependencies, dep)
	}
	
	// 保存到文件
	return ds.saveDependencies(dependencies)
}

// loadDependencies 加载依赖信息
func (ds *DependencyService) loadDependencies() ([]SkillDependency, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get home directory: %w", err)
	}
	
	configDir := filepath.Join(homeDir, ".skills-manager")
	depsFile := filepath.Join(configDir, "skill-dependencies.json")
	
	if _, err := os.Stat(depsFile); os.IsNotExist(err) {
		// 创建默认依赖配置
		defaultDeps := ds.getDefaultDependencies()
		ds.saveDependencies(defaultDeps)
		return defaultDeps, nil
	}
	
	data, err := os.ReadFile(depsFile)
	if err != nil {
		return nil, fmt.Errorf("failed to read dependencies file: %w", err)
	}
	
	var dependencies []SkillDependency
	if err := json.Unmarshal(data, &dependencies); err != nil {
		return nil, fmt.Errorf("failed to parse dependencies: %w", err)
	}
	
	return dependencies, nil
}

// saveDependencies 保存依赖信息
func (ds *DependencyService) saveDependencies(dependencies []SkillDependency) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}
	
	configDir := filepath.Join(homeDir, ".skills-manager")
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}
	
	depsFile := filepath.Join(configDir, "skill-dependencies.json")
	
	data, err := json.MarshalIndent(dependencies, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal dependencies: %w", err)
	}
	
	if err := os.WriteFile(depsFile, data, 0644); err != nil {
		return fmt.Errorf("failed to write dependencies file: %w", err)
	}
	
	return nil
}

// getDefaultDependencies 获取默认依赖配置
func (ds *DependencyService) getDefaultDependencies() []SkillDependency {
	return []SkillDependency{
		{
			Name:         "react-best-practices",
			Dependencies: []string{"javascript-best-practices", "typescript-guidelines"},
			Optional:     []string{"react-testing", "react-performance"},
			Conflicts:    []string{"vue-best-practices"},
			Description:  "React development best practices",
		},
		{
			Name:         "vue-best-practices",
			Dependencies: []string{"javascript-best-practices", "typescript-guidelines"},
			Optional:     []string{"vue-testing", "vue-performance"},
			Conflicts:    []string{"react-best-practices"},
			Description:  "Vue.js development best practices",
		},
		{
			Name:         "golang-pro",
			Dependencies: []string{},
			Optional:     []string{"go-testing", "go-performance"},
			Conflicts:    []string{},
			Description:  "Advanced Go programming techniques",
		},
		{
			Name:         "python-best-practices",
			Dependencies: []string{},
			Optional:     []string{"python-testing", "python-performance"},
			Conflicts:    []string{},
			Description:  "Python development best practices",
		},
	}
}

// detectCircularDependencies 检测循环依赖
func (ds *DependencyService) detectCircularDependencies(graph *DependencyGraph) [][]string {
	var cycles [][]string
	visited := make(map[string]bool)
	recStack := make(map[string]bool)
	
	// 构建邻接表
	adjList := make(map[string][]string)
	for _, edge := range graph.Edges {
		if edge.Type == "requires" {
			adjList[edge.Source] = append(adjList[edge.Source], edge.Target)
		}
	}
	
	// DFS 检测循环
	var dfs func(node string, path []string) bool
	dfs = func(node string, path []string) bool {
		visited[node] = true
		recStack[node] = true
		path = append(path, node)
		
		for _, neighbor := range adjList[node] {
			if !visited[neighbor] {
				if dfs(neighbor, path) {
					return true
				}
			} else if recStack[neighbor] {
				// 找到循环，提取循环路径
				cycleStart := -1
				for i, n := range path {
					if n == neighbor {
						cycleStart = i
						break
					}
				}
				if cycleStart != -1 {
					cycle := append(path[cycleStart:], neighbor)
					cycles = append(cycles, cycle)
				}
				return true
			}
		}
		
		recStack[node] = false
		return false
	}
	
	for _, node := range graph.Nodes {
		if !visited[node.ID] {
			dfs(node.ID, []string{})
		}
	}
	
	return cycles
}

// detectConflicts 检测冲突
func (ds *DependencyService) detectConflicts(graph *DependencyGraph) []ConflictInfo {
	var conflicts []ConflictInfo
	
	// 预构建已安装节点 set，将查找从 O(N) 降为 O(1)
	installedNodes := make(map[string]bool, len(graph.Nodes))
	for _, node := range graph.Nodes {
		if node.Installed {
			installedNodes[node.ID] = true
		}
	}
	
	for _, edge := range graph.Edges {
		if edge.Type == "conflicts" {
			if installedNodes[edge.Source] && installedNodes[edge.Target] {
				conflict := ConflictInfo{
					SkillA:      edge.Source,
					SkillB:      edge.Target,
					Type:        "feature",
					Description: fmt.Sprintf("%s conflicts with %s", edge.Source, edge.Target),
					Severity:    "medium",
					Solutions: []string{
						fmt.Sprintf("Remove %s", edge.Source),
						fmt.Sprintf("Remove %s", edge.Target),
						"Use alternative skills",
					},
				}
				conflicts = append(conflicts, conflict)
			}
		}
	}
	
	return conflicts
}

// detectMissingDependencies 检测缺失依赖
func (ds *DependencyService) detectMissingDependencies(graph *DependencyGraph) []string {
	var missing []string
	
	for _, node := range graph.Nodes {
		if !node.Installed {
			missing = append(missing, node.ID)
		}
	}
	
	return missing
}

// detectOptionalDependencies 检测可选依赖
func (ds *DependencyService) detectOptionalDependencies(graph *DependencyGraph) []string {
	var optional []string
	
	for _, edge := range graph.Edges {
		if edge.Type == "optional" {
			optional = append(optional, edge.Target)
		}
	}
	
	return optional
}

// calculateMaxDepth 计算最大深度
func (ds *DependencyService) calculateMaxDepth(graph *DependencyGraph) int {
	maxLevel := 0
	for _, node := range graph.Nodes {
		if node.Level > maxLevel {
			maxLevel = node.Level
		}
	}
	return maxLevel
}

// calculateNodeLevels 计算节点层级
func (ds *DependencyService) calculateNodeLevels(graph *DependencyGraph) {
	// 构建邻接表和入度表
	adjList := make(map[string][]string)
	inDegree := make(map[string]int)
	
	for _, node := range graph.Nodes {
		inDegree[node.ID] = 0
	}
	
	for _, edge := range graph.Edges {
		if edge.Type == "requires" {
			adjList[edge.Target] = append(adjList[edge.Target], edge.Source)
			inDegree[edge.Source]++
		}
	}
	
	// 拓扑排序计算层级
	queue := []string{}
	levels := make(map[string]int)
	
	// 找到所有入度为0的节点
	for nodeID, degree := range inDegree {
		if degree == 0 {
			queue = append(queue, nodeID)
			levels[nodeID] = 0
		}
	}
	
	// BFS 计算层级
	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]
		
		for _, neighbor := range adjList[current] {
			inDegree[neighbor]--
			if inDegree[neighbor] == 0 {
				levels[neighbor] = levels[current] + 1
				queue = append(queue, neighbor)
			}
		}
	}
	
	// 更新节点层级
	for i, node := range graph.Nodes {
		if level, exists := levels[node.ID]; exists {
			graph.Nodes[i].Level = level
		}
	}
}

// calculateHealthScore 计算健康分数
func (ds *DependencyService) calculateHealthScore(analysis *DependencyAnalysis) float64 {
	score := 100.0
	
	// 循环依赖扣分
	score -= float64(len(analysis.CircularDeps)) * 20.0
	
	// 冲突扣分
	for _, conflict := range analysis.Conflicts {
		switch conflict.Severity {
		case "critical":
			score -= 25.0
		case "high":
			score -= 15.0
		case "medium":
			score -= 10.0
		case "low":
			score -= 5.0
		}
	}
	
	// 缺失依赖扣分
	score -= float64(len(analysis.MissingDeps)) * 5.0
	
	// 确保分数在0-100之间
	if score < 0 {
		score = 0
	}
	
	return score
}

// generateRecommendations 生成建议
func (ds *DependencyService) generateRecommendations(analysis *DependencyAnalysis) []string {
	var recommendations []string
	
	if len(analysis.CircularDeps) > 0 {
		recommendations = append(recommendations, "Resolve circular dependencies to improve maintainability")
	}
	
	if len(analysis.Conflicts) > 0 {
		recommendations = append(recommendations, "Address skill conflicts to avoid runtime issues")
	}
	
	if len(analysis.MissingDeps) > 0 {
		recommendations = append(recommendations, "Install missing dependencies for complete functionality")
	}
	
	if analysis.MaxDepthLevel > 5 {
		recommendations = append(recommendations, "Consider simplifying dependency tree (current depth: "+fmt.Sprintf("%d", analysis.MaxDepthLevel)+")")
	}
	
	if analysis.HealthScore < 70 {
		recommendations = append(recommendations, "Dependency health score is low, consider cleanup and optimization")
	}
	
	return recommendations
}

// getSkillDependency 获取技能依赖信息
func (ds *DependencyService) getSkillDependency(skillName string) (*SkillDependency, error) {
	dependencies, err := ds.loadDependencies()
	if err != nil {
		return nil, err
	}
	
	for _, dep := range dependencies {
		if dep.Name == skillName {
			return &dep, nil
		}
	}
	
	// 如果没找到，返回空依赖
	return &SkillDependency{
		Name:         skillName,
		Dependencies: []string{},
		Conflicts:    []string{},
		Optional:     []string{},
	}, nil
}

// calculateInstallOrder 计算安装顺序
func (ds *DependencyService) calculateInstallOrder(skillName string, dependencies []string) ([]string, error) {
	var order []string
	visited := make(map[string]bool)
	
	// 递归添加依赖
	var addDeps func(skill string) error
	addDeps = func(skill string) error {
		if visited[skill] {
			return nil
		}
		
		visited[skill] = true
		
		// 获取当前技能的依赖
		dep, err := ds.getSkillDependency(skill)
		if err != nil {
			return err
		}
		
		// 先添加依赖的依赖
		for _, subDep := range dep.Dependencies {
			if err := addDeps(subDep); err != nil {
				return err
			}
		}
		
		// 再添加当前技能
		order = append(order, skill)
		return nil
	}
	
	// 添加所有依赖
	for _, dep := range dependencies {
		if err := addDeps(dep); err != nil {
			return nil, err
		}
	}
	
	// 最后添加主技能
	if err := addDeps(skillName); err != nil {
		return nil, err
	}
	
	return order, nil
}

// isSkillInstalled 检查技能是否已安装
func (ds *DependencyService) isSkillInstalled(skillName string) (bool, error) {
	skills, err := ds.skillsService.GetAllAgentSkills()
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