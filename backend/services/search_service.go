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

// SearchService 高级搜索服务
type SearchService struct {
	ctx           context.Context
	skillsService *SkillsService
	searchIndex   *SearchIndex
}

// SearchIndex 搜索索引
type SearchIndex struct {
	Skills    map[string]*IndexedSkill `json:"skills"`
	Tags      map[string][]string      `json:"tags"`      // tag -> skill names
	Languages map[string][]string      `json:"languages"` // language -> skill names
	Frameworks map[string][]string     `json:"frameworks"` // framework -> skill names
	Keywords  map[string][]string      `json:"keywords"`  // keyword -> skill names
	UpdatedAt time.Time               `json:"updatedAt"`
}

// IndexedSkill 索引中的技能
type IndexedSkill struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Content     string   `json:"content"`
	Language    string   `json:"language"`
	Framework   string   `json:"framework"`
	Tags        []string `json:"tags"`
	Keywords    []string `json:"keywords"`
	Source      string   `json:"source"`
	Path        string   `json:"path"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// SearchQuery 搜索查询
type SearchQuery struct {
	Query       string   `json:"query"`
	Languages   []string `json:"languages"`
	Frameworks  []string `json:"frameworks"`
	Tags        []string `json:"tags"`
	Sources     []string `json:"sources"`
	Installed   *bool    `json:"installed"`   // nil=all, true=installed only, false=not installed only
	Fuzzy       bool     `json:"fuzzy"`       // 模糊搜索
	CaseSensitive bool   `json:"caseSensitive"`
	Limit       int      `json:"limit"`
	Offset      int      `json:"offset"`
	SortBy      string   `json:"sortBy"`      // relevance, name, date, usage
	SortOrder   string   `json:"sortOrder"`   // asc, desc
}

// SearchResult 搜索结果
type SearchResult struct {
	Skills      []SearchResultItem `json:"skills"`
	Total       int                `json:"total"`
	Query       SearchQuery        `json:"query"`
	Suggestions []string           `json:"suggestions"`
	Facets      SearchFacets       `json:"facets"`
	Duration    time.Duration      `json:"duration"`
}

// SearchResultItem 搜索结果项
type SearchResultItem struct {
	Skill     IndexedSkill `json:"skill"`
	Score     float64      `json:"score"`
	Matches   []Match      `json:"matches"`
	Installed bool         `json:"installed"`
}

// Match 匹配信息
type Match struct {
	Field     string `json:"field"`     // name, description, content, tags
	Text      string `json:"text"`      // 匹配的文本
	Highlight string `json:"highlight"` // 高亮的文本
	Position  int    `json:"position"`  // 匹配位置
}

// SearchFacets 搜索分面
type SearchFacets struct {
	Languages  map[string]int `json:"languages"`
	Frameworks map[string]int `json:"frameworks"`
	Tags       map[string]int `json:"tags"`
	Sources    map[string]int `json:"sources"`
}

// SearchHistory 搜索历史
type SearchHistory struct {
	Query     string    `json:"query"`
	Timestamp time.Time `json:"timestamp"`
	Results   int       `json:"results"`
}

// SearchSuggestion 搜索建议
type SearchSuggestion struct {
	Text        string  `json:"text"`
	Type        string  `json:"type"`        // query, skill, tag, language, framework
	Score       float64 `json:"score"`
	Description string  `json:"description"`
}

func NewSearchService(skillsService *SkillsService) *SearchService {
	return &SearchService{
		skillsService: skillsService,
		searchIndex:   &SearchIndex{
			Skills:    make(map[string]*IndexedSkill),
			Tags:      make(map[string][]string),
			Languages: make(map[string][]string),
			Frameworks: make(map[string][]string),
			Keywords:  make(map[string][]string),
		},
	}
}

func (ss *SearchService) Startup(ctx context.Context) {
	ss.ctx = ctx
	
	// 加载搜索索引
	if err := ss.loadSearchIndex(); err != nil {
		fmt.Printf("Warning: failed to load search index: %v\n", err)
	}
	
	// 如果索引为空或过期，重建索引
	if len(ss.searchIndex.Skills) == 0 || time.Since(ss.searchIndex.UpdatedAt) > 24*time.Hour {
		go ss.rebuildIndex()
	}
	
	// 启动定期索引更新
	go ss.startIndexUpdater()
}

// Search 执行搜索
func (ss *SearchService) Search(query SearchQuery) (*SearchResult, error) {
	startTime := time.Now()
	
	// 设置默认值
	if query.Limit <= 0 {
		query.Limit = 20
	}
	if query.SortBy == "" {
		query.SortBy = "relevance"
	}
	if query.SortOrder == "" {
		query.SortOrder = "desc"
	}
	
	// 执行搜索
	var candidates []SearchResultItem
	
	if query.Query == "" {
		// 无查询词，返回所有技能
		candidates = ss.getAllSkills()
	} else {
		// 有查询词，执行搜索
		candidates = ss.searchSkills(query)
	}
	
	// 应用过滤器
	candidates = ss.applyFilters(candidates, query)
	
	// 排序
	ss.sortResults(candidates, query.SortBy, query.SortOrder)
	
	// 分页
	total := len(candidates)
	start := query.Offset
	end := start + query.Limit
	
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}
	
	pagedResults := candidates[start:end]
	
	// 生成建议和分面
	suggestions := ss.generateSuggestions(query.Query)
	facets := ss.generateFacets(candidates)
	
	result := &SearchResult{
		Skills:      pagedResults,
		Total:       total,
		Query:       query,
		Suggestions: suggestions,
		Facets:      facets,
		Duration:    time.Since(startTime),
	}
	
	// 记录搜索历史
	ss.recordSearchHistory(query.Query, total)
	
	return result, nil
}

// GetSearchSuggestions 获取搜索建议
func (ss *SearchService) GetSearchSuggestions(prefix string, limit int) ([]SearchSuggestion, error) {
	if limit <= 0 {
		limit = 10
	}
	
	var suggestions []SearchSuggestion
	prefix = strings.ToLower(prefix)
	
	// 技能名称建议
	for name, skill := range ss.searchIndex.Skills {
		if strings.HasPrefix(strings.ToLower(name), prefix) {
			suggestions = append(suggestions, SearchSuggestion{
				Text:        name,
				Type:        "skill",
				Score:       0.9,
				Description: skill.Description,
			})
		}
	}
	
	// 标签建议
	for tag := range ss.searchIndex.Tags {
		if strings.HasPrefix(strings.ToLower(tag), prefix) {
			suggestions = append(suggestions, SearchSuggestion{
				Text:        tag,
				Type:        "tag",
				Score:       0.7,
				Description: fmt.Sprintf("Tag: %s", tag),
			})
		}
	}
	
	// 语言建议
	for lang := range ss.searchIndex.Languages {
		if strings.HasPrefix(strings.ToLower(lang), prefix) {
			suggestions = append(suggestions, SearchSuggestion{
				Text:        lang,
				Type:        "language",
				Score:       0.8,
				Description: fmt.Sprintf("Language: %s", lang),
			})
		}
	}
	
	// 框架建议
	for framework := range ss.searchIndex.Frameworks {
		if strings.HasPrefix(strings.ToLower(framework), prefix) {
			suggestions = append(suggestions, SearchSuggestion{
				Text:        framework,
				Type:        "framework",
				Score:       0.8,
				Description: fmt.Sprintf("Framework: %s", framework),
			})
		}
	}
	
	// 按分数排序
	sort.Slice(suggestions, func(i, j int) bool {
		return suggestions[i].Score > suggestions[j].Score
	})
	
	// 限制数量
	if len(suggestions) > limit {
		suggestions = suggestions[:limit]
	}
	
	return suggestions, nil
}

// GetSearchHistory 获取搜索历史
func (ss *SearchService) GetSearchHistory(limit int) ([]SearchHistory, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get home directory: %w", err)
	}
	
	historyFile := filepath.Join(homeDir, ".skills-manager", "search-history.json")
	
	if _, err := os.Stat(historyFile); os.IsNotExist(err) {
		return []SearchHistory{}, nil
	}
	
	data, err := os.ReadFile(historyFile)
	if err != nil {
		return nil, fmt.Errorf("failed to read search history: %w", err)
	}
	
	var history []SearchHistory
	if err := json.Unmarshal(data, &history); err != nil {
		return nil, fmt.Errorf("failed to parse search history: %w", err)
	}
	
	// 按时间倒序排列
	sort.Slice(history, func(i, j int) bool {
		return history[i].Timestamp.After(history[j].Timestamp)
	})
	
	// 限制数量
	if limit > 0 && len(history) > limit {
		history = history[:limit]
	}
	
	return history, nil
}

// ClearSearchHistory 清空搜索历史
func (ss *SearchService) ClearSearchHistory() error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}
	
	historyFile := filepath.Join(homeDir, ".skills-manager", "search-history.json")
	
	if err := os.Remove(historyFile); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to remove search history: %w", err)
	}
	
	return nil
}

// RebuildIndex 重建搜索索引
func (ss *SearchService) RebuildIndex() error {
	return ss.rebuildIndex()
}

// rebuildIndex 重建索引
func (ss *SearchService) rebuildIndex() error {
	fmt.Println("Rebuilding search index...")
	
	// 重置索引
	ss.searchIndex = &SearchIndex{
		Skills:    make(map[string]*IndexedSkill),
		Tags:      make(map[string][]string),
		Languages: make(map[string][]string),
		Frameworks: make(map[string][]string),
		Keywords:  make(map[string][]string),
		UpdatedAt: time.Now(),
	}
	
	// 索引本地技能
	if err := ss.indexLocalSkills(); err != nil {
		return fmt.Errorf("failed to index local skills: %w", err)
	}
	
	// 索引远程技能（可选）
	ss.indexRemoteSkills()
	
	// 保存索引
	if err := ss.saveSearchIndex(); err != nil {
		return fmt.Errorf("failed to save search index: %w", err)
	}
	
	fmt.Printf("Search index rebuilt with %d skills\n", len(ss.searchIndex.Skills))
	return nil
}

// indexLocalSkills 索引本地技能
func (ss *SearchService) indexLocalSkills() error {
	skills, err := ss.skillsService.GetAllAgentSkills()
	if err != nil {
		return err
	}
	
	for _, skill := range skills {
		// 读取技能内容
		content := ""
		if skill.Path != "" {
			skillMdPath := filepath.Join(skill.Path, "SKILL.md")
			if data, err := os.ReadFile(skillMdPath); err == nil {
				content = string(data)
			}
		}
		
		// 获取标签
		tags, _ := ss.skillsService.GetSkillTags(skill.Name)
		
		// 提取关键词
		keywords := ss.extractKeywords(skill.Name, skill.Desc, content)
		
		// 创建索引项
		indexedSkill := &IndexedSkill{
			Name:        skill.Name,
			Description: skill.Desc,
			Content:     content,
			Language:    skill.Language,
			Framework:   skill.Framework,
			Tags:        tags,
			Keywords:    keywords,
			Source:      skill.Source,
			Path:        skill.Path,
			UpdatedAt:   time.Now(),
		}
		
		ss.searchIndex.Skills[skill.Name] = indexedSkill
		
		// 更新反向索引
		ss.updateReverseIndex(skill.Name, indexedSkill)
	}
	
	return nil
}

// indexRemoteSkills 索引远程技能
func (ss *SearchService) indexRemoteSkills() {
	// 搜索一些常见关键词来获取远程技能
	commonTerms := []string{"react", "vue", "python", "golang", "javascript", "typescript"}
	
	for _, term := range commonTerms {
		remoteSkills, err := ss.skillsService.FindRemoteSkills(term)
		if err != nil {
			continue
		}
		
		for _, skill := range remoteSkills {
			if _, exists := ss.searchIndex.Skills[skill.Name]; exists {
				continue // 已存在，跳过
			}
			
			// 提取关键词
			keywords := ss.extractKeywords(skill.Name, skill.Description, "")
			
			// 创建索引项
			indexedSkill := &IndexedSkill{
				Name:        skill.Name,
				Description: skill.Description,
				Content:     "",
				Language:    "",
				Framework:   "",
				Tags:        []string{},
				Keywords:    keywords,
				Source:      skill.Owner + "/" + skill.Repo,
				Path:        "",
				UpdatedAt:   time.Now(),
			}
			
			ss.searchIndex.Skills[skill.Name] = indexedSkill
			
			// 更新反向索引
			ss.updateReverseIndex(skill.Name, indexedSkill)
		}
	}
}

// updateReverseIndex 更新反向索引
func (ss *SearchService) updateReverseIndex(skillName string, skill *IndexedSkill) {
	// 标签索引
	for _, tag := range skill.Tags {
		ss.searchIndex.Tags[tag] = append(ss.searchIndex.Tags[tag], skillName)
	}
	
	// 语言索引
	if skill.Language != "" {
		ss.searchIndex.Languages[skill.Language] = append(ss.searchIndex.Languages[skill.Language], skillName)
	}
	
	// 框架索引
	if skill.Framework != "" {
		ss.searchIndex.Frameworks[skill.Framework] = append(ss.searchIndex.Frameworks[skill.Framework], skillName)
	}
	
	// 关键词索引
	for _, keyword := range skill.Keywords {
		ss.searchIndex.Keywords[keyword] = append(ss.searchIndex.Keywords[keyword], skillName)
	}
}

// extractKeywords 提取关键词
func (ss *SearchService) extractKeywords(name, description, content string) []string {
	var keywords []string
	
	// 从名称中提取
	nameWords := strings.Fields(strings.ReplaceAll(name, "-", " "))
	keywords = append(keywords, nameWords...)
	
	// 从描述中提取
	descWords := strings.Fields(description)
	keywords = append(keywords, descWords...)
	
	// 从内容中提取常见技术词汇
	techWords := []string{
		"react", "vue", "angular", "javascript", "typescript", "python", "golang", "java",
		"api", "rest", "graphql", "database", "sql", "nosql", "mongodb", "postgresql",
		"docker", "kubernetes", "aws", "azure", "gcp", "microservice", "serverless",
		"testing", "unit", "integration", "e2e", "ci", "cd", "devops", "git",
	}
	
	contentLower := strings.ToLower(content)
	for _, word := range techWords {
		if strings.Contains(contentLower, word) {
			keywords = append(keywords, word)
		}
	}
	
	// 去重和清理
	return ss.cleanKeywords(keywords)
}

// cleanKeywords 清理关键词
func (ss *SearchService) cleanKeywords(keywords []string) []string {
	seen := make(map[string]bool)
	var cleaned []string
	
	for _, keyword := range keywords {
		// 转换为小写
		keyword = strings.ToLower(keyword)
		
		// 移除标点符号
		keyword = strings.Trim(keyword, ".,!?;:()[]{}\"'")
		
		// 跳过短词和常见词
		if len(keyword) < 3 || ss.isStopWord(keyword) {
			continue
		}
		
		if !seen[keyword] {
			seen[keyword] = true
			cleaned = append(cleaned, keyword)
		}
	}
	
	return cleaned
}

// isStopWord 检查是否为停用词
func (ss *SearchService) isStopWord(word string) bool {
	stopWords := map[string]bool{
		"the": true, "and": true, "for": true, "are": true, "but": true,
		"not": true, "you": true, "all": true, "can": true, "had": true,
		"her": true, "was": true, "one": true, "our": true, "out": true,
		"day": true, "get": true, "has": true, "him": true, "his": true,
		"how": true, "man": true, "new": true, "now": true, "old": true,
		"see": true, "two": true, "way": true, "who": true, "boy": true,
		"did": true, "its": true, "let": true, "put": true, "say": true,
		"she": true, "too": true, "use": true,
	}
	
	return stopWords[word]
}

// searchSkills 搜索技能
func (ss *SearchService) searchSkills(query SearchQuery) []SearchResultItem {
	var results []SearchResultItem
	queryLower := strings.ToLower(query.Query)
	
	for _, skill := range ss.searchIndex.Skills {
		score := 0.0
		var matches []Match
		
		// 名称匹配（权重最高）
		if nameScore, nameMatches := ss.matchField(skill.Name, queryLower, "name", query.Fuzzy, query.CaseSensitive); nameScore > 0 {
			score += nameScore * 3.0
			matches = append(matches, nameMatches...)
		}
		
		// 描述匹配
		if descScore, descMatches := ss.matchField(skill.Description, queryLower, "description", query.Fuzzy, query.CaseSensitive); descScore > 0 {
			score += descScore * 2.0
			matches = append(matches, descMatches...)
		}
		
		// 标签匹配
		for _, tag := range skill.Tags {
			if tagScore, tagMatches := ss.matchField(tag, queryLower, "tags", query.Fuzzy, query.CaseSensitive); tagScore > 0 {
				score += tagScore * 1.5
				matches = append(matches, tagMatches...)
			}
		}
		
		// 关键词匹配
		for _, keyword := range skill.Keywords {
			if keywordScore, _ := ss.matchField(keyword, queryLower, "keywords", query.Fuzzy, query.CaseSensitive); keywordScore > 0 {
				score += keywordScore * 1.0
			}
		}
		
		// 内容匹配（权重最低）
		if contentScore, contentMatches := ss.matchField(skill.Content, queryLower, "content", query.Fuzzy, query.CaseSensitive); contentScore > 0 {
			score += contentScore * 0.5
			matches = append(matches, contentMatches...)
		}
		
		if score > 0 {
			// 检查是否已安装
			installed := skill.Path != ""
			
			results = append(results, SearchResultItem{
				Skill:     *skill,
				Score:     score,
				Matches:   matches,
				Installed: installed,
			})
		}
	}
	
	return results
}

// matchField 匹配字段
func (ss *SearchService) matchField(text, query, field string, fuzzy, caseSensitive bool) (float64, []Match) {
	if text == "" {
		return 0, nil
	}
	
	if !caseSensitive {
		text = strings.ToLower(text)
	}
	
	var matches []Match
	score := 0.0
	
	if fuzzy {
		// 模糊匹配
		if strings.Contains(text, query) {
			score = 1.0
			// 找到匹配位置
			pos := strings.Index(text, query)
			if pos >= 0 {
				matches = append(matches, Match{
					Field:     field,
					Text:      query,
					Highlight: ss.highlightText(text, query, pos),
					Position:  pos,
				})
			}
		}
	} else {
		// 精确匹配
		words := strings.Fields(query)
		matchCount := 0
		
		for _, word := range words {
			if strings.Contains(text, word) {
				matchCount++
				pos := strings.Index(text, word)
				if pos >= 0 {
					matches = append(matches, Match{
						Field:     field,
						Text:      word,
						Highlight: ss.highlightText(text, word, pos),
						Position:  pos,
					})
				}
			}
		}
		
		if len(words) > 0 {
			score = float64(matchCount) / float64(len(words))
		}
	}
	
	return score, matches
}

// highlightText 高亮文本
func (ss *SearchService) highlightText(text, query string, pos int) string {
	if pos < 0 {
		return text
	}
	
	start := pos
	end := pos + len(query)
	
	// 扩展上下文
	contextStart := start - 20
	if contextStart < 0 {
		contextStart = 0
	}
	
	contextEnd := end + 20
	if contextEnd > len(text) {
		contextEnd = len(text)
	}
	
	context := text[contextStart:contextEnd]
	highlightStart := start - contextStart
	highlightEnd := end - contextStart
	
	highlighted := context[:highlightStart] + "<mark>" + context[highlightStart:highlightEnd] + "</mark>" + context[highlightEnd:]
	
	return highlighted
}

// getAllSkills 获取所有技能
func (ss *SearchService) getAllSkills() []SearchResultItem {
	var results []SearchResultItem
	
	for _, skill := range ss.searchIndex.Skills {
		installed := skill.Path != ""
		
		results = append(results, SearchResultItem{
			Skill:     *skill,
			Score:     1.0,
			Matches:   []Match{},
			Installed: installed,
		})
	}
	
	return results
}

// applyFilters 应用过滤器
func (ss *SearchService) applyFilters(results []SearchResultItem, query SearchQuery) []SearchResultItem {
	var filtered []SearchResultItem
	
	for _, result := range results {
		// 语言过滤
		if len(query.Languages) > 0 && !ss.contains(query.Languages, result.Skill.Language) {
			continue
		}
		
		// 框架过滤
		if len(query.Frameworks) > 0 && !ss.contains(query.Frameworks, result.Skill.Framework) {
			continue
		}
		
		// 标签过滤
		if len(query.Tags) > 0 && !ss.hasAnyTag(result.Skill.Tags, query.Tags) {
			continue
		}
		
		// 来源过滤
		if len(query.Sources) > 0 && !ss.contains(query.Sources, result.Skill.Source) {
			continue
		}
		
		// 安装状态过滤
		if query.Installed != nil {
			if *query.Installed && !result.Installed {
				continue
			}
			if !*query.Installed && result.Installed {
				continue
			}
		}
		
		filtered = append(filtered, result)
	}
	
	return filtered
}

// sortResults 排序结果
func (ss *SearchService) sortResults(results []SearchResultItem, sortBy, sortOrder string) {
	sort.Slice(results, func(i, j int) bool {
		var less bool
		
		switch sortBy {
		case "name":
			less = results[i].Skill.Name < results[j].Skill.Name
		case "date":
			less = results[i].Skill.UpdatedAt.Before(results[j].Skill.UpdatedAt)
		case "relevance":
			fallthrough
		default:
			less = results[i].Score > results[j].Score
		}
		
		if sortOrder == "desc" {
			return !less
		}
		return less
	})
}

// generateSuggestions 生成搜索建议
func (ss *SearchService) generateSuggestions(query string) []string {
	if query == "" {
		return []string{}
	}
	
	var suggestions []string
	queryLower := strings.ToLower(query)
	
	// 基于技能名称的建议
	for name := range ss.searchIndex.Skills {
		if strings.Contains(strings.ToLower(name), queryLower) && name != query {
			suggestions = append(suggestions, name)
		}
	}
	
	// 基于标签的建议
	for tag := range ss.searchIndex.Tags {
		if strings.Contains(strings.ToLower(tag), queryLower) && tag != query {
			suggestions = append(suggestions, tag)
		}
	}
	
	// 限制数量
	if len(suggestions) > 5 {
		suggestions = suggestions[:5]
	}
	
	return suggestions
}

// generateFacets 生成搜索分面
func (ss *SearchService) generateFacets(results []SearchResultItem) SearchFacets {
	facets := SearchFacets{
		Languages:  make(map[string]int),
		Frameworks: make(map[string]int),
		Tags:       make(map[string]int),
		Sources:    make(map[string]int),
	}
	
	for _, result := range results {
		skill := result.Skill
		
		if skill.Language != "" {
			facets.Languages[skill.Language]++
		}
		
		if skill.Framework != "" {
			facets.Frameworks[skill.Framework]++
		}
		
		for _, tag := range skill.Tags {
			facets.Tags[tag]++
		}
		
		if skill.Source != "" {
			facets.Sources[skill.Source]++
		}
	}
	
	return facets
}

// recordSearchHistory 记录搜索历史
func (ss *SearchService) recordSearchHistory(query string, results int) {
	if query == "" {
		return
	}
	
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return
	}
	
	configDir := filepath.Join(homeDir, ".skills-manager")
	historyFile := filepath.Join(configDir, "search-history.json")
	
	// 读取现有历史
	var history []SearchHistory
	if data, err := os.ReadFile(historyFile); err == nil {
		json.Unmarshal(data, &history)
	}
	
	// 添加新记录
	newRecord := SearchHistory{
		Query:     query,
		Timestamp: time.Now(),
		Results:   results,
	}
	
	// 去重：如果查询已存在，更新时间戳
	found := false
	for i, record := range history {
		if record.Query == query {
			history[i] = newRecord
			found = true
			break
		}
	}
	
	if !found {
		history = append(history, newRecord)
	}
	
	// 限制历史记录数量
	if len(history) > 100 {
		history = history[len(history)-100:]
	}
	
	// 保存历史
	if data, err := json.MarshalIndent(history, "", "  "); err == nil {
		os.MkdirAll(configDir, 0755)
		os.WriteFile(historyFile, data, 0644)
	}
}

// loadSearchIndex 加载搜索索引
func (ss *SearchService) loadSearchIndex() error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}
	
	indexFile := filepath.Join(homeDir, ".skills-manager", "search-index.json")
	
	if _, err := os.Stat(indexFile); os.IsNotExist(err) {
		return nil // 索引文件不存在
	}
	
	data, err := os.ReadFile(indexFile)
	if err != nil {
		return fmt.Errorf("failed to read index file: %w", err)
	}
	
	if err := json.Unmarshal(data, ss.searchIndex); err != nil {
		return fmt.Errorf("failed to parse index: %w", err)
	}
	
	return nil
}

// saveSearchIndex 保存搜索索引
func (ss *SearchService) saveSearchIndex() error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}
	
	configDir := filepath.Join(homeDir, ".skills-manager")
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}
	
	indexFile := filepath.Join(configDir, "search-index.json")
	
	data, err := json.MarshalIndent(ss.searchIndex, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal index: %w", err)
	}
	
	if err := os.WriteFile(indexFile, data, 0644); err != nil {
		return fmt.Errorf("failed to write index file: %w", err)
	}
	
	return nil
}

// startIndexUpdater 启动索引更新器
func (ss *SearchService) startIndexUpdater() {
	ticker := time.NewTicker(6 * time.Hour) // 每6小时更新一次
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			if err := ss.rebuildIndex(); err != nil {
				fmt.Printf("Warning: failed to update search index: %v\n", err)
			}
		case <-ss.ctx.Done():
			return
		}
	}
}

// 辅助函数
func (ss *SearchService) contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func (ss *SearchService) hasAnyTag(skillTags, queryTags []string) bool {
	for _, queryTag := range queryTags {
		for _, skillTag := range skillTags {
			if skillTag == queryTag {
				return true
			}
		}
	}
	return false
}