package services

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// ProviderConfig 供应商配置
type ProviderConfig struct {
	ID        string            `json:"id"`
	Name      string            `json:"name"`
	AppType   string            `json:"appType"`
	APIKey    string            `json:"apiKey"`
	BaseURL   string            `json:"baseUrl"`
	Models    map[string]string `json:"models"`
	Note      string            `json:"note"`
	WebURL    string            `json:"webUrl"`
	APIFormat string            `json:"apiFormat"` // "anthropic" | "openai" (Claude Code only)
	AuthField string            `json:"authField"` // "auth_token" | "api_key" (Claude Code only)
	PresetID  string            `json:"presetId"`
	CreatedAt string            `json:"createdAt"`
	UpdatedAt string            `json:"updatedAt"`
}

// ProvidersData 供应商数据文件结构
type ProvidersData struct {
	Providers []ProviderConfig  `json:"providers"`
	ActiveMap map[string]string `json:"activeMap"`
}

// ProviderTestResult API 连通性测试结果
type ProviderTestResult struct {
	OK      bool   `json:"ok"`
	Latency int64  `json:"latency"`
	Error   string `json:"error"`
}

// ProviderService 供应商配置管理服务
type ProviderService struct {
	ctx  context.Context
	mu   sync.RWMutex
	data ProvidersData
}

func NewProviderService() *ProviderService {
	return &ProviderService{
		data: ProvidersData{
			Providers: []ProviderConfig{},
			ActiveMap: map[string]string{},
		},
	}
}

func (ps *ProviderService) Startup(ctx context.Context) {
	ps.ctx = ctx
	ps.loadData()
}

// --- Data persistence ---

func (ps *ProviderService) dataFilePath() (string, error) {
	configDir, err := getConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(configDir, "providers.json"), nil
}

func (ps *ProviderService) loadData() {
	fp, err := ps.dataFilePath()
	if err != nil {
		return
	}
	raw, err := os.ReadFile(fp)
	if err != nil {
		return
	}
	var data ProvidersData
	if err := json.Unmarshal(raw, &data); err != nil {
		return
	}
	if data.Providers == nil {
		data.Providers = []ProviderConfig{}
	}
	if data.ActiveMap == nil {
		data.ActiveMap = map[string]string{}
	}
	ps.mu.Lock()
	ps.data = data
	ps.mu.Unlock()
}

func (ps *ProviderService) saveData() error {
	fp, err := ps.dataFilePath()
	if err != nil {
		return err
	}
	ps.mu.RLock()
	raw, err := json.MarshalIndent(ps.data, "", "  ")
	ps.mu.RUnlock()
	if err != nil {
		return err
	}
	return os.WriteFile(fp, raw, 0644)
}

// --- CRUD ---

// GetAllProviders 返回所有供应商配置
func (ps *ProviderService) GetAllProviders() ProvidersData {
	ps.mu.RLock()
	defer ps.mu.RUnlock()
	return ps.data
}

// AddProvider 添加供应商配置
func (ps *ProviderService) AddProvider(configJSON string) (ProviderConfig, error) {
	var cfg ProviderConfig
	if err := json.Unmarshal([]byte(configJSON), &cfg); err != nil {
		return ProviderConfig{}, fmt.Errorf("invalid config: %w", err)
	}
	if cfg.Name == "" || cfg.AppType == "" || cfg.APIKey == "" {
		return ProviderConfig{}, fmt.Errorf("name, appType, and apiKey are required")
	}
	now := time.Now().Format(time.RFC3339)
	cfg.ID = fmt.Sprintf("%s-%d", cfg.AppType, time.Now().UnixMilli())
	cfg.CreatedAt = now
	cfg.UpdatedAt = now
	if cfg.Models == nil {
		cfg.Models = map[string]string{}
	}

	ps.mu.Lock()
	ps.data.Providers = append(ps.data.Providers, cfg)
	ps.mu.Unlock()

	if err := ps.saveData(); err != nil {
		return ProviderConfig{}, fmt.Errorf("failed to save: %w", err)
	}
	return cfg, nil
}

