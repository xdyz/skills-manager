package services

import (
	"archive/zip"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

// BackupService 备份服务
type BackupService struct {
	ctx context.Context
}

// BackupConfig 备份配置
type BackupConfig struct {
	AutoBackup       bool          `json:"autoBackup"`
	BackupInterval   time.Duration `json:"backupInterval"`   // 备份间隔
	MaxBackups       int           `json:"maxBackups"`       // 最大备份数量
	BackupLocation   string        `json:"backupLocation"`   // 备份位置
	IncludeSkills    bool          `json:"includeSkills"`    // 是否包含技能文件
	IncludeSettings  bool          `json:"includeSettings"`  // 是否包含设置
	IncludeProjects  bool          `json:"includeProjects"`  // 是否包含项目配置
	IncludeLogs      bool          `json:"includeLogs"`      // 是否包含日志
	CompressionLevel int           `json:"compressionLevel"` // 压缩级别 0-9
}

// BackupInfo 备份信息
type BackupInfo struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
	Size        int64     `json:"size"`
	FilePath    string    `json:"filePath"`
	Type        string    `json:"type"`        // auto, manual
	Status      string    `json:"status"`      // success, failed, partial
	Items       []string  `json:"items"`       // 备份项目列表
	Checksum    string    `json:"checksum"`    // 文件校验和
	Version     string    `json:"version"`     // 应用版本
}

// RestoreOptions 恢复选项
type RestoreOptions struct {
	BackupID         string   `json:"backupId"`
	RestoreSkills    bool     `json:"restoreSkills"`
	RestoreSettings  bool     `json:"restoreSettings"`
	RestoreProjects  bool     `json:"restoreProjects"`
	RestoreLogs      bool     `json:"restoreLogs"`
	OverwriteExisting bool    `json:"overwriteExisting"`
	SelectedItems    []string `json:"selectedItems"` // 选择性恢复
}

// BackupProgress 备份进度
type BackupProgress struct {
	ID          string  `json:"id"`
	Status      string  `json:"status"`      // running, completed, failed
	Progress    float64 `json:"progress"`    // 0-100
	CurrentItem string  `json:"currentItem"`
	Message     string  `json:"message"`
	StartTime   time.Time `json:"startTime"`
	EndTime     *time.Time `json:"endTime,omitempty"`
}

// BackupItem 备份项目
type BackupItem struct {
	Name        string `json:"name"`
	Type        string `json:"type"`        // file, directory, config
	SourcePath  string `json:"sourcePath"`
	Size        int64  `json:"size"`
	Required    bool   `json:"required"`    // 是否必需
	Description string `json:"description"`
}

func NewBackupService() *BackupService {
	return &BackupService{}
}

func (bs *BackupService) Startup(ctx context.Context) {
	bs.ctx = ctx
	
	// 启动自动备份任务
	go bs.startAutoBackup()
}

// CreateBackup 创建备份
func (bs *BackupService) CreateBackup(name, description string, items []string) (*BackupInfo, error) {
	config, err := bs.getBackupConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to get backup config: %w", err)
	}
	
	// 生成备份ID和文件名
	backupID := fmt.Sprintf("backup_%d", time.Now().Unix())
	timestamp := time.Now().Format("20060102_150405")
	fileName := fmt.Sprintf("agent_hub_backup_%s.zip", timestamp)
	
	backupDir := config.BackupLocation
	if backupDir == "" {
		homeDir, _ := os.UserHomeDir()
		backupDir = filepath.Join(homeDir, ".skills-manager", "backups")
	}
	
	if err := os.MkdirAll(backupDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create backup directory: %w", err)
	}
	
	backupPath := filepath.Join(backupDir, fileName)
	
	// 创建备份信息
	backup := &BackupInfo{
		ID:          backupID,
		Name:        name,
		Description: description,
		CreatedAt:   time.Now(),
		FilePath:    backupPath,
		Type:        "manual",
		Status:      "running",
		Items:       items,
		Version:     "1.0.0", // 应用版本
	}
	
	// 执行备份
	err = bs.performBackup(backup, config)
	if err != nil {
		backup.Status = "failed"
		return backup, fmt.Errorf("backup failed: %w", err)
	}
	
	backup.Status = "success"
	
	// 计算文件大小和校验和
	if stat, err := os.Stat(backupPath); err == nil {
		backup.Size = stat.Size()
	}
	
	backup.Checksum, _ = bs.calculateChecksum(backupPath)
	
	// 保存备份信息
	if err := bs.saveBackupInfo(backup); err != nil {
		fmt.Printf("Warning: failed to save backup info: %v\n", err)
	}
	
	// 清理旧备份
	bs.cleanupOldBackups(config.MaxBackups)
	
	return backup, nil
}

