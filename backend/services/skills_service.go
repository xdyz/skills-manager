package services

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
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
	Source    string   `json:"source"` // 来源，例如: vercel-labs/agent-skills
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
	Source    string   `json:"source"`   // 来源，例如: vercel-labs/agent-skills
}

// RemoteSkill 远程 skill 信息
type RemoteSkill struct {
	FullName        string   `json:"fullName"`        // 例如: vercel-labs/agent-skills@vercel-react-best-practices
	Owner           string   `json:"owner"`           // 例如: vercel-labs
	Repo            string   `json:"repo"`            // 例如: agent-skills
	Name            string   `json:"name"`            // 例如: vercel-react-best-practices
	URL             string   `json:"url"`             // 例如: https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices
	Description     string   `json:"description"`     // 技能描述
	Installed       bool     `json:"installed"`       // 是否已安装
	Installs        int      `json:"installs"`        // 安装次数
	SupportedAgents []string `json:"supportedAgents"` // 支持的 agent 列表（通过检测仓库文件判断）
}

// SkillsLock .skills-lock 文件结构
type SkillsLock struct {
	Version int                       `json:"version"`
	Skills  map[string]SkillLockEntry `json:"skills"`
}

// SkillLockEntry 单个 skill 的安装信息
type SkillLockEntry struct {
	Source      string `json:"source"`     // 例如: vercel-labs/agent-skills
	SourceType  string `json:"sourceType"` // 例如: github
	SourceURL   string `json:"sourceUrl"`  // 例如: https://github.com/vercel-labs/agent-skills.git
	SkillPath   string `json:"skillPath"`  // 例如: skills/react-best-practices/SKILL.md
	InstalledAt string `json:"installedAt"`
	UpdatedAt   string `json:"updatedAt"`
}

// sanitizeJSON removes trailing commas to handle malformed JSON (e.g. from external tools)
func sanitizeJSON(data []byte) []byte {
	re := regexp.MustCompile(`,(\s*[}\]])`)
	return re.ReplaceAll(data, []byte("$1"))
}

// unmarshalSkillsLock safely parses .skills-lock with trailing comma tolerance
func unmarshalSkillsLock(data []byte) (SkillsLock, error) {
	var lock SkillsLock
	if err := json.Unmarshal(data, &lock); err != nil {
		// Retry with sanitized JSON
		if err2 := json.Unmarshal(sanitizeJSON(data), &lock); err2 != nil {
			return lock, err // Return original error
		}
	}
	return lock, nil
}

func NewSkillsService() *SkillsService {
	return &SkillsService{
		skills: []Skills{},
	}
}

func (ss *SkillsService) Startup(ctx context.Context) {
	ss.ctx = ctx
}

// shellRun 通过用户的 login shell 执行命令，确保 GUI 应用能继承完整的 shell 环境
// macOS GUI 应用不会加载 .zshrc，而 nvm 等工具的初始化脚本通常在 .zshrc 中
// 使用 -l（login）+ -i（interactive）确保 .zprofile 和 .zshrc 都被加载
// 注意：interactive 模式在非 tty 时可能产生额外输出，但能确保 nvm/rbenv 等工具可用
func shellRun(command string) ([]byte, error) {
	return exec.Command("/bin/zsh", "-l", "-c", "source ~/.zshrc 2>/dev/null; "+command).CombinedOutput()
}

// shellOutput 通过 login shell 执行命令并返回 stdout
func shellOutput(command string) (string, error) {
	out, err := exec.Command("/bin/zsh", "-l", "-c", "source ~/.zshrc 2>/dev/null; "+command).Output()
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(out)), nil
}

// gitClone 安全执行 git clone，避免 shell 注入
func gitClone(repoURL, destDir string) ([]byte, error) {
	cmd := exec.Command("git", "clone", "--depth", "1", repoURL, destDir)
	return cmd.CombinedOutput()
}

// safeExecCommand 安全执行命令，避免 shell 注入
func safeExecCommand(name string, args ...string) ([]byte, error) {
	cmd := exec.Command(name, args...)
	return cmd.CombinedOutput()
}

func (ss *SkillsService) GetAllAgentSkills() ([]Skills, error) {
	// 1. 获取用户主目录
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}


	// 读取 .skills-lock 获取来源信息
	centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")
	lockPath := filepath.Join(centralSkillsDir, ".skills-lock")
	var lock SkillsLock
	if data, err := os.ReadFile(lockPath); err == nil {
		lock, _ = unmarshalSkillsLock(data)
	}

	// 2. 使用 map 去重，key 是 skill 名称
	skillsMap := make(map[string]*Skills)

	// 3. 遍历所有支持的 agent 目录
	for _, agent := range getAllAgentConfigs() {
		agentSkillsDir := filepath.Join(homeDir, agent.GlobalPath)

		// 检查目录是否存在
		if _, err := os.Stat(agentSkillsDir); os.IsNotExist(err) {
			continue // 该 agent 目录不存在，跳过
		}


		// 读取该 agent 目录下的所有 skill
		entries, err := os.ReadDir(agentSkillsDir)
		if err != nil {
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
				continue
			}
			if !info.IsDir() {
				continue
			}

			// 读取 SKILL.md（只支持新格式）
			skillMdPath := filepath.Join(skillPath, "SKILL.md")
			content, err := os.ReadFile(skillMdPath)
			if err != nil {
				continue // 没有 SKILL.md，跳过
			}


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
				// 从 .skills-lock 填充 source
				if lock.Skills != nil {
					if entry, ok := lock.Skills[skillName]; ok {
						skill.Source = entry.Source
					}
				}
				skillsMap[skillName] = &skill
			}
		}
	}

	// 4. 将 map 转换为 slice
	var skills []Skills
	for _, skill := range skillsMap {
		skills = append(skills, *skill)
	}


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

// SkillDetail 技能详情
type SkillDetail struct {
	Name        string   `json:"name"`
	Desc        string   `json:"desc"`
	Path        string   `json:"path"`
	Language    string   `json:"language"`
	Framework   string   `json:"framework"`
	Agents      []string `json:"agents"`
	Source      string   `json:"source"`
	Content     string   `json:"content"`     // SKILL.md 完整内容
	InstalledAt string   `json:"installedAt"` // 安装时间
	UpdatedAt   string   `json:"updatedAt"`   // 更新时间
}

// GetSkillDetail 获取指定 skill 的详细信息（包含 SKILL.md 内容和安装信息）
func (ss *SkillsService) GetSkillDetail(skillName string) (*SkillDetail, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get home directory: %v", err)
	}

	centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")
	skillPath := filepath.Join(centralSkillsDir, skillName)

	// 检查 skill 是否存在
	if _, err := os.Stat(skillPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("skill not found: %s", skillName)
	}

	// 读取 SKILL.md
	skillMdPath := filepath.Join(skillPath, "SKILL.md")
	content, err := os.ReadFile(skillMdPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read SKILL.md: %v", err)
	}

	// 解析 frontmatter
	parsed := parseSkillMd(string(content), skillPath)

	detail := &SkillDetail{
		Name:      skillName,
		Desc:      parsed.Desc,
		Path:      skillPath,
		Language:  parsed.Language,
		Framework: parsed.Framework,
		Content:   string(content),
	}

	// 从 .skills-lock 获取安装信息
	lockPath := filepath.Join(centralSkillsDir, ".skills-lock")
	if data, err := os.ReadFile(lockPath); err == nil {
		if lock, err := unmarshalSkillsLock(data); err == nil {
			if entry, ok := lock.Skills[skillName]; ok {
				detail.Source = entry.Source
				detail.InstalledAt = entry.InstalledAt
				detail.UpdatedAt = entry.UpdatedAt
			}
		}
	}

	// 获取链接的 agents
	agents, _ := ss.GetSkillAgentLinks(skillName)
	detail.Agents = agents

	return detail, nil
}

// BatchDeleteSkills 批量删除多个 skills
func (ss *SkillsService) BatchDeleteSkills(skillNames []string) (int, error) {
	successCount := 0
	var lastErr error
	for _, name := range skillNames {
		if err := ss.DeleteSkill(name); err != nil {
			lastErr = err
		} else {
			successCount++
		}
	}
	if successCount == 0 && lastErr != nil {
		return 0, lastErr
	}
	return successCount, nil
}

// BatchUpdateSkillAgentLinks 批量更新多个 skills 的 agent 链接
func (ss *SkillsService) BatchUpdateSkillAgentLinks(skillNames []string, agents []string) (int, error) {
	successCount := 0
	var lastErr error
	for _, name := range skillNames {
		if err := ss.UpdateSkillAgentLinks(name, agents); err != nil {
			lastErr = err
		} else {
			successCount++
		}
	}
	if successCount == 0 && lastErr != nil {
		return 0, lastErr
	}
	return successCount, nil
}

// GetProjectSkills 获取指定项目目录内的 skills
func (ss *SkillsService) GetProjectSkills(projectPath string) ([]ProjectSkill, error) {
	if projectPath == "" {
		return []ProjectSkill{}, nil
	}


	homeDir, _ := os.UserHomeDir()
	skillMap := make(map[string]*ProjectSkill) // 用 skill name 聚合多个 agent
	var order []string                         // 保持顺序

	// 读取全局 .skills-lock 获取来源信息
	centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")
	lockPath := filepath.Join(centralSkillsDir, ".skills-lock")
	var globalLock SkillsLock
	if data, err := os.ReadFile(lockPath); err == nil {
		globalLock, _ = unmarshalSkillsLock(data)
	}

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
			// 不用 parsed.Name 覆盖，始终使用目录名以匹配远程 skill name
			// 从全局 .skills-lock 填充 source
			if globalLock.Skills != nil {
				if lockEntry, ok := globalLock.Skills[skillName]; ok {
					skill.Source = lockEntry.Source
				}
			}

			skillMap[skillName] = skill
			order = append(order, skillName)
		}
	}

	// 按发现顺序构建结果
	skills := make([]ProjectSkill, 0, len(order))
	for _, name := range order {
		skills = append(skills, *skillMap[name])
	}

	return skills, nil
}

// FindRemoteSkills 通过 skills.sh API 搜索远程 skills
func (ss *SkillsService) FindRemoteSkills(query string) ([]RemoteSkill, error) {
	if query == "" {
		return []RemoteSkill{}, nil
	}


	// 使用 skills.sh API 搜索（支持 limit 参数，默认返回 20 条）
	apiURL := fmt.Sprintf("https://skills.sh/api/search?q=%s&limit=30", query)

	resp, err := httpGet(apiURL)
	if err != nil {
		return ss.findRemoteSkillsFallback(query)
	}

	// 解析 API 响应
	var apiResp struct {
		Skills []struct {
			ID       string `json:"id"`
			Name     string `json:"name"`
			Source   string `json:"source"`
			Installs int    `json:"installs"`
		} `json:"skills"`
		Count int `json:"count"`
	}
	if err := json.Unmarshal(resp, &apiResp); err != nil {
		return ss.findRemoteSkillsFallback(query)
	}

	// 转换为 RemoteSkill
	var skills []RemoteSkill
	for _, s := range apiResp.Skills {
		parts := strings.Split(s.Source, "/")
		owner := ""
		repo := ""
		if len(parts) == 2 {
			owner = parts[0]
			repo = parts[1]
		}
		skills = append(skills, RemoteSkill{
			FullName: fmt.Sprintf("%s@%s", s.Source, s.Name),
			Owner:    owner,
			Repo:     repo,
			Name:     s.Name,
			URL:      fmt.Sprintf("https://skills.sh/%s", s.ID),
			Installs: s.Installs,
		})
	}

	// 读取 .skills-lock 文件获取已安装的 skills 信息
	homeDir, _ := os.UserHomeDir()
	centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")
	skillsLockPath := filepath.Join(centralSkillsDir, ".skills-lock")

	installedSkills := make(map[string]SkillLockEntry)
	if data, err := os.ReadFile(skillsLockPath); err == nil {
		if lock, err := unmarshalSkillsLock(data); err == nil {
			installedSkills = lock.Skills
		}
	}

	// 检查每个 skill 是否已安装
	for i := range skills {
		skillName := skills[i].Name
		if entry, exists := installedSkills[skillName]; exists {
			expectedSource := fmt.Sprintf("%s/%s", skills[i].Owner, skills[i].Repo)
			if entry.Source == expectedSource {
				skills[i].Installed = true
			}
		}
	}

	// 并发检测每个 skill 支持哪些 agent
	checkSkillSupportedAgents(skills)

	return skills, nil
}

// findRemoteSkillsFallback 回退到 CLI 搜索
func (ss *SkillsService) findRemoteSkillsFallback(query string) ([]RemoteSkill, error) {
	output, err := safeExecCommand("npx", "skills", "find", query)
	if err != nil {
		return nil, fmt.Errorf("failed to search remote skills: %v", err)
	}

	skills := parseRemoteSkillsOutput(string(output))

	// 读取 .skills-lock
	homeDir, _ := os.UserHomeDir()
	centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")
	skillsLockPath := filepath.Join(centralSkillsDir, ".skills-lock")

	installedSkills := make(map[string]SkillLockEntry)
	if data, err := os.ReadFile(skillsLockPath); err == nil {
		if lock, err := unmarshalSkillsLock(data); err == nil {
			installedSkills = lock.Skills
		}
	}

	for i := range skills {
		if entry, exists := installedSkills[skills[i].Name]; exists {
			expectedSource := fmt.Sprintf("%s/%s", skills[i].Owner, skills[i].Repo)
			if entry.Source == expectedSource {
				skills[i].Installed = true
			}
		}
	}

	// 并发检测每个 skill 支持哪些 agent
	checkSkillSupportedAgents(skills)

	return skills, nil
}

// agentFileMapping 定义仓库文件名到支持的 agent 的映射
var agentFileMapping = []struct {
	FileName string
	Agent    string
}{
	{"SKILL.md", "All Agents"},
	{"CLAUDE.md", "Claude Code"},
	{"AGENTS.md", "GitHub Copilot"},
	{".cursorrules", "Cursor"},
	{".windsurfrules", "Windsurf"},
}

// guessSkillDirNames 根据技能名猜测可能的仓库目录名
// 例如 "vercel-react-best-practices" 在 "vercel-labs/agent-skills" 仓库中
// 实际目录名可能是 "react-best-practices"（去掉了 owner 相关前缀）
func guessSkillDirNames(skillName, owner string) []string {
	names := []string{skillName}

	// 尝试去掉 owner 名（或 owner 名中 -labs/-io/-dev 等后缀之前的部分）作为前缀
	ownerPrefixes := []string{owner + "-"}
	// 从 owner 中提取主名称，如 "vercel-labs" -> "vercel"
	if parts := strings.SplitN(owner, "-", 2); len(parts) > 1 {
		ownerPrefixes = append(ownerPrefixes, parts[0]+"-")
	}

	for _, prefix := range ownerPrefixes {
		if stripped, found := strings.CutPrefix(skillName, prefix); found && stripped != "" {
			names = append(names, stripped)
		}
	}

	return names
}

// checkSkillSupportedAgents 并发检测每个 skill 支持哪些 agent
// 通过 GitHub raw URL 的 HEAD 请求检测仓库中有哪些格式文件
func checkSkillSupportedAgents(skills []RemoteSkill) {
	if len(skills) == 0 {
		return
	}
	var wg sync.WaitGroup
	client := &http.Client{Timeout: 5 * time.Second}

	for i := range skills {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			s := &skills[idx]
			if s.Owner == "" || s.Repo == "" || s.Name == "" {
				return
			}

			// 猜测可能的目录名（原名 + 去掉 owner 前缀的变体）
			dirNames := guessSkillDirNames(s.Name, s.Owner)

			var mu sync.Mutex
			var innerWg sync.WaitGroup

			for _, mapping := range agentFileMapping {
				innerWg.Add(1)
				go func(fileName, agentName string) {
					defer innerWg.Done()
					// 构建所有可能的路径
					var paths []string
					for _, dirName := range dirNames {
						paths = append(paths,
							fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/main/skills/%s/%s", s.Owner, s.Repo, dirName, fileName),
							fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/main/%s/%s", s.Owner, s.Repo, dirName, fileName),
						)
					}
					// 根目录只对单 skill 仓库检查
					if fileName == "SKILL.md" || fileName == "CLAUDE.md" || fileName == "AGENTS.md" {
						paths = append(paths, fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/main/%s", s.Owner, s.Repo, fileName))
					}
					for _, url := range paths {
						resp, err := client.Head(url)
						if err == nil {
							resp.Body.Close()
							if resp.StatusCode == 200 {
								mu.Lock()
								s.SupportedAgents = append(s.SupportedAgents, agentName)
								mu.Unlock()
								return
							}
						}
					}
				}(mapping.FileName, mapping.Agent)
			}
			innerWg.Wait()
		}(i)
	}
	wg.Wait()
}

// parseRemoteSkillsOutput 解析 npx skills find 或 find-skills-plus 的输出
// find-skills-plus 输出格式：
//
//	owner/repo@skill-name          （加粗）
//	└ https://skills.sh/owner/repo/skill-name （蓝色）
//	描述文本                         （灰色）
//	（空行分隔下一个 skill）
func parseRemoteSkillsOutput(output string) []RemoteSkill {
	var skills []RemoteSkill

	// 移除 ANSI 转义序列
	ansiRegex := regexp.MustCompile(`\x1b\[[0-9;]*m`)
	cleanOutput := ansiRegex.ReplaceAllString(output, "")


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
		} else if currentSkill != nil && strings.Contains(line, "└") {
			// 匹配 URL 行
			if matches := urlRegex.FindStringSubmatch(line); len(matches) == 2 {
				currentSkill.URL = matches[1]
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

	// 中央 skills 目录
	centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")
	targetPath := filepath.Join(centralSkillsDir, skillName)

	// 确保中央目录存在
	if err := os.MkdirAll(centralSkillsDir, 0755); err != nil {
		return fmt.Errorf("failed to create central skills directory: %v", err)
	}

	// 检查是否已存在
	if _, err := os.Stat(targetPath); err == nil {
		os.RemoveAll(targetPath)
	}

	// 解析 owner/repo
	ownerRepo := parts[0]

	// 使用 git clone 直接下载到目标位置
	// 格式: https://github.com/owner/repo.git
	repoURL := fmt.Sprintf("https://github.com/%s.git", ownerRepo)

	// 临时克隆整个仓库
	tempRepoDir := filepath.Join(os.TempDir(), "skills-temp-"+skillName)
	defer os.RemoveAll(tempRepoDir)

	// 克隆仓库
	cloneOutput, err := gitClone(repoURL, tempRepoDir)
	if err != nil {
		return fmt.Errorf("failed to clone repository: %v\nOutput: %s", err, string(cloneOutput))
	}

	// 查找 skill 目录（在仓库中的位置）- 使用通用查找函数
	skillSourcePath := findSkillInRepo(tempRepoDir, skillName)
	if skillSourcePath == "" {
		return fmt.Errorf("skill not found in repository: %s", skillName)
	}

	// 复制 skill 到目标位置
	if err := copyDir(skillSourcePath, targetPath); err != nil {
		return fmt.Errorf("failed to copy skill: %v", err)
	}


	// 更新 .skills-lock 文件
	if err := ss.updateSkillsLock(centralSkillsDir, skillName, ownerRepo); err != nil {
	}

	// 为指定的 agent 目录创建软链接
	if err := ss.createSymlinksForSkill(skillName, targetPath, agents); err != nil {
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
				continue
			}
		}

		// 创建软链接
		if err := os.Symlink(sourcePath, linkPath); err != nil {
			errorCount++
		} else {
			successCount++
		}
	}

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
				continue
			}
			if err := os.Symlink(skillSourcePath, linkPath); err != nil {
			} else {
				addedCount++
			}
		} else if !shouldExist && linkExists {
			// 需要删除软链接
			if err := os.Remove(linkPath); err != nil {
			} else {
				removedCount++
			}
		}
	}

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
				continue
			}

			if isGlobalSource {
				// 全局 skill：创建软链接
				if err := os.Symlink(sourceSkillPath, skillPath); err != nil {
				} else {
					addedCount++
				}
			} else {
				// 项目本地 skill：复制目录
				if err := copyDir(sourceSkillPath, skillPath); err != nil {
				} else {
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
			removedCount++
		}
	}

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
					deletedLinks++
				}
			}
		}
	}

	// 2. 删除中央目录中的 skill
	if err := os.RemoveAll(skillPath); err != nil {
		return fmt.Errorf("failed to delete skill directory: %v", err)
	}

	// 3. 更新 .skills-lock 文件
	lockPath := filepath.Join(centralSkillsDir, ".skills-lock")
	if data, err := os.ReadFile(lockPath); err == nil {
		if lock, err := unmarshalSkillsLock(data); err == nil {
			delete(lock.Skills, skillName)
			if data, err := json.MarshalIndent(lock, "", "  "); err == nil {
				os.WriteFile(lockPath, data, 0644)
			}
		}
	}

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

	lock, err := unmarshalSkillsLock(data)
	if err != nil {
		return fmt.Errorf("failed to parse .skills-lock: %v", err)
	}

	entry, exists := lock.Skills[skillName]
	if !exists {
		return fmt.Errorf("skill not found in .skills-lock: %s", skillName)
	}


	// 删除旧版本
	skillPath := filepath.Join(centralSkillsDir, skillName)
	if err := os.RemoveAll(skillPath); err != nil {
		return fmt.Errorf("failed to remove old version: %v", err)
	}

	// 重新安装（复用 InstallRemoteSkill 的逻辑）
	tempRepoDir := filepath.Join(os.TempDir(), "skills-temp-"+skillName)
	defer os.RemoveAll(tempRepoDir)

	repoURL := fmt.Sprintf("https://github.com/%s.git", entry.Source)

	cloneOutput, err := gitClone(repoURL, tempRepoDir)
	if err != nil {
		return fmt.Errorf("failed to clone repository: %v\nOutput: %s", err, string(cloneOutput))
	}

	// 查找 skill 目录（复用 findSkillInRepo 的完整查找逻辑）
	skillSourcePath := findSkillInRepo(tempRepoDir, skillName)
	if skillSourcePath == "" {
		return fmt.Errorf("skill not found in repository: %s", skillName)
	}

	// 复制新版本
	if err := copyDir(skillSourcePath, skillPath); err != nil {
		return fmt.Errorf("failed to copy skill: %v", err)
	}

	// 更新 .skills-lock 中的 updatedAt 时间
	if err := ss.updateSkillsLock(centralSkillsDir, skillName, entry.Source); err != nil {
	}

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
			continue
		}

		linkPath := filepath.Join(agentSkillsDir, skillName)

		// 如果已存在，先删除
		if stat, err := os.Lstat(linkPath); err == nil {
			if stat.Mode()&os.ModeSymlink != 0 {
				os.Remove(linkPath)
			} else {
				continue
			}
		}

		// 创建软链接
		if err := os.Symlink(skillSourcePath, linkPath); err != nil {
		} else {
			successCount++
		}
	}

	return nil
}

// InstallRemoteSkillToProject 从远程直接安装 skill 到项目本地（不经过全局）
func (ss *SkillsService) InstallRemoteSkillToProject(projectPath string, fullName string, agents []string) error {
	if projectPath == "" || fullName == "" {
		return fmt.Errorf("project path and skill full name are required")
	}


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

	cloneOutput, err := gitClone(repoURL, tempRepoDir)
	if err != nil {
		return fmt.Errorf("failed to clone repository: %v\nOutput: %s", err, string(cloneOutput))
	}

	// 查找 skill 目录 - 使用通用查找函数
	skillSourcePath := findSkillInRepo(tempRepoDir, skillName)
	if skillSourcePath == "" {
		return fmt.Errorf("skill not found in repository: %s", skillName)
	}

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
			continue
		}

		targetPath := filepath.Join(agentSkillsDir, skillName)

		// 如果已存在，先删除
		if _, err := os.Lstat(targetPath); err == nil {
			os.RemoveAll(targetPath)
		}

		// 复制 skill 文件到项目目录
		if err := copyDir(skillSourcePath, targetPath); err != nil {
		} else {
			successCount++
		}
	}

	return nil
}

// hasSkillMd 检查目录下是否有 SKILL.md 文件
func hasSkillMd(dir string) bool {
	_, err := os.Stat(filepath.Join(dir, "SKILL.md"))
	return err == nil
}

// findSkillInRepo 在仓库中查找 skill 目录，支持多种目录结构
// skillName 可能与仓库内目录名不完全匹配（例如 API 返回 "vercel-react-best-practices"
// 但仓库内目录名是 "react-best-practices"），所以需要后缀匹配。
func findSkillInRepo(repoDir string, skillName string) string {
	// 1. 精确匹配：直接在根目录查找 repo/skill-name/
	candidate := filepath.Join(repoDir, skillName)
	if info, err := os.Stat(candidate); err == nil && info.IsDir() {
		// 优先返回有 SKILL.md 的目录
		if hasSkillMd(candidate) {
			return candidate
		}
	}

	// 2. 精确匹配：在 skills/ 子目录查找 repo/skills/skill-name/
	candidate = filepath.Join(repoDir, "skills", skillName)
	if info, err := os.Stat(candidate); err == nil && info.IsDir() {
		return candidate
	}

	// 3. 仓库根目录有 SKILL.md → 整个仓库就是一个 skill
	if hasSkillMd(repoDir) {
		return repoDir
	}

	// 4. 后缀匹配：在 skills/ 目录下查找名称后缀匹配的目录（优先有 SKILL.md 的）
	// 例如 skillName="vercel-react-best-practices" 匹配目录 "react-best-practices"
	skillsDir := filepath.Join(repoDir, "skills")
	if entries, err := os.ReadDir(skillsDir); err == nil {
		for _, entry := range entries {
			if !entry.IsDir() || strings.HasPrefix(entry.Name(), ".") {
				continue
			}
			if strings.HasSuffix(skillName, entry.Name()) || strings.HasSuffix(entry.Name(), skillName) {
				return filepath.Join(skillsDir, entry.Name())
			}
		}
	}

	// 5. 递归查找：精确名称匹配或后缀匹配，优先有 SKILL.md 的
	var exactFound string
	var suffixFound string
	filepath.WalkDir(repoDir, func(path string, d os.DirEntry, err error) error {
		if err != nil || !d.IsDir() || path == repoDir {
			return nil
		}
		if d.Name() == ".git" || d.Name() == ".github" {
			return filepath.SkipDir
		}
		dirName := d.Name()
		if dirName == skillName {
			exactFound = path
			return filepath.SkipAll
		}
		if suffixFound == "" && (strings.HasSuffix(skillName, dirName) || strings.HasSuffix(dirName, skillName)) {
			if hasSkillMd(path) {
				suffixFound = path
			}
		}
		return nil
	})
	if exactFound != "" {
		return exactFound
	}
	if suffixFound != "" {
		return suffixFound
	}

	// 6. 如果仓库只有一个非隐藏子目录，可能就是 skill
	if entries, err := os.ReadDir(repoDir); err == nil {
		var dirs []os.DirEntry
		for _, entry := range entries {
			if entry.IsDir() && !strings.HasPrefix(entry.Name(), ".") {
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


	removedCount := 0
	for _, agent := range getAllAgentConfigs() {
		agentSkillsDir := filepath.Join(projectPath, agent.LocalPath)
		linkPath := filepath.Join(agentSkillsDir, skillName)

		if stat, err := os.Lstat(linkPath); err == nil {
			if stat.Mode()&os.ModeSymlink != 0 {
				if err := os.Remove(linkPath); err == nil {
					removedCount++
				}
			} else if stat.IsDir() {
				// 项目本地的 skill 目录（非软链接），也可以删除
				if err := os.RemoveAll(linkPath); err == nil {
					removedCount++
				}
			}
		}
	}

	return nil
}

// ---- 版本检测与更新提醒 ----

// SkillUpdateInfo 单个 skill 的更新信息
type SkillUpdateInfo struct {
	Name       string `json:"name"`
	Source     string `json:"source"`
	HasUpdate  bool   `json:"hasUpdate"`
	CurrentSHA string `json:"currentSHA"`
	LatestSHA  string `json:"latestSHA"`
}

// CheckSkillUpdates 检查所有已安装 skill 是否有更新
// 通过 GitHub API 获取最新 commit SHA 与本地记录的对比
func (ss *SkillsService) CheckSkillUpdates() ([]SkillUpdateInfo, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get home directory: %v", err)
	}

	centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")
	lockPath := filepath.Join(centralSkillsDir, ".skills-lock")

	data, err := os.ReadFile(lockPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read .skills-lock: %v", err)
	}

	lock, err := unmarshalSkillsLock(data)
	if err != nil {
		return nil, fmt.Errorf("failed to parse .skills-lock: %v", err)
	}

	if len(lock.Skills) == 0 {
		return []SkillUpdateInfo{}, nil
	}

	// 并发检测每个 skill 是否有更新
	var mu sync.Mutex
	var wg sync.WaitGroup
	var results []SkillUpdateInfo

	client := &http.Client{Timeout: 10 * time.Second}

	for skillName, entry := range lock.Skills {
		if entry.Source == "" {
			continue
		}
		wg.Add(1)
		go func(name string, e SkillLockEntry) {
			defer wg.Done()
			info := SkillUpdateInfo{
				Name:   name,
				Source: e.Source,
			}

			// 获取本地文件的修改时间作为参考 (updatedAt)
			localUpdatedAt := e.UpdatedAt

			// 通过 GitHub API 获取最新 commit
			// GET https://api.github.com/repos/{owner}/{repo}/commits?path=skills/{skillName}&per_page=1
			apiURL := fmt.Sprintf("https://api.github.com/repos/%s/commits?path=skills/%s&per_page=1", e.Source, name)
			req, err := http.NewRequest("GET", apiURL, nil)
			if err != nil {
				mu.Lock()
				results = append(results, info)
				mu.Unlock()
				return
			}
			req.Header.Set("Accept", "application/vnd.github.v3+json")

			resp, err := client.Do(req)
			if err != nil {
				mu.Lock()
				results = append(results, info)
				mu.Unlock()
				return
			}
			defer resp.Body.Close()

			if resp.StatusCode != 200 {
				mu.Lock()
				results = append(results, info)
				mu.Unlock()
				return
			}

			body, err := io.ReadAll(resp.Body)
			if err != nil {
				mu.Lock()
				results = append(results, info)
				mu.Unlock()
				return
			}

			var commits []struct {
				SHA    string `json:"sha"`
				Commit struct {
					Committer struct {
						Date string `json:"date"`
					} `json:"committer"`
				} `json:"commit"`
			}
			if err := json.Unmarshal(body, &commits); err != nil || len(commits) == 0 {
				// 尝试不带 path 参数（仓库根就是 skill 的情况）
				apiURL2 := fmt.Sprintf("https://api.github.com/repos/%s/commits?per_page=1", e.Source)
				req2, _ := http.NewRequest("GET", apiURL2, nil)
				req2.Header.Set("Accept", "application/vnd.github.v3+json")
				resp2, err2 := client.Do(req2)
				if err2 != nil {
					mu.Lock()
					results = append(results, info)
					mu.Unlock()
					return
				}
				defer resp2.Body.Close()
				body2, _ := io.ReadAll(resp2.Body)
				if err := json.Unmarshal(body2, &commits); err != nil || len(commits) == 0 {
					mu.Lock()
					results = append(results, info)
					mu.Unlock()
					return
				}
			}

			latestSHA := commits[0].SHA
			latestDate := commits[0].Commit.Committer.Date
			info.LatestSHA = latestSHA

			// 比较远程 commit 时间与本地 updatedAt
			if localUpdatedAt != "" && latestDate != "" {
				localTime, err1 := time.Parse(time.RFC3339, localUpdatedAt)
				remoteTime, err2 := time.Parse(time.RFC3339, latestDate)
				if err1 == nil && err2 == nil {
					if remoteTime.After(localTime) {
						info.HasUpdate = true
					} else {
					}
				}
			}

			mu.Lock()
			results = append(results, info)
			mu.Unlock()
		}(skillName, entry)
	}

	wg.Wait()
	return results, nil
}

// ---- 导入/导出配置 ----

// ExportedConfig 导出配置的结构
type ExportedConfig struct {
	Version      int               `json:"version"`
	ExportedAt   string            `json:"exportedAt"`
	Skills       []ExportedSkill   `json:"skills"`
	CustomAgents []CustomAgentConfig `json:"customAgents"`
}

// ExportedSkill 导出的单个 skill 信息
type ExportedSkill struct {
	FullName     string   `json:"fullName"`     // owner/repo@skill-name
	LinkedAgents []string `json:"linkedAgents"` // 链接到的 agent 列表
}

// ExportConfig 导出当前所有配置（已安装 skills + agent 链接 + 自定义 agents）
func (ss *SkillsService) ExportConfig() (*ExportedConfig, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get home directory: %v", err)
	}

	centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")
	lockPath := filepath.Join(centralSkillsDir, ".skills-lock")

	// 读取 .skills-lock
	var lock SkillsLock
	if data, err := os.ReadFile(lockPath); err == nil {
		lock, _ = unmarshalSkillsLock(data)
	}

	// 收集所有 skill 信息
	var exportedSkills []ExportedSkill
	if lock.Skills != nil {
		for skillName, entry := range lock.Skills {
			fullName := fmt.Sprintf("%s@%s", entry.Source, skillName)
			// 获取链接的 agents
			agents, _ := ss.GetSkillAgentLinks(skillName)
			exportedSkills = append(exportedSkills, ExportedSkill{
				FullName:     fullName,
				LinkedAgents: agents,
			})
		}
	}

	// 读取自定义 agents
	customAgents, _ := loadCustomAgents()

	config := &ExportedConfig{
		Version:      1,
		ExportedAt:   time.Now().Format(time.RFC3339),
		Skills:       exportedSkills,
		CustomAgents: customAgents,
	}

	return config, nil
}

// ExportConfigToFile 导出配置到用户选择的文件（使用原生文件对话框）
// 返回保存的文件路径，空字符串表示用户取消
func (ss *SkillsService) ExportConfigToFile() (string, error) {
	config, err := ss.ExportConfig()
	if err != nil {
		return "", err
	}

	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal config: %v", err)
	}

	defaultFilename := fmt.Sprintf("skills-manager-config-%s.json", time.Now().Format("2006-01-02"))

	savePath, err := wailsRuntime.SaveFileDialog(ss.ctx, wailsRuntime.SaveDialogOptions{
		DefaultFilename: defaultFilename,
		Title:           "导出配置",
		Filters: []wailsRuntime.FileFilter{
			{DisplayName: "JSON Files", Pattern: "*.json"},
		},
	})
	if err != nil {
		return "", fmt.Errorf("save dialog error: %v", err)
	}
	if savePath == "" {
		return "", nil // 用户取消
	}

	if err := os.WriteFile(savePath, data, 0644); err != nil {
		return "", fmt.Errorf("failed to write file: %v", err)
	}

	return savePath, nil
}

// ImportResult 导入结果
type ImportResult struct {
	InstalledCount int `json:"installedCount"`
	SkippedCount   int `json:"skippedCount"`
	FailedCount    int `json:"failedCount"`
}

// ImportConfig 导入配置（安装缺失的 skills + 恢复 agent 链接 + 恢复自定义 agents）
func (ss *SkillsService) ImportConfig(configJSON string) (*ImportResult, error) {
	var config ExportedConfig
	if err := json.Unmarshal([]byte(configJSON), &config); err != nil {
		return nil, fmt.Errorf("invalid config format: %v", err)
	}


	// 1. 导入自定义 agents
	if len(config.CustomAgents) > 0 {
		existingCustoms, _ := loadCustomAgents()
		existingNames := make(map[string]bool)
		for _, c := range existingCustoms {
			existingNames[c.Name] = true
		}
		for _, c := range config.CustomAgents {
			if !existingNames[c.Name] {
				existingCustoms = append(existingCustoms, c)
			} else {
			}
		}
		if err := saveCustomAgents(existingCustoms); err != nil {
		}
	}

	// 2. 安装缺失的 skills 并恢复 agent 链接
	homeDir, _ := os.UserHomeDir()
	centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")

	result := &ImportResult{}

	for _, skill := range config.Skills {
		// 解析 fullName
		parts := strings.Split(skill.FullName, "@")
		if len(parts) != 2 {
			result.FailedCount++
			continue
		}
		skillName := parts[1]
		skillPath := filepath.Join(centralSkillsDir, skillName)

		// 检查是否已安装
		if _, err := os.Stat(skillPath); err == nil {
			if len(skill.LinkedAgents) > 0 {
				ss.UpdateSkillAgentLinks(skillName, skill.LinkedAgents)
			}
			result.SkippedCount++
			continue
		}

		// 安装 skill
		if err := ss.InstallRemoteSkill(skill.FullName, skill.LinkedAgents); err != nil {
			result.FailedCount++
			continue
		}
		result.InstalledCount++
	}

	return result, nil
}

// ---- 标签/分类系统 ----

// SkillTagsConfig 标签持久化结构
type SkillTagsConfig struct {
	Tags map[string][]string `json:"tags"` // skill name -> tag list
}

func getTagsFilePath() (string, error) {
	configDir, err := getConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(configDir, "skill-tags.json"), nil
}

func loadSkillTags() (SkillTagsConfig, error) {
	filePath, err := getTagsFilePath()
	if err != nil {
		return SkillTagsConfig{Tags: make(map[string][]string)}, err
	}
	data, err := os.ReadFile(filePath)
	if err != nil {
		return SkillTagsConfig{Tags: make(map[string][]string)}, nil
	}
	var config SkillTagsConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return SkillTagsConfig{Tags: make(map[string][]string)}, nil
	}
	if config.Tags == nil {
		config.Tags = make(map[string][]string)
	}
	return config, nil
}

func saveSkillTags(config SkillTagsConfig) error {
	filePath, err := getTagsFilePath()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filePath, data, 0644)
}

// GetSkillTags 获取某个 skill 的标签
func (ss *SkillsService) GetSkillTags(skillName string) ([]string, error) {
	config, err := loadSkillTags()
	if err != nil {
		return []string{}, err
	}
	tags, ok := config.Tags[skillName]
	if !ok {
		return []string{}, nil
	}
	return tags, nil
}

// SetSkillTags 设置某个 skill 的标签
func (ss *SkillsService) SetSkillTags(skillName string, tags []string) error {
	config, err := loadSkillTags()
	if err != nil {
		return err
	}
	if len(tags) == 0 {
		delete(config.Tags, skillName)
	} else {
		config.Tags[skillName] = tags
	}
	return saveSkillTags(config)
}

// GetAllTags 获取所有已使用的标签及其 skill 列表
func (ss *SkillsService) GetAllTags() (map[string][]string, error) {
	config, err := loadSkillTags()
	if err != nil {
		return nil, err
	}
	// 反转: tag -> skill names
	tagMap := make(map[string][]string)
	for skillName, tags := range config.Tags {
		for _, tag := range tags {
			tagMap[tag] = append(tagMap[tag], skillName)
		}
	}
	return tagMap, nil
}

// GetAllSkillTagsMap 获取所有 skill 的标签映射
func (ss *SkillsService) GetAllSkillTagsMap() (map[string][]string, error) {
	config, err := loadSkillTags()
	if err != nil {
		return nil, err
	}
	return config.Tags, nil
}

// ---- Agent 健康检查 ----

// HealthCheckResult 健康检查结果
type HealthCheckResult struct {
	BrokenLinks   []BrokenLink   `json:"brokenLinks"`
	OrphanSkills  []string       `json:"orphanSkills"`  // 没有链接到任何 agent 的 skills
	UnknownFiles  []UnknownFile  `json:"unknownFiles"`  // agent 目录中非 skill 的文件
	TotalLinks    int            `json:"totalLinks"`
	HealthyLinks  int            `json:"healthyLinks"`
}

// BrokenLink 断裂的软链接
type BrokenLink struct {
	AgentName string `json:"agentName"`
	SkillName string `json:"skillName"`
	LinkPath  string `json:"linkPath"`
	Target    string `json:"target"`
	Error     string `json:"error"`
}

// UnknownFile agent 目录中的非 skill 文件
type UnknownFile struct {
	AgentName string `json:"agentName"`
	FileName  string `json:"fileName"`
	FilePath  string `json:"filePath"`
}

// HealthCheck 执行 Agent 链接健康检查
func (ss *SkillsService) HealthCheck() (*HealthCheckResult, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get home directory: %v", err)
	}

	centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")
	result := &HealthCheckResult{}

	// 跟踪所有 skill 被链接到了哪些 agent
	skillLinkCount := make(map[string]int)

	for _, agent := range getAllAgentConfigs() {
		agentSkillsDir := filepath.Join(homeDir, agent.GlobalPath)
		if agentSkillsDir == centralSkillsDir {
			continue
		}

		if _, err := os.Stat(agentSkillsDir); os.IsNotExist(err) {
			continue
		}

		entries, err := os.ReadDir(agentSkillsDir)
		if err != nil {
			continue
		}

		for _, entry := range entries {
			name := entry.Name()
			if strings.HasPrefix(name, ".") {
				continue
			}
			fullPath := filepath.Join(agentSkillsDir, name)

			// 检查是否是软链接
			lstat, err := os.Lstat(fullPath)
			if err != nil {
				continue
			}

			if lstat.Mode()&os.ModeSymlink != 0 {
				result.TotalLinks++
				// 检查软链接是否有效
				target, err := os.Readlink(fullPath)
				if err != nil {
					result.BrokenLinks = append(result.BrokenLinks, BrokenLink{
						AgentName: agent.Name,
						SkillName: name,
						LinkPath:  fullPath,
						Error:     fmt.Sprintf("cannot read link: %v", err),
					})
					continue
				}

				absTarget := target
				if !filepath.IsAbs(target) {
					absTarget = filepath.Clean(filepath.Join(agentSkillsDir, target))
				}

				if _, err := os.Stat(absTarget); os.IsNotExist(err) {
					result.BrokenLinks = append(result.BrokenLinks, BrokenLink{
						AgentName: agent.Name,
						SkillName: name,
						LinkPath:  fullPath,
						Target:    absTarget,
						Error:     "target does not exist",
					})
				} else {
					result.HealthyLinks++
					skillLinkCount[name]++
				}
			} else if !lstat.IsDir() {
				// 非目录、非软链接的文件
				result.UnknownFiles = append(result.UnknownFiles, UnknownFile{
					AgentName: agent.Name,
					FileName:  name,
					FilePath:  fullPath,
				})
			}
		}
	}

	// 检查中央目录中没有被任何 agent 链接的 skills
	if entries, err := os.ReadDir(centralSkillsDir); err == nil {
		for _, entry := range entries {
			name := entry.Name()
			if strings.HasPrefix(name, ".") || !entry.IsDir() {
				continue
			}
			if skillLinkCount[name] == 0 {
				result.OrphanSkills = append(result.OrphanSkills, name)
			}
		}
	}

	return result, nil
}

// RepairBrokenLinks 修复断裂的软链接（删除断裂链接）
func (ss *SkillsService) RepairBrokenLinks() (int, error) {
	result, err := ss.HealthCheck()
	if err != nil {
		return 0, err
	}

	repaired := 0
	for _, broken := range result.BrokenLinks {
		if err := os.Remove(broken.LinkPath); err == nil {
			repaired++
		}
	}

	return repaired, nil
}

// ---- 使用统计 ----

// SkillStats 单个 skill 的统计信息
type SkillStats struct {
	Name        string `json:"name"`
	AgentCount  int    `json:"agentCount"`
	ProjectCount int   `json:"projectCount"`
	Source      string `json:"source"`
	InstalledAt string `json:"installedAt"`
}

// DashboardStats 首页仪表盘统计
type DashboardStats struct {
	TotalSkills       int              `json:"totalSkills"`
	TotalAgents       int              `json:"totalAgents"`
	TotalLinks        int              `json:"totalLinks"`
	TotalProjects     int              `json:"totalProjects"`
	OrphanSkills      int              `json:"orphanSkills"`
	MostLinkedSkills  []SkillStats     `json:"mostLinkedSkills"`
	RecentSkills      []SkillStats     `json:"recentSkills"`
	TopAgents         []AgentLinkCount `json:"topAgents"`
	TagDistribution   map[string]int   `json:"tagDistribution"`
}

// AgentLinkCount agent 链接计数
type AgentLinkCount struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

// GetDashboardStats 获取首页仪表盘统计数据
func (ss *SkillsService) GetDashboardStats() (*DashboardStats, error) {
	skills, err := ss.GetAllAgentSkills()
	if err != nil {
		return nil, err
	}

	stats := &DashboardStats{
		TotalSkills: len(skills),
		TotalAgents: len(getAllAgentConfigs()),
	}

	// 统计链接数和 agent 排名
	agentCounts := make(map[string]int)
	for _, skill := range skills {
		stats.TotalLinks += len(skill.Agents)
		for _, agent := range skill.Agents {
			agentCounts[agent]++
		}
	}

	// Top agents
	for name, count := range agentCounts {
		stats.TopAgents = append(stats.TopAgents, AgentLinkCount{Name: name, Count: count})
	}
	// 排序
	for i := 0; i < len(stats.TopAgents); i++ {
		for j := i + 1; j < len(stats.TopAgents); j++ {
			if stats.TopAgents[j].Count > stats.TopAgents[i].Count {
				stats.TopAgents[i], stats.TopAgents[j] = stats.TopAgents[j], stats.TopAgents[i]
			}
		}
	}
	if len(stats.TopAgents) > 5 {
		stats.TopAgents = stats.TopAgents[:5]
	}

	// Most linked skills
	for _, skill := range skills {
		stats.MostLinkedSkills = append(stats.MostLinkedSkills, SkillStats{
			Name:       skill.Name,
			AgentCount: len(skill.Agents),
			Source:     skill.Source,
		})
	}
	for i := 0; i < len(stats.MostLinkedSkills); i++ {
		for j := i + 1; j < len(stats.MostLinkedSkills); j++ {
			if stats.MostLinkedSkills[j].AgentCount > stats.MostLinkedSkills[i].AgentCount {
				stats.MostLinkedSkills[i], stats.MostLinkedSkills[j] = stats.MostLinkedSkills[j], stats.MostLinkedSkills[i]
			}
		}
	}
	if len(stats.MostLinkedSkills) > 5 {
		stats.MostLinkedSkills = stats.MostLinkedSkills[:5]
	}

	// Recent skills (from .skills-lock)
	homeDir, _ := os.UserHomeDir()
	lockPath := filepath.Join(homeDir, ".agents", "skills", ".skills-lock")
	if data, err := os.ReadFile(lockPath); err == nil {
		if lock, err := unmarshalSkillsLock(data); err == nil {
			type timeEntry struct {
				name string
				time string
				src  string
			}
			var entries []timeEntry
			for name, entry := range lock.Skills {
				t := entry.UpdatedAt
				if t == "" {
					t = entry.InstalledAt
				}
				entries = append(entries, timeEntry{name: name, time: t, src: entry.Source})
			}
			// 按时间降序
			for i := 0; i < len(entries); i++ {
				for j := i + 1; j < len(entries); j++ {
					if entries[j].time > entries[i].time {
						entries[i], entries[j] = entries[j], entries[i]
					}
				}
			}
			if len(entries) > 5 {
				entries = entries[:5]
			}
			for _, e := range entries {
				stats.RecentSkills = append(stats.RecentSkills, SkillStats{
					Name:        e.name,
					Source:      e.src,
					InstalledAt: e.time,
				})
			}
		}
	}

	// Orphan skills count
	healthResult, _ := ss.HealthCheck()
	if healthResult != nil {
		stats.OrphanSkills = len(healthResult.OrphanSkills)
	}

	// Tag distribution
	tagConfig, _ := loadSkillTags()
	tagDist := make(map[string]int)
	for _, tags := range tagConfig.Tags {
		for _, tag := range tags {
			tagDist[tag]++
		}
	}
	stats.TagDistribution = tagDist

	return stats, nil
}

// ---- Skill 模板/创建 ----

// SkillTemplate skill 模板定义
type SkillTemplate struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Language    string `json:"language"`
	Framework   string `json:"framework"`
	Content     string `json:"content"`
}

// GetSkillTemplates 获取内置模板列表
func (ss *SkillsService) GetSkillTemplates() []SkillTemplate {
	return []SkillTemplate{
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
	}
}

// CreateSkill 创建新的自定义 skill
func (ss *SkillsService) CreateSkill(name string, description string, templateName string, agents []string) error {
	if name == "" {
		return fmt.Errorf("skill name is required")
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %v", err)
	}

	centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")
	skillPath := filepath.Join(centralSkillsDir, name)

	// 检查是否已存在
	if _, err := os.Stat(skillPath); err == nil {
		return fmt.Errorf("skill already exists: %s", name)
	}

	// 获取模板
	var content string
	templates := ss.GetSkillTemplates()
	for _, tmpl := range templates {
		if tmpl.Name == templateName {
			content = tmpl.Content
			break
		}
	}
	if content == "" {
		// 使用空白模板
		content = templates[0].Content
	}

	// 替换占位符
	content = strings.ReplaceAll(content, "{{NAME}}", name)
	content = strings.ReplaceAll(content, "{{DESCRIPTION}}", description)

	// 创建目录
	if err := os.MkdirAll(skillPath, 0755); err != nil {
		return fmt.Errorf("failed to create skill directory: %v", err)
	}

	// 写入 SKILL.md
	skillMdPath := filepath.Join(skillPath, "SKILL.md")
	if err := os.WriteFile(skillMdPath, []byte(content), 0644); err != nil {
		os.RemoveAll(skillPath)
		return fmt.Errorf("failed to write SKILL.md: %v", err)
	}

	// 更新 .skills-lock
	now := time.Now().Format(time.RFC3339)
	lockPath := filepath.Join(centralSkillsDir, ".skills-lock")
	var lock SkillsLock
	if data, err := os.ReadFile(lockPath); err == nil {
		lock, _ = unmarshalSkillsLock(data)
	} else {
		lock = SkillsLock{Version: 3, Skills: make(map[string]SkillLockEntry)}
	}
	lock.Skills[name] = SkillLockEntry{
		Source:      "local",
		SourceType:  "local",
		InstalledAt: now,
		UpdatedAt:   now,
	}
	if data, err := json.MarshalIndent(lock, "", "  "); err == nil {
		os.WriteFile(lockPath, data, 0644)
	}

	// 创建 agent 软链接
	if len(agents) > 0 {
		ss.createSymlinksForSkill(name, skillPath, agents)
	}

	return nil
}

// SaveSkillContent 保存 skill 的 SKILL.md 内容
func (ss *SkillsService) SaveSkillContent(skillName string, content string) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %v", err)
	}

	skillMdPath := filepath.Join(homeDir, ".agents", "skills", skillName, "SKILL.md")
	if _, err := os.Stat(skillMdPath); os.IsNotExist(err) {
		return fmt.Errorf("skill not found: %s", skillName)
	}

	return os.WriteFile(skillMdPath, []byte(content), 0644)
}

// EditorInfo 编辑器信息
type EditorInfo struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Icon       string `json:"icon"`
	IconBase64 string `json:"iconBase64"` // base64 编码的 PNG 图标
}

// editorDef 编辑器定义（内部使用）
type editorDef struct {
	ID      string
	Name    string
	Icon    string
	AppName string // macOS .app 名称
}

// knownEditorDefs 已知的代码编辑器列表（按优先级排列）
var knownEditorDefs = []editorDef{
	{ID: "code", Name: "VS Code", Icon: "vscode", AppName: "Visual Studio Code"},
	{ID: "cursor", Name: "Cursor", Icon: "cursor", AppName: "Cursor"},
	{ID: "buddycn", Name: "CodeBuddy", Icon: "codebuddy", AppName: "CodeBuddy CN"},
	{ID: "windsurf", Name: "Windsurf", Icon: "windsurf", AppName: "Windsurf"},
	{ID: "zed", Name: "Zed", Icon: "zed", AppName: "Zed"},
	{ID: "subl", Name: "Sublime Text", Icon: "sublime", AppName: "Sublime Text"},
	{ID: "idea", Name: "IntelliJ IDEA", Icon: "idea", AppName: "IntelliJ IDEA"},
	{ID: "webstorm", Name: "WebStorm", Icon: "webstorm", AppName: "WebStorm"},
	{ID: "fleet", Name: "Fleet", Icon: "fleet", AppName: "Fleet"},
	{ID: "nova", Name: "Nova", Icon: "nova", AppName: "Nova"},
}

// getAppIconBase64 从 macOS .app 包中提取应用图标并转为 base64 PNG
func getAppIconBase64(appName string) string {
	appPath := fmt.Sprintf("/Applications/%s.app", appName)
	if _, err := os.Stat(appPath); os.IsNotExist(err) {
		return ""
	}

	// 读取 Info.plist 获取图标文件名
	iconFileOut, err := exec.Command("defaults", "read", appPath+"/Contents/Info", "CFBundleIconFile").Output()
	if err != nil {
		return ""
	}
	iconFile := strings.TrimSpace(string(iconFileOut))
	if iconFile == "" {
		return ""
	}
	// 补全 .icns 后缀
	if !strings.HasSuffix(iconFile, ".icns") {
		iconFile += ".icns"
	}

	icnsPath := filepath.Join(appPath, "Contents", "Resources", iconFile)
	if _, err := os.Stat(icnsPath); os.IsNotExist(err) {
		return ""
	}

	// 用 sips 将 icns 转换为 32x32 PNG
	tmpFile := filepath.Join(os.TempDir(), fmt.Sprintf("editor-icon-%s.png", appName))
	defer os.Remove(tmpFile)

	if err := exec.Command("sips", "-s", "format", "png", "-Z", "32", icnsPath, "--out", tmpFile).Run(); err != nil {
		return ""
	}

	// 读取 PNG 并转为 base64
	data, err := os.ReadFile(tmpFile)
	if err != nil {
		return ""
	}

	return "data:image/png;base64," + base64.StdEncoding.EncodeToString(data)
}

// GetAvailableEditors 返回系统中可用的编辑器列表（包含应用图标）
func (ss *SkillsService) GetAvailableEditors() []EditorInfo {
	var available []EditorInfo
	for _, def := range knownEditorDefs {
		if _, err := exec.LookPath(def.ID); err == nil {
			editor := EditorInfo{
				ID:         def.ID,
				Name:       def.Name,
				Icon:       def.Icon,
				IconBase64: getAppIconBase64(def.AppName),
			}
			available = append(available, editor)
		}
	}
	return available
}

// editorAppNames VS Code 系列编辑器对应的 macOS App 名称
var editorAppNames = map[string]string{
	"code":     "Visual Studio Code",
	"cursor":   "Cursor",
	"buddycn":  "CodeBuddy CN",
	"windsurf": "Windsurf",
}

// OpenSkillInEditor 在指定编辑器中打开 skill 目录
func (ss *SkillsService) OpenSkillInEditor(skillName string, editorID string) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %v", err)
	}

	skillDir := filepath.Join(homeDir, ".agents", "skills", skillName)
	if _, err := os.Stat(skillDir); os.IsNotExist(err) {
		return fmt.Errorf("skill not found: %s", skillName)
	}

	// 查找 SKILL.md，打开目录时同时打开文件以确保 Explorer 展开
	skillFile := filepath.Join(skillDir, "SKILL.md")
	hasSkillFile := false
	if _, err := os.Stat(skillFile); err == nil {
		hasSkillFile = true
	}

	// 对于 VS Code 系列编辑器，用 open -a 通过 macOS 原生方式打开，确保侧边栏正常展开
	if appName, ok := editorAppNames[editorID]; ok {
		appPath := fmt.Sprintf("/Applications/%s.app", appName)
		if _, err := os.Stat(appPath); err == nil {
			// 先用 open -a 打开目录
			if _, err = safeExecCommand("open", "-a", appName, skillDir); err != nil {
				return err
			}
			// 等待编辑器启动
			time.Sleep(500 * time.Millisecond)
			// 然后用 CLI 打开文件
			if hasSkillFile {
				_, err = safeExecCommand(editorID, "-g", skillFile+":1")
			} else {
				_, err = safeExecCommand(editorID, skillDir)
			}
			return err
		}
	}

	// 其他编辑器直接用 CLI 打开
	args := []string{skillDir}
	if hasSkillFile {
		args = append(args, "-g", skillFile+":1")
	}
	_, err = safeExecCommand(editorID, args...)
	return err
}

// OpenSkillInSystemEditor 在系统编辑器中打开 skill 目录（兼容旧调用，自动选择第一个可用编辑器）
func (ss *SkillsService) OpenSkillInSystemEditor(skillName string) error {
	editors := ss.GetAvailableEditors()
	if len(editors) == 0 {
		return fmt.Errorf("no editor found")
	}
	return ss.OpenSkillInEditor(skillName, editors[0].ID)
}

// GetSkillFiles 获取 skill 目录下的所有文件列表
func (ss *SkillsService) GetSkillFiles(skillName string) ([]SkillFile, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get home directory: %v", err)
	}

	skillDir := filepath.Join(homeDir, ".agents", "skills", skillName)
	if _, err := os.Stat(skillDir); os.IsNotExist(err) {
		return nil, fmt.Errorf("skill not found: %s", skillName)
	}

	var files []SkillFile
	err = filepath.Walk(skillDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		relPath, _ := filepath.Rel(skillDir, path)
		if relPath == "." {
			return nil
		}
		sf := SkillFile{
			Name:  relPath,
			IsDir: info.IsDir(),
			Size:  info.Size(),
		}
		if !info.IsDir() {
			if data, err := os.ReadFile(path); err == nil {
				sf.Content = string(data)
			}
		}
		files = append(files, sf)
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list files: %v", err)
	}

	return files, nil
}

// SkillFile 技能目录中的文件信息
type SkillFile struct {
	Name    string `json:"name"`
	IsDir   bool   `json:"isDir"`
	Size    int64  `json:"size"`
	Content string `json:"content"`
}

// ---- Diff 预览 ----

// SkillDiff 更新前后的 diff 信息
type SkillDiff struct {
	SkillName    string `json:"skillName"`
	LocalContent string `json:"localContent"`
	RemoteContent string `json:"remoteContent"`
	HasChanges   bool   `json:"hasChanges"`
}

// GetSkillDiff 获取本地和远程版本的 SKILL.md 内容对比
func (ss *SkillsService) GetSkillDiff(skillName string) (*SkillDiff, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get home directory: %v", err)
	}

	centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")
	lockPath := filepath.Join(centralSkillsDir, ".skills-lock")

	// 读取本地内容
	localPath := filepath.Join(centralSkillsDir, skillName, "SKILL.md")
	localData, err := os.ReadFile(localPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read local SKILL.md: %v", err)
	}

	// 获取来源信息
	lockData, err := os.ReadFile(lockPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read .skills-lock: %v", err)
	}
	lock, err := unmarshalSkillsLock(lockData)
	if err != nil {
		return nil, fmt.Errorf("failed to parse .skills-lock: %v", err)
	}
	entry, exists := lock.Skills[skillName]
	if !exists || entry.Source == "" || entry.Source == "local" {
		return &SkillDiff{
			SkillName:    skillName,
			LocalContent: string(localData),
			HasChanges:   false,
		}, nil
	}

	// 克隆远程仓库获取最新内容
	repoURL := fmt.Sprintf("https://github.com/%s.git", entry.Source)
	tempRepoDir := filepath.Join(os.TempDir(), "skills-diff-"+skillName)
	os.RemoveAll(tempRepoDir)
	defer os.RemoveAll(tempRepoDir)

	cloneOutput, err := gitClone(repoURL, tempRepoDir)
	if err != nil {
		return nil, fmt.Errorf("failed to clone: %v\n%s", err, string(cloneOutput))
	}

	// 查找远程 skill
	skillSourcePath := findSkillInRepo(tempRepoDir, skillName)
	if skillSourcePath == "" {
		return nil, fmt.Errorf("skill not found in remote repository")
	}

	remoteSkillMd := filepath.Join(skillSourcePath, "SKILL.md")
	remoteData, err := os.ReadFile(remoteSkillMd)
	if err != nil {
		return nil, fmt.Errorf("failed to read remote SKILL.md: %v", err)
	}

	return &SkillDiff{
		SkillName:     skillName,
		LocalContent:  string(localData),
		RemoteContent: string(remoteData),
		HasChanges:    string(localData) != string(remoteData),
	}, nil
}

// ---- 私有源管理 ----

// CustomSource 自定义 skill 源
type CustomSource struct {
	Name    string `json:"name"`
	URL     string `json:"url"`     // Git 仓库 URL
	Token   string `json:"token"`   // 可选的 PAT token
	AddedAt string `json:"addedAt"`
}

// CustomSourcesConfig 自定义源配置
type CustomSourcesConfig struct {
	Sources []CustomSource `json:"sources"`
}

func getSourcesFilePath() (string, error) {
	configDir, err := getConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(configDir, "custom-sources.json"), nil
}

func loadCustomSources() ([]CustomSource, error) {
	filePath, err := getSourcesFilePath()
	if err != nil {
		return nil, err
	}
	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return []CustomSource{}, nil
		}
		return nil, err
	}
	var config CustomSourcesConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return []CustomSource{}, nil
	}
	return config.Sources, nil
}

func saveCustomSources(sources []CustomSource) error {
	filePath, err := getSourcesFilePath()
	if err != nil {
		return err
	}
	config := CustomSourcesConfig{Sources: sources}
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filePath, data, 0644)
}

// GetCustomSources 获取自定义源列表
func (ss *SkillsService) GetCustomSources() ([]CustomSource, error) {
	return loadCustomSources()
}

// AddCustomSource 添加自定义源
func (ss *SkillsService) AddCustomSource(name string, url string, token string) error {
	if name == "" || url == "" {
		return fmt.Errorf("name and URL are required")
	}

	sources, err := loadCustomSources()
	if err != nil {
		return err
	}

	// 检查重复
	for _, s := range sources {
		if s.Name == name {
			return fmt.Errorf("source already exists: %s", name)
		}
	}

	sources = append(sources, CustomSource{
		Name:    name,
		URL:     url,
		Token:   token,
		AddedAt: time.Now().Format(time.RFC3339),
	})

	return saveCustomSources(sources)
}

// RemoveCustomSource 删除自定义源
func (ss *SkillsService) RemoveCustomSource(name string) error {
	sources, err := loadCustomSources()
	if err != nil {
		return err
	}

	found := false
	result := make([]CustomSource, 0, len(sources))
	for _, s := range sources {
		if s.Name == name {
			found = true
			continue
		}
		result = append(result, s)
	}

	if !found {
		return fmt.Errorf("source not found: %s", name)
	}

	return saveCustomSources(result)
}

// SearchCustomSource 从自定义源搜索 skills
func (ss *SkillsService) SearchCustomSource(sourceName string) ([]RemoteSkill, error) {
	sources, err := loadCustomSources()
	if err != nil {
		return nil, err
	}

	var source *CustomSource
	for _, s := range sources {
		if s.Name == sourceName {
			source = &s
			break
		}
	}
	if source == nil {
		return nil, fmt.Errorf("source not found: %s", sourceName)
	}

	// 克隆仓库
	tempDir := filepath.Join(os.TempDir(), "skills-source-"+sourceName)
	os.RemoveAll(tempDir)
	defer os.RemoveAll(tempDir)

	if _, err := gitClone(source.URL, tempDir); err != nil {
		return nil, fmt.Errorf("failed to clone source: %v", err)
	}

	// 扫描仓库中的 skills
	var skills []RemoteSkill
	skillsDir := filepath.Join(tempDir, "skills")
	if entries, err := os.ReadDir(skillsDir); err == nil {
		for _, entry := range entries {
			if !entry.IsDir() || strings.HasPrefix(entry.Name(), ".") {
				continue
			}
			skillPath := filepath.Join(skillsDir, entry.Name())
			if hasSkillMd(skillPath) {
				content, _ := os.ReadFile(filepath.Join(skillPath, "SKILL.md"))
				parsed := parseSkillMd(string(content), skillPath)
				skills = append(skills, RemoteSkill{
					FullName:    fmt.Sprintf("%s@%s", sourceName, entry.Name()),
					Name:        entry.Name(),
					Description: parsed.Desc,
				})
			}
		}
	}

	// 如果 skills/ 目录不存在，检查根目录
	if len(skills) == 0 {
		if hasSkillMd(tempDir) {
			content, _ := os.ReadFile(filepath.Join(tempDir, "SKILL.md"))
			parsed := parseSkillMd(string(content), tempDir)
			repoName := filepath.Base(tempDir)
			skills = append(skills, RemoteSkill{
				FullName:    fmt.Sprintf("%s@%s", sourceName, repoName),
				Name:        repoName,
				Description: parsed.Desc,
			})
		}
	}

	return skills, nil
}

// ---- 项目初始化向导 ----

// ProjectTypeInfo 项目类型检测结果
type ProjectTypeInfo struct {
	ProjectPath    string   `json:"projectPath"`
	DetectedTypes  []string `json:"detectedTypes"`  // e.g. ["react", "typescript", "tailwind"]
	SuggestedSkills []string `json:"suggestedSkills"` // 推荐安装的 skill 关键词
	ExistingAgents []string `json:"existingAgents"`
}

// DetectProjectType 检测项目类型
func (ss *SkillsService) DetectProjectType(projectPath string) (*ProjectTypeInfo, error) {
	if projectPath == "" {
		return nil, fmt.Errorf("project path is required")
	}

	info := &ProjectTypeInfo{
		ProjectPath: projectPath,
	}

	// 检测 package.json
	pkgPath := filepath.Join(projectPath, "package.json")
	if data, err := os.ReadFile(pkgPath); err == nil {
		var pkg map[string]interface{}
		if err := json.Unmarshal(data, &pkg); err == nil {
			deps := make(map[string]bool)
			for _, key := range []string{"dependencies", "devDependencies"} {
				if d, ok := pkg[key].(map[string]interface{}); ok {
					for k := range d {
						deps[k] = true
					}
				}
			}
			if deps["react"] || deps["react-dom"] {
				info.DetectedTypes = append(info.DetectedTypes, "React")
				info.SuggestedSkills = append(info.SuggestedSkills, "react")
			}
			if deps["vue"] {
				info.DetectedTypes = append(info.DetectedTypes, "Vue")
				info.SuggestedSkills = append(info.SuggestedSkills, "vue")
			}
			if deps["next"] {
				info.DetectedTypes = append(info.DetectedTypes, "Next.js")
				info.SuggestedSkills = append(info.SuggestedSkills, "nextjs")
			}
			if deps["typescript"] {
				info.DetectedTypes = append(info.DetectedTypes, "TypeScript")
				info.SuggestedSkills = append(info.SuggestedSkills, "typescript")
			}
			if deps["tailwindcss"] {
				info.DetectedTypes = append(info.DetectedTypes, "Tailwind CSS")
			}
			if deps["svelte"] {
				info.DetectedTypes = append(info.DetectedTypes, "Svelte")
				info.SuggestedSkills = append(info.SuggestedSkills, "svelte")
			}
		}
	}

	// 检测 Go
	if _, err := os.Stat(filepath.Join(projectPath, "go.mod")); err == nil {
		info.DetectedTypes = append(info.DetectedTypes, "Go")
		info.SuggestedSkills = append(info.SuggestedSkills, "go")
	}

	// 检测 Python
	if _, err := os.Stat(filepath.Join(projectPath, "requirements.txt")); err == nil {
		info.DetectedTypes = append(info.DetectedTypes, "Python")
		info.SuggestedSkills = append(info.SuggestedSkills, "python")
	}
	if _, err := os.Stat(filepath.Join(projectPath, "pyproject.toml")); err == nil {
		if !contains(info.DetectedTypes, "Python") {
			info.DetectedTypes = append(info.DetectedTypes, "Python")
			info.SuggestedSkills = append(info.SuggestedSkills, "python")
		}
	}

	// 检测 Rust
	if _, err := os.Stat(filepath.Join(projectPath, "Cargo.toml")); err == nil {
		info.DetectedTypes = append(info.DetectedTypes, "Rust")
		info.SuggestedSkills = append(info.SuggestedSkills, "rust")
	}

	// 如果没有检测到任何类型
	if len(info.DetectedTypes) == 0 {
		info.DetectedTypes = append(info.DetectedTypes, "Unknown")
	}

	// 检测已有的 agent
	for _, agent := range getAllAgentConfigs() {
		agentDir := filepath.Join(projectPath, agent.LocalPath)
		if dirInfo, err := os.Stat(agentDir); err == nil && dirInfo.IsDir() {
			info.ExistingAgents = append(info.ExistingAgents, agent.Name)
		}
	}

	return info, nil
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// updateSkillsLock 更新 .skills-lock 文件
func (ss *SkillsService) updateSkillsLock(skillsDir, skillName, source string) error {
	lockPath := filepath.Join(skillsDir, ".skills-lock")

	var lock SkillsLock

	// 读取现有的 lock 文件
	if data, err := os.ReadFile(lockPath); err == nil {
		lock, _ = unmarshalSkillsLock(data)
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

// RecommendedSkill 推荐技能
type RecommendedSkill struct {
	Name   string `json:"name"`
	Reason string `json:"reason"`
}

// GetRecommendations 根据已安装的技能推荐相关技能
func (ss *SkillsService) GetRecommendations() ([]RecommendedSkill, error) {
	skills, err := ss.GetAllAgentSkills()
	if err != nil {
		return nil, err
	}

	// 收集已安装的 skill 名称和标签
	installedNames := map[string]bool{}
	tagCounts := map[string]int{}
	for _, s := range skills {
		installedNames[s.Name] = true
		tags, _ := ss.GetSkillTags(s.Name)
		for _, t := range tags {
			tagCounts[t]++
		}
	}

	// 基于最常用的标签，搜索远程技能
	recommendations := []RecommendedSkill{}
	searchTerms := []string{}

	// 从标签中提取搜索词
	for tag, count := range tagCounts {
		if count >= 1 {
			searchTerms = append(searchTerms, tag)
		}
	}

	// 也从已安装技能的 framework/language 提取
	for _, s := range skills {
		if s.Language != "" && len(searchTerms) < 5 {
			searchTerms = append(searchTerms, s.Language)
		}
		if s.Framework != "" && len(searchTerms) < 5 {
			searchTerms = append(searchTerms, s.Framework)
		}
	}

	seen := map[string]bool{}
	for _, term := range searchTerms {
		if len(recommendations) >= 5 {
			break
		}
		remoteSkills, err := ss.FindRemoteSkills(term)
		if err != nil {
			continue
		}
		for _, rs := range remoteSkills {
			if installedNames[rs.Name] || seen[rs.FullName] {
				continue
			}
			seen[rs.FullName] = true
			recommendations = append(recommendations, RecommendedSkill{
				Name:   rs.FullName,
				Reason: fmt.Sprintf("Based on: %s", term),
			})
			if len(recommendations) >= 5 {
				break
			}
		}
	}

	return recommendations, nil
}

// AutoUpdateConfig 自动更新配置
type AutoUpdateConfig struct {
	Enabled       bool   `json:"enabled"`
	IntervalHours int    `json:"intervalHours"`
	LastCheck     string `json:"lastCheck"`
}

// GetAutoUpdateConfig 获取自动更新配置
func (ss *SkillsService) GetAutoUpdateConfig() (*AutoUpdateConfig, error) {
	configDir, err := getConfigDir()
	if err != nil {
		return &AutoUpdateConfig{Enabled: false, IntervalHours: 24}, nil
	}
	configPath := filepath.Join(configDir, "auto-update.json")

	data, err := os.ReadFile(configPath)
	if err != nil {
		return &AutoUpdateConfig{Enabled: false, IntervalHours: 24}, nil
	}

	var config AutoUpdateConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return &AutoUpdateConfig{Enabled: false, IntervalHours: 24}, nil
	}
	return &config, nil
}

// SetAutoUpdateConfig 设置自动更新配置
func (ss *SkillsService) SetAutoUpdateConfig(enabled bool, intervalHours int) error {
	configDir, err := getConfigDir()
	if err != nil {
		return err
	}
	os.MkdirAll(configDir, 0755)
	configPath := filepath.Join(configDir, "auto-update.json")

	config := AutoUpdateConfig{
		Enabled:       enabled,
		IntervalHours: intervalHours,
		LastCheck:     time.Now().Format(time.RFC3339),
	}

	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(configPath, data, 0644)
}

// ---- 收藏/置顶 ----

// FavoritesConfig 收藏配置
type FavoritesConfig struct {
	Favorites []string `json:"favorites"` // 收藏的 skill 名称列表
}

func getFavoritesFilePath() (string, error) {
	configDir, err := getConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(configDir, "favorites.json"), nil
}

func loadFavorites() (FavoritesConfig, error) {
	filePath, err := getFavoritesFilePath()
	if err != nil {
		return FavoritesConfig{}, err
	}
	data, err := os.ReadFile(filePath)
	if err != nil {
		return FavoritesConfig{}, nil
	}
	var config FavoritesConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return FavoritesConfig{}, nil
	}
	return config, nil
}

func saveFavorites(config FavoritesConfig) error {
	filePath, err := getFavoritesFilePath()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filePath, data, 0644)
}

// GetFavorites 获取收藏列表
func (ss *SkillsService) GetFavorites() ([]string, error) {
	config, err := loadFavorites()
	if err != nil {
		return []string{}, err
	}
	return config.Favorites, nil
}

// ToggleFavorite 切换收藏状态，返回新状态
func (ss *SkillsService) ToggleFavorite(skillName string) (bool, error) {
	config, err := loadFavorites()
	if err != nil {
		return false, err
	}
	found := false
	result := make([]string, 0, len(config.Favorites))
	for _, name := range config.Favorites {
		if name == skillName {
			found = true
			continue
		}
		result = append(result, name)
	}
	if !found {
		result = append([]string{skillName}, result...)
	}
	config.Favorites = result
	if err := saveFavorites(config); err != nil {
		return false, err
	}
	return !found, nil
}

// ---- 活动日志 ----

// ActivityLog 活动日志条目
type ActivityLog struct {
	ID        string `json:"id"`
	Action    string `json:"action"`    // install, delete, update, link, unlink, create, import, export, etc.
	SkillName string `json:"skillName"` // 相关 skill
	Detail    string `json:"detail"`    // 额外说明
	Timestamp string `json:"timestamp"`
}

// ActivityLogsConfig 活动日志配置
type ActivityLogsConfig struct {
	Logs []ActivityLog `json:"logs"`
}

func getActivityLogFilePath() (string, error) {
	configDir, err := getConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(configDir, "activity-log.json"), nil
}

func loadActivityLogs() (ActivityLogsConfig, error) {
	filePath, err := getActivityLogFilePath()
	if err != nil {
		return ActivityLogsConfig{}, err
	}
	data, err := os.ReadFile(filePath)
	if err != nil {
		return ActivityLogsConfig{}, nil
	}
	var config ActivityLogsConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return ActivityLogsConfig{}, nil
	}
	return config, nil
}

func saveActivityLogs(config ActivityLogsConfig) error {
	filePath, err := getActivityLogFilePath()
	if err != nil {
		return err
	}
	// 只保留最近 200 条
	if len(config.Logs) > 200 {
		config.Logs = config.Logs[:200]
	}
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filePath, data, 0644)
}

// AddActivityLog 记录一条活动日志
func (ss *SkillsService) AddActivityLog(action string, skillName string, detail string) error {
	config, err := loadActivityLogs()
	if err != nil {
		return err
	}
	log := ActivityLog{
		ID:        fmt.Sprintf("%d", time.Now().UnixNano()),
		Action:    action,
		SkillName: skillName,
		Detail:    detail,
		Timestamp: time.Now().Format(time.RFC3339),
	}
	config.Logs = append([]ActivityLog{log}, config.Logs...)
	return saveActivityLogs(config)
}

// GetActivityLogs 获取活动日志
func (ss *SkillsService) GetActivityLogs(limit int) ([]ActivityLog, error) {
	config, err := loadActivityLogs()
	if err != nil {
		return []ActivityLog{}, err
	}
	if limit > 0 && limit < len(config.Logs) {
		return config.Logs[:limit], nil
	}
	return config.Logs, nil
}

// ClearActivityLogs 清空活动日志
func (ss *SkillsService) ClearActivityLogs() error {
	return saveActivityLogs(ActivityLogsConfig{})
}

// ---- 技能预览（安装前预览） ----

// PreviewRemoteSkill 预览远程 skill 的 SKILL.md 内容（不安装）
func (ss *SkillsService) PreviewRemoteSkill(fullName string) (string, error) {
	parts := strings.Split(fullName, "@")
	if len(parts) != 2 {
		return "", fmt.Errorf("invalid skill name format: %s", fullName)
	}
	ownerRepo := parts[0]
	skillName := parts[1]

	// 尝试从 GitHub raw 获取 SKILL.md（不需要完整 clone）
	paths := []string{
		fmt.Sprintf("https://raw.githubusercontent.com/%s/main/skills/%s/SKILL.md", ownerRepo, skillName),
		fmt.Sprintf("https://raw.githubusercontent.com/%s/main/%s/SKILL.md", ownerRepo, skillName),
		fmt.Sprintf("https://raw.githubusercontent.com/%s/main/SKILL.md", ownerRepo),
	}

	for _, url := range paths {
		data, err := httpGet(url)
		if err == nil && len(data) > 0 {
			return string(data), nil
		}
	}

	return "", fmt.Errorf("could not fetch SKILL.md for %s", fullName)
}

// ---- 技能集合 ----

// SkillCollection 技能集合
type SkillCollection struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Skills      []string `json:"skills"` // fullName 列表 (owner/repo@name)
	CreatedAt   string   `json:"createdAt"`
}

// CollectionsConfig 集合配置
type CollectionsConfig struct {
	Collections []SkillCollection `json:"collections"`
}

func getCollectionsFilePath() (string, error) {
	configDir, err := getConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(configDir, "collections.json"), nil
}

func loadCollections() (CollectionsConfig, error) {
	filePath, err := getCollectionsFilePath()
	if err != nil {
		return CollectionsConfig{}, err
	}
	data, err := os.ReadFile(filePath)
	if err != nil {
		return CollectionsConfig{}, nil
	}
	var config CollectionsConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return CollectionsConfig{}, nil
	}
	return config, nil
}

func saveCollections(config CollectionsConfig) error {
	filePath, err := getCollectionsFilePath()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filePath, data, 0644)
}

// GetCollections 获取所有集合
func (ss *SkillsService) GetCollections() ([]SkillCollection, error) {
	config, err := loadCollections()
	if err != nil {
		return []SkillCollection{}, err
	}
	return config.Collections, nil
}

// CreateCollection 创建新集合
func (ss *SkillsService) CreateCollection(name string, description string, skills []string) error {
	if name == "" {
		return fmt.Errorf("collection name is required")
	}
	config, err := loadCollections()
	if err != nil {
		return err
	}
	for _, c := range config.Collections {
		if c.Name == name {
			return fmt.Errorf("collection already exists: %s", name)
		}
	}
	config.Collections = append(config.Collections, SkillCollection{
		Name:        name,
		Description: description,
		Skills:      skills,
		CreatedAt:   time.Now().Format(time.RFC3339),
	})
	return saveCollections(config)
}

// DeleteCollection 删除集合
func (ss *SkillsService) DeleteCollection(name string) error {
	config, err := loadCollections()
	if err != nil {
		return err
	}
	found := false
	result := make([]SkillCollection, 0, len(config.Collections))
	for _, c := range config.Collections {
		if c.Name == name {
			found = true
			continue
		}
		result = append(result, c)
	}
	if !found {
		return fmt.Errorf("collection not found: %s", name)
	}
	config.Collections = result
	return saveCollections(config)
}

// UpdateCollection 更新集合
func (ss *SkillsService) UpdateCollection(name string, description string, skills []string) error {
	config, err := loadCollections()
	if err != nil {
		return err
	}
	for i, c := range config.Collections {
		if c.Name == name {
			config.Collections[i].Description = description
			config.Collections[i].Skills = skills
			return saveCollections(config)
		}
	}
	return fmt.Errorf("collection not found: %s", name)
}

// InstallCollection 一键安装整个集合的所有 skills
func (ss *SkillsService) InstallCollection(name string, agents []string) (int, error) {
	config, err := loadCollections()
	if err != nil {
		return 0, err
	}
	var collection *SkillCollection
	for _, c := range config.Collections {
		if c.Name == name {
			collection = &c
			break
		}
	}
	if collection == nil {
		return 0, fmt.Errorf("collection not found: %s", name)
	}

	installed := 0
	for _, fullName := range collection.Skills {
		if err := ss.InstallRemoteSkill(fullName, agents); err != nil {
			continue
		}
		installed++
	}
	return installed, nil
}

// ---- 一键克隆项目配置 ----

// CloneProjectConfig 将一个项目的 skills 和 agent 配置复制到另一个项目
func (ss *SkillsService) CloneProjectConfig(sourcePath string, targetPath string) (int, error) {
	if sourcePath == "" || targetPath == "" {
		return 0, fmt.Errorf("source and target paths are required")
	}

	// 获取源项目的 skills
	sourceSkills, err := ss.GetProjectSkills(sourcePath)
	if err != nil {
		return 0, fmt.Errorf("failed to read source project: %v", err)
	}

	homeDir, _ := os.UserHomeDir()
	centralSkillsDir := filepath.Join(homeDir, ".agents", "skills")
	installed := 0

	for _, skill := range sourceSkills {
		// 获取这个 skill 在源项目中链接的 agents
		for _, agent := range getAllAgentConfigs() {
			agentSkillsDir := filepath.Join(targetPath, agent.LocalPath)
			targetSkillPath := filepath.Join(agentSkillsDir, skill.Name)

			// 检查源项目中是否存在
			sourceSkillPath := filepath.Join(sourcePath, agent.LocalPath, skill.Name)
			if _, err := os.Stat(sourceSkillPath); os.IsNotExist(err) {
				continue
			}

			// 确保目标目录存在
			if err := os.MkdirAll(agentSkillsDir, 0755); err != nil {
				continue
			}

			// 跳过已存在的
			if _, err := os.Lstat(targetSkillPath); err == nil {
				continue
			}

			if skill.IsGlobal {
				// 全局 skill：创建软链接
				globalPath := filepath.Join(centralSkillsDir, skill.Name)
				if err := os.Symlink(globalPath, targetSkillPath); err == nil {
					installed++
				}
			} else {
				// 本地 skill：复制
				if err := copyDir(sourceSkillPath, targetSkillPath); err == nil {
					installed++
				}
			}
		}
	}

	return installed, nil
}

// ---- 设置页 ----

// AppSettings 应用设置
type AppSettings struct {
	Theme           string   `json:"theme"`           // light, dark, system
	Language        string   `json:"language"`         // zh, en
	AutoUpdate      bool     `json:"autoUpdate"`
	UpdateInterval  int      `json:"updateInterval"`   // hours
	DefaultAgents   []string `json:"defaultAgents"`    // 默认安装到的 agents
	ShowPath        bool     `json:"showPath"`         // 卡片是否显示路径
	CompactMode     bool     `json:"compactMode"`      // 紧凑模式
}

func getSettingsFilePath() (string, error) {
	configDir, err := getConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(configDir, "settings.json"), nil
}

// GetSettings 获取应用设置
func (ss *SkillsService) GetSettings() (*AppSettings, error) {
	filePath, err := getSettingsFilePath()
	if err != nil {
		return defaultSettings(), nil
	}
	data, err := os.ReadFile(filePath)
	if err != nil {
		return defaultSettings(), nil
	}
	var settings AppSettings
	if err := json.Unmarshal(data, &settings); err != nil {
		return defaultSettings(), nil
	}
	return &settings, nil
}

// SaveSettings 保存应用设置
func (ss *SkillsService) SaveSettings(settingsJSON string) error {
	var settings AppSettings
	if err := json.Unmarshal([]byte(settingsJSON), &settings); err != nil {
		return fmt.Errorf("invalid settings format: %v", err)
	}
	filePath, err := getSettingsFilePath()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return err
	}
	// 同步自动更新配置
	ss.SetAutoUpdateConfig(settings.AutoUpdate, settings.UpdateInterval)
	return os.WriteFile(filePath, data, 0644)
}

func defaultSettings() *AppSettings {
	// 默认选中所有 agent
	allAgentNames := make([]string, 0)
	for _, agent := range getAllAgentConfigs() {
		allAgentNames = append(allAgentNames, agent.Name)
	}
	return &AppSettings{
		Theme:          "light",
		Language:       "zh",
		AutoUpdate:     false,
		UpdateInterval: 24,
		DefaultAgents:  allAgentNames,
		ShowPath:       true,
		CompactMode:    false,
	}
}

// RunAutoUpdate 执行自动更新检查并更新
func (ss *SkillsService) RunAutoUpdate() (int, error) {
	config, err := ss.GetAutoUpdateConfig()
	if err != nil || !config.Enabled {
		return 0, nil
	}

	updates, err := ss.CheckSkillUpdates()
	if err != nil {
		return 0, err
	}

	updated := 0
	for _, u := range updates {
		if u.HasUpdate {
			if err := ss.UpdateSkill(u.Name); err == nil {
				updated++
			}
		}
	}

	// 更新 lastCheck 时间
	ss.SetAutoUpdateConfig(config.Enabled, config.IntervalHours)

	return updated, nil
}

// CompareSkills 对比两个技能的信息
func (ss *SkillsService) CompareSkills(name1 string, name2 string) (*CompareResult, error) {
	buildInfo := func(name string) (SkillCompareInfo, error) {
		detail, err := ss.GetSkillDetail(name)
		if err != nil {
			return SkillCompareInfo{}, err
		}
		tags, _ := ss.GetSkillTags(name)
		files, _ := ss.GetSkillFiles(name)

		var totalSize int64
		fileCount := 0
		for _, f := range files {
			if !f.IsDir {
				fileCount++
				totalSize += f.Size
			}
		}

		rating := &SkillRating{}
		ratingConfig, _ := loadRatings()
		if r, ok := ratingConfig.Ratings[name]; ok {
			rating = &r
		}

		return SkillCompareInfo{
			Name:      detail.Name,
			Desc:      detail.Desc,
			Language:  detail.Language,
			Framework: detail.Framework,
			Agents:    detail.Agents,
			Source:    detail.Source,
			Tags:      tags,
			Rating:    rating.Rating,
			Note:      rating.Note,
			FileCount: fileCount,
			TotalSize: totalSize,
			Content:   detail.Content,
		}, nil
	}

	info1, err := buildInfo(name1)
	if err != nil {
		return nil, fmt.Errorf("failed to load skill 1: %v", err)
	}
	info2, err := buildInfo(name2)
	if err != nil {
		return nil, fmt.Errorf("failed to load skill 2: %v", err)
	}

	return &CompareResult{Skill1: info1, Skill2: info2}, nil
}

// GitHubRepoSkill 从 GitHub 仓库解析出的技能
type GitHubRepoSkill struct {
	Name     string `json:"name"`
	FullName string `json:"fullName"`
	Desc     string `json:"desc"`
}

// ScanGitHubRepo 扫描 GitHub 仓库中的所有技能
func (ss *SkillsService) ScanGitHubRepo(repoURL string) ([]GitHubRepoSkill, error) {
	if repoURL == "" {
		return nil, fmt.Errorf("repository URL is required")
	}

	// 提取 owner/repo
	ownerRepo := repoURL
	// 处理完整 URL
	for _, prefix := range []string{"https://github.com/", "http://github.com/", "github.com/"} {
		if len(ownerRepo) > len(prefix) && ownerRepo[:len(prefix)] == prefix {
			ownerRepo = ownerRepo[len(prefix):]
		}
	}
	ownerRepo = strings.TrimSuffix(ownerRepo, ".git")
	ownerRepo = strings.TrimSuffix(ownerRepo, "/")

	parts := strings.Split(ownerRepo, "/")
	if len(parts) < 2 {
		return nil, fmt.Errorf("invalid repository URL: %s", repoURL)
	}
	ownerRepo = parts[0] + "/" + parts[1]

	// 克隆仓库
	tempDir := filepath.Join(os.TempDir(), "skills-scan-"+parts[1])
	os.RemoveAll(tempDir)
	defer os.RemoveAll(tempDir)

	cloneOutput, err := gitClone(fmt.Sprintf("https://github.com/%s.git", ownerRepo), tempDir)
	if err != nil {
		return nil, fmt.Errorf("failed to clone repository: %v\n%s", err, string(cloneOutput))
	}

	var skills []GitHubRepoSkill

	// 扫描 skills/ 目录
	skillsDir := filepath.Join(tempDir, "skills")
	if entries, err := os.ReadDir(skillsDir); err == nil {
		for _, entry := range entries {
			if !entry.IsDir() || strings.HasPrefix(entry.Name(), ".") {
				continue
			}
			skillPath := filepath.Join(skillsDir, entry.Name())
			if hasSkillMd(skillPath) {
				content, _ := os.ReadFile(filepath.Join(skillPath, "SKILL.md"))
				parsed := parseSkillMd(string(content), skillPath)
				skills = append(skills, GitHubRepoSkill{
					Name:     entry.Name(),
					FullName: fmt.Sprintf("%s@%s", ownerRepo, entry.Name()),
					Desc:     parsed.Desc,
				})
			}
		}
	}

	// 如果 skills/ 目录为空，检查根目录
	if len(skills) == 0 && hasSkillMd(tempDir) {
		content, _ := os.ReadFile(filepath.Join(tempDir, "SKILL.md"))
		parsed := parseSkillMd(string(content), tempDir)
		repoName := parts[1]
		skills = append(skills, GitHubRepoSkill{
			Name:     repoName,
			FullName: fmt.Sprintf("%s@%s", ownerRepo, repoName),
			Desc:     parsed.Desc,
		})
	}

	// 也扫描根目录下的直接子目录
	if len(skills) == 0 {
		if entries, err := os.ReadDir(tempDir); err == nil {
			for _, entry := range entries {
				if !entry.IsDir() || strings.HasPrefix(entry.Name(), ".") {
					continue
				}
				dirPath := filepath.Join(tempDir, entry.Name())
				if hasSkillMd(dirPath) {
					content, _ := os.ReadFile(filepath.Join(dirPath, "SKILL.md"))
					parsed := parseSkillMd(string(content), dirPath)
					skills = append(skills, GitHubRepoSkill{
						Name:     entry.Name(),
						FullName: fmt.Sprintf("%s@%s", ownerRepo, entry.Name()),
						Desc:     parsed.Desc,
					})
				}
			}
		}
	}

	return skills, nil
}

// BatchInstallFromRepo 批量从仓库安装选中的技能
func (ss *SkillsService) BatchInstallFromRepo(fullNames []string, agents []string) (int, error) {
	installed := 0
	for _, fullName := range fullNames {
		if err := ss.InstallRemoteSkill(fullName, agents); err != nil {
			continue
		}
		installed++
	}
	return installed, nil
}
