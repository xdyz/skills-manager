package services

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"sync"
	"time"
)

// MonitoringService 性能监控服务
type MonitoringService struct {
	ctx     context.Context
	metrics map[string]*PerformanceMetric
	mutex   sync.RWMutex
}

// PerformanceMetric 性能指标
type PerformanceMetric struct {
	SkillName     string        `json:"skillName"`
	UsageCount    int           `json:"usageCount"`
	TotalExecTime time.Duration `json:"totalExecTime"`
	AvgExecTime   time.Duration `json:"avgExecTime"`
	MinExecTime   time.Duration `json:"minExecTime"`
	MaxExecTime   time.Duration `json:"maxExecTime"`
	ErrorCount    int           `json:"errorCount"`
	ErrorRate     float64       `json:"errorRate"`
	LastUsed      time.Time     `json:"lastUsed"`
	FirstUsed     time.Time     `json:"firstUsed"`
	AgentUsage    map[string]int `json:"agentUsage"`    // 各Agent的使用次数
	HourlyUsage   map[int]int   `json:"hourlyUsage"`   // 24小时使用分布
	DailyUsage    map[string]int `json:"dailyUsage"`   // 每日使用统计
}

// AgentMetric Agent性能指标
type AgentMetric struct {
	AgentName     string        `json:"agentName"`
	StartupTime   time.Duration `json:"startupTime"`
	ResponseTime  time.Duration `json:"responseTime"`
	MemoryUsage   int64         `json:"memoryUsage"`
	CPUUsage      float64       `json:"cpuUsage"`
	ActiveSkills  int           `json:"activeSkills"`
	TotalRequests int           `json:"totalRequests"`
	ErrorCount    int           `json:"errorCount"`
	LastActive    time.Time     `json:"lastActive"`
}

// SystemMetric 系统指标
type SystemMetric struct {
	Timestamp         time.Time `json:"timestamp"`
	TotalSkills       int       `json:"totalSkills"`
	ActiveAgents      int       `json:"activeAgents"`
	TotalUsage        int       `json:"totalUsage"`
	AvgResponseTime   float64   `json:"avgResponseTime"`
	SystemLoad        float64   `json:"systemLoad"`
	MemoryUsage       int64     `json:"memoryUsage"`
	DiskUsage         int64     `json:"diskUsage"`
	NetworkLatency    float64   `json:"networkLatency"`
}

// UsageReport 使用报告
type UsageReport struct {
	Period          string                    `json:"period"` // daily, weekly, monthly
	StartDate       time.Time                 `json:"startDate"`
	EndDate         time.Time                 `json:"endDate"`
	TotalUsage      int                       `json:"totalUsage"`
	TopSkills       []SkillUsageStat          `json:"topSkills"`
	TopAgents       []AgentUsageStat          `json:"topAgents"`
	UsageTrend      []DailyUsage              `json:"usageTrend"`
	PerformanceData []PerformanceDataPoint    `json:"performanceData"`
	Insights        []string                  `json:"insights"`
}

// SkillUsageStat 技能使用统计
type SkillUsageStat struct {
	SkillName   string  `json:"skillName"`
	UsageCount  int     `json:"usageCount"`
	Percentage  float64 `json:"percentage"`
	AvgExecTime float64 `json:"avgExecTime"`
	ErrorRate   float64 `json:"errorRate"`
}

// AgentUsageStat Agent使用统计
type AgentUsageStat struct {
	AgentName   string  `json:"agentName"`
	UsageCount  int     `json:"usageCount"`
	Percentage  float64 `json:"percentage"`
	SkillCount  int     `json:"skillCount"`
	ErrorRate   float64 `json:"errorRate"`
}

// DailyUsage 每日使用量
type DailyUsage struct {
	Date       string `json:"date"`
	UsageCount int    `json:"usageCount"`
	SkillCount int    `json:"skillCount"`
	ErrorCount int    `json:"errorCount"`
}

// PerformanceDataPoint 性能数据点
type PerformanceDataPoint struct {
	Timestamp    time.Time `json:"timestamp"`
	ResponseTime float64   `json:"responseTime"`
	MemoryUsage  int64     `json:"memoryUsage"`
	CPUUsage     float64   `json:"cpuUsage"`
}