// UpdateProvider 更新供应商配置
func (ps *ProviderService) UpdateProvider(configJSON string) error {
	var cfg ProviderConfig
	if err := json.Unmarshal([]byte(configJSON), &cfg); err != nil {
		return fmt.Errorf("invalid config: %w", err)
	}

	ps.mu.Lock()
	found := false
	for i, p := range ps.data.Providers {
		if p.ID == cfg.ID {
			cfg.CreatedAt = p.CreatedAt
			cfg.UpdatedAt = time.Now().Format(time.RFC3339)
			if cfg.Models == nil {
				cfg.Models = map[string]string{}
			}
			ps.data.Providers[i] = cfg
			found = true
			break
		}
	}
	ps.mu.Unlock()

	if !found {
		return fmt.Errorf("provider not found: %s", cfg.ID)
	}
	return ps.saveData()
}

// DeleteProvider 删除供应商配置
func (ps *ProviderService) DeleteProvider(id string) error {
	ps.mu.Lock()
	newList := make([]ProviderConfig, 0, len(ps.data.Providers))
	for _, p := range ps.data.Providers {
		if p.ID != id {
			newList = append(newList, p)
		}
	}
	ps.data.Providers = newList
	for k, v := range ps.data.ActiveMap {
		if v == id {
			delete(ps.data.ActiveMap, k)
		}
	}
	ps.mu.Unlock()
	return ps.saveData()
}

// --- Switch / Activate ---

// SwitchProvider 切换激活供应商，将配置写入对应 Agent 配置文件
func (ps *ProviderService) SwitchProvider(id string) error {
	ps.mu.RLock()
	var target *ProviderConfig
	for i := range ps.data.Providers {
		if ps.data.Providers[i].ID == id {
			cfg := ps.data.Providers[i]
			target = &cfg
			break
		}
	}
	ps.mu.RUnlock()

	if target == nil {
		return fmt.Errorf("provider not found: %s", id)
	}

	var err error
	switch target.AppType {
	case "claude-code":
		err = ps.writeClaudeCodeConfig(target)
	case "codex":
		err = ps.writeCodexConfig(target)
	case "gemini-cli":
		err = ps.writeGeminiConfig(target)
	case "codebuddy-cli":
		err = ps.writeCodeBuddyConfig(target)
	case "opencode":
		err = ps.writeOpenCodeConfig(target)
	default:
		return fmt.Errorf("unknown app type: %s", target.AppType)
	}

	if err != nil {
		return err
	}

	ps.mu.Lock()
	ps.data.ActiveMap[target.AppType] = id
	ps.mu.Unlock()
	return ps.saveData()
}

// DeactivateProvider 取消激活
func (ps *ProviderService) DeactivateProvider(appType string) error {
	ps.mu.Lock()
	delete(ps.data.ActiveMap, appType)
	ps.mu.Unlock()
	return ps.saveData()
}

// DetectActiveProviders 检测当前各 Agent 配置文件中的激活状态
func (ps *ProviderService) DetectActiveProviders() map[string]string {
	ps.mu.RLock()
	providers := make([]ProviderConfig, len(ps.data.Providers))
	copy(providers, ps.data.Providers)
	ps.mu.RUnlock()

	result := map[string]string{}

	claudeKey := ps.readClaudeCodeAPIKey()
	if claudeKey != "" {
		for _, p := range providers {
			if p.AppType == "claude-code" && p.APIKey == claudeKey {
				result["claude-code"] = p.ID
				break
			}
		}
	}

	codexKey := ps.readCodexAPIKey()
	if codexKey != "" {
		for _, p := range providers {
			if p.AppType == "codex" && p.APIKey == codexKey {
				result["codex"] = p.ID
				break
			}
		}
	}

	geminiKey := ps.readGeminiAPIKey()
	if geminiKey != "" {
		for _, p := range providers {
			if p.AppType == "gemini-cli" && p.APIKey == geminiKey {
				result["gemini-cli"] = p.ID
				break
			}
		}
	}

	codebuddyModel := ps.readCodeBuddyActiveModel()
	if codebuddyModel != "" {
		for _, p := range providers {
			if p.AppType == "codebuddy-cli" {
				mid := p.Models["modelId"]
				if mid == "" {
					mid = p.Name
				}
				if mid == codebuddyModel {
					result["codebuddy-cli"] = p.ID
					break
				}
			}
		}
	}

	opencodeKey := ps.readOpenCodeAPIKey()
	if opencodeKey != "" {
		for _, p := range providers {
			if p.AppType == "opencode" && p.APIKey == opencodeKey {
				result["opencode"] = p.ID
				break
			}
		}
	}

	ps.mu.Lock()
	ps.data.ActiveMap = result
	ps.mu.Unlock()
	_ = ps.saveData()

	return result
}

