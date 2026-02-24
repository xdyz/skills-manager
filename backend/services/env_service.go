package services

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

// EnvStatus 环境依赖状态
type EnvStatus struct {
	NpxInstalled            bool   `json:"npxInstalled"`
	SkillsInstalled         bool   `json:"skillsInstalled"`
	FindSkillsPlusInstalled bool   `json:"findSkillsPlusInstalled"`
	NodeVersion             string `json:"nodeVersion"`
	NpxVersion              string `json:"npxVersion"`
}

// EnvService 环境检测服务，负责在启动时预加载环境状态
type EnvService struct {
	ctx    context.Context
	status EnvStatus
	mu     sync.RWMutex
}

func NewEnvService() *EnvService {
	return &EnvService{}
}

func (es *EnvService) Startup(ctx context.Context) {
	es.ctx = ctx
	// 启动时同步检测环境，确保前端首次调用 CheckEnv 时结果已就绪
	es.detect()
}

// detect 执行实际的环境检测
func (es *EnvService) detect() {
	status := EnvStatus{}

	// 检查 node
	if ver, err := shellOutput("node --version"); err == nil && ver != "" {
		status.NodeVersion = ver
	}

	// 检查 npx
	if ver, err := shellOutput("npx --version"); err == nil && ver != "" {
		status.NpxInstalled = true
		status.NpxVersion = ver
	}

	// 检查 skills CLI
	if status.NpxInstalled {
		if _, err := shellRun("npx skills --help"); err == nil {
			status.SkillsInstalled = true
		}
	}

	// 检查 find-skills-plus 是否已安装
	homeDir, _ := os.UserHomeDir()
	scriptPath := filepath.Join(homeDir, ".agents", "skills", "find-skills-plus", "scripts", "enrich_find.js")
	if _, err := os.Stat(scriptPath); err == nil {
		status.FindSkillsPlusInstalled = true
	}

	fmt.Printf("环境检查: npx=%v, skills=%v, find-skills-plus=%v, node=%s\n",
		status.NpxInstalled, status.SkillsInstalled, status.FindSkillsPlusInstalled, status.NodeVersion)

	es.mu.Lock()
	es.status = status
	es.mu.Unlock()
}

// CheckEnv 返回环境状态（已缓存的结果）
func (es *EnvService) CheckEnv() EnvStatus {
	es.mu.RLock()
	defer es.mu.RUnlock()
	return es.status
}

// RefreshEnv 重新检测环境并返回最新结果
func (es *EnvService) RefreshEnv() EnvStatus {
	es.detect()
	return es.CheckEnv()
}

// InstallSkillsCLI 安装 skills CLI
func (es *EnvService) InstallSkillsCLI() error {
	fmt.Println("安装 skills CLI...")
	output, err := shellRun("npm install -g @anthropic-ai/skills")
	if err != nil {
		fmt.Printf("安装 skills CLI 失败: %s\n%s\n", err, string(output))
		return fmt.Errorf("安装 skills CLI 失败: %v\n%s", err, string(output))
	}
	fmt.Printf("安装 skills CLI 成功: %s\n", string(output))
	// 安装后刷新环境状态
	es.detect()
	return nil
}

// InstallFindSkillsPlus 安装 find-skills-plus
func (es *EnvService) InstallFindSkillsPlus() error {
	fmt.Println("安装 find-skills-plus...")
	output, err := shellRun("npx skills add yinhui1984/find_skills_plus")
	if err != nil {
		fmt.Printf("安装 find-skills-plus 失败: %s\n%s\n", err, string(output))
		return fmt.Errorf("安装 find-skills-plus 失败: %v\n%s", err, string(output))
	}
	fmt.Printf("安装 find-skills-plus 成功: %s\n", string(output))
	// 安装后刷新环境状态
	es.detect()
	return nil
}
