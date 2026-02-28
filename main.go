package main

import (
	"context"
	"embed"
	"agent-hub/backend"
	"agent-hub/backend/services"

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
	agentService := services.NewAgentService()
	envService := services.NewEnvService()
	
	// Create new enhanced services
	templateService := services.NewTemplateService()
	recommendationService := services.NewRecommendationService(skillsService)
	dependencyService := services.NewDependencyService(skillsService)
	monitoringService := services.NewMonitoringService()
	backupService := services.NewBackupService()
	searchService := services.NewSearchService(skillsService)
	profileService := services.NewProfileService(skillsService)
	ratingService := services.NewRatingService()
	providerService := services.NewProviderService()
	trayService := services.NewTrayService(providerService)

	// Create application with options
	err := wails.Run(&options.App{
		Title:             "Agent Hub",
		Width:             1024,
		Height:            768,
		HideWindowOnClose: true,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup: func(ctx context.Context) {
			app.Startup(ctx)
			folderService.Startup(ctx)
			skillsService.Startup(ctx)
			agentService.Startup(ctx)
			envService.Startup(ctx)
			
			// Startup new services
			templateService.Startup(ctx)
			recommendationService.Startup(ctx)
			dependencyService.Startup(ctx)
			monitoringService.Startup(ctx)
			backupService.Startup(ctx)
			searchService.Startup(ctx)
			profileService.Startup(ctx)
			ratingService.Startup(ctx)
			providerService.Startup(ctx)
			// TrayService is initialized in OnDomReady to ensure Cocoa run loop is active
		},
		OnDomReady: func(ctx context.Context) {
			trayService.Startup(ctx)
		},
		Bind: []interface{}{
			app,
			folderService,
			skillsService,
			agentService,
			envService,
			templateService,
			recommendationService,
			dependencyService,
			monitoringService,
			backupService,
			searchService,
			profileService,
			ratingService,
			providerService,
			trayService,
		},
		Debug: options.Debug{
			OpenInspectorOnStartup: true,
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
