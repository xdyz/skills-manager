package services

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"agent-hub/backend/tray"
)

// AppType label mapping for tray menu
var appTypeLabels = map[string]string{
	"claude-code":   "Claude Code",
	"codex":         "Codex",
	"gemini-cli":    "Gemini CLI",
	"opencode":      "OpenCode",
	"codebuddy-cli": "CodeBuddy CLI",
}

// Ordered app types for consistent menu display
var appTypeOrder = []string{"claude-code", "codex", "gemini-cli", "opencode", "codebuddy-cli"}

// CodeBuddy built-in models (synced with frontend CODEBUDDY_BUILTIN_MODELS)
var codeBuddyBuiltinModels = []string{
	"claude-sonnet-4.6",
	"claude-4.5",
	"claude-opus-4.6",
	"claude-opus-4.5",
	"claude-haiku-4.5",
	"gemini-3.0-pro",
	"gemini-3.0-flash",
	"gemini-2.5-pro",
	"gpt-5.2",
	"gpt-5.3-codex",
	"gpt-5.2-codex",
	"gpt-5.1",
	"gpt-5.1-codex",
	"gpt-5.1-codex-max",
	"gpt-5.1-codex-mini",
	"minimax-m2.5-ioa",
	"kimi-k2.5-ioa",
	"kimi-k2-thinking",
	"glm-5.0-ioa",
	"glm-4.7-ioa",
	"glm-4.6-ioa",
	"glm-4.6v-ioa",
	"deepseek-v3-2-volc-ioa",
}

// TrayService manages the system tray icon and menu
type TrayService struct {
	ctx             context.Context
	providerService *ProviderService
	mu              sync.Mutex
	ready           bool
	menuItems       []*trayMenuItem
}

type trayMenuItem struct {
	menuID     int
	providerID string
	appType    string
	action     string // special actions: "show", "quit", "settings", "terminal", "cb-builtin"
	modelID    string // for CodeBuddy built-in model switch
}

func NewTrayService(ps *ProviderService) *TrayService {
	return &TrayService{
		providerService: ps,
	}
}

func (ts *TrayService) Startup(ctx context.Context) {
	ts.ctx = ctx
	go func() {
		// Wait for Cocoa run loop to be fully active
		time.Sleep(800 * time.Millisecond)
		fmt.Println("[TrayService] Initializing status bar item...")
		tray.InitStatusItem(tray.IconData)
		// Give the status item time to appear
		time.Sleep(200 * time.Millisecond)

		tray.SetMenuClickHandler(ts.handleMenuClick)
		ts.buildMenu()

		ts.mu.Lock()
		ts.ready = true
		ts.mu.Unlock()
		fmt.Println("[TrayService] Status bar item ready")
	}()
}

func (ts *TrayService) buildMenu() {
	ts.mu.Lock()
	defer ts.mu.Unlock()

	tray.ClearMenu()
	ts.menuItems = nil

	// "打开主界面" button
	showID := tray.AddMenuItem("打开主界面", false, false)
	ts.menuItems = append(ts.menuItems, &trayMenuItem{menuID: showID, action: "show"})

	tray.AddSeparator()

	// Get provider data
	data := ts.providerService.GetAllProviders()

	// Group providers by appType
	grouped := map[string][]ProviderConfig{}
	for _, p := range data.Providers {
		grouped[p.AppType] = append(grouped[p.AppType], p)
	}

	// Track which appTypes have active providers (for terminal section)
	activeAppTypes := []string{}

	// Product submenus (no separators between them)
	for _, appType := range appTypeOrder {
		if appType == "codebuddy-cli" {
			continue // handled separately in buildCodeBuddySection
		}

		providers := grouped[appType]
		if len(providers) == 0 {
			continue
		}

		label := appTypeLabels[appType]
		if label == "" {
			label = appType
		}

		activeID := data.ActiveMap[appType]
		if activeID != "" {
			activeAppTypes = append(activeAppTypes, appType)
		}

		subIdx := tray.AddSubmenu(label)

		for _, p := range providers {
			isActive := p.ID == activeID
			mid := tray.AddSubmenuItem(subIdx, p.Name, isActive, false)

			ts.menuItems = append(ts.menuItems, &trayMenuItem{
				menuID:     mid,
				providerID: p.ID,
				appType:    appType,
			})
		}
	}

	// CodeBuddy section (built-in models + custom providers)
	cbProviders := grouped["codebuddy-cli"]
	cbActiveID := data.ActiveMap["codebuddy-cli"]
	if cbActiveID != "" {
		activeAppTypes = append(activeAppTypes, "codebuddy-cli")
	}
	ts.buildCodeBuddySection(cbProviders, cbActiveID)

	// Terminal launch section (as submenu)
	if len(activeAppTypes) > 0 {
		tray.AddSeparator()
		termSubIdx := tray.AddSubmenu("打开终端")
		for _, appType := range activeAppTypes {
			label := appTypeLabels[appType]
			if label == "" {
				label = appType
			}
			mid := tray.AddSubmenuItem(termSubIdx, label, false, false)
			ts.menuItems = append(ts.menuItems, &trayMenuItem{
				menuID:  mid,
				appType: appType,
				action:  "terminal",
			})
		}
	}

	tray.AddSeparator()

	// "设置" button
	settingsID := tray.AddMenuItem("设置", false, false)
	ts.menuItems = append(ts.menuItems, &trayMenuItem{menuID: settingsID, action: "settings"})

	// "退出" button
	quitID := tray.AddMenuItem("退出", false, false)
	ts.menuItems = append(ts.menuItems, &trayMenuItem{menuID: quitID, action: "quit"})
}