// --- Agent config file readers ---

func (ps *ProviderService) readClaudeCodeAPIKey() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	fp := filepath.Join(homeDir, ".claude", "settings.json")
	raw, err := os.ReadFile(fp)
	if err != nil {
		return ""
	}
	var settings map[string]interface{}
	if err := json.Unmarshal(raw, &settings); err != nil {
		return ""
	}
	env, ok := settings["env"].(map[string]interface{})
	if !ok {
		return ""
	}
	if v, ok := env["ANTHROPIC_AUTH_TOKEN"].(string); ok && v != "" {
		return v
	}
	if v, ok := env["ANTHROPIC_API_KEY"].(string); ok && v != "" {
		return v
	}
	if v, ok := env["OPENAI_API_KEY"].(string); ok && v != "" {
		return v
	}
	return ""
}

func (ps *ProviderService) readCodexAPIKey() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	fp := filepath.Join(homeDir, ".codex", "auth.json")
	raw, err := os.ReadFile(fp)
	if err != nil {
		return ""
	}
	var auth map[string]interface{}
	if err := json.Unmarshal(raw, &auth); err != nil {
		return ""
	}
	if v, ok := auth["token"].(string); ok && v != "" {
		return v
	}
	if v, ok := auth["OPENAI_API_KEY"].(string); ok && v != "" {
		return v
	}
	return ""
}

func (ps *ProviderService) readGeminiAPIKey() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	fp := filepath.Join(homeDir, ".gemini", ".env")
	raw, err := os.ReadFile(fp)
	if err != nil {
		return ""
	}
	for _, line := range strings.Split(string(raw), "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "GEMINI_API_KEY=") {
			return strings.TrimPrefix(line, "GEMINI_API_KEY=")
		}
	}
	return ""
}

// --- Agent config file writers ---

func (ps *ProviderService) writeClaudeCodeConfig(cfg *ProviderConfig) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	dir := filepath.Join(homeDir, ".claude")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	fp := filepath.Join(dir, "settings.json")

	settings := map[string]interface{}{}
	if raw, err := os.ReadFile(fp); err == nil {
		_ = json.Unmarshal(raw, &settings)
	}

	env, ok := settings["env"].(map[string]interface{})
	if !ok {
		env = map[string]interface{}{}
	}

	apiFormat := cfg.APIFormat
	if apiFormat == "" {
		apiFormat = "anthropic"
	}

	// Clean up all provider-related env vars first to avoid stale values
	keysToClean := []string{
		"ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL",
		"ANTHROPIC_MODEL", "ANTHROPIC_SMALL_FAST_MODEL",
		"ANTHROPIC_DEFAULT_HAIKU_MODEL", "ANTHROPIC_DEFAULT_SONNET_MODEL", "ANTHROPIC_DEFAULT_OPUS_MODEL",
		"OPENAI_API_KEY", "OPENAI_BASE_URL",
		"CLAUDE_CODE_USE_BEDROCK", "ANTHROPIC_BEDROCK_BASE_URL",
		"AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION",
	}
	for _, k := range keysToClean {
		delete(env, k)
	}

	if apiFormat == "openai" {
		// OpenAI compatible mode: use OPENAI_API_KEY + OPENAI_BASE_URL
		env["OPENAI_API_KEY"] = cfg.APIKey
		if cfg.BaseURL != "" {
			env["OPENAI_BASE_URL"] = cfg.BaseURL
		}
	} else {
		// Native Anthropic mode
		authField := cfg.AuthField
		if authField == "" {
			authField = "auth_token"
		}
		if authField == "auth_token" {
			env["ANTHROPIC_AUTH_TOKEN"] = cfg.APIKey
		} else {
			env["ANTHROPIC_API_KEY"] = cfg.APIKey
		}
		if cfg.BaseURL != "" {
			env["ANTHROPIC_BASE_URL"] = cfg.BaseURL
		}
	}

	// Handle model settings
	if v, ok := cfg.Models["main"]; ok && v != "" {
		env["ANTHROPIC_MODEL"] = v
	}
	if v, ok := cfg.Models["thinking"]; ok && v != "" {
		env["ANTHROPIC_SMALL_FAST_MODEL"] = v
	}
	if v, ok := cfg.Models["haiku"]; ok && v != "" {
		env["ANTHROPIC_DEFAULT_HAIKU_MODEL"] = v
	}
	if v, ok := cfg.Models["sonnet"]; ok && v != "" {
		env["ANTHROPIC_DEFAULT_SONNET_MODEL"] = v
	}
	if v, ok := cfg.Models["opus"]; ok && v != "" {
		env["ANTHROPIC_DEFAULT_OPUS_MODEL"] = v
	}

	settings["env"] = env
	raw, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(fp, raw, 0644)
}

