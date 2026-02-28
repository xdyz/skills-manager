#include <Cocoa/Cocoa.h>
#include "tray_darwin.h"

// Implemented in Go via //export
extern void goMenuItemClicked(int menuID);

static NSStatusItem *statusItem = nil;
static NSMenu *statusMenu = nil;
static int nextMenuID = 0;

// SMTrayTarget handles menu clicks
@interface SMTrayTarget : NSObject
@property (assign) int menuID;
- (void)menuItemClicked:(id)sender;
@end

@implementation SMTrayTarget
- (void)menuItemClicked:(id)sender {
    goMenuItemClicked(self.menuID);
}
@end

// Keep targets alive
static NSMutableArray *targets = nil;
// Keep submenus for addSubmenuItem
static NSMutableArray *submenus = nil;

void initStatusItem(const void *iconData, int iconLen) {
    dispatch_async(dispatch_get_main_queue(), ^{
        statusItem = [[NSStatusBar systemStatusBar] statusItemWithLength:NSVariableStatusItemLength];

        if (iconData != NULL && iconLen > 0) {
            NSData *data = [NSData dataWithBytes:iconData length:iconLen];
            NSImage *image = [[NSImage alloc] initWithData:data];
            // Template image for proper dark/light mode rendering
            [image setTemplate:YES];
            // Scale to menu bar size
            [image setSize:NSMakeSize(18, 18)];
            statusItem.button.image = image;
        } else {
            statusItem.button.title = @"SM";
        }

        statusMenu = [[NSMenu alloc] init];
        [statusMenu setAutoenablesItems:NO];
        statusItem.menu = statusMenu;
    });
}

int addMenuItem(const char *title, int checked, int disabled, int isSeparator) {
    __block int mid = -1;
    dispatch_sync(dispatch_get_main_queue(), ^{
        if (statusMenu == nil) return;
        if (targets == nil) {
            targets = [[NSMutableArray alloc] init];
        }

        if (isSeparator) {
            [statusMenu addItem:[NSMenuItem separatorItem]];
            return;
        }

        mid = nextMenuID++;
        NSString *t = [NSString stringWithUTF8String:title];
        NSMenuItem *item = [[NSMenuItem alloc] initWithTitle:t action:nil keyEquivalent:@""];

        SMTrayTarget *target = [[SMTrayTarget alloc] init];
        target.menuID = mid;
        [targets addObject:target];

        if (!disabled) {
            [item setTarget:target];
            [item setAction:@selector(menuItemClicked:)];
        }
        if (checked) {
            [item setState:NSControlStateValueOn];
        }
        if (disabled) {
            [item setEnabled:NO];
        }

        [statusMenu addItem:item];
    });
    return mid;
}

// Add a submenu entry to the main menu. Returns submenu index for addSubmenuItem.
int addSubmenu(const char *title) {
    __block int idx = -1;
    dispatch_sync(dispatch_get_main_queue(), ^{
        if (statusMenu == nil) return;
        if (submenus == nil) {
            submenus = [[NSMutableArray alloc] init];
        }

        NSString *t = [NSString stringWithUTF8String:title];
        NSMenuItem *item = [[NSMenuItem alloc] initWithTitle:t action:nil keyEquivalent:@""];
        NSMenu *sub = [[NSMenu alloc] initWithTitle:t];
        [sub setAutoenablesItems:NO];
        [item setSubmenu:sub];
        [statusMenu addItem:item];

        idx = (int)[submenus count];
        [submenus addObject:sub];
    });
    return idx;
}

// Add an item to a submenu (identified by submenuIndex from addSubmenu).
int addSubmenuItem(int submenuIndex, const char *title, int checked, int disabled) {
    __block int mid = -1;
    dispatch_sync(dispatch_get_main_queue(), ^{
        if (submenus == nil || submenuIndex < 0 || submenuIndex >= (int)[submenus count]) return;
        if (targets == nil) {
            targets = [[NSMutableArray alloc] init];
        }

        NSMenu *sub = [submenus objectAtIndex:submenuIndex];

        mid = nextMenuID++;
        NSString *t = [NSString stringWithUTF8String:title];
        NSMenuItem *item = [[NSMenuItem alloc] initWithTitle:t action:nil keyEquivalent:@""];

        SMTrayTarget *target = [[SMTrayTarget alloc] init];
        target.menuID = mid;
        [targets addObject:target];

        if (!disabled) {
            [item setTarget:target];
            [item setAction:@selector(menuItemClicked:)];
        }
        if (checked) {
            [item setState:NSControlStateValueOn];
        }
        if (disabled) {
            [item setEnabled:NO];
        }

        [sub addItem:item];
    });
    return mid;
}

void addSubmenuSeparator(int submenuIndex) {
    dispatch_sync(dispatch_get_main_queue(), ^{
        if (submenus == nil || submenuIndex < 0 || submenuIndex >= (int)[submenus count]) return;
        NSMenu *sub = [submenus objectAtIndex:submenuIndex];
        [sub addItem:[NSMenuItem separatorItem]];
    });
}

void setMenuItemState(int menuID, int checked) {
    dispatch_async(dispatch_get_main_queue(), ^{
        if (statusMenu == nil) return;
        // Search in main menu
        for (NSMenuItem *item in [statusMenu itemArray]) {
            if ([item.target isKindOfClass:[SMTrayTarget class]]) {
                SMTrayTarget *t = (SMTrayTarget *)item.target;
                if (t.menuID == menuID) {
                    [item setState:checked ? NSControlStateValueOn : NSControlStateValueOff];
                    return;
                }
            }
            // Also search in submenus
            if ([item hasSubmenu]) {
                for (NSMenuItem *subItem in [[item submenu] itemArray]) {
                    if ([subItem.target isKindOfClass:[SMTrayTarget class]]) {
                        SMTrayTarget *t = (SMTrayTarget *)subItem.target;
                        if (t.menuID == menuID) {
                            [subItem setState:checked ? NSControlStateValueOn : NSControlStateValueOff];
                            return;
                        }
                    }
                }
            }
        }
    });
}

void clearMenu(void) {
    dispatch_sync(dispatch_get_main_queue(), ^{
        if (statusMenu != nil) {
            [statusMenu removeAllItems];
        }
        if (targets != nil) {
            [targets removeAllObjects];
        }
        if (submenus != nil) {
            [submenus removeAllObjects];
        }
        nextMenuID = 0;
    });
}