func (ts *TrayService) buildCodeBuddySection(providers []ProviderConfig, activeID string) {
	activeModel := ts.providerService.GetCodeBuddyActiveModel()

	subIdx := tray.AddSubmenu("CodeBuddy")

	// "内置模型" section header
	tray.AddSubmenuItem(subIdx, "内置模型", false, true)

	for _, modelID := range codeBuddyBuiltinModels {
		isActive := modelID == activeModel
		mid := tray.AddSubmenuItem(subIdx, modelID, isActive, false)
		ts.menuItems = append(ts.menuItems, &trayMenuItem{
			menuID:  mid,
			action:  "cb-builtin",
			modelID: modelID,
		})
	}

	// If user has custom codebuddy-cli providers, show them too
	if len(providers) > 0 {
		tray.AddSubmenuSeparator(subIdx)
		tray.AddSubmenuItem(subIdx, "自定义供应商", false, true)

		for _, p := range providers {
			isActive := p.ID == activeID
			mid := tray.AddSubmenuItem(subIdx, p.Name, isActive, false)
			ts.menuItems = append(ts.menuItems, &trayMenuItem{
				menuID:     mid,
				providerID: p.ID,
				appType:    "codebuddy-cli",
			})
		}
	}

	tray.AddSeparator()
}

func (ts *TrayService) handleMenuClick(menuID int) {
	ts.mu.Lock()
	var clicked *trayMenuItem
	for _, mi := range ts.menuItems {
		if mi.menuID == menuID {
			clicked = mi
			break
		}
	}
	ts.mu.Unlock()

	if clicked == nil {
		return
	}

	switch clicked.action {
	case "show":
		ts.showWindow()
	case "quit":
		ts.quit()
	case "settings":
		ts.openSettings()
	case "terminal":
		ts.openTerminal(clicked.appType)
	case "cb-builtin":
		ts.switchCodeBuddyBuiltin(clicked)
	default:
		// Provider switch
		if clicked.providerID != "" {
			ts.switchProvider(clicked)
		}
	}
}

func (ts *TrayService) switchProvider(clicked *trayMenuItem) {
	err := ts.providerService.SwitchProvider(clicked.providerID)
	if err != nil {
		fmt.Println("[TrayService] switch error:", err)
		return
	}

	// Update checkmarks
	ts.mu.Lock()
	for _, mi := range ts.menuItems {
		if mi.appType == clicked.appType && mi.action == "" {
			tray.SetMenuItemState(mi.menuID, mi.providerID == clicked.providerID)
		}
	}
	ts.mu.Unlock()

	// Notify frontend
	if ts.ctx != nil {
		runtime.EventsEmit(ts.ctx, "provider-switched", clicked.appType)
	}
}

func (ts *TrayService) switchCodeBuddyBuiltin(clicked *trayMenuItem) {
	err := ts.providerService.SwitchCodeBuddyBuiltinModel(clicked.modelID)
	if err != nil {
		fmt.Println("[TrayService] CodeBuddy builtin switch error:", err)
		return
	}

	// Update checkmarks for CodeBuddy built-in section
	ts.mu.Lock()
	for _, mi := range ts.menuItems {
		if mi.action == "cb-builtin" {
			tray.SetMenuItemState(mi.menuID, mi.modelID == clicked.modelID)
		}
	}
	ts.mu.Unlock()

	// Notify frontend
	if ts.ctx != nil {
		runtime.EventsEmit(ts.ctx, "provider-switched", "codebuddy-cli")
	}
}

func (ts *TrayService) showWindow() {
	if ts.ctx != nil {
		runtime.WindowShow(ts.ctx)
	}
}

func (ts *TrayService) openSettings() {
	if ts.ctx != nil {
		runtime.WindowShow(ts.ctx)
		runtime.EventsEmit(ts.ctx, "navigate", "/settings")
	}
}

func (ts *TrayService) openTerminal(appType string) {
	err := ts.providerService.OpenTerminalWithCLI(appType)
	if err != nil {
		fmt.Println("[TrayService] terminal open error:", err)
	}
}

func (ts *TrayService) quit() {
	if ts.ctx != nil {
		runtime.Quit(ts.ctx)
	}
}

// RefreshTray rebuilds the entire tray menu based on current provider state
func (ts *TrayService) RefreshTray() {
	ts.mu.Lock()
	ready := ts.ready
	ts.mu.Unlock()

	if !ready {
		return
	}

	ts.buildMenu()
}