func (ps *ProviderService) writeCodexConfig(cfg *ProviderConfig) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	dir := filepath.Join(homeDir, ".codex")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	// Write auth.json
	authFP := filepath.Join(dir, "auth.json")
	auth := map[string]interface{}{}
	if raw, err := os.ReadFile(authFP); err == nil {
		_ = json.Unmarshal(raw, &auth)
	}
	auth["token"] = cfg.APIKey
	auth["OPENAI_API_KEY"] = cfg.APIKey
	raw, err := json.MarshalIndent(auth, "", "  ")
	if err != nil {
		return err
	}
	if err := os.WriteFile(authFP, raw, 0644); err != nil {
		return err
	}

	// Write config.toml — update provider-related keys while preserving other settings
	configFP := filepath.Join(dir, "config.toml")
	existing := ""
	if data, err := os.ReadFile(configFP); err == nil {
		existing = string(data)
	}

	// Keys managed by provider switching
	codexKeysToManage := map[string]bool{
		"model":          true,
		"model_provider": true,
		"base_url":       true,
	}

	// Build new values
	newValues := map[string]string{}
	if cfg.BaseURL != "" {
		newValues["base_url"] = cfg.BaseURL
	}
	if model, ok := cfg.Models["model"]; ok && model != "" {
		newValues["model"] = model
	}
	// If base_url is set, it's a third-party provider → set model_provider = "openai"
	if cfg.BaseURL != "" {
		newValues["model_provider"] = "openai"
	}

	// Parse existing lines, removing managed keys
	var resultLines []string
	for _, line := range strings.Split(existing, "\n") {
		trimmed := strings.TrimSpace(line)
		key := ""
		if idx := strings.Index(trimmed, "="); idx > 0 {
			key = strings.TrimSpace(trimmed[:idx])
		}
		if key != "" && codexKeysToManage[key] {
			continue // skip, will re-add below
		}
		resultLines = append(resultLines, line)
	}

	// Remove trailing empty lines
	for len(resultLines) > 0 && strings.TrimSpace(resultLines[len(resultLines)-1]) == "" {
		resultLines = resultLines[:len(resultLines)-1]
	}

	// Append new values
	for _, key := range []string{"model", "model_provider", "base_url"} {
		if val, ok := newValues[key]; ok {
			resultLines = append(resultLines, fmt.Sprintf("%s = \"%s\"", key, val))
		}
	}

	content := strings.Join(resultLines, "\n")
	if !strings.HasSuffix(content, "\n") {
		content += "\n"
	}
	return os.WriteFile(configFP, []byte(content), 0644)
}