// GetBackups 获取备份列表
func (bs *BackupService) GetBackups() ([]BackupInfo, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get home directory: %w", err)
	}
	
	backupsFile := filepath.Join(homeDir, ".skills-manager", "backups.json")
	
	if _, err := os.Stat(backupsFile); os.IsNotExist(err) {
		return []BackupInfo{}, nil
	}
	
	data, err := os.ReadFile(backupsFile)
	if err != nil {
		return nil, fmt.Errorf("failed to read backups file: %w", err)
	}
	
	var backups []BackupInfo
	if err := json.Unmarshal(data, &backups); err != nil {
		return nil, fmt.Errorf("failed to parse backups: %w", err)
	}
	
	// 按创建时间倒序排列
	sort.Slice(backups, func(i, j int) bool {
		return backups[i].CreatedAt.After(backups[j].CreatedAt)
	})
	
	return backups, nil
}

// RestoreBackup 恢复备份
func (bs *BackupService) RestoreBackup(options RestoreOptions) error {
	backups, err := bs.GetBackups()
	if err != nil {
		return fmt.Errorf("failed to get backups: %w", err)
	}
	
	var targetBackup *BackupInfo
	for _, backup := range backups {
		if backup.ID == options.BackupID {
			targetBackup = &backup
			break
		}
	}
	
	if targetBackup == nil {
		return fmt.Errorf("backup not found: %s", options.BackupID)
	}
	
	// 检查备份文件是否存在
	if _, err := os.Stat(targetBackup.FilePath); os.IsNotExist(err) {
		return fmt.Errorf("backup file not found: %s", targetBackup.FilePath)
	}
	
	// 验证校验和
	if targetBackup.Checksum != "" {
		currentChecksum, err := bs.calculateChecksum(targetBackup.FilePath)
		if err == nil && currentChecksum != targetBackup.Checksum {
			return fmt.Errorf("backup file corrupted: checksum mismatch")
		}
	}
	
	// 执行恢复
	return bs.performRestore(targetBackup, options)
}

// DeleteBackup 删除备份
func (bs *BackupService) DeleteBackup(backupID string) error {
	backups, err := bs.GetBackups()
	if err != nil {
		return fmt.Errorf("failed to get backups: %w", err)
	}
	
	var targetBackup *BackupInfo
	var remainingBackups []BackupInfo
	
	for _, backup := range backups {
		if backup.ID == backupID {
			targetBackup = &backup
		} else {
			remainingBackups = append(remainingBackups, backup)
		}
	}
	
	if targetBackup == nil {
		return fmt.Errorf("backup not found: %s", backupID)
	}
	
	// 删除备份文件
	if err := os.Remove(targetBackup.FilePath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete backup file: %w", err)
	}
	
	// 更新备份列表
	return bs.saveBackupList(remainingBackups)
}

// GetBackupConfig 获取备份配置
func (bs *BackupService) GetBackupConfig() (*BackupConfig, error) {
	return bs.getBackupConfig()
}

// SetBackupConfig 设置备份配置
func (bs *BackupService) SetBackupConfig(config BackupConfig) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}
	
	configDir := filepath.Join(homeDir, ".skills-manager")
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}
	
	configFile := filepath.Join(configDir, "backup-config.json")
	
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}
	
	if err := os.WriteFile(configFile, data, 0644); err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
	}
	
	return nil
}

