package services

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

type SkillsService struct {
	ctx    context.Context
	skills []Skills
}

type Skills struct {
	Name      string   `json:"name"`
	Desc      string   `json:"desc"`
	Path      string   `json:"path"`
	Language  string   `json:"language"`
	Framework string   `json:"framework"`
	Agents    []string `json:"agents"` // 该 skill 存在于哪些 agent 目录
}

// ProjectSkill 项目内的 skill 信息
type ProjectSkill struct {
	Name      string   `json:"name"`
	Desc      string   `json:"desc"`
	Path      string   `json:"path"`
	Language  string   `json:"language"`
	Framework string   `json:"framework"`
	Agents    []string `json:"agents"`   // 所属 agents（可能链接到多个 agent）
	IsGlobal  bool     `json:"isGlobal"` // 是否是全局 skill（软链接）
}

// RemoteSkill 远程 skill 信息
type RemoteSkill struct {
	FullName    string `json:"fullName"`    // 例如: vercel-labs/agent-skills@vercel-react-best-practices
	Owner       string `json:"owner"`       // 例如: vercel-labs
	Repo        string `json:"repo"`        // 例如: agent-skills
	Name        string `json:"name"`        // 例如: vercel-react-best-practices
	URL         string `json:"url"`         // 例如: https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices
	Description string `json:"description"` // 技能描述（由 find-skills-plus 提供）
	Installed   bool   `json:"installed"`   // 是否已安装
}

// SkillsLock .skills-lock 文件结构
type SkillsLock struct {
	Version int                       `json:"version"`
	Skills  map[string]SkillLockEntry `json:"skills"`
}

// SkillLockEntry 单个 skill 的安装信息
type SkillLockEntry struct {
	Source      string `json:"source"`      // 例如: vercel-labs/agent-skills
	SourceType  string `json:"sourceType"`  // 例如: github
	SourceURL   string `json:"sourceUrl"`   // 例如: https://github.com/vercel-labs/agent-skills.git
	SkillPath   string `json:"skillPath"`   // 例如: skills/react-best-practices/SKILL.md
	InstalledAt string `json:"installedAt"`
	UpdatedAt   string `json:"updatedAt"`
}

// AgentConfig 定义 agent 的配置
type AgentConfig struct {
	Name       string // 显示名称
	GlobalPath string // 全局路径（相对于 home 目录）
	LocalPath  string // 项目内路径（相对于项目根目录）
}

// 支持的 agents 列表（从 npx skills 获取）
var supportedAgents = []AgentConfig{
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

// getCustomAgentsFilePath 获取自定义 agent 配置文件路径
func getCustomAgentsFilePath() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	configDir := filepath.Join(homeDir, ".config", "skills-manager")
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return "", err
	}
	return filepath.Join(configDir, "custom-agents.json"), nil
}

// loadCustomAgents 从配置文件加载自定义 agent 列表
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

// saveCustomAgents 保存自定义 agent 列表到配置文件
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

// GetSupportedAgents 返回所有支持的 agent 列表（内置 + 自定义）
func (ss *SkillsService) GetSupportedAgents() []AgentInfo {
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

// AddCustomAgent 添加自定义 agent
func (ss *SkillsService) AddCustomAgent(name string, globalPath string, localPath string) error {
	if name == "" || globalPath == "" || localPath == "" {
		return fmt.Errorf("名称、全局路径和项目路径不能为空")
	}
	// 检查是否与内置 agent 重名
	for _, a := range supportedAgents {
		if strings.EqualFold(a.Name, name) {
			return fmt.Errorf("与内置 Agent \"%s\" 名称冲突", a.Name)
		}
	}
	customs, err := loadCustomAgents()
	if err != nil {
		return fmt.Errorf("读取配置失败: %v", err)
	}
	// 检查自定义列表中是否已存在
	for _, c := range customs {
		if strings.EqualFold(c.Name, name) {
			return fmt.Errorf("自定义 Agent \"%s\" 已存在", name)
		}
	}
	customs = append(customs, CustomAgentConfig{Name: name, GlobalPath: globalPath, LocalPath: localPath})
	return saveCustomAgents(customs)
}

// RemoveCustomAgent 删除自定义 agent
func (ss *SkillsService) RemoveCustomAgent(name string) error {
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

func NewSkillsService() *SkillsService {
	return &SkillsService{
		skills: []Skills{},
	}
}

func (ss *SkillsService) Startup(ctx context.Context) {
	ss.ctx = ctx
}

// EnvStatus 环境依赖状态
type EnvStatus struct {
	NpxInstalled            bool   `json:"npxInstalled"`
	SkillsInstalled         bool   `json:"skillsInstalled"`
	FindSkillsPlusInstalled bool   `json:"findSkillsPlusInstalled"`
	NodeVersion             string `json:"nodeVersion"`
	NpxVersion              string `json:"npxVersion"`
}

// CheckEnv 检查运行环境依赖
func (ss *SkillsService) CheckEnv() EnvStatus {
	status := EnvStatus{}

	// 检查 node
	if out, err := exec.Command("node", "--version").Output(); err == nil {
		status.NodeVersion = strings.TrimSpace(string(out))
	}

	// 检查 npx
	if out, err := exec.Command("npx", "--version").Output(); err == nil {
		status.NpxInstalled = true
		status.NpxVersion = strings.TrimSpace(string(out))
	}

	// 检查 skills CLI（npx skills --version 或 npx skills --help）
	if status.NpxInstalled {
		cmd := exec.Command("npx", "skills", "--help")
		if err := cmd.Run(); err == nil {
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

	return status
}

// InstallSkillsCLI 安装 skills CLI
func (ss *SkillsService) InstallSkillsCLI() error {
	fmt.Println("安装 skills CLI...")
	cmd := exec.Command("npm", "install", "-g", "@anthropic-ai/skills")
	cmd.Env = os.Environ()
	output, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Printf("安装 skills CLI 失败: %s\n%s\n", err, string(output))
		return fmt.Errorf("安装 skills CLI 失败: %v\n%s", err, string(output))
	}
	fmt.Printf("安装 skills CLI 成功: %s\n", string(output))
	return nil
}

// InstallFindSkillsPlus 安装 find-skills-plus
func (ss *SkillsService) InstallFindSkillsPlus() error {
	fmt.Println("安装 find-skills-plus...")
	cmd := exec.Command("npx", "skills", "add", "yinhui1984/find_skills_plus")
	cmd.Env = os.Environ()
	output, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Printf("安装 find-skills-plus 失败: %s\n%s\n", err, string(output))
		return fmt.Errorf("安装 find-skills-plus 失败: %v\n%s", err, string(output))
	}
	fmt.Printf("安装 find-skills-plus 成功: %s\n", string(output))
	return nil
}

func (ss *SkillsService) GetAllAgentSkills() ([]Skills, error) {
	// 1. 获取用户主目录
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}

	fmt.Println("开始扫描 skills，主目录:", homeDir)

	// 2. 使用 map 去重，key 是 skill 名称
	skillsMap := make(map[string]*Skills)

	// 3. 遍历所有支持的 agent 目录
	for _, agent := range getAllAgentConfigs() {
		agentSkillsDir := filepath.Join(homeDir, agent.GlobalPath)

		// 检查目录是否存在
		if _, err := os.Stat(agentSkillsDir); os.IsNotExist(err) {
			continue // 该 agent 目录不存在，跳过
		}

		fmt.Printf("扫描 agent 目录: %s (%s)\n", agent.Name, agentSkillsDir)

		// 读取该 agent 目录下的所有 skill
		entries, err := os.ReadDir(agentSkillsDir)
		if err != nil {
			fmt.Printf("读取目录失败: %v\n", err)
			continue // 读取失败，跳过
		}

		// 遍历每个 skill 文件夹
		for _, entry := range entries {
			skillName := entry.Name()
			
			// 跳过隐藏文件
			if strings.HasPrefix(skillName, ".") {
				continue
			}

			skillPath := filepath.Join(agentSkillsDir, skillName)

			// 检查是否是目录或软链接（软链接也需要处理）
			info, err := os.Stat(skillPath)
			if err != nil {
				fmt.Printf("  - 跳过 %s: stat 失败 %v\n", skillName, err)
				continue
			}
			if !info.IsDir() {
				fmt.Printf("  - 跳过 %s: 不是目录\n", skillName)
				continue
			}

			// 读取 SKILL.md
			skillMdPath := filepath.Join(skillPath, "SKILL.md")
			content, err := os.ReadFile(skillMdPath)
			if err != nil {
				fmt.Printf("  - 跳过 %s: 没有 SKILL.md\n", skillName)
				continue // 没有 SKILL.md，跳过
			}

			fmt.Printf("  ✓ 找到 skill: %s\n", skillName)

			// 如果这个 skill 已经存在，只添加 agent 名称
			if existingSkill, exists := skillsMap[skillName]; exists {
				existingSkill.Agents = append(existingSkill.Agents, agent.Name)
			} else {
				// 新 skill，解析并添加
				skill := parseSkillMd(string(content), skillPath)
				if skill.Name == "" {
					skill.Name = skillName // 如果 YAML 中没有 name，使用目录名
				}
				skill.Agents = []string{agent.Name}
				skillsMap[skillName] = &skill
			}
		}
	}

	// 4. 将 map 转换为 slice
	var skills []Skills
	for _, skill := range skillsMap {
		skills = append(skills, *skill)
	}

	fmt.Printf("总共找到 %d 个 skills\n", len(skills))

	return skills, nil
}

// parseSkillMd 解析 SKILL.md 文件的 YAML frontmatter
func parseSkillMd(content string, path string) Skills {
	skill := Skills{Path: path}

	// 提取 --- 之间的 frontmatter
	lines := strings.Split(content, "\n")
	inFrontmatter := false
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		if trimmed == "---" {
			if !inFrontmatter {
				inFrontmatter = true
			} else {
				break // 遇到第二个 ---，结束解析
			}
			continue
		}

		if !inFrontmatter {
			continue
		}

		// 解析 key: value 格式
		if strings.Contains(line, ":") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) != 2 {
				continue
			}
			key := strings.TrimSpace(parts[0])
			value := strings.TrimSpace(parts[1])

			switch key {
			case "name":
				skill.Name = value
			case "description":
				skill.Desc = value
			case "language":
				skill.Language = value
			case "framework":
				skill.Framework = value
			}
		}
	}

	return skill
}

// GetProjectSkills 获取指定项目目录内的 skills
func (ss *SkillsService) GetProjectSkills(projectPath string) ([]ProjectSkill, error) {
	if projectPath == "" {
		return []ProjectSkill{}, nil
	}

	fmt.Printf("扫描项目 skills: %s\n", projectPath)

	homeDir, _ := os.UserHomeDir()
	skillMap := make(map[string]*ProjectSkill) // 用 skill name 聚合多个 agent
	var order []string                         // 保持顺序

	for _, agent := range getAllAgentConfigs() {
		agentSkillsDir := filepath.Join(projectPath, agent.LocalPath)

		if _, err := os.Stat(agentSkillsDir); os.IsNotExist(err) {
			continue
		}

		entries, err := os.ReadDir(agentSkillsDir)
		if err != nil {
			continue
		}

		for _, entry := range entries {
			skillName := entry.Name()
			if strings.HasPrefix(skillName, ".") {
				continue
			}

			skillPath := filepath.Join(agentSkillsDir, skillName)

			info, err := os.Stat(skillPath)
			if err != nil || !info.IsDir() {
				continue
			}

			// 判断是否是全局的软链接
			isGlobal := false
			if lstat, err := os.Lstat(skillPath); err == nil {
				if lstat.Mode()&os.ModeSymlink != 0 {
					// 读取软链接目标
					if target, err := os.Readlink(skillPath); err == nil {
						centralDir := filepath.Join(homeDir, ".agents", "skills")
						if strings.HasPrefix(target, centralDir) {
							isGlobal = true
						}
					}
				}
			}

			// 如果已经见过这个 skill，只追加 agent
			if existing, ok := skillMap[skillName]; ok {
				existing.Agents = append(existing.Agents, agent.Name)
				fmt.Printf("  + [%s] %s (追加 agent)\n", agent.Name, skillName)
				continue
			}

			// 读取 SKILL.md
			skillMdPath := filepath.Join(skillPath, "SKILL.md")
			content, err := os.ReadFile(skillMdPath)
			if err != nil {
				continue
			}

			parsed := parseSkillMd(string(content), skillPath)
			skill := &ProjectSkill{
				Name:      skillName,
				Desc:      parsed.Desc,
				Path:      skillPath,
				Language:  parsed.Language,
				Framework: parsed.Framework,
				Agents:    []string{agent.Name},
				IsGlobal:  isGlobal,
			}
			if parsed.Name != "" {
				skill.Name = parsed.Name
			}

			skillMap[skillName] = skill
			order = append(order, skillName)
			fmt.Printf("  ✓ [%s] %s (全局: %v)\n", agent.Name, skillName, isGlobal)
		}
	}

	// 按发现顺序构建结果
	skills := make([]ProjectSkill, 0, len(order))
	for _, name := range order {
		skills = append(skills, *skillMap[name])
	}

	fmt.Printf("项目 %s 共找到 %d 个 skills\n", projectPath, len(skills))
	return skills, nil
}

// FindRemoteSkills 通过 find-skills-plus 搜索远程 skills（带描述信息）
func (ss *SkillsService) FindRemoteSkills(query string) ([]RemoteSkill, error) {
	if query == "" {
		return []RemoteSkill{}, nil
	}

	fmt.Printf("搜索远程 skills: %s\n", query)

	// 获取 find-skills-plus 脚本路径
	homeDir, _ := os.UserHomeDir()
	scriptPath := filepath.Join(homeDir, ".agents", "skills", "find-skills-plus", "scripts", "enrich_find.js")

	var output []byte
	var err error

	// 优先使用 find-skills-plus（带描述），如果脚本不存在则回退到 npx skills find
	if _, statErr := os.Stat(scriptPath); statErr == nil {
		fmt.Printf("使用 find-skills-plus 搜索: %s\n", scriptPath)
		cmd := exec.Command("node", scriptPath, query, "--timeout", "15")
		cmd.Env = append(os.Environ(), "NODE_NO_WARNINGS=1")
		output, err = cmd.CombinedOutput()
		if err != nil {
			fmt.Printf("执行 find-skills-plus 失败: %v，回退到 npx skills find\n", err)
			cmd2 := exec.Command("npx", "skills", "find", query)
			output, err = cmd2.CombinedOutput()
			if err != nil {
				fmt.Printf("执行 npx skills find 也失败: %v\n", err)
				return nil, fmt.Errorf("failed to search remote skills: %v", err)
			}
		}
	} else {
		fmt.Println("find-skills-plus 脚本不存在，使用 npx skills find")
		cmd := exec.Command("npx", "skills", "find", query)
		output, err = cmd.CombinedOutput()
		if err != nil {
			fmt.Printf("执行 npx skills find 失败: %v\n", err)
			return nil, fmt.Errorf("failed to execute npx skills find: %v", err)
		}
	}

	// 解析输出（兼容两种格式）
	skills := parseRemoteSkillsOutput(string(output))
	
	// 读取 .skills-lock 文件获取已安装的 skills 信息
	homeDir, _ = os.UserHomeDir()
	centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")
	skillsLockPath := filepath.Join(centralSkillsDir, ".skills-lock")
	
	installedSkills := make(map[string]SkillLockEntry)
	if data, err := os.ReadFile(skillsLockPath); err == nil {
		var lock SkillsLock
		if err := json.Unmarshal(data, &lock); err == nil {
			installedSkills = lock.Skills
			fmt.Printf("读取到 %d 个已安装的 skills\n", len(installedSkills))
		}
	}
	
	// 检查每个 skill 是否已安装（通过 source 字段匹配）
	for i := range skills {
		skillName := skills[i].Name
		if entry, exists := installedSkills[skillName]; exists {
			// 比对 source (owner/repo) 是否匹配
			expectedSource := fmt.Sprintf("%s/%s", skills[i].Owner, skills[i].Repo)
			if entry.Source == expectedSource {
				skills[i].Installed = true
				fmt.Printf("  ✓ %s (已安装，来源: %s)\n", skills[i].FullName, entry.Source)
			} else {
				fmt.Printf("  - %s (同名不同源，已安装: %s)\n", skills[i].FullName, entry.Source)
			}
		} else {
			fmt.Printf("  - %s (未安装)\n", skills[i].FullName)
		}
	}
	
	fmt.Printf("找到 %d 个远程 skills\n", len(skills))

	return skills, nil
}

// parseRemoteSkillsOutput 解析 npx skills find 或 find-skills-plus 的输出
// find-skills-plus 输出格式：
//   owner/repo@skill-name          （加粗）
//   └ https://skills.sh/owner/repo/skill-name （蓝色）
//   描述文本                         （灰色）
//   （空行分隔下一个 skill）
func parseRemoteSkillsOutput(output string) []RemoteSkill {
	var skills []RemoteSkill

	// 移除 ANSI 转义序列
	ansiRegex := regexp.MustCompile(`\x1b\[[0-9;]*m`)
	cleanOutput := ansiRegex.ReplaceAllString(output, "")

	fmt.Println("清理后的输出:")
	fmt.Println(cleanOutput)

	// 正则匹配格式：owner/repo@skill-name
	// 例如：vercel-labs/agent-skills@vercel-react-best-practices
	nameRegex := regexp.MustCompile(`([a-zA-Z0-9_-]+)/([a-zA-Z0-9_-]+)@([a-zA-Z0-9_:-]+)`)
	// 正则匹配 URL
	// 例如：└ https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices
	urlRegex := regexp.MustCompile(`└\s*(https://skills\.sh/[^\s]+)`)

	lines := strings.Split(cleanOutput, "\n")
	var currentSkill *RemoteSkill

	for _, line := range lines {
		line = strings.TrimSpace(line)

		// 跳过包含 "Install with" 的说明行
		if strings.Contains(line, "Install with") || strings.Contains(line, "<owner/repo@skill>") {
			continue
		}

		// 匹配 skill 名称行
		if matches := nameRegex.FindStringSubmatch(line); len(matches) == 4 {
			if currentSkill != nil {
				// 保存之前的 skill
				skills = append(skills, *currentSkill)
			}
			// 创建新的 skill
			currentSkill = &RemoteSkill{
				FullName: matches[0],
				Owner:    matches[1],
				Repo:     matches[2],
				Name:     matches[3],
			}
			fmt.Printf("  解析到 skill: %s\n", matches[0])
		} else if currentSkill != nil && strings.Contains(line, "└") {
			// 匹配 URL 行
			if matches := urlRegex.FindStringSubmatch(line); len(matches) == 2 {
				currentSkill.URL = matches[1]
				fmt.Printf("    URL: %s\n", matches[1])
			}
		} else if currentSkill != nil && line != "" && !strings.Contains(line, "└") {
			// 非空行且不是 URL 行，视为描述信息（find-skills-plus 特有）
			// 跳过 [description skipped] 和 [no description found] 等占位符
			if line != "[description skipped]" && line != "[no description found]" {
				if currentSkill.Description != "" {
					currentSkill.Description += " " + line
				} else {
					currentSkill.Description = line
				}
				fmt.Printf("    Description: %s\n", line)
			}
		}
	}

	// 保存最后一个 skill
	if currentSkill != nil {
		skills = append(skills, *currentSkill)
	}

	return skills
}

// InstallRemoteSkill 安装远程 skill 并创建软链接到所有 agent 目录
func (ss *SkillsService) InstallRemoteSkill(fullName string, agents []string) error {
	fmt.Printf("安装远程 skill: %s\n", fullName)

	// 获取用户主目录
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %v", err)
	}

	// 提取 skill 名称（从 fullName 中提取）
	// 例如：vercel-labs/agent-skills@vercel-react-best-practices -> vercel-react-best-practices
	parts := strings.Split(fullName, "@")
	if len(parts) != 2 {
		return fmt.Errorf("invalid skill name format: %s", fullName)
	}
	skillName := parts[1]
	fmt.Printf("Skill 名称: %s\n", skillName)

	// 中央 skills 目录
	centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")
	targetPath := filepath.Join(centralSkillsDir, skillName)

	// 确保中央目录存在
	if err := os.MkdirAll(centralSkillsDir, 0755); err != nil {
		return fmt.Errorf("failed to create central skills directory: %v", err)
	}

	// 检查是否已存在
	if _, err := os.Stat(targetPath); err == nil {
		fmt.Printf("⚠ Skill 已存在，将重新安装: %s\n", targetPath)
		os.RemoveAll(targetPath)
	}

	// 解析 owner/repo
	ownerRepo := parts[0]
	
	// 使用 git clone 直接下载到目标位置
	// 格式: https://github.com/owner/repo.git
	repoURL := fmt.Sprintf("https://github.com/%s.git", ownerRepo)
	fmt.Printf("从 GitHub 克隆: %s\n", repoURL)

	// 临时克隆整个仓库
	tempRepoDir := filepath.Join(os.TempDir(), "skills-temp-"+skillName)
	defer os.RemoveAll(tempRepoDir)

	// 克隆仓库
	cloneCmd := exec.Command("git", "clone", "--depth", "1", repoURL, tempRepoDir)
	output, err := cloneCmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to clone repository: %v\nOutput: %s", err, string(output))
	}
	fmt.Printf("✓ 仓库克隆成功\n")

	// 查找 skill 目录（在仓库中的位置）- 使用通用查找函数
	skillSourcePath := findSkillInRepo(tempRepoDir, skillName)
	if skillSourcePath == "" {
		return fmt.Errorf("skill not found in repository: %s", skillName)
	}
	fmt.Printf("✓ 找到 skill 目录: %s\n", skillSourcePath)

	// 复制 skill 到目标位置
	if err := copyDir(skillSourcePath, targetPath); err != nil {
		return fmt.Errorf("failed to copy skill: %v", err)
	}

	fmt.Printf("✓ 成功安装 skill 到: %s\n", targetPath)

	// 更新 .skills-lock 文件
	if err := ss.updateSkillsLock(centralSkillsDir, skillName, ownerRepo); err != nil {
		fmt.Printf("⚠ 更新 .skills-lock 文件失败: %v\n", err)
	}

	// 为指定的 agent 目录创建软链接
	if err := ss.createSymlinksForSkill(skillName, targetPath, agents); err != nil {
		fmt.Printf("创建软链接时出现警告: %v\n", err)
	}

	return nil
}

// copyDir 递归复制目录
func copyDir(src, dst string) error {
	// 获取源目录信息
	srcInfo, err := os.Stat(src)
	if err != nil {
		return err
	}

	// 创建目标目录
	if err := os.MkdirAll(dst, srcInfo.Mode()); err != nil {
		return err
	}

	// 读取源目录内容
	entries, err := os.ReadDir(src)
	if err != nil {
		return err
	}

	// 遍历并复制
	for _, entry := range entries {
		srcPath := filepath.Join(src, entry.Name())
		dstPath := filepath.Join(dst, entry.Name())

		if entry.IsDir() {
			// 递归复制子目录
			if err := copyDir(srcPath, dstPath); err != nil {
				return err
			}
		} else {
			// 复制文件
			if err := copyFile(srcPath, dstPath); err != nil {
				return err
			}
		}
	}

	return nil
}

// copyFile 复制单个文件
func copyFile(src, dst string) error {
	srcFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer srcFile.Close()

	// 获取源文件信息
	srcInfo, err := srcFile.Stat()
	if err != nil {
		return err
	}

	// 创建目标文件
	dstFile, err := os.OpenFile(dst, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, srcInfo.Mode())
	if err != nil {
		return err
	}
	defer dstFile.Close()

	// 复制内容
	_, err = srcFile.WriteTo(dstFile)
	return err
}

// createSymlinksForSkill 为指定 skill 在所有 agent 目录创建软链接
func (ss *SkillsService) createSymlinksForSkill(skillName string, sourcePath string, agents []string) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	// 构建要安装的 agent 集合
	agentSet := make(map[string]bool)
	for _, name := range agents {
		agentSet[name] = true
	}

	successCount := 0
	errorCount := 0

	for _, agent := range getAllAgentConfigs() {
		// 如果指定了 agents 列表，只安装到指定的 agents
		if len(agentSet) > 0 && !agentSet[agent.Name] {
			continue
		}

		agentSkillsDir := filepath.Join(homeDir, agent.GlobalPath)

		// 跳过中央目录本身
		centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")
		if agentSkillsDir == centralSkillsDir {
			continue
		}

		// 确保 agent 目录存在
		if err := os.MkdirAll(agentSkillsDir, 0755); err != nil {
			continue
		}

		// 创建软链接
		linkPath := filepath.Join(agentSkillsDir, skillName)

		// 如果链接或文件已存在，先删除
		if stat, err := os.Lstat(linkPath); err == nil {
			if stat.Mode()&os.ModeSymlink != 0 {
				// 是软链接
				os.Remove(linkPath)
			} else {
				// 是实际目录，不删除
				fmt.Printf("  ⚠ 跳过 [%s]: 已存在实际目录\n", agent.Name)
				continue
			}
		}

		// 创建软链接
		if err := os.Symlink(sourcePath, linkPath); err != nil {
			fmt.Printf("  ✗ 创建软链接失败 [%s]: %v\n", agent.Name, err)
			errorCount++
		} else {
			fmt.Printf("  ✓ 创建软链接 [%s]\n", agent.Name)
			successCount++
		}
	}

	fmt.Printf("软链接创建完成: 成功 %d, 失败 %d\n", successCount, errorCount)
	return nil
}

// GetSkillAgentLinks 获取某个全局 skill 当前链接到了哪些 agent
func (ss *SkillsService) GetSkillAgentLinks(skillName string) ([]string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get home directory: %v", err)
	}

	centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")
	skillSourcePath := filepath.Join(centralSkillsDir, skillName)

	// 检查 skill 是否存在
	if _, err := os.Stat(skillSourcePath); os.IsNotExist(err) {
		return nil, fmt.Errorf("skill not found: %s", skillName)
	}

	var linkedAgents []string
	for _, agent := range getAllAgentConfigs() {
		agentSkillsDir := filepath.Join(homeDir, agent.GlobalPath)
		if agentSkillsDir == centralSkillsDir {
			continue
		}

		linkPath := filepath.Join(agentSkillsDir, skillName)
		if stat, err := os.Lstat(linkPath); err == nil {
			if stat.Mode()&os.ModeSymlink != 0 {
				// 确认软链接指向的是这个 skill
				if target, err := os.Readlink(linkPath); err == nil {
					// 处理相对路径：将相对路径转换为绝对路径
					absTarget := target
					if !filepath.IsAbs(target) {
						absTarget = filepath.Join(agentSkillsDir, target)
					}
					// Clean 路径以消除 .. 等
					absTarget = filepath.Clean(absTarget)
					if absTarget == skillSourcePath {
						linkedAgents = append(linkedAgents, agent.Name)
					}
				}
			}
		}
	}

	return linkedAgents, nil
}

// UpdateSkillAgentLinks 更新全局 skill 的 agent 软链接配置
func (ss *SkillsService) UpdateSkillAgentLinks(skillName string, agents []string) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %v", err)
	}

	centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")
	skillSourcePath := filepath.Join(centralSkillsDir, skillName)

	// 检查 skill 是否存在
	if _, err := os.Stat(skillSourcePath); os.IsNotExist(err) {
		return fmt.Errorf("skill not found: %s", skillName)
	}

	fmt.Printf("更新 skill '%s' 的 agent 链接配置\n", skillName)

	// 构建目标 agent 集合
	agentSet := make(map[string]bool)
	for _, name := range agents {
		agentSet[name] = true
	}

	addedCount := 0
	removedCount := 0

	for _, agent := range getAllAgentConfigs() {
		agentSkillsDir := filepath.Join(homeDir, agent.GlobalPath)
		if agentSkillsDir == centralSkillsDir {
			continue
		}

		linkPath := filepath.Join(agentSkillsDir, skillName)
		linkExists := false

		if stat, err := os.Lstat(linkPath); err == nil {
			if stat.Mode()&os.ModeSymlink != 0 {
				linkExists = true
			}
		}

		shouldExist := agentSet[agent.Name]

		if shouldExist && !linkExists {
			// 需要创建软链接
			if err := os.MkdirAll(agentSkillsDir, 0755); err != nil {
				fmt.Printf("  ✗ 创建目录失败 [%s]: %v\n", agent.Name, err)
				continue
			}
			if err := os.Symlink(skillSourcePath, linkPath); err != nil {
				fmt.Printf("  ✗ 创建软链接失败 [%s]: %v\n", agent.Name, err)
			} else {
				fmt.Printf("  ✓ 创建软链接 [%s]\n", agent.Name)
				addedCount++
			}
		} else if !shouldExist && linkExists {
			// 需要删除软链接
			if err := os.Remove(linkPath); err != nil {
				fmt.Printf("  ✗ 删除软链接失败 [%s]: %v\n", agent.Name, err)
			} else {
				fmt.Printf("  ✓ 删除软链接 [%s]\n", agent.Name)
				removedCount++
			}
		}
	}

	fmt.Printf("更新完成: 新增 %d, 删除 %d\n", addedCount, removedCount)
	return nil
}

// GetProjectSkillAgentLinks 获取项目中某个 skill 当前链接到了哪些 agent
func (ss *SkillsService) GetProjectSkillAgentLinks(projectPath string, skillName string) ([]string, error) {
	if projectPath == "" || skillName == "" {
		return nil, fmt.Errorf("project path and skill name are required")
	}

	var linkedAgents []string
	for _, agent := range getAllAgentConfigs() {
		skillPath := filepath.Join(projectPath, agent.LocalPath, skillName)
		if info, err := os.Stat(skillPath); err == nil && info.IsDir() {
			linkedAgents = append(linkedAgents, agent.Name)
		}
	}

	return linkedAgents, nil
}

// UpdateProjectSkillAgentLinks 更新项目中 skill 的 agent 链接配置
func (ss *SkillsService) UpdateProjectSkillAgentLinks(projectPath string, skillName string, agents []string) error {
	if projectPath == "" || skillName == "" {
		return fmt.Errorf("project path and skill name are required")
	}

	homeDir, _ := os.UserHomeDir()
	centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")

	fmt.Printf("更新项目 skill '%s' 的 agent 链接: %s\n", skillName, projectPath)

	agentSet := make(map[string]bool)
	for _, name := range agents {
		agentSet[name] = true
	}

	addedCount := 0
	removedCount := 0

	// 找到 skill 的源路径（可能是全局软链接或项目本地副本）
	var sourceSkillPath string
	for _, agent := range getAllAgentConfigs() {
		candidate := filepath.Join(projectPath, agent.LocalPath, skillName)
		if info, err := os.Stat(candidate); err == nil && info.IsDir() {
			// 检查是否是软链接，获取真实路径
			if lstat, err := os.Lstat(candidate); err == nil && lstat.Mode()&os.ModeSymlink != 0 {
				if target, err := os.Readlink(candidate); err == nil {
					if filepath.IsAbs(target) {
						sourceSkillPath = target
					} else {
						sourceSkillPath = filepath.Clean(filepath.Join(filepath.Dir(candidate), target))
					}
				}
			} else {
				// 本地实际目录，用它作为源
				sourceSkillPath = candidate
			}
			break
		}
	}

	if sourceSkillPath == "" {
		return fmt.Errorf("skill '%s' not found in project", skillName)
	}

	isGlobalSource := strings.HasPrefix(sourceSkillPath, centralSkillsDir)

	for _, agent := range getAllAgentConfigs() {
		agentSkillsDir := filepath.Join(projectPath, agent.LocalPath)
		skillPath := filepath.Join(agentSkillsDir, skillName)

		exists := false
		if info, err := os.Stat(skillPath); err == nil && info.IsDir() {
			exists = true
		}

		shouldExist := agentSet[agent.Name]

		if shouldExist && !exists {
			// 创建目录
			if err := os.MkdirAll(agentSkillsDir, 0755); err != nil {
				fmt.Printf("  ✗ 创建目录失败 [%s]: %v\n", agent.Name, err)
				continue
			}

			if isGlobalSource {
				// 全局 skill：创建软链接
				if err := os.Symlink(sourceSkillPath, skillPath); err != nil {
					fmt.Printf("  ✗ 创建软链接失败 [%s]: %v\n", agent.Name, err)
				} else {
					fmt.Printf("  ✓ 创建软链接 [%s]\n", agent.Name)
					addedCount++
				}
			} else {
				// 项目本地 skill：复制目录
				if err := copyDir(sourceSkillPath, skillPath); err != nil {
					fmt.Printf("  ✗ 复制目录失败 [%s]: %v\n", agent.Name, err)
				} else {
					fmt.Printf("  ✓ 复制目录 [%s]\n", agent.Name)
					addedCount++
				}
			}
		} else if !shouldExist && exists {
			// 删除
			if lstat, err := os.Lstat(skillPath); err == nil && lstat.Mode()&os.ModeSymlink != 0 {
				os.Remove(skillPath)
			} else {
				os.RemoveAll(skillPath)
			}
			fmt.Printf("  ✓ 移除 [%s]\n", agent.Name)
			removedCount++
		}
	}

	fmt.Printf("项目 skill agent 更新完成: 新增 %d, 删除 %d\n", addedCount, removedCount)
	return nil
}

// DeleteSkill 删除指定的 skill（从中央目录和所有软链接）
func (ss *SkillsService) DeleteSkill(skillName string) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %v", err)
	}

	centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")
	skillPath := filepath.Join(centralSkillsDir, skillName)

	// 检查 skill 是否存在
	if _, err := os.Stat(skillPath); os.IsNotExist(err) {
		return fmt.Errorf("skill not found: %s", skillName)
	}

	fmt.Printf("开始删除 skill: %s\n", skillName)

	// 1. 删除所有 agent 目录中的软链接
	deletedLinks := 0
	for _, agent := range getAllAgentConfigs() {
		agentSkillsDir := filepath.Join(homeDir, agent.GlobalPath)
		if agentSkillsDir == centralSkillsDir {
			continue
		}

		linkPath := filepath.Join(agentSkillsDir, skillName)
		if stat, err := os.Lstat(linkPath); err == nil {
			if stat.Mode()&os.ModeSymlink != 0 {
				// 是软链接，删除
				if err := os.Remove(linkPath); err == nil {
					fmt.Printf("  ✓ 删除软链接 [%s]\n", agent.Name)
					deletedLinks++
				}
			}
		}
	}

	// 2. 删除中央目录中的 skill
	if err := os.RemoveAll(skillPath); err != nil {
		return fmt.Errorf("failed to delete skill directory: %v", err)
	}
	fmt.Printf("✓ 删除 skill 目录: %s\n", skillPath)

	// 3. 更新 .skills-lock 文件
	lockPath := filepath.Join(centralSkillsDir, ".skills-lock")
	if data, err := os.ReadFile(lockPath); err == nil {
		var lock SkillsLock
		if err := json.Unmarshal(data, &lock); err == nil {
			delete(lock.Skills, skillName)
			if data, err := json.MarshalIndent(lock, "", "  "); err == nil {
				os.WriteFile(lockPath, data, 0644)
				fmt.Printf("✓ 更新 .skills-lock 文件\n")
			}
		}
	}

	fmt.Printf("删除完成: 删除了 %d 个软链接\n", deletedLinks)
	return nil
}

// UpdateSkill 更新指定的 skill（重新从远程拉取）
func (ss *SkillsService) UpdateSkill(skillName string) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %v", err)
	}

	centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")
	lockPath := filepath.Join(centralSkillsDir, ".skills-lock")

	// 读取 .skills-lock 获取 skill 来源信息
	data, err := os.ReadFile(lockPath)
	if err != nil {
		return fmt.Errorf("failed to read .skills-lock: %v", err)
	}

	var lock SkillsLock
	if err := json.Unmarshal(data, &lock); err != nil {
		return fmt.Errorf("failed to parse .skills-lock: %v", err)
	}

	entry, exists := lock.Skills[skillName]
	if !exists {
		return fmt.Errorf("skill not found in .skills-lock: %s", skillName)
	}

	fmt.Printf("开始更新 skill: %s (来源: %s)\n", skillName, entry.Source)

	// 构造 fullName (owner/repo@skill-name)
	fullName := fmt.Sprintf("%s@%s", entry.Source, skillName)

	// 删除旧版本
	skillPath := filepath.Join(centralSkillsDir, skillName)
	if err := os.RemoveAll(skillPath); err != nil {
		return fmt.Errorf("failed to remove old version: %v", err)
	}
	fmt.Printf("✓ 删除旧版本\n")

	// 重新安装（复用 InstallRemoteSkill 的逻辑）
	tempRepoDir := filepath.Join(os.TempDir(), "skills-temp-"+skillName)
	defer os.RemoveAll(tempRepoDir)

	repoURL := fmt.Sprintf("https://github.com/%s.git", entry.Source)
	fmt.Printf("从 GitHub 克隆: %s\n", repoURL)

	cloneCmd := exec.Command("git", "clone", "--depth", "1", repoURL, tempRepoDir)
	output, err := cloneCmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to clone repository: %v\nOutput: %s", err, string(output))
	}
	fmt.Printf("✓ 仓库克隆成功\n")

	// 查找 skill 目录
	skillSourcePath := filepath.Join(tempRepoDir, skillName)
	if _, err := os.Stat(skillSourcePath); os.IsNotExist(err) {
		skillSourcePath = filepath.Join(tempRepoDir, "skills", skillName)
		if _, err := os.Stat(skillSourcePath); os.IsNotExist(err) {
			return fmt.Errorf("skill not found in repository: %s", skillName)
		}
	}

	// 复制新版本
	if err := copyDir(skillSourcePath, skillPath); err != nil {
		return fmt.Errorf("failed to copy skill: %v", err)
	}
	fmt.Printf("✓ 复制新版本成功\n")

	// 更新 .skills-lock 中的 updatedAt 时间
	if err := ss.updateSkillsLock(centralSkillsDir, skillName, entry.Source); err != nil {
		fmt.Printf("⚠ 更新 .skills-lock 文件失败: %v\n", err)
	}

	fmt.Printf("更新完成: %s\n", fullName)
	return nil
}

// InstallSkillToProject 将全局 skill 安装（软链接）到指定项目目录的指定 agents
func (ss *SkillsService) InstallSkillToProject(projectPath string, skillName string, agents []string) error {
	if projectPath == "" || skillName == "" {
		return fmt.Errorf("project path and skill name are required")
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %v", err)
	}

	// 中央 skills 目录中的 skill 路径
	centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")
	skillSourcePath := filepath.Join(centralSkillsDir, skillName)

	// 检查全局 skill 是否存在
	if _, err := os.Stat(skillSourcePath); os.IsNotExist(err) {
		return fmt.Errorf("global skill not found: %s", skillName)
	}

	fmt.Printf("安装 skill '%s' 到项目: %s\n", skillName, projectPath)

	// 构建要安装的 agent 集合
	agentSet := make(map[string]bool)
	for _, name := range agents {
		agentSet[name] = true
	}

	successCount := 0
	for _, agent := range getAllAgentConfigs() {
		// 如果指定了 agents 列表，只安装到指定的 agents
		if len(agentSet) > 0 && !agentSet[agent.Name] {
			continue
		}

		agentSkillsDir := filepath.Join(projectPath, agent.LocalPath)

		// 确保 agent 目录存在
		if err := os.MkdirAll(agentSkillsDir, 0755); err != nil {
			fmt.Printf("  ✗ 创建目录失败 [%s]: %v\n", agent.Name, err)
			continue
		}

		linkPath := filepath.Join(agentSkillsDir, skillName)

		// 如果已存在，先删除
		if stat, err := os.Lstat(linkPath); err == nil {
			if stat.Mode()&os.ModeSymlink != 0 {
				os.Remove(linkPath)
			} else {
				fmt.Printf("  ⚠ 跳过 [%s]: 已存在实际目录\n", agent.Name)
				continue
			}
		}

		// 创建软链接
		if err := os.Symlink(skillSourcePath, linkPath); err != nil {
			fmt.Printf("  ✗ 创建软链接失败 [%s]: %v\n", agent.Name, err)
		} else {
			fmt.Printf("  ✓ 创建软链接 [%s]: %s -> %s\n", agent.Name, linkPath, skillSourcePath)
			successCount++
		}
	}

	fmt.Printf("项目安装完成: 成功为 %d 个 agent 创建软链接\n", successCount)
	return nil
}

// InstallRemoteSkillToProject 从远程直接安装 skill 到项目本地（不经过全局）
func (ss *SkillsService) InstallRemoteSkillToProject(projectPath string, fullName string, agents []string) error {
	if projectPath == "" || fullName == "" {
		return fmt.Errorf("project path and skill full name are required")
	}

	fmt.Printf("从远程安装 skill 到项目: %s -> %s\n", fullName, projectPath)

	// 解析 fullName: owner/repo@skill-name
	parts := strings.Split(fullName, "@")
	if len(parts) != 2 {
		return fmt.Errorf("invalid skill name format: %s", fullName)
	}
	ownerRepo := parts[0]
	skillName := parts[1]

	// 克隆仓库到临时目录
	repoURL := fmt.Sprintf("https://github.com/%s.git", ownerRepo)
	tempRepoDir := filepath.Join(os.TempDir(), "skills-temp-project-"+skillName)
	// 先清理可能残留的临时目录
	os.RemoveAll(tempRepoDir)
	defer os.RemoveAll(tempRepoDir)

	fmt.Printf("从 GitHub 克隆: %s\n", repoURL)
	cloneCmd := exec.Command("git", "clone", "--depth", "1", repoURL, tempRepoDir)
	output, err := cloneCmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to clone repository: %v\nOutput: %s", err, string(output))
	}
	fmt.Printf("✓ 仓库克隆成功\n")

	// 查找 skill 目录 - 使用通用查找函数
	skillSourcePath := findSkillInRepo(tempRepoDir, skillName)
	if skillSourcePath == "" {
		return fmt.Errorf("skill not found in repository: %s", skillName)
	}
	fmt.Printf("✓ 找到 skill 目录: %s\n", skillSourcePath)

	// 构建要安装的 agent 集合
	agentSet := make(map[string]bool)
	for _, name := range agents {
		agentSet[name] = true
	}

	// 直接复制到项目的指定 agent 本地目录（不是软链接，是实际文件）
	successCount := 0
	for _, agent := range getAllAgentConfigs() {
		// 如果指定了 agents 列表，只安装到指定的 agents
		if len(agentSet) > 0 && !agentSet[agent.Name] {
			continue
		}

		agentSkillsDir := filepath.Join(projectPath, agent.LocalPath)

		if err := os.MkdirAll(agentSkillsDir, 0755); err != nil {
			fmt.Printf("  ✗ 创建目录失败 [%s]: %v\n", agent.Name, err)
			continue
		}

		targetPath := filepath.Join(agentSkillsDir, skillName)

		// 如果已存在，先删除
		if _, err := os.Lstat(targetPath); err == nil {
			os.RemoveAll(targetPath)
		}

		// 复制 skill 文件到项目目录
		if err := copyDir(skillSourcePath, targetPath); err != nil {
			fmt.Printf("  ✗ 复制失败 [%s]: %v\n", agent.Name, err)
		} else {
			fmt.Printf("  ✓ 安装到项目 [%s]: %s\n", agent.Name, targetPath)
			successCount++
		}
	}

	fmt.Printf("项目安装完成: 成功为 %d 个 agent 安装 skill\n", successCount)
	return nil
}

// findSkillInRepo 在仓库中查找 skill 目录，支持多种目录结构
func findSkillInRepo(repoDir string, skillName string) string {
	// 1. 直接在根目录查找: repo/skill-name/
	candidate := filepath.Join(repoDir, skillName)
	if info, err := os.Stat(candidate); err == nil && info.IsDir() {
		return candidate
	}

	// 2. 在 skills/ 子目录查找: repo/skills/skill-name/
	candidate = filepath.Join(repoDir, "skills", skillName)
	if info, err := os.Stat(candidate); err == nil && info.IsDir() {
		return candidate
	}

	// 3. 如果仓库根目录下有 .md 文件（说明整个仓库就是一个 skill），直接使用仓库根目录
	entries, err := os.ReadDir(repoDir)
	if err == nil {
		hasSkillFile := false
		for _, entry := range entries {
			name := entry.Name()
			if strings.HasSuffix(name, ".md") && !entry.IsDir() && name != "README.md" && name != "CHANGELOG.md" && name != "LICENSE.md" {
				hasSkillFile = true
				break
			}
		}
		if hasSkillFile {
			return repoDir
		}
	}

	// 4. 递归查找：在所有子目录中查找名称匹配的目录
	var found string
	filepath.WalkDir(repoDir, func(path string, d os.DirEntry, err error) error {
		if err != nil || !d.IsDir() {
			return nil
		}
		// 跳过 .git 目录
		if d.Name() == ".git" {
			return filepath.SkipDir
		}
		if d.Name() == skillName && path != repoDir {
			found = path
			return filepath.SkipAll
		}
		return nil
	})
	if found != "" {
		return found
	}

	// 5. 如果仓库只有一个子目录（且不是 .git），可能就是 skill
	if entries != nil {
		var dirs []os.DirEntry
		for _, entry := range entries {
			if entry.IsDir() && entry.Name() != ".git" && !strings.HasPrefix(entry.Name(), ".") {
				dirs = append(dirs, entry)
			}
		}
		if len(dirs) == 1 {
			return filepath.Join(repoDir, dirs[0].Name())
		}
	}

	return ""
}

// RemoveSkillFromProject 从指定项目目录中移除 skill（删除软链接）
func (ss *SkillsService) RemoveSkillFromProject(projectPath string, skillName string) error {
	if projectPath == "" || skillName == "" {
		return fmt.Errorf("project path and skill name are required")
	}

	fmt.Printf("从项目中移除 skill '%s': %s\n", skillName, projectPath)

	removedCount := 0
	for _, agent := range getAllAgentConfigs() {
		agentSkillsDir := filepath.Join(projectPath, agent.LocalPath)
		linkPath := filepath.Join(agentSkillsDir, skillName)

		if stat, err := os.Lstat(linkPath); err == nil {
			if stat.Mode()&os.ModeSymlink != 0 {
				if err := os.Remove(linkPath); err == nil {
					fmt.Printf("  ✓ 删除软链接 [%s]\n", agent.Name)
					removedCount++
				}
			} else if stat.IsDir() {
				// 项目本地的 skill 目录（非软链接），也可以删除
				if err := os.RemoveAll(linkPath); err == nil {
					fmt.Printf("  ✓ 删除本地 skill [%s]\n", agent.Name)
					removedCount++
				}
			}
		}
	}

	fmt.Printf("项目移除完成: 删除了 %d 个\n", removedCount)
	return nil
}

// updateSkillsLock 更新 .skills-lock 文件
func (ss *SkillsService) updateSkillsLock(skillsDir, skillName, source string) error {
	lockPath := filepath.Join(skillsDir, ".skills-lock")
	
	var lock SkillsLock
	
	// 读取现有的 lock 文件
	if data, err := os.ReadFile(lockPath); err == nil {
		json.Unmarshal(data, &lock)
	} else {
		// 文件不存在，创建新的
		lock = SkillsLock{
			Version: 3,
			Skills:  make(map[string]SkillLockEntry),
		}
	}
	
	// 添加或更新 skill 信息
	now := time.Now().Format(time.RFC3339)
	entry := SkillLockEntry{
		Source:     source,
		SourceType: "github",
		SourceURL:  fmt.Sprintf("https://github.com/%s.git", source),
		SkillPath:  fmt.Sprintf("skills/%s/SKILL.md", skillName),
	}
	
	// 如果是新安装，设置 InstalledAt
	if existingEntry, exists := lock.Skills[skillName]; exists {
		entry.InstalledAt = existingEntry.InstalledAt
	} else {
		entry.InstalledAt = now
	}
	entry.UpdatedAt = now
	
	lock.Skills[skillName] = entry
	
	// 写回文件
	data, err := json.MarshalIndent(lock, "", "  ")
	if err != nil {
		return err
	}
	
	return os.WriteFile(lockPath, data, 0644)
}