func (ps *ProviderService) writeGeminiConfig(cfg *ProviderConfig) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	dir := filepath.Join(homeDir, ".gemini")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	envFP := filepath.Join(dir, ".env")
	existing := ""
	if raw, err := os.ReadFile(envFP); err == nil {
		existing = string(raw)
	}

	envMap := map[string]string{}
	var otherLines []string
	for _, line := range strings.Split(existing, "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			otherLines = append(otherLines, line)
			continue
		}
		parts := strings.SplitN(trimmed, "=", 2)
		if len(parts) == 2 {
			envMap[parts[0]] = parts[1]
		} else {
			otherLines = append(otherLines, line)
		}
	}

	envMap["GEMINI_API_KEY"] = cfg.APIKey
	if cfg.BaseURL != "" {
		envMap["GOOGLE_GEMINI_BASE_URL"] = cfg.BaseURL
	} else {
		delete(envMap, "GOOGLE_GEMINI_BASE_URL")
	}
	if model, ok := cfg.Models["model"]; ok && model != "" {
		envMap["GEMINI_MODEL"] = model
	} else {
		delete(envMap, "GEMINI_MODEL")
	}

	var result []string
	result = append(result, otherLines...)
	for k, v := range envMap {
		result = append(result, fmt.Sprintf("%s=%s", k, v))
	}
	content := strings.Join(result, "\n")
	if !strings.HasSuffix(content, "\n") {
		content += "\n"
	}
	if err := os.WriteFile(envFP, []byte(content), 0644); err != nil {
		return err
	}

	settingsFP := filepath.Join(dir, "settings.json")
	settings := map[string]interface{}{}
	if raw, err := os.ReadFile(settingsFP); err == nil {
		_ = json.Unmarshal(raw, &settings)
	}
	settings["selectedAuthType"] = "api-key"
	sRaw, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(settingsFP, sRaw, 0644)
}

func (ps *ProviderService) writeCodeBuddyConfig(cfg *ProviderConfig) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	dir := filepath.Join(homeDir, ".codebuddy")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	modelID := cfg.Models["modelId"]
	if modelID == "" {
		modelID = cfg.Name
	}

	// Determine if this is a built-in model switch (no apiKey/url) or custom model
	isCustomModel := cfg.APIKey != "" || cfg.Models["url"] != "" || cfg.BaseURL != ""

	// For custom models: write models.json
	if isCustomModel {
		if err := ps.writeCodeBuddyModelsJSON(cfg, modelID); err != nil {
			return err
		}
	}

	// Always: update settings.json "model" field
	return ps.writeCodeBuddySettingsModel(modelID)
}

// writeCodeBuddySettingsModel updates the "model" field in ~/.codebuddy/settings.json
func (ps *ProviderService) writeCodeBuddySettingsModel(modelID string) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	fp := filepath.Join(homeDir, ".codebuddy", "settings.json")

	settings := map[string]interface{}{}
	if raw, err := os.ReadFile(fp); err == nil {
		_ = json.Unmarshal(raw, &settings)
	}
	settings["model"] = modelID

	raw, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(fp, raw, 0644)
}

// writeCodeBuddyModelsJSON writes custom model entry into ~/.codebuddy/models.json
func (ps *ProviderService) writeCodeBuddyModelsJSON(cfg *ProviderConfig, modelID string) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	fp := filepath.Join(homeDir, ".codebuddy", "models.json")

	// Read existing models.json
	var fileData map[string]interface{}
	if raw, err := os.ReadFile(fp); err == nil {
		_ = json.Unmarshal(raw, &fileData)
	}
	if fileData == nil {
		fileData = map[string]interface{}{}
	}

	// Parse existing models array
	var existingModels []map[string]interface{}
	if arr, ok := fileData["models"].([]interface{}); ok {
		for _, item := range arr {
			if m, ok := item.(map[string]interface{}); ok {
				existingModels = append(existingModels, m)
			}
		}
	}

	// Build new model entry from ProviderConfig
	newModel := map[string]interface{}{
		"id":   modelID,
		"name": cfg.Name,
	}
	if cfg.APIKey != "" {
		newModel["apiKey"] = cfg.APIKey
	}
	if v := cfg.Models["vendor"]; v != "" {
		newModel["vendor"] = v
	}
	if v := cfg.Models["url"]; v != "" {
		newModel["url"] = v
	} else if cfg.BaseURL != "" {
		newModel["url"] = cfg.BaseURL
	}
	if v := cfg.Models["maxInputTokens"]; v != "" {
		if n, err := parseIntSafe(v); err == nil {
			newModel["maxInputTokens"] = n
		}
	}
	if v := cfg.Models["maxOutputTokens"]; v != "" {
		if n, err := parseIntSafe(v); err == nil {
			newModel["maxOutputTokens"] = n
		}
	}
	if v := cfg.Models["temperature"]; v != "" {
		if f, err := parseFloatSafe(v); err == nil {
			newModel["temperature"] = f
		}
	}
	if v := cfg.Models["supportsToolCall"]; v == "true" {
		newModel["supportsToolCall"] = true
	}
	if v := cfg.Models["supportsImages"]; v == "true" {
		newModel["supportsImages"] = true
	}
	if v := cfg.Models["supportsReasoning"]; v == "true" {
		newModel["supportsReasoning"] = true
	}

	// Replace existing model with same ID or append
	found := false
	for i, m := range existingModels {
		if mid, _ := m["id"].(string); mid == modelID {
			existingModels[i] = newModel
			found = true
			break
		}
	}
	if !found {
		existingModels = append(existingModels, newModel)
	}

	// Update availableModels
	var availableModels []string
	if arr, ok := fileData["availableModels"].([]interface{}); ok {
		for _, item := range arr {
			if s, ok := item.(string); ok {
				availableModels = append(availableModels, s)
			}
		}
	}
	hasModelID := false
	for _, s := range availableModels {
		if s == modelID {
			hasModelID = true
			break
		}
	}
	if !hasModelID {
		availableModels = append(availableModels, modelID)
	}

	// Write back
	modelsArr := make([]interface{}, len(existingModels))
	for i, m := range existingModels {
		modelsArr[i] = m
	}
	fileData["models"] = modelsArr
	fileData["availableModels"] = availableModels

	raw, err := json.MarshalIndent(fileData, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(fp, raw, 0644)
}

