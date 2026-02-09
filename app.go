package main

import (
	"context"
	"fmt"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx     context.Context
	folders []string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		folders: []string{},
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// SelectFolder opens a folder selection dialog and returns the selected folder path
func (a *App) SelectFolder() (string, error) {
	folder, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "选择文件夹",
	})
	if err != nil {
		return "", err
	}
	if folder != "" {
		a.folders = append(a.folders, folder)
	}
	return folder, nil
}

// GetFolders returns the list of opened folders
func (a *App) GetFolders() []string {
	return a.folders
}

// RemoveFolder removes a folder from the list
func (a *App) RemoveFolder(folder string) {
	for i, f := range a.folders {
		if f == folder {
			a.folders = append(a.folders[:i], a.folders[i+1:]...)
			break
		}
	}
}
