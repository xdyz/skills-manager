package services

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type folderConfig struct {
	Folders []string `json:"folders"`
}

type FolderService struct {
	ctx        context.Context
	folders    []string
	configPath string
}

func NewFolderService() *FolderService {
	return &FolderService{
		folders: []string{},
	}
}

func (fs *FolderService) Startup(ctx context.Context) {
	fs.ctx = ctx

	// 初始化配置文件路径: ~/.skills-manager/config.json
	homeDir, err := os.UserHomeDir()
	if err == nil {
		configDir := filepath.Join(homeDir, ".skills-manager")
		os.MkdirAll(configDir, 0755)
		fs.configPath = filepath.Join(configDir, "config.json")
	}

	// 启动时从磁盘加载已保存的文件夹列表
	fs.loadFromDisk()
}

// SelectFolder opens a folder selection dialog and returns the selected folder path
func (fs *FolderService) SelectFolder() (string, error) {
	folder, err := runtime.OpenDirectoryDialog(fs.ctx, runtime.OpenDialogOptions{
		Title: "选择文件夹",
	})
	if err != nil {
		return "", err
	}
	if folder != "" {
		// 去重
		for _, f := range fs.folders {
			if f == folder {
				return folder, nil
			}
		}
		fs.folders = append(fs.folders, folder)
		fs.saveToDisk()
	}
	return folder, nil
}

// GetFolders returns the list of opened folders
func (fs *FolderService) GetFolders() []string {
	return fs.folders
}

// RemoveFolder removes a folder from the list
func (fs *FolderService) RemoveFolder(folder string) {
	for i, f := range fs.folders {
		if f == folder {
			fs.folders = append(fs.folders[:i], fs.folders[i+1:]...)
			fs.saveToDisk()
			break
		}
	}
}

// loadFromDisk reads the folder list from the config file
func (fs *FolderService) loadFromDisk() {
	if fs.configPath == "" {
		return
	}
	data, err := os.ReadFile(fs.configPath)
	if err != nil {
		return
	}
	var cfg folderConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		return
	}
	// 只保留仍然存在的目录
	valid := make([]string, 0, len(cfg.Folders))
	for _, f := range cfg.Folders {
		if info, err := os.Stat(f); err == nil && info.IsDir() {
			valid = append(valid, f)
		}
	}
	fs.folders = valid
}

// saveToDisk writes the folder list to the config file
func (fs *FolderService) saveToDisk() {
	if fs.configPath == "" {
		return
	}
	cfg := folderConfig{Folders: fs.folders}
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return
	}
	os.WriteFile(fs.configPath, data, 0644)
}