// GetCodeBuddyActiveModel returns the current active model from ~/.codebuddy/settings.json (exposed to frontend)
func (ps *ProviderService) GetCodeBuddyActiveModel() string {
	return ps.readCodeBuddyActiveModel()
}

// SwitchCodeBuddyBuiltinModel switches the built-in model by updating settings.json directly (no provider record needed)
func (ps *ProviderService) SwitchCodeBuddyBuiltinModel(modelID string) error {
	if modelID == "" {
		return fmt.Errorf("modelID is required")
	}
	return ps.writeCodeBuddySettingsModel(modelID)
}

// readCodeBuddyActiveModel reads the "model" field from ~/.codebuddy/settings.json
func (ps *ProviderService) readCodeBuddyActiveModel() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	fp := filepath.Join(homeDir, ".codebuddy", "settings.json")
	raw, err := os.ReadFile(fp)
	if err != nil {
		return ""
	}
	var settings map[string]interface{}
	if err := json.Unmarshal(raw, &settings); err != nil {
		return ""
	}
	if v, ok := settings["model"].(string); ok {
		return v
	}
	return ""
}

// readOpenCodeAPIKey reads the API key from ~/.config/opencode/opencode.json
func (ps *ProviderService) readOpenCodeAPIKey() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	fp := filepath.Join(homeDir, ".config", "opencode", "opencode.json")
	raw, err := os.ReadFile(fp)
	if err != nil {
		return ""
	}
	var config map[string]interface{}
	if err := json.Unmarshal(raw, &config); err != nil {
		return ""
	}
	providerMap, ok := config["provider"].(map[string]interface{})
	if !ok {
		return ""
	}
	// Check each provider for an apiKey in options
	for _, pv := range providerMap {
		provObj, ok := pv.(map[string]interface{})
		if !ok {
			continue
		}
		opts, ok := provObj["options"].(map[string]interface{})
		if !ok {
			continue
		}
		if key, ok := opts["apiKey"].(string); ok && key != "" {
			return key
		}
	}
	return ""
}