// ExecutionContext 执行上下文
type ExecutionContext struct {
	SkillName   string            `json:"skillName"`
	AgentName   string            `json:"agentName"`
	ProjectPath string            `json:"projectPath"`
	StartTime   time.Time         `json:"startTime"`
	EndTime     time.Time         `json:"endTime"`
	Success     bool              `json:"success"`
	Error       string            `json:"error,omitempty"`
	Metadata    map[string]string `json:"metadata,omitempty"`
}

func NewMonitoringService() *MonitoringService {
	return &MonitoringService{
		metrics: make(map[string]*PerformanceMetric),
	}
}

func (ms *MonitoringService) Startup(ctx context.Context) {
	ms.ctx = ctx
	
	// 加载历史指标数据
	if err := ms.loadMetrics(); err != nil {
		fmt.Printf("Warning: failed to load metrics: %v\n", err)
	}
	
	// 启动定期保存任务
	go ms.startPeriodicSave()
	
	// 启动系统监控
	go ms.startSystemMonitoring()
}

// RecordSkillUsage 记录技能使用
func (ms *MonitoringService) RecordSkillUsage(ctx ExecutionContext) {
	ms.mutex.Lock()
	defer ms.mutex.Unlock()
	
	skillName := ctx.SkillName
	execTime := ctx.EndTime.Sub(ctx.StartTime)
	
	// 获取或创建指标
	metric, exists := ms.metrics[skillName]
	if !exists {
		metric = &PerformanceMetric{
			SkillName:     skillName,
			FirstUsed:     ctx.StartTime,
			AgentUsage:    make(map[string]int),
			HourlyUsage:   make(map[int]int),
			DailyUsage:    make(map[string]int),
			MinExecTime:   execTime,
			MaxExecTime:   execTime,
		}
		ms.metrics[skillName] = metric
	}
	
	// 更新基本统计
	metric.UsageCount++
	metric.TotalExecTime += execTime
	metric.AvgExecTime = metric.TotalExecTime / time.Duration(metric.UsageCount)
	metric.LastUsed = ctx.EndTime
	
	// 更新最小/最大执行时间
	if execTime < metric.MinExecTime {
		metric.MinExecTime = execTime
	}
	if execTime > metric.MaxExecTime {
		metric.MaxExecTime = execTime
	}
	
	// 更新错误统计
	if !ctx.Success {
		metric.ErrorCount++
	}
	metric.ErrorRate = float64(metric.ErrorCount) / float64(metric.UsageCount)
	
	// 更新Agent使用统计
	if ctx.AgentName != "" {
		metric.AgentUsage[ctx.AgentName]++
	}
	
	// 更新小时使用分布
	hour := ctx.StartTime.Hour()
	metric.HourlyUsage[hour]++
	
	// 更新每日使用统计
	dateKey := ctx.StartTime.Format("2006-01-02")
	metric.DailyUsage[dateKey]++
}

// GetPerformanceMetrics 获取性能指标
func (ms *MonitoringService) GetPerformanceMetrics() ([]PerformanceMetric, error) {
	ms.mutex.RLock()
	defer ms.mutex.RUnlock()
	
	var metrics []PerformanceMetric
	for _, metric := range ms.metrics {
		metrics = append(metrics, *metric)
	}
	
	// 按使用次数排序
	sort.Slice(metrics, func(i, j int) bool {
		return metrics[i].UsageCount > metrics[j].UsageCount
	})
	
	return metrics, nil
}

// GetSkillMetric 获取单个技能的指标
func (ms *MonitoringService) GetSkillMetric(skillName string) (*PerformanceMetric, error) {
	ms.mutex.RLock()
	defer ms.mutex.RUnlock()
	
	metric, exists := ms.metrics[skillName]
	if !exists {
		return nil, fmt.Errorf("no metrics found for skill: %s", skillName)
	}
	
	// 返回副本
	result := *metric
	return &result, nil
}

