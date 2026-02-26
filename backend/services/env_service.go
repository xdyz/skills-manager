package services

import (
	"context"
	"fmt"
	"sync"
)

// EnvStatus 环境依赖状态
type EnvStatus struct {
	NpxInstalled    bool   `json:"npxInstalled"`
	SkillsInstalled bool   `json:"skillsInstalled"`
	NodeVersion     string `json:"nodeVersion"`
	NpxVersion      string `json:"npxVersion"`
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
	// 启动时异步检测环境，不阻塞 app 启动
	go es.detect()
}

// detect 执行实际的环境检测（并行执行所有检查）
func (es *EnvService) detect() {
	status := EnvStatus{}
	var wg sync.WaitGroup
	var mu sync.Mutex

	// 并行检查 node 和 npx
	wg.Add(2)

	go func() {
		defer wg.Done()
		if ver, err := shellOutput("node --version"); err == nil && ver != "" {
			mu.Lock()
			status.NodeVersion = ver
			mu.Unlock()
		}
	}()

	go func() {
		defer wg.Done()
		if ver, err := shellOutput("npx --version"); err == nil && ver != "" {
			mu.Lock()
			status.NpxInstalled = true
			status.NpxVersion = ver
			mu.Unlock()
		}
	}()

	wg.Wait()

	// npx 存在时再检查 skills CLI
	if status.NpxInstalled {
		if _, err := shellRun("npx skills --help"); err == nil {
			status.SkillsInstalled = true
		}
	}

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
	output, err := shellRun("npm install -g @anthropic-ai/skills")
	if err != nil {
		return fmt.Errorf("安装 skills CLI 失败: %v\n%s", err, string(output))
	}
	// 安装后刷新环境状态
	es.detect()
	return nil
}