// writeOpenCodeConfig writes provider configuration to ~/.config/opencode/opencode.json
func (ps *ProviderService) writeOpenCodeConfig(cfg *ProviderConfig) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	dir := filepath.Join(homeDir, ".config", "opencode")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	fp := filepath.Join(dir, "opencode.json")

	// Read existing config
	config := map[string]interface{}{}
	if raw, err := os.ReadFile(fp); err == nil {
		_ = json.Unmarshal(raw, &config)
	}

	// Always keep $schema
	if _, ok := config["$schema"]; !ok {
		config["$schema"] = "https://opencode.ai/config.json"
	}

	// Build provider entry
	providerID := cfg.Models["providerId"]
	if providerID == "" {
		// Generate from name: lowercase, replace spaces with hyphens
		providerID = strings.ToLower(strings.ReplaceAll(strings.TrimSpace(cfg.Name), " ", "-"))
	}

	npm := cfg.Models["npm"]
	if npm == "" {
		npm = "@ai-sdk/openai-compatible"
	}

	providerEntry := map[string]interface{}{
		"npm":  npm,
		"name": cfg.Name,
	}

	// Options
	options := map[string]interface{}{}
	if cfg.APIKey != "" {
		options["apiKey"] = cfg.APIKey
	}
	if cfg.BaseURL != "" {
		options["baseURL"] = cfg.BaseURL
	}
	if v, ok := cfg.Models["timeout"]; ok && v != "" {
		if n, err := parseIntSafe(v); err == nil {
			options["timeout"] = n
		}
	}
	if len(options) > 0 {
		providerEntry["options"] = options
	}

	// Models
	modelName := cfg.Models["model"]
	modelAlias := cfg.Models["modelAlias"]
	if modelAlias == "" && modelName != "" {
		modelAlias = modelName
	}
	if modelName != "" {
		modelsMap := map[string]interface{}{
			modelAlias: map[string]interface{}{
				"name": modelName,
			},
		}
		providerEntry["models"] = modelsMap
	}

	// Write provider into config
	providerMap, ok := config["provider"].(map[string]interface{})
	if !ok {
		providerMap = map[string]interface{}{}
	}
	providerMap[providerID] = providerEntry
	config["provider"] = providerMap

	// Set model field: "providerId/modelAlias"
	if modelAlias != "" {
		config["model"] = providerID + "/" + modelAlias
	}

	// Handle small_model if specified
	if v, ok := cfg.Models["smallModel"]; ok && v != "" {
		config["small_model"] = v
	}

	raw, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(fp, raw, 0644)
}

// --- Helper functions for type parsing ---

func parseIntSafe(s string) (int64, error) {
	var n int64
	_, err := fmt.Sscanf(s, "%d", &n)
	return n, err
}

func parseFloatSafe(s string) (float64, error) {
	var f float64
	_, err := fmt.Sscanf(s, "%f", &f)
	return f, err
}

// --- API Test ---

// TestProvider 测试 API 端点连通性
func (ps *ProviderService) TestProvider(id string) ProviderTestResult {
	ps.mu.RLock()
	var target *ProviderConfig
	for i := range ps.data.Providers {
		if ps.data.Providers[i].ID == id {
			cfg := ps.data.Providers[i]
			target = &cfg
			break
		}
	}
	ps.mu.RUnlock()

	if target == nil {
		return ProviderTestResult{OK: false, Error: "provider not found"}
	}

	testURL := target.BaseURL
	if target.AppType == "codebuddy-cli" {
		if v, ok := target.Models["url"]; ok && v != "" {
			testURL = v
		}
	}
	if testURL == "" {
		switch target.AppType {
		case "claude-code":
			testURL = "https://api.anthropic.com"
		case "codex":
			testURL = "https://api.openai.com"
		case "gemini-cli":
			testURL = "https://generativelanguage.googleapis.com"
		case "codebuddy-cli":
			testURL = "https://api.openai.com"
		case "opencode":
			testURL = "https://opencode.ai"
		}
	}

	client := &http.Client{Timeout: 10 * time.Second}
	start := time.Now()
	resp, err := client.Head(testURL)
	latencyMs := time.Since(start).Milliseconds()

	if err != nil {
		return ProviderTestResult{OK: false, Latency: latencyMs, Error: err.Error()}
	}
	defer resp.Body.Close()

	return ProviderTestResult{OK: resp.StatusCode < 500, Latency: latencyMs}
}

// --- Import / Export ---

// ExportProviders 导出供应商配置
func (ps *ProviderService) ExportProviders() (string, error) {
	ps.mu.RLock()
	raw, err := json.MarshalIndent(ps.data, "", "  ")
	ps.mu.RUnlock()
	if err != nil {
		return "", err
	}
	return string(raw), nil
}

