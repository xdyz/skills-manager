package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// AgentService 负责 Agent 相关的所有操作
type AgentService struct {
	ctx context.Context
}

func NewAgentService() *AgentService {
	return &AgentService{}
}

func (as *AgentService) Startup(ctx context.Context) {
	as.ctx = ctx
}

// AgentConfig 定义 agent 的配置
type AgentConfig struct {
	Name       string `json:"name"`       // 显示名称
	GlobalPath string `json:"globalPath"` // 全局路径（相对于 home 目录）
	LocalPath  string `json:"localPath"`  // 项目内路径（相对于项目根目录）
}

// AgentInfo 返回给前端的 agent 信息
type AgentInfo struct {
	Name      string `json:"name"`
	LocalPath string `json:"localPath"`
	IsCustom  bool   `json:"isCustom"`
}

// CustomAgentConfig 用户自定义的 agent 配置（持久化到文件）
type CustomAgentConfig struct {
	Name       string `json:"name"`
	GlobalPath string `json:"globalPath"`
	LocalPath  string `json:"localPath"`
}

// defaultAgents 内置的默认 agents 列表，仅在 agents.json 不存在时用于初始化
var defaultAgents = []AgentConfig{
	{"Amp", ".config/agents/skills", ".amp/skills"},
	{"Kimi Code CLI", ".config/agents/skills", ".kimi/skills"},
	{"Replit", ".config/agents/skills", ".replit/skills"},
	{"Antigravity", ".gemini/antigravity/skills", ".gemini/skills"},
	{"Augment", ".augment/skills", ".augment/skills"},
	{"Claude Code", ".claude/skills", ".claude/skills"},
	{"OpenClaw", ".moltbot/skills", ".moltbot/skills"},
	{"Cline", ".cline/skills", ".cline/skills"},
	{"CodeBuddy", ".codebuddy/skills", ".codebuddy/skills"},
	{"Codex", ".codex/skills", ".codex/skills"},
	{"Command Code", ".commandcode/skills", ".commandcode/skills"},
	{"Continue", ".continue/skills", ".continue/skills"},
	{"Crush", ".config/crush/skills", ".crush/skills"},
	{"Cursor", ".cursor/skills", ".cursor/skills"},
	{"Droid", ".factory/skills", ".factory/skills"},
	{"Gemini CLI", ".gemini/skills", ".gemini/skills"},
	{"GitHub Copilot", ".copilot/skills", ".copilot/skills"},
	{"Goose", ".config/goose/skills", ".goose/skills"},
	{"Junie", ".junie/skills", ".junie/skills"},
	{"iFlow CLI", ".iflow/skills", ".iflow/skills"},
	{"Kilo Code", ".kilocode/skills", ".kilocode/skills"},
	{"Kiro CLI", ".kiro/skills", ".kiro/skills"},
	{"Kode", ".kode/skills", ".kode/skills"},
	{"MCPJam", ".mcpjam/skills", ".mcpjam/skills"},
	{"Mistral Vibe", ".vibe/skills", ".vibe/skills"},
	{"Mux", ".mux/skills", ".mux/skills"},
	{"OpenCode", ".config/opencode/skills", ".opencode/skills"},
	{"OpenHands", ".openhands/skills", ".openhands/skills"},
	{"Pi", ".pi/agent/skills", ".pi/skills"},
	{"Qoder", ".qoder/skills", ".qoder/skills"},
	{"Qwen Code", ".qwen/skills", ".qwen/skills"},
	{"Roo Code", ".roo/skills", ".roo/skills"},
	{"Trae", ".trae/skills", ".trae/skills"},
	{"Trae CN", ".trae-cn/skills", ".trae-cn/skills"},
	{"Windsurf", ".codeium/windsurf/skills", ".windsurf/skills"},
	{"Zencoder", ".zencoder/skills", ".zencoder/skills"},
	{"Neovate", ".neovate/skills", ".neovate/skills"},
	{"Pochi", ".pochi/skills", ".pochi/skills"},
	{"AdaL", ".adal/skills", ".adal/skills"},
	{"Cortex Code", ".cortex/skills", ".snowflake/cortex/skills"},
	{"Universal", ".agents/skills", ".config/agents/skills"},
}

// supportedAgents 运行时的 agents 列表，从 agents.json 加载
var supportedAgents []AgentConfig