// GetBackupItems 获取可备份项目列表
func (bs *BackupService) GetBackupItems() ([]BackupItem, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get home directory: %w", err)
	}
	
	configDir := filepath.Join(homeDir, ".skills-manager")
	skillsDir := filepath.Join(homeDir, ".agents", "skills")
	
	items := []BackupItem{
		{
			Name:        "Application Settings",
			Type:        "config",
			SourcePath:  filepath.Join(configDir, "settings.json"),
			Required:    true,
			Description: "Application preferences and configuration",
		},
		{
			Name:        "Project Configuration",
			Type:        "config",
			SourcePath:  filepath.Join(configDir, "config.json"),
			Required:    true,
			Description: "Project list and folder configuration",
		},
		{
			Name:        "Agent Configuration",
			Type:        "config",
			SourcePath:  filepath.Join(configDir, "agents.json"),
			Required:    true,
			Description: "Agent settings and custom agents",
		},
		{
			Name:        "Skill Tags",
			Type:        "config",
			SourcePath:  filepath.Join(configDir, "skill-tags.json"),
			Required:    false,
			Description: "Skill tagging information",
		},
		{
			Name:        "Favorites",
			Type:        "config",
			SourcePath:  filepath.Join(configDir, "favorites.json"),
			Required:    false,
			Description: "Favorited skills list",
		},
		{
			Name:        "Collections",
			Type:        "config",
			SourcePath:  filepath.Join(configDir, "collections.json"),
			Required:    false,
			Description: "Skill collections and groups",
		},
		{
			Name:        "Activity Logs",
			Type:        "file",
			SourcePath:  filepath.Join(configDir, "activity-log.json"),
			Required:    false,
			Description: "Activity and operation history",
		},
		{
			Name:        "Performance Metrics",
			Type:        "file",
			SourcePath:  filepath.Join(configDir, "performance-metrics.json"),
			Required:    false,
			Description: "Usage statistics and performance data",
		},
		{
			Name:        "Skills Directory",
			Type:        "directory",
			SourcePath:  skillsDir,
			Required:    false,
			Description: "All installed skills and their files",
		},
	}
	
	// 计算文件大小
	for i, item := range items {
		if stat, err := os.Stat(item.SourcePath); err == nil {
			if stat.IsDir() {
				items[i].Size = bs.calculateDirSize(item.SourcePath)
			} else {
				items[i].Size = stat.Size()
			}
		}
	}
	
	return items, nil
}

// performBackup 执行备份
func (bs *BackupService) performBackup(backup *BackupInfo, config *BackupConfig) error {
	// 创建ZIP文件
	zipFile, err := os.Create(backup.FilePath)
	if err != nil {
		return fmt.Errorf("failed to create backup file: %w", err)
	}
	defer zipFile.Close()
	
	zipWriter := zip.NewWriter(zipFile)
	defer zipWriter.Close()
	
	// 获取备份项目
	allItems, err := bs.GetBackupItems()
	if err != nil {
		return fmt.Errorf("failed to get backup items: %w", err)
	}
	
	// 过滤要备份的项目
	var itemsToBackup []BackupItem
	for _, item := range allItems {
		if bs.shouldBackupItem(item, backup.Items, config) {
			itemsToBackup = append(itemsToBackup, item)
		}
	}
	
	// 执行备份
	for _, item := range itemsToBackup {
		if err := bs.addToZip(zipWriter, item); err != nil {
			fmt.Printf("Warning: failed to backup %s: %v\n", item.Name, err)
		}
	}
	
	return nil
}

// performRestore 执行恢复
func (bs *BackupService) performRestore(backup *BackupInfo, options RestoreOptions) error {
	// 打开ZIP文件
	zipReader, err := zip.OpenReader(backup.FilePath)
	if err != nil {
		return fmt.Errorf("failed to open backup file: %w", err)
	}
	defer zipReader.Close()
	
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}
	
	// 创建临时目录
	tempDir := filepath.Join(homeDir, ".skills-manager", "temp-restore")
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return fmt.Errorf("failed to create temp directory: %w", err)
	}
	defer os.RemoveAll(tempDir)
	
	// 解压文件
	for _, file := range zipReader.File {
		if err := bs.extractFile(file, tempDir); err != nil {
			fmt.Printf("Warning: failed to extract %s: %v\n", file.Name, err)
		}
	}
	
	// 恢复文件到目标位置
	return bs.restoreFiles(tempDir, options)
}

// shouldBackupItem 判断是否应该备份项目
func (bs *BackupService) shouldBackupItem(item BackupItem, selectedItems []string, config *BackupConfig) bool {
	// 如果指定了选择项目，只备份选中的
	if len(selectedItems) > 0 {
		for _, selected := range selectedItems {
			if selected == item.Name {
				return true
			}
		}
		return false
	}
	
	// 根据配置决定
	switch item.Type {
	case "config":
		return config.IncludeSettings
	case "file":
		if strings.Contains(item.Name, "Log") {
			return config.IncludeLogs
		}
		return config.IncludeSettings
	case "directory":
		if strings.Contains(item.Name, "Skills") {
			return config.IncludeSkills
		}
		return config.IncludeProjects
	}
	
	return item.Required
}

// addToZip 添加文件到ZIP
func (bs *BackupService) addToZip(zipWriter *zip.Writer, item BackupItem) error {
	if _, err := os.Stat(item.SourcePath); os.IsNotExist(err) {
		return nil // 文件不存在，跳过
	}
	
	if item.Type == "directory" {
		return bs.addDirToZip(zipWriter, item.SourcePath, item.Name)
	} else {
		return bs.addFileToZip(zipWriter, item.SourcePath, item.Name)
	}
}

// addFileToZip 添加单个文件到ZIP
func (bs *BackupService) addFileToZip(zipWriter *zip.Writer, filePath, zipPath string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()
	
	writer, err := zipWriter.Create(zipPath)
	if err != nil {
		return err
	}
	
	_, err = io.Copy(writer, file)
	return err
}

// addDirToZip 添加目录到ZIP
func (bs *BackupService) addDirToZip(zipWriter *zip.Writer, dirPath, zipPrefix string) error {
	return filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // 跳过错误文件
		}
		
		// 跳过隐藏文件和目录
		if strings.HasPrefix(info.Name(), ".") && info.Name() != ".skills-lock" {
			if info.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		
		if info.IsDir() {
			return nil
		}
		
		// 计算相对路径
		relPath, err := filepath.Rel(dirPath, path)
		if err != nil {
			return nil
		}
		
		zipPath := filepath.Join(zipPrefix, relPath)
		zipPath = strings.ReplaceAll(zipPath, "\\", "/") // 确保使用正斜杠
		
		return bs.addFileToZip(zipWriter, path, zipPath)
	})
}

// extractFile 解压文件
func (bs *BackupService) extractFile(file *zip.File, destDir string) error {
	reader, err := file.Open()
	if err != nil {
		return err
	}
	defer reader.Close()
	
	destPath := filepath.Join(destDir, file.Name)
	
	// 创建目录
	if err := os.MkdirAll(filepath.Dir(destPath), 0755); err != nil {
		return err
	}
	
	// 创建文件
	destFile, err := os.Create(destPath)
	if err != nil {
		return err
	}
	defer destFile.Close()
	
	_, err = io.Copy(destFile, reader)
	return err
}

// restoreFiles 恢复文件到目标位置
func (bs *BackupService) restoreFiles(tempDir string, options RestoreOptions) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}
	
	configDir := filepath.Join(homeDir, ".skills-manager")
	skillsDir := filepath.Join(homeDir, ".agents", "skills")
	
	// 恢复配置文件
	if options.RestoreSettings {
		configFiles := []string{
			"settings.json",
			"agents.json",
			"skill-tags.json",
			"favorites.json",
			"collections.json",
		}
		
		for _, file := range configFiles {
			srcPath := filepath.Join(tempDir, file)
			destPath := filepath.Join(configDir, file)
			
			if _, err := os.Stat(srcPath); err == nil {
				if !options.OverwriteExisting {
					if _, err := os.Stat(destPath); err == nil {
						continue // 文件已存在，跳过
					}
				}
				
				bs.copyFile(srcPath, destPath)
			}
		}
	}
	
	// 恢复项目配置
	if options.RestoreProjects {
		srcPath := filepath.Join(tempDir, "config.json")
		destPath := filepath.Join(configDir, "config.json")
		
		if _, err := os.Stat(srcPath); err == nil {
			if options.OverwriteExisting || !bs.fileExists(destPath) {
				bs.copyFile(srcPath, destPath)
			}
		}
	}
	
	// 恢复技能文件
	if options.RestoreSkills {
		skillsSrcDir := filepath.Join(tempDir, "Skills Directory")
		if _, err := os.Stat(skillsSrcDir); err == nil {
			if err := bs.copyDir(skillsSrcDir, skillsDir, options.OverwriteExisting); err != nil {
				fmt.Printf("Warning: failed to restore skills: %v\n", err)
			}
		}
	}
	
	// 恢复日志
	if options.RestoreLogs {
		logFiles := []string{
			"activity-log.json",
			"performance-metrics.json",
		}
		
		for _, file := range logFiles {
			srcPath := filepath.Join(tempDir, file)
			destPath := filepath.Join(configDir, file)
			
			if _, err := os.Stat(srcPath); err == nil {
				if options.OverwriteExisting || !bs.fileExists(destPath) {
					bs.copyFile(srcPath, destPath)
				}
			}
		}
	}
	
	return nil
}

// getBackupConfig 获取备份配置
func (bs *BackupService) getBackupConfig() (*BackupConfig, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get home directory: %w", err)
	}
	
	configFile := filepath.Join(homeDir, ".skills-manager", "backup-config.json")
	
	// 如果配置文件不存在，返回默认配置
	if _, err := os.Stat(configFile); os.IsNotExist(err) {
		defaultConfig := &BackupConfig{
			AutoBackup:       false,
			BackupInterval:   24 * time.Hour, // 每天
			MaxBackups:       10,
			BackupLocation:   "",
			IncludeSkills:    true,
			IncludeSettings:  true,
			IncludeProjects:  true,
			IncludeLogs:      false,
			CompressionLevel: 6,
		}
		
		// 保存默认配置
		bs.SetBackupConfig(*defaultConfig)
		return defaultConfig, nil
	}
	
	data, err := os.ReadFile(configFile)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}
	
	var config BackupConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("failed to parse config: %w", err)
	}
	
	return &config, nil
}