// ImportProviders 导入供应商配置
func (ps *ProviderService) ImportProviders(dataJSON string) (int, error) {
	var imported ProvidersData
	if err := json.Unmarshal([]byte(dataJSON), &imported); err != nil {
		return 0, fmt.Errorf("invalid JSON: %w", err)
	}

	ps.mu.Lock()
	existingIDs := map[string]bool{}
	for _, p := range ps.data.Providers {
		existingIDs[p.ID] = true
	}
	count := 0
	for _, p := range imported.Providers {
		if !existingIDs[p.ID] {
			ps.data.Providers = append(ps.data.Providers, p)
			count++
		}
	}
	ps.mu.Unlock()

	if err := ps.saveData(); err != nil {
		return 0, err
	}
	return count, nil
}

// TerminalInfo 终端应用信息
type TerminalInfo struct {
	ID        string `json:"id"`        // terminal, iterm2, warp, ghostty
	Name      string `json:"name"`      // 显示名称
	Available bool   `json:"available"` // 是否已安装
}

// GetAvailableTerminals 返回所有支持的终端应用及其安装状态
func (ps *ProviderService) GetAvailableTerminals() []TerminalInfo {
	homeDir, _ := os.UserHomeDir()

	all := []struct {
		id    string
		name  string
		paths []string // 可能的安装路径
	}{
		{"terminal", "Terminal", []string{"/System/Applications/Utilities/Terminal.app"}},
		{"iterm2", "iTerm2", []string{"/Applications/iTerm.app", filepath.Join(homeDir, "Applications/iTerm.app")}},
		{"warp", "Warp", []string{"/Applications/Warp.app", filepath.Join(homeDir, "Applications/Warp.app")}},
		{"ghostty", "Ghostty", []string{"/Applications/Ghostty.app", filepath.Join(homeDir, "Applications/Ghostty.app")}},
	}

	var terminals []TerminalInfo
	for _, c := range all {
		available := false
		for _, p := range c.paths {
			if _, err := os.Stat(p); err == nil {
				available = true
				break
			}
		}
		// Terminal.app 始终可用
		if c.id == "terminal" {
			available = true
		}
		terminals = append(terminals, TerminalInfo{ID: c.id, Name: c.name, Available: available})
	}

	return terminals
}

// OpenTerminalWithCLI 用用户配置的终端打开对应 CLI 工具
func (ps *ProviderService) OpenTerminalWithCLI(appType string) error {
	cliCmd := appTypeToCLI(appType)
	if cliCmd == "" {
		return fmt.Errorf("unknown appType: %s", appType)
	}

	terminal := "terminal"
	ss := &SkillsService{}
	if settings, err := ss.GetSettings(); err == nil && settings.Terminal != "" {
		terminal = settings.Terminal
	}

	return openTerminal(terminal, cliCmd)
}

func appTypeToCLI(appType string) string {
	switch appType {
	case "claude-code":
		return "claude"
	case "codex":
		return "codex"
	case "gemini-cli":
		return "gemini"
	case "opencode":
		return "opencode"
	case "codebuddy-cli":
		return "codebuddy"
	default:
		return ""
	}
}

func openTerminal(terminal, cmd string) error {
	switch terminal {
	case "terminal":
		script := fmt.Sprintf(`tell application "Terminal"
	activate
	do script "%s"
end tell`, cmd)
		return exec.Command("osascript", "-e", script).Start()

	case "iterm2":
		script := fmt.Sprintf(`tell application "iTerm2"
	activate
	create window with default profile
	tell current session of current window
		write text "%s"
	end tell
end tell`, cmd)
		return exec.Command("osascript", "-e", script).Start()

	case "warp":
		script := fmt.Sprintf(`tell application "Warp"
	activate
end tell
delay 0.5
tell application "System Events"
	tell process "Warp"
		keystroke "%s"
		key code 36
	end tell
end tell`, cmd)
		return exec.Command("osascript", "-e", script).Start()

	case "ghostty":
		ghosttyPath, err := exec.LookPath("ghostty")
		if err != nil {
			return exec.Command("open", "-a", "Ghostty").Start()
		}
		return exec.Command(ghosttyPath, "-e", cmd).Start()

	default:
		return fmt.Errorf("unsupported terminal: %s", terminal)
	}
}