// init 在启动时从 agents.json 加载 agent 列表，若文件不存在则用默认列表初始化
func init() {
	agents, err := loadAgentsFromFile()
	if err != nil || len(agents) == 0 {
		// 文件不存在或为空，用默认列表初始化并写入文件
		supportedAgents = make([]AgentConfig, len(defaultAgents))
		copy(supportedAgents, defaultAgents)
		_ = saveAgentsToFile(supportedAgents)
	} else {
		supportedAgents = agents
	}
}

// ---- 配置文件路径 ----

// getConfigDir 获取 skills-manager 配置目录
func getConfigDir() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	configDir := filepath.Join(homeDir, ".skills-manager")
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return "", err
	}
	return configDir, nil
}

func getCustomAgentsFilePath() (string, error) {
	configDir, err := getConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(configDir, "custom-agents.json"), nil
}

func getAgentsFilePath() (string, error) {
	configDir, err := getConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(configDir, "agents.json"), nil
}

// ---- agents.json 持久化 ----

func loadAgentsFromFile() ([]AgentConfig, error) {
	filePath, err := getAgentsFilePath()
	if err != nil {
		return nil, err
	}
	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}
	var agents []AgentConfig
	if err := json.Unmarshal(data, &agents); err != nil {
		return nil, err
	}
	return agents, nil
}

func saveAgentsToFile(agents []AgentConfig) error {
	filePath, err := getAgentsFilePath()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(agents, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filePath, data, 0644)
}

// ---- 自定义 Agent 持久化 ----

func loadCustomAgents() ([]CustomAgentConfig, error) {
	filePath, err := getCustomAgentsFilePath()
	if err != nil {
		return nil, err
	}
	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return []CustomAgentConfig{}, nil
		}
		return nil, err
	}
	var agents []CustomAgentConfig
	if err := json.Unmarshal(data, &agents); err != nil {
		return []CustomAgentConfig{}, nil
	}
	return agents, nil
}

func saveCustomAgents(agents []CustomAgentConfig) error {
	filePath, err := getCustomAgentsFilePath()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(agents, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filePath, data, 0644)
}

// ---- 包级辅助函数 ----

// getAllAgentConfigs 获取所有 agent 配置（内置 + 自定义）
func getAllAgentConfigs() []AgentConfig {
	all := make([]AgentConfig, len(supportedAgents))
	copy(all, supportedAgents)
	customs, err := loadCustomAgents()
	if err == nil {
		for _, c := range customs {
			all = append(all, AgentConfig{Name: c.Name, GlobalPath: c.GlobalPath, LocalPath: c.LocalPath})
		}
	}
	return all
}

// httpGet 发送 HTTP GET 请求并返回响应体
func httpGet(url string) ([]byte, error) {
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d", resp.StatusCode)
	}
	return io.ReadAll(resp.Body)
}

// ---- AgentService 公开方法（暴露给前端） ----

// GetSupportedAgents 返回所有支持的 agent 列表（内置 + 自定义）
func (as *AgentService) GetSupportedAgents() []AgentInfo {
	customs, _ := loadCustomAgents()
	customNames := make(map[string]bool)
	for _, c := range customs {
		customNames[c.Name] = true
	}

	allConfigs := getAllAgentConfigs()
	agents := make([]AgentInfo, len(allConfigs))
	for i, a := range allConfigs {
		agents[i] = AgentInfo{Name: a.Name, LocalPath: a.LocalPath, IsCustom: customNames[a.Name]}
	}
	return agents
}

// EnableProjectAgent 在项目中启用一个 agent（创建目录并同步已有 skills）
func (as *AgentService) EnableProjectAgent(projectPath string, agentName string) error {
	if projectPath == "" || agentName == "" {
		return fmt.Errorf("project path and agent name are required")
	}
	allConfigs := getAllAgentConfigs()
	var targetAgent *AgentConfig
	for _, a := range allConfigs {
		if a.Name == agentName {
			targetAgent = &a
			break
		}
	}
	if targetAgent == nil {
		return fmt.Errorf("agent \"%s\" not found", agentName)
	}
	agentDir := filepath.Join(projectPath, targetAgent.LocalPath)
	if err := os.MkdirAll(agentDir, 0755); err != nil {
		return fmt.Errorf("failed to create agent directory: %v", err)
	}

	// 同步项目中其他已启用 Agent 下的 skills 到新启用的 Agent
	as.syncSkillsToAgent(projectPath, targetAgent, allConfigs)

	return nil
}

// syncSkillsToAgent 将项目中其他 agent 已有的 skills 同步到目标 agent
func (as *AgentService) syncSkillsToAgent(projectPath string, targetAgent *AgentConfig, allConfigs []AgentConfig) {
	homeDir, _ := os.UserHomeDir()
	centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")
	targetSkillsDir := filepath.Join(projectPath, targetAgent.LocalPath)

	// 收集项目中其他 agent 已有的 skills（去重）
	type skillSource struct {
		name       string
		sourcePath string // 真实来源路径
		isGlobal   bool
	}
	skillMap := make(map[string]*skillSource)

	for _, agent := range allConfigs {
		if agent.Name == targetAgent.Name {
			continue
		}
		agentSkillsDir := filepath.Join(projectPath, agent.LocalPath)
		entries, err := os.ReadDir(agentSkillsDir)
		if err != nil {
			continue
		}
		for _, entry := range entries {
			skillName := entry.Name()
			if strings.HasPrefix(skillName, ".") {
				continue
			}
			if _, exists := skillMap[skillName]; exists {
				continue // 已经记录过
			}

			skillPath := filepath.Join(agentSkillsDir, skillName)
			info, err := os.Stat(skillPath)
			if err != nil || !info.IsDir() {
				continue
			}

			// 判断来源类型
			src := &skillSource{name: skillName}
			if lstat, err := os.Lstat(skillPath); err == nil && lstat.Mode()&os.ModeSymlink != 0 {
				if target, err := os.Readlink(skillPath); err == nil {
					absTarget := target
					if !filepath.IsAbs(target) {
						absTarget = filepath.Clean(filepath.Join(filepath.Dir(skillPath), target))
					}
					src.sourcePath = absTarget
					src.isGlobal = strings.HasPrefix(absTarget, centralSkillsDir)
				}
			} else {
				// 本地实际目录
				src.sourcePath = skillPath
				src.isGlobal = false
			}

			if src.sourcePath != "" {
				skillMap[skillName] = src
			}
		}
	}

	if len(skillMap) == 0 {
		return
	}

	fmt.Printf("同步 %d 个 skills 到新启用的 agent [%s]\n", len(skillMap), targetAgent.Name)

	for _, skill := range skillMap {
		targetPath := filepath.Join(targetSkillsDir, skill.name)

		// 如果已存在则跳过
		if _, err := os.Lstat(targetPath); err == nil {
			continue
		}

		if skill.isGlobal {
			// 全局 skill：创建软链接
			if err := os.Symlink(skill.sourcePath, targetPath); err != nil {
				fmt.Printf("  ✗ 创建软链接失败 [%s -> %s]: %v\n", skill.name, targetAgent.Name, err)
			} else {
				fmt.Printf("  ✓ 同步软链接 [%s -> %s]\n", skill.name, targetAgent.Name)
			}
		} else {
			// 本地 skill：复制目录
			if err := copyDir(skill.sourcePath, targetPath); err != nil {
				fmt.Printf("  ✗ 复制失败 [%s -> %s]: %v\n", skill.name, targetAgent.Name, err)
			} else {
				fmt.Printf("  ✓ 同步复制 [%s -> %s]\n", skill.name, targetAgent.Name)
			}
		}
	}
}

// DisableProjectAgent 在项目中禁用一个 agent（删除目录）
// force 为 true 时，会先清空目录中的 skills 再删除
func (as *AgentService) DisableProjectAgent(projectPath string, agentName string, force bool) error {
	if projectPath == "" || agentName == "" {
		return fmt.Errorf("project path and agent name are required")
	}
	allConfigs := getAllAgentConfigs()
	var targetAgent *AgentConfig
	for _, a := range allConfigs {
		if a.Name == agentName {
			targetAgent = &a
			break
		}
	}
	if targetAgent == nil {
		return fmt.Errorf("agent \"%s\" not found", agentName)
	}
	agentDir := filepath.Join(projectPath, targetAgent.LocalPath)
	info, err := os.Stat(agentDir)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("failed to check agent directory: %v", err)
	}
	if !info.IsDir() {
		return fmt.Errorf("path is not a directory")
	}
	entries, err := os.ReadDir(agentDir)
	if err != nil {
		return fmt.Errorf("failed to read agent directory: %v", err)
	}
	if len(entries) > 0 {
		if !force {
			return fmt.Errorf("agent directory is not empty, contains %d items", len(entries))
		}
		// 强制模式：清空目录中的所有 skills
		fmt.Printf("强制禁用 Agent [%s]，清理 %d 个 skill\n", agentName, len(entries))
		for _, entry := range entries {
			entryPath := filepath.Join(agentDir, entry.Name())
			if lstat, err := os.Lstat(entryPath); err == nil && lstat.Mode()&os.ModeSymlink != 0 {
				os.Remove(entryPath)
			} else {
				os.RemoveAll(entryPath)
			}
		}
	}
	if err := os.Remove(agentDir); err != nil {
		return fmt.Errorf("failed to remove agent directory: %v", err)
	}

	// 清理空的父目录（例如删除 .codebuddy/skills 后，如果 .codebuddy 也为空则一并删除）
	parentDir := filepath.Dir(agentDir)
	// 只清理项目内的隐藏目录（以 . 开头），且不能是项目根目录本身
	if parentDir != projectPath && strings.HasPrefix(filepath.Base(parentDir), ".") {
		if entries, err := os.ReadDir(parentDir); err == nil && len(entries) == 0 {
			os.Remove(parentDir)
			fmt.Printf("清理空父目录: %s\n", parentDir)
		}
	}

	return nil
}

// GetProjectAgentSkillCount 获取项目中某个 agent 目录下的 skill 数量
func (as *AgentService) GetProjectAgentSkillCount(projectPath string, agentName string) int {
	if projectPath == "" || agentName == "" {
		return 0
	}
	allConfigs := getAllAgentConfigs()
	for _, a := range allConfigs {
		if a.Name == agentName {
			agentDir := filepath.Join(projectPath, a.LocalPath)
			entries, err := os.ReadDir(agentDir)
			if err != nil {
				return 0
			}
			count := 0
			for _, entry := range entries {
				if !strings.HasPrefix(entry.Name(), ".") {
					count++
				}
			}
			return count
		}
	}
	return 0
}

// GetProjectAgents 返回项目中实际存在的 agent 列表
func (as *AgentService) GetProjectAgents(projectPath string) []AgentInfo {
	if projectPath == "" {
		return []AgentInfo{}
	}
	allConfigs := getAllAgentConfigs()
	customs, _ := loadCustomAgents()
	customNames := make(map[string]bool)
	for _, c := range customs {
		customNames[c.Name] = true
	}
	var result []AgentInfo
	for _, a := range allConfigs {
		agentDir := filepath.Join(projectPath, a.LocalPath)
		if info, err := os.Stat(agentDir); err == nil && info.IsDir() {
			result = append(result, AgentInfo{Name: a.Name, LocalPath: a.LocalPath, IsCustom: customNames[a.Name]})
		}
	}
	return result
}

// AddCustomAgent 添加自定义 agent（路径根据名称自动生成）
func (as *AgentService) AddCustomAgent(name string) error {
	if name == "" {
		return fmt.Errorf("名称不能为空")
	}
	pathSegment := strings.ToLower(strings.ReplaceAll(strings.TrimSpace(name), " ", "-"))
	globalPath := "." + pathSegment + "/skills"
	localPath := "." + pathSegment + "/skills"

	for _, a := range supportedAgents {
		if strings.EqualFold(a.Name, name) {
			return fmt.Errorf("与内置 Agent \"%s\" 名称冲突", a.Name)
		}
	}
	customs, err := loadCustomAgents()
	if err != nil {
		return fmt.Errorf("读取配置失败: %v", err)
	}
	for _, c := range customs {
		if strings.EqualFold(c.Name, name) {
			return fmt.Errorf("自定义 Agent \"%s\" 已存在", name)
		}
	}
	customs = append(customs, CustomAgentConfig{Name: name, GlobalPath: globalPath, LocalPath: localPath})
	return saveCustomAgents(customs)
}

// RemoveCustomAgent 删除自定义 agent
func (as *AgentService) RemoveCustomAgent(name string) error {
	customs, err := loadCustomAgents()
	if err != nil {
		return fmt.Errorf("读取配置失败: %v", err)
	}
	found := false
	result := make([]CustomAgentConfig, 0, len(customs))
	for _, c := range customs {
		if c.Name == name {
			found = true
			continue
		}
		result = append(result, c)
	}
	if !found {
		return fmt.Errorf("未找到自定义 Agent \"%s\"", name)
	}
	return saveCustomAgents(result)
}