// GetUsageReport 生成使用报告
func (ms *MonitoringService) GetUsageReport(period string, startDate, endDate time.Time) (*UsageReport, error) {
	ms.mutex.RLock()
	defer ms.mutex.RUnlock()
	
	report := &UsageReport{
		Period:    period,
		StartDate: startDate,
		EndDate:   endDate,
		TopSkills: []SkillUsageStat{},
		TopAgents: []AgentUsageStat{},
		Insights:  []string{},
	}
	
	// 计算总使用量和技能统计
	totalUsage := 0
	skillStats := make(map[string]*SkillUsageStat)
	agentStats := make(map[string]*AgentUsageStat)
	
	for _, metric := range ms.metrics {
		// 过滤时间范围内的数据
		usageInPeriod := ms.getUsageInPeriod(metric, startDate, endDate)
		if usageInPeriod == 0 {
			continue
		}
		
		totalUsage += usageInPeriod
		
		// 技能统计
		skillStats[metric.SkillName] = &SkillUsageStat{
			SkillName:   metric.SkillName,
			UsageCount:  usageInPeriod,
			AvgExecTime: float64(metric.AvgExecTime.Milliseconds()),
			ErrorRate:   metric.ErrorRate,
		}
		
		// Agent统计
		for agentName, count := range metric.AgentUsage {
			if _, exists := agentStats[agentName]; !exists {
				agentStats[agentName] = &AgentUsageStat{
					AgentName:  agentName,
					UsageCount: 0,
					SkillCount: 0,
				}
			}
			agentStats[agentName].UsageCount += count
			agentStats[agentName].SkillCount++
		}
	}
	
	report.TotalUsage = totalUsage
	
	// 计算百分比并排序
	for _, stat := range skillStats {
		stat.Percentage = float64(stat.UsageCount) / float64(totalUsage) * 100
		report.TopSkills = append(report.TopSkills, *stat)
	}
	
	for _, stat := range agentStats {
		stat.Percentage = float64(stat.UsageCount) / float64(totalUsage) * 100
		report.TopAgents = append(report.TopAgents, *stat)
	}
	
	// 排序
	sort.Slice(report.TopSkills, func(i, j int) bool {
		return report.TopSkills[i].UsageCount > report.TopSkills[j].UsageCount
	})
	
	sort.Slice(report.TopAgents, func(i, j int) bool {
		return report.TopAgents[i].UsageCount > report.TopAgents[j].UsageCount
	})
	
	// 生成使用趋势
	report.UsageTrend = ms.generateUsageTrend(startDate, endDate)
	
	// 生成洞察
	report.Insights = ms.generateInsights(report)
	
	return report, nil
}

// GetAgentMetrics 获取Agent指标
func (ms *MonitoringService) GetAgentMetrics() ([]AgentMetric, error) {
	// 这里可以实现Agent性能监控
	// 暂时返回模拟数据
	return []AgentMetric{
		{
			AgentName:     "cursor",
			StartupTime:   time.Millisecond * 500,
			ResponseTime:  time.Millisecond * 200,
			MemoryUsage:   1024 * 1024 * 100, // 100MB
			CPUUsage:      15.5,
			ActiveSkills:  5,
			TotalRequests: 150,
			ErrorCount:    2,
			LastActive:    time.Now(),
		},
		{
			AgentName:     "claude-code",
			StartupTime:   time.Millisecond * 300,
			ResponseTime:  time.Millisecond * 150,
			MemoryUsage:   1024 * 1024 * 80, // 80MB
			CPUUsage:      12.3,
			ActiveSkills:  3,
			TotalRequests: 120,
			ErrorCount:    1,
			LastActive:    time.Now().Add(-time.Minute * 5),
		},
	}, nil
}