// saveBackupInfo 保存备份信息
func (bs *BackupService) saveBackupInfo(backup *BackupInfo) error {
	backups, err := bs.GetBackups()
	if err != nil {
		backups = []BackupInfo{}
	}
	
	// 添加新备份
	backups = append(backups, *backup)
	
	return bs.saveBackupList(backups)
}

// saveBackupList 保存备份列表
func (bs *BackupService) saveBackupList(backups []BackupInfo) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}
	
	configDir := filepath.Join(homeDir, ".skills-manager")
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}
	
	backupsFile := filepath.Join(configDir, "backups.json")
	
	data, err := json.MarshalIndent(backups, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal backups: %w", err)
	}
	
	if err := os.WriteFile(backupsFile, data, 0644); err != nil {
		return fmt.Errorf("failed to write backups file: %w", err)
	}
	
	return nil
}

// calculateChecksum 计算文件校验和
func (bs *BackupService) calculateChecksum(filePath string) (string, error) {
	// 这里可以实现MD5或SHA256校验和计算
	// 暂时返回文件大小作为简单校验
	stat, err := os.Stat(filePath)
	if err != nil {
		return "", err
	}
	
	return fmt.Sprintf("%d", stat.Size()), nil
}

// calculateDirSize 计算目录大小
func (bs *BackupService) calculateDirSize(dirPath string) int64 {
	var size int64
	
	filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if !info.IsDir() {
			size += info.Size()
		}
		return nil
	})
	
	return size
}

// cleanupOldBackups 清理旧备份
func (bs *BackupService) cleanupOldBackups(maxBackups int) {
	if maxBackups <= 0 {
		return
	}
	
	backups, err := bs.GetBackups()
	if err != nil {
		return
	}
	
	if len(backups) <= maxBackups {
		return
	}
	
	// 删除最旧的备份
	toDelete := backups[maxBackups:]
	remaining := backups[:maxBackups]
	
	for _, backup := range toDelete {
		os.Remove(backup.FilePath)
	}
	
	bs.saveBackupList(remaining)
}

// startAutoBackup 启动自动备份
func (bs *BackupService) startAutoBackup() {
	ticker := time.NewTicker(1 * time.Hour) // 每小时检查一次
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			config, err := bs.getBackupConfig()
			if err != nil || !config.AutoBackup {
				continue
			}
			
			// 检查是否需要备份
			backups, err := bs.GetBackups()
			if err != nil {
				continue
			}
			
			shouldBackup := true
			if len(backups) > 0 {
				lastBackup := backups[0] // 已按时间排序
				if time.Since(lastBackup.CreatedAt) < config.BackupInterval {
					shouldBackup = false
				}
			}
			
			if shouldBackup {
				// 执行自动备份
				items := []string{} // 空表示使用配置决定
				backup, err := bs.CreateBackup(
					fmt.Sprintf("Auto Backup %s", time.Now().Format("2006-01-02 15:04")),
					"Automatic backup",
					items,
				)
				if err != nil {
					fmt.Printf("Auto backup failed: %v\n", err)
				} else {
					backup.Type = "auto"
					bs.saveBackupInfo(backup)
				}
			}
			
		case <-bs.ctx.Done():
			return
		}
	}
}

// copyFile 复制文件
func (bs *BackupService) copyFile(src, dest string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()
	
	// 创建目标目录
	if err := os.MkdirAll(filepath.Dir(dest), 0755); err != nil {
		return err
	}
	
	destFile, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer destFile.Close()
	
	_, err = io.Copy(destFile, sourceFile)
	return err
}

// copyDir 复制目录
func (bs *BackupService) copyDir(src, dest string, overwrite bool) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		
		relPath, err := filepath.Rel(src, path)
		if err != nil {
			return nil
		}
		
		destPath := filepath.Join(dest, relPath)
		
		if info.IsDir() {
			return os.MkdirAll(destPath, info.Mode())
		}
		
		if !overwrite && bs.fileExists(destPath) {
			return nil
		}
		
		return bs.copyFile(path, destPath)
	})
}

// fileExists 检查文件是否存在
func (bs *BackupService) fileExists(filePath string) bool {
	_, err := os.Stat(filePath)
	return err == nil
}