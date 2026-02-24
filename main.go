package main

import (
	"context"
	"embed"
	"skills-manager/backend"
	"skills-manager/backend/services"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := backend.NewApp()
	folderService := services.NewFolderService()
	skillsService := services.NewSkillsService()
	envService := services.NewEnvService()

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "Skills Manager",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup: func(ctx context.Context) {
			app.Startup(ctx)
			folderService.Startup(ctx)
			skillsService.Startup(ctx)
			envService.Startup(ctx)
		},
		Bind: []interface{}{
			app,
			folderService,
			skillsService,
			envService,
		},
		// 👇 添加调试配置
		Debug: options.Debug{
			OpenInspectorOnStartup: true, // 启动时自动打开 DevTools
		},
		Mac: &mac.Options{
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
