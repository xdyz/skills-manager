package tray

/*
#cgo darwin CFLAGS: -x objective-c -fobjc-arc
#cgo darwin LDFLAGS: -framework Cocoa

#include "tray_darwin.h"
#include <stdlib.h>
*/
import "C"
import (
	"sync"
	"unsafe"
)

var (
	menuClickHandler func(menuID int)
	menuMu           sync.Mutex
)

//export goMenuItemClicked
func goMenuItemClicked(menuID C.int) {
	menuMu.Lock()
	h := menuClickHandler
	menuMu.Unlock()
	if h != nil {
		go h(int(menuID))
	}
}

// SetMenuClickHandler sets the callback for menu item clicks
func SetMenuClickHandler(handler func(menuID int)) {
	menuMu.Lock()
	menuClickHandler = handler
	menuMu.Unlock()
}

// InitStatusItem creates the macOS status bar item with the given icon
func InitStatusItem(iconData []byte) {
	var ptr unsafe.Pointer
	if len(iconData) > 0 {
		ptr = unsafe.Pointer(&iconData[0])
	}
	C.initStatusItem(ptr, C.int(len(iconData)))
}

// AddMenuItem adds a menu item and returns its ID
func AddMenuItem(title string, checked, disabled bool) int {
	cTitle := C.CString(title)
	defer C.free(unsafe.Pointer(cTitle))
	c := 0
	if checked {
		c = 1
	}
	d := 0
	if disabled {
		d = 1
	}
	return int(C.addMenuItem(cTitle, C.int(c), C.int(d), C.int(0)))
}

// AddSeparator adds a separator to the menu
func AddSeparator() {
	C.addMenuItem(nil, 0, 0, C.int(1))
}

// AddSubmenu adds a submenu entry to the main menu.
// Returns a submenu index for use with AddSubmenuItem.
func AddSubmenu(title string) int {
	cTitle := C.CString(title)
	defer C.free(unsafe.Pointer(cTitle))
	return int(C.addSubmenu(cTitle))
}

// AddSubmenuItem adds an item inside a submenu (identified by submenuIndex from AddSubmenu).
// Returns the menu item ID.
func AddSubmenuItem(submenuIndex int, title string, checked, disabled bool) int {
	cTitle := C.CString(title)
	defer C.free(unsafe.Pointer(cTitle))
	c := 0
	if checked {
		c = 1
	}
	d := 0
	if disabled {
		d = 1
	}
	return int(C.addSubmenuItem(C.int(submenuIndex), cTitle, C.int(c), C.int(d)))
}

// AddSubmenuSeparator adds a separator inside a submenu.
func AddSubmenuSeparator(submenuIndex int) {
	C.addSubmenuSeparator(C.int(submenuIndex))
}

// SetMenuItemState sets the check state of a menu item
func SetMenuItemState(menuID int, checked bool) {
	c := 0
	if checked {
		c = 1
	}
	C.setMenuItemState(C.int(menuID), C.int(c))
}

// ClearMenu removes all menu items
func ClearMenu() {
	C.clearMenu()
}