// GetSystemMetrics 获取系统指标
func (ms *MonitoringService) GetSystemMetrics() (*SystemMetric, error) {
	ms.mutex.RLock()
	defer ms.mutex.RUnlock()
	
	totalUsage := 0
	totalResponseTime := time.Duration(0)
	skillCount := len(ms.metrics)
	
	for _, metric := range ms.metrics {
		totalUsage += metric.UsageCount
		totalResponseTime += metric.AvgExecTime
	}
	
	avgResponseTime := float64(0)
	if skillCount > 0 {
		avgResponseTime = float64(totalResponseTime.Milliseconds()) / float64(skillCount)
	}
	
	return &SystemMetric{
		Timestamp:       time.Now(),
		TotalSkills:     skillCount,
		ActiveAgents:    2, // 模拟数据
		TotalUsage:      totalUsage,
		AvgResponseTime: avgResponseTime,
		SystemLoad:      0.65, // 模拟数据
		MemoryUsage:     1024 * 1024 * 200, // 200MB
		DiskUsage:       1024 * 1024 * 1024 * 5, // 5GB
		NetworkLatency:  25.5, // ms
	}, nil
}

// ClearMetrics 清空指标数据
func (ms *MonitoringService) ClearMetrics() error {
	ms.mutex.Lock()
	defer ms.mutex.Unlock()
	
	ms.metrics = make(map[string]*PerformanceMetric)
	
	// 删除持久化文件
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}
	
	configDir := filepath.Join(homeDir, ".skills-manager")
	metricsFile := filepath.Join(configDir, "performance-metrics.json")
	
	if err := os.Remove(metricsFile); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to remove metrics file: %w", err)
	}
	
	return nil
}

// ExportMetrics 导出指标数据
func (ms *MonitoringService) ExportMetrics() ([]byte, error) {
	ms.mutex.RLock()
	defer ms.mutex.RUnlock()
	
	data, err := json.MarshalIndent(ms.metrics, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("failed to marshal metrics: %w", err)
	}
	
	return data, nil
}

// ImportMetrics 导入指标数据
func (ms *MonitoringService) ImportMetrics(data []byte) error {
	ms.mutex.Lock()
	defer ms.mutex.Unlock()
	
	var importedMetrics map[string]*PerformanceMetric
	if err := json.Unmarshal(data, &importedMetrics); err != nil {
		return fmt.Errorf("failed to unmarshal metrics: %w", err)
	}
	
	// 合并指标数据
	for skillName, metric := range importedMetrics {
		if existing, exists := ms.metrics[skillName]; exists {
			// 合并现有指标
			existing.UsageCount += metric.UsageCount
			existing.TotalExecTime += metric.TotalExecTime
			existing.ErrorCount += metric.ErrorCount
			
			// 重新计算平均值和错误率
			existing.AvgExecTime = existing.TotalExecTime / time.Duration(existing.UsageCount)
			existing.ErrorRate = float64(existing.ErrorCount) / float64(existing.UsageCount)
			
			// 更新时间
			if metric.FirstUsed.Before(existing.FirstUsed) {
				existing.FirstUsed = metric.FirstUsed
			}
			if metric.LastUsed.After(existing.LastUsed) {
				existing.LastUsed = metric.LastUsed
			}
		} else {
			ms.metrics[skillName] = metric
		}
	}
	
	return nil
}

// loadMetrics 加载指标数据
func (ms *MonitoringService) loadMetrics() error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}
	
	configDir := filepath.Join(homeDir, ".skills-manager")
	metricsFile := filepath.Join(configDir, "performance-metrics.json")
	
	if _, err := os.Stat(metricsFile); os.IsNotExist(err) {
		return nil // 文件不存在，使用空指标
	}
	
	data, err := os.ReadFile(metricsFile)
	if err != nil {
		return fmt.Errorf("failed to read metrics file: %w", err)
	}
	
	if err := json.Unmarshal(data, &ms.metrics); err != nil {
		return fmt.Errorf("failed to unmarshal metrics: %w", err)
	}
	
	return nil
}

// saveMetrics 保存指标数据
func (ms *MonitoringService) saveMetrics() error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}
	
	configDir := filepath.Join(homeDir, ".skills-manager")
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}
	
	metricsFile := filepath.Join(configDir, "performance-metrics.json")
	
	ms.mutex.RLock()
	data, err := json.MarshalIndent(ms.metrics, "", "  ")
	ms.mutex.RUnlock()
	
	if err != nil {
		return fmt.Errorf("failed to marshal metrics: %w", err)
	}
	
	if err := os.WriteFile(metricsFile, data, 0644); err != nil {
		return fmt.Errorf("failed to write metrics file: %w", err)
	}
	
	return nil
}

// startPeriodicSave 启动定期保存任务
func (ms *MonitoringService) startPeriodicSave() {
	ticker := time.NewTicker(5 * time.Minute) // 每5分钟保存一次
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			if err := ms.saveMetrics(); err != nil {
				fmt.Printf("Warning: failed to save metrics: %v\n", err)
			}
		case <-ms.ctx.Done():
			// 程序退出时保存一次
			ms.saveMetrics()
			return
		}
	}
}

// startSystemMonitoring 启动系统监控
func (ms *MonitoringService) startSystemMonitoring() {
	ticker := time.NewTicker(1 * time.Minute) // 每分钟收集一次系统指标
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			// 这里可以收集系统指标
			// 暂时跳过实现
		case <-ms.ctx.Done():
			return
		}
	}
}

// getUsageInPeriod 获取时间段内的使用量
func (ms *MonitoringService) getUsageInPeriod(metric *PerformanceMetric, startDate, endDate time.Time) int {
	usage := 0
	
	for dateStr, count := range metric.DailyUsage {
		date, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			continue
		}
		
		if (date.Equal(startDate) || date.After(startDate)) && 
		   (date.Equal(endDate) || date.Before(endDate)) {
			usage += count
		}
	}
	
	return usage
}

// generateUsageTrend 生成使用趋势
func (ms *MonitoringService) generateUsageTrend(startDate, endDate time.Time) []DailyUsage {
	var trend []DailyUsage
	
	// 按日期遍历
	for d := startDate; d.Before(endDate) || d.Equal(endDate); d = d.AddDate(0, 0, 1) {
		dateStr := d.Format("2006-01-02")
		
		dailyUsage := DailyUsage{
			Date:       dateStr,
			UsageCount: 0,
			SkillCount: 0,
			ErrorCount: 0,
		}
		
		// 统计当日数据
		for _, metric := range ms.metrics {
			if count, exists := metric.DailyUsage[dateStr]; exists {
				dailyUsage.UsageCount += count
				dailyUsage.SkillCount++
				
				// 估算错误数量
				dailyUsage.ErrorCount += int(float64(count) * metric.ErrorRate)
			}
		}
		
		trend = append(trend, dailyUsage)
	}
	
	return trend
}

// generateInsights 生成洞察
func (ms *MonitoringService) generateInsights(report *UsageReport) []string {
	var insights []string
	
	// 分析最受欢迎的技能
	if len(report.TopSkills) > 0 {
		topSkill := report.TopSkills[0]
		insights = append(insights, fmt.Sprintf("Most popular skill: %s (%d uses, %.1f%%)", 
			topSkill.SkillName, topSkill.UsageCount, topSkill.Percentage))
	}
	
	// 分析使用趋势
	if len(report.UsageTrend) >= 2 {
		firstDay := report.UsageTrend[0].UsageCount
		lastDay := report.UsageTrend[len(report.UsageTrend)-1].UsageCount
		
		if lastDay > firstDay {
			growth := float64(lastDay-firstDay) / float64(firstDay) * 100
			insights = append(insights, fmt.Sprintf("Usage increased by %.1f%% over the period", growth))
		} else if lastDay < firstDay {
			decline := float64(firstDay-lastDay) / float64(firstDay) * 100
			insights = append(insights, fmt.Sprintf("Usage decreased by %.1f%% over the period", decline))
		}
	}
	
	// 分析错误率
	totalErrors := 0
	for _, day := range report.UsageTrend {
		totalErrors += day.ErrorCount
	}
	
	if report.TotalUsage > 0 {
		errorRate := float64(totalErrors) / float64(report.TotalUsage) * 100
		if errorRate > 5 {
			insights = append(insights, fmt.Sprintf("High error rate detected: %.1f%%", errorRate))
		} else if errorRate < 1 {
			insights = append(insights, "Excellent stability with low error rate")
		}
	}
	
	return insights
}