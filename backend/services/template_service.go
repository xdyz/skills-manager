package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

// TemplateService 模板市场服务
type TemplateService struct {
	ctx context.Context
}

// EnhancedSkillTemplate 增强的技能模板
type EnhancedSkillTemplate struct {
	SkillTemplate
	Category    string    `json:"category"`
	Author      string    `json:"author"`
	Rating      float64   `json:"rating"`
	Downloads   int       `json:"downloads"`
	Tags        []string  `json:"tags"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	Version     string    `json:"version"`
	Repository  string    `json:"repository"`
	IsBuiltIn   bool      `json:"isBuiltIn"`
}

// TemplateCategory 模板分类
type TemplateCategory struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Count       int    `json:"count"`
}

// TemplateRating 模板评分
type TemplateRating struct {
	TemplateID string    `json:"templateId"`
	Rating     int       `json:"rating"` // 1-5 stars
	Comment    string    `json:"comment"`
	CreatedAt  time.Time `json:"createdAt"`
}

// TemplateSource 模板源配置
type TemplateSource struct {
	Name        string `json:"name"`
	URL         string `json:"url"`
	Type        string `json:"type"` // github, gitlab, custom
	Token       string `json:"token,omitempty"`
	Enabled     bool   `json:"enabled"`
	LastSync    time.Time `json:"lastSync"`
}

func NewTemplateService() *TemplateService {
	return &TemplateService{}
}

func (ts *TemplateService) Startup(ctx context.Context) {
	ts.ctx = ctx
}

// GetEnhancedTemplates 获取增强的模板列表
func (ts *TemplateService) GetEnhancedTemplates() ([]EnhancedSkillTemplate, error) {
	// 获取内置模板
	builtInTemplates := ts.getBuiltInTemplates()
	
	// 获取自定义模板
	customTemplates, err := ts.getCustomTemplates()
	if err != nil {
		return nil, fmt.Errorf("failed to get custom templates: %w", err)
	}
	
	// 获取远程模板
	remoteTemplates, err := ts.getRemoteTemplates()
	if err != nil {
		// 远程模板获取失败不影响整体功能
		fmt.Printf("Warning: failed to get remote templates: %v\n", err)
	}
	
	// 合并所有模板
	allTemplates := append(builtInTemplates, customTemplates...)
	allTemplates = append(allTemplates, remoteTemplates...)
	
	// 按评分和下载量排序
	sort.Slice(allTemplates, func(i, j int) bool {
		if allTemplates[i].Rating != allTemplates[j].Rating {
			return allTemplates[i].Rating > allTemplates[j].Rating
		}
		return allTemplates[i].Downloads > allTemplates[j].Downloads
	})
	
	return allTemplates, nil
}

// getBuiltInTemplates 获取内置模板
func (ts *TemplateService) getBuiltInTemplates() []EnhancedSkillTemplate {
	baseTemplates := []SkillTemplate{
		{
			Name:        "blank",
			Description: "Empty skill template",
			Content: `---
name: {{NAME}}
description: {{DESCRIPTION}}
---

# {{NAME}}

Add your skill instructions here.
`,
		},
		{
			Name:        "react",
			Description: "React best practices template",
			Language:    "TypeScript",
			Framework:   "React",
			Content: `---
name: {{NAME}}
description: {{DESCRIPTION}}
language: TypeScript
framework: React
---

# {{NAME}}

## React Component Guidelines

- Use functional components with hooks
- Prefer composition over inheritance
- Use TypeScript for type safety
- Follow the single responsibility principle

## Hooks Best Practices

- Keep hooks at the top level
- Use custom hooks for shared logic
- Avoid unnecessary re-renders with useMemo/useCallback

## State Management

- Use useState for local state
- Use useContext for shared state
- Consider external state management for complex apps
`,
		},
		{
			Name:        "vue",
			Description: "Vue.js development template",
			Language:    "TypeScript",
			Framework:   "Vue",
			Content: `---
name: {{NAME}}
description: {{DESCRIPTION}}
language: TypeScript
framework: Vue
---

# {{NAME}}

## Vue 3 Guidelines

- Use Composition API with script setup
- Prefer ref/reactive for state management
- Use defineProps/defineEmits for component communication

## Component Design

- Keep components small and focused
- Use slots for flexible layouts
- Leverage provide/inject for deep prop passing
`,
		},
		{
			Name:        "python",
			Description: "Python development template",
			Language:    "Python",
			Content: `---
name: {{NAME}}
description: {{DESCRIPTION}}
language: Python
---

# {{NAME}}

## Python Coding Standards

- Follow PEP 8 style guide
- Use type hints for function signatures
- Write docstrings for all public functions
- Use virtual environments for dependency management

## Error Handling

- Use specific exception types
- Avoid bare except clauses
- Log errors with appropriate severity levels

## Testing

- Write unit tests with pytest
- Aim for high code coverage
- Use fixtures for test setup
`,
		},
		{
			Name:        "golang",
			Description: "Go development template",
			Language:    "Go",
			Content: `---
name: {{NAME}}
description: {{DESCRIPTION}}
language: Go
---

# {{NAME}}

## Go Best Practices

- Follow effective Go guidelines
- Use interfaces for abstraction
- Handle errors explicitly
- Use context for cancellation

## Concurrency

- Use goroutines and channels
- Avoid shared memory, communicate by sharing
- Use sync package for synchronization
- Always handle context cancellation

## Testing

- Write table-driven tests
- Use testify for assertions
- Benchmark performance-critical code
- Run tests with race detector
`,
		},
		{
			Name:        "microservice",
			Description: "Microservice architecture template",
			Language:    "Go",
			Framework:   "gRPC",
			Content: `---
name: {{NAME}}
description: {{DESCRIPTION}}
language: Go
framework: gRPC
category: microservice
---

# {{NAME}}

## Microservice Design Principles

- Single responsibility principle
- Database per service
- API-first design
- Fail fast and gracefully

## Implementation Guidelines

- Use gRPC for service-to-service communication
- Implement health checks and metrics
- Use structured logging
- Handle circuit breaker patterns

## Deployment

- Containerize with Docker
- Use Kubernetes for orchestration
- Implement service mesh for observability
- Monitor with Prometheus and Grafana
`,
		},
		{
			Name:        "ai-assistant",
			Description: "AI assistant development template",
			Language:    "Python",
			Framework:   "FastAPI",
			Content: `---
name: {{NAME}}
description: {{DESCRIPTION}}
language: Python
framework: FastAPI
category: ai
---

# {{NAME}}

## AI Assistant Guidelines

- Use OpenAI API or similar LLM services
- Implement proper prompt engineering
- Handle rate limiting and retries
- Validate and sanitize user inputs

## Architecture Patterns

- Use async/await for I/O operations
- Implement caching for expensive operations
- Use dependency injection for testability
- Structure prompts as templates

## Security

- Validate all user inputs
- Implement proper authentication
- Use environment variables for API keys
- Log security events
`,
		},
		{
			Name:        "data-analysis",
			Description: "Data analysis and visualization template",
			Language:    "Python",
			Framework:   "Pandas",
			Content: `---
name: {{NAME}}
description: {{DESCRIPTION}}
language: Python
framework: Pandas
category: data-science
---

# {{NAME}}

## Data Analysis Best Practices

- Use pandas for data manipulation
- Leverage numpy for numerical operations
- Create visualizations with matplotlib/seaborn
- Document data sources and transformations

## Workflow

1. Data ingestion and validation
2. Exploratory data analysis (EDA)
3. Data cleaning and preprocessing
4. Analysis and modeling
5. Visualization and reporting

## Tools and Libraries

- pandas: Data manipulation
- numpy: Numerical computing
- matplotlib/seaborn: Visualization
- jupyter: Interactive development
`,
		},
	}
	
	enhanced := make([]EnhancedSkillTemplate, len(baseTemplates))
	for i, template := range baseTemplates {
		category := "basic"
		if template.Framework != "" {
			category = "framework"
		}
		if strings.Contains(template.Content, "microservice") {
			category = "microservice"
		}
		if strings.Contains(template.Content, "ai") || strings.Contains(template.Content, "AI") {
			category = "ai"
		}
		if strings.Contains(template.Content, "data") {
			category = "data-science"
		}
		
		enhanced[i] = EnhancedSkillTemplate{
			SkillTemplate: template,
			Category:      category,
			Author:        "Agent Hub",
			Rating:        4.5,
			Downloads:     100 + i*50, // 模拟下载量
			Tags:          []string{template.Language, template.Framework},
			CreatedAt:     time.Now().AddDate(0, -i, 0),
			UpdatedAt:     time.Now(),
			Version:       "1.0.0",
			IsBuiltIn:     true,
		}
	}
	
	return enhanced
}

// getCustomTemplates 获取自定义模板
func (ts *TemplateService) getCustomTemplates() ([]EnhancedSkillTemplate, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get home directory: %w", err)
	}
	
	configDir := filepath.Join(homeDir, ".skills-manager")
	templatesFile := filepath.Join(configDir, "custom-templates.json")
	
	if _, err := os.Stat(templatesFile); os.IsNotExist(err) {
		return []EnhancedSkillTemplate{}, nil
	}
	
	data, err := os.ReadFile(templatesFile)
	if err != nil {
		return nil, fmt.Errorf("failed to read custom templates: %w", err)
	}
	
	var templates []EnhancedSkillTemplate
	if err := json.Unmarshal(data, &templates); err != nil {
		return nil, fmt.Errorf("failed to parse custom templates: %w", err)
	}
	
	return templates, nil
}

// getRemoteTemplates 获取远程模板
func (ts *TemplateService) getRemoteTemplates() ([]EnhancedSkillTemplate, error) {
	sources, err := ts.getTemplateSources()
	if err != nil {
		return nil, fmt.Errorf("failed to get template sources: %w", err)
	}
	
	var allTemplates []EnhancedSkillTemplate
	
	for _, source := range sources {
		if !source.Enabled {
			continue
		}
		
		templates, err := ts.fetchTemplatesFromSource(source)
		if err != nil {
			fmt.Printf("Warning: failed to fetch templates from %s: %v\n", source.Name, err)
			continue
		}
		
		allTemplates = append(allTemplates, templates...)
	}
	
	return allTemplates, nil
}

// fetchTemplatesFromSource 从指定源获取模板
func (ts *TemplateService) fetchTemplatesFromSource(source TemplateSource) ([]EnhancedSkillTemplate, error) {
	// 这里可以实现从 GitHub、GitLab 等源获取模板的逻辑
	// 暂时返回空列表
	return []EnhancedSkillTemplate{}, nil
}

// GetTemplateCategories 获取模板分类
func (ts *TemplateService) GetTemplateCategories() ([]TemplateCategory, error) {
	templates, err := ts.GetEnhancedTemplates()
	if err != nil {
		return nil, err
	}
	
	categoryMap := make(map[string]int)
	for _, template := range templates {
		categoryMap[template.Category]++
	}
	
	categories := []TemplateCategory{
		{Name: "basic", Description: "Basic templates for common use cases", Icon: "📝", Count: categoryMap["basic"]},
		{Name: "framework", Description: "Framework-specific templates", Icon: "🚀", Count: categoryMap["framework"]},
		{Name: "microservice", Description: "Microservice architecture templates", Icon: "🔧", Count: categoryMap["microservice"]},
		{Name: "ai", Description: "AI and machine learning templates", Icon: "🤖", Count: categoryMap["ai"]},
		{Name: "data-science", Description: "Data analysis and visualization", Icon: "📊", Count: categoryMap["data-science"]},
	}
	
	return categories, nil
}

// CreateCustomTemplate 创建自定义模板
func (ts *TemplateService) CreateCustomTemplate(template EnhancedSkillTemplate) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}
	
	configDir := filepath.Join(homeDir, ".skills-manager")
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}
	
	templatesFile := filepath.Join(configDir, "custom-templates.json")
	
	// 读取现有模板
	var templates []EnhancedSkillTemplate
	if data, err := os.ReadFile(templatesFile); err == nil {
		json.Unmarshal(data, &templates)
	}
	
	// 设置模板属性
	template.CreatedAt = time.Now()
	template.UpdatedAt = time.Now()
	template.IsBuiltIn = false
	template.Version = "1.0.0"
	
	// 添加新模板
	templates = append(templates, template)
	
	// 保存到文件
	data, err := json.MarshalIndent(templates, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal templates: %w", err)
	}
	
	if err := os.WriteFile(templatesFile, data, 0644); err != nil {
		return fmt.Errorf("failed to write templates file: %w", err)
	}
	
	return nil
}

// RateTemplate 为模板评分
func (ts *TemplateService) RateTemplate(templateID string, rating int, comment string) error {
	if rating < 1 || rating > 5 {
		return fmt.Errorf("rating must be between 1 and 5")
	}
	
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}
	
	configDir := filepath.Join(homeDir, ".skills-manager")
	ratingsFile := filepath.Join(configDir, "template-ratings.json")
	
	// 读取现有评分
	var ratings []TemplateRating
	if data, err := os.ReadFile(ratingsFile); err == nil {
		json.Unmarshal(data, &ratings)
	}
	
	// 添加新评分
	newRating := TemplateRating{
		TemplateID: templateID,
		Rating:     rating,
		Comment:    comment,
		CreatedAt:  time.Now(),
	}
	ratings = append(ratings, newRating)
	
	// 保存到文件
	data, err := json.MarshalIndent(ratings, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal ratings: %w", err)
	}
	
	if err := os.WriteFile(ratingsFile, data, 0644); err != nil {
		return fmt.Errorf("failed to write ratings file: %w", err)
	}
	
	return nil
}

// getTemplateSources 获取模板源配置
func (ts *TemplateService) getTemplateSources() ([]TemplateSource, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get home directory: %w", err)
	}
	
	configDir := filepath.Join(homeDir, ".skills-manager")
	sourcesFile := filepath.Join(configDir, "template-sources.json")
	
	// 如果文件不存在，创建默认配置
	if _, err := os.Stat(sourcesFile); os.IsNotExist(err) {
		defaultSources := []TemplateSource{
			{
				Name:    "Official Templates",
				URL:     "https://github.com/agent-hub/templates",
				Type:    "github",
				Enabled: true,
			},
		}
		
		data, _ := json.MarshalIndent(defaultSources, "", "  ")
		os.WriteFile(sourcesFile, data, 0644)
		return defaultSources, nil
	}
	
	data, err := os.ReadFile(sourcesFile)
	if err != nil {
		return nil, fmt.Errorf("failed to read template sources: %w", err)
	}
	
	var sources []TemplateSource
	if err := json.Unmarshal(data, &sources); err != nil {
		return nil, fmt.Errorf("failed to parse template sources: %w", err)
	}
	
	return sources, nil
}

// SearchTemplates 搜索模板
func (ts *TemplateService) SearchTemplates(query string, category string, language string) ([]EnhancedSkillTemplate, error) {
	templates, err := ts.GetEnhancedTemplates()
	if err != nil {
		return nil, err
	}
	
	var filtered []EnhancedSkillTemplate
	
	for _, template := range templates {
		// 分类过滤
		if category != "" && template.Category != category {
			continue
		}
		
		// 语言过滤
		if language != "" && template.Language != language {
			continue
		}
		
		// 关键词搜索
		if query != "" {
			queryLower := strings.ToLower(query)
			if !strings.Contains(strings.ToLower(template.Name), queryLower) &&
				!strings.Contains(strings.ToLower(template.Description), queryLower) &&
				!containsTag(template.Tags, queryLower) {
				continue
			}
		}
		
		filtered = append(filtered, template)
	}
	
	return filtered, nil
}

// containsTag 检查标签列表是否包含指定标签
func containsTag(tags []string, tag string) bool {
	for _, t := range tags {
		if strings.Contains(strings.ToLower(t), tag) {
			return true
		}
	}
	return false
}

// templateHttpGet 发送 HTTP GET 请求
func templateHttpGet(url string) ([]byte, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, resp.Status)
	}
	
	return io.ReadAll(resp.Body)
}