package services

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

// ProfileService 管理 Agent 配置方案
type ProfileService struct {
	ctx           context.Context
	skillsService *SkillsService
}

func NewProfileService(ss *SkillsService) *ProfileService {
	return &ProfileService{skillsService: ss}
}

func (ps *ProfileService) Startup(ctx context.Context) {
	ps.ctx = ctx
}

// Profile 配置方案
type Profile struct {
	Name        string            `json:"name"`
	Description string            `json:"description"`
	AgentSkills map[string][]string `json:"agentSkills"` // agent name -> skill names
	CreatedAt   string            `json:"createdAt"`
	UpdatedAt   string            `json:"updatedAt"`
}

// ProfilesConfig 配置方案列表
type ProfilesConfig struct {
	Profiles []Profile `json:"profiles"`
	Active   string    `json:"active"` // 当前激活的方案名
}

func getProfilesFilePath() (string, error) {
	configDir, err := getConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(configDir, "profiles.json"), nil
}

func loadProfiles() (ProfilesConfig, error) {
	filePath, err := getProfilesFilePath()
	if err != nil {
		return ProfilesConfig{}, err
	}
	data, err := os.ReadFile(filePath)
	if err != nil {
		return ProfilesConfig{}, nil
	}
	var config ProfilesConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return ProfilesConfig{}, nil
	}
	return config, nil
}

func saveProfiles(config ProfilesConfig) error {
	filePath, err := getProfilesFilePath()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filePath, data, 0644)
}

// GetProfiles 获取所有配置方案
func (ps *ProfileService) GetProfiles() (ProfilesConfig, error) {
	return loadProfiles()
}

// SaveCurrentAsProfile 将当前的 agent-skill 链接状态保存为配置方案
func (ps *ProfileService) SaveCurrentAsProfile(name string, description string) error {
	if name == "" {
		return fmt.Errorf("profile name is required")
	}

	config, err := loadProfiles()
	if err != nil {
		return err
	}

	// 检查重名
	for _, p := range config.Profiles {
		if p.Name == name {
			return fmt.Errorf("profile already exists: %s", name)
		}
	}

	// 获取当前所有 skill 的 agent 链接状态
	skills, err := ps.skillsService.GetAllAgentSkills()
	if err != nil {
		return err
	}

	agentSkills := make(map[string][]string)
	for _, skill := range skills {
		for _, agent := range skill.Agents {
			agentSkills[agent] = append(agentSkills[agent], skill.Name)
		}
	}

	now := time.Now().Format(time.RFC3339)
	config.Profiles = append(config.Profiles, Profile{
		Name:        name,
		Description: description,
		AgentSkills: agentSkills,
		CreatedAt:   now,
		UpdatedAt:   now,
	})

	return saveProfiles(config)
}

// ApplyProfile 应用配置方案 - 重新配置所有 agent-skill 链接
func (ps *ProfileService) ApplyProfile(name string) error {
	config, err := loadProfiles()
	if err != nil {
		return err
	}

	var profile *Profile
	for _, p := range config.Profiles {
		if p.Name == name {
			profile = &p
			break
		}
	}
	if profile == nil {
		return fmt.Errorf("profile not found: %s", name)
	}

	// 反转映射: skill -> agents
	skillAgents := make(map[string][]string)
	for agent, skills := range profile.AgentSkills {
		for _, skill := range skills {
			skillAgents[skill] = append(skillAgents[skill], agent)
		}
	}

	// 获取当前所有 skill
	allSkills, err := ps.skillsService.GetAllAgentSkills()
	if err != nil {
		return err
	}

	// 对每个已安装的 skill，更新其 agent 链接
	for _, skill := range allSkills {
		targetAgents := skillAgents[skill.Name]
		if targetAgents == nil {
			targetAgents = []string{}
		}
		ps.skillsService.UpdateSkillAgentLinks(skill.Name, targetAgents)
	}

	// 更新激活状态
	config.Active = name
	return saveProfiles(config)
}

// DeleteProfile 删除配置方案
func (ps *ProfileService) DeleteProfile(name string) error {
	config, err := loadProfiles()
	if err != nil {
		return err
	}

	found := false
	result := make([]Profile, 0, len(config.Profiles))
	for _, p := range config.Profiles {
		if p.Name == name {
			found = true
			continue
		}
		result = append(result, p)
	}
	if !found {
		return fmt.Errorf("profile not found: %s", name)
	}
	config.Profiles = result
	if config.Active == name {
		config.Active = ""
	}
	return saveProfiles(config)
}

// UpdateProfile 更新配置方案（重新快照当前状态）
func (ps *ProfileService) UpdateProfile(name string) error {
	config, err := loadProfiles()
	if err != nil {
		return err
	}

	idx := -1
	for i, p := range config.Profiles {
		if p.Name == name {
			idx = i
			break
		}
	}
	if idx == -1 {
		return fmt.Errorf("profile not found: %s", name)
	}

	skills, err := ps.skillsService.GetAllAgentSkills()
	if err != nil {
		return err
	}

	agentSkills := make(map[string][]string)
	for _, skill := range skills {
		for _, agent := range skill.Agents {
			agentSkills[agent] = append(agentSkills[agent], skill.Name)
		}
	}

	config.Profiles[idx].AgentSkills = agentSkills
	config.Profiles[idx].UpdatedAt = time.Now().Format(time.RFC3339)
	return saveProfiles(config)
}
