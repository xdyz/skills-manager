#ifndef TRAY_DARWIN_H
#define TRAY_DARWIN_H

void initStatusItem(const void *iconData, int iconLen);
int addMenuItem(const char *title, int checked, int disabled, int isSeparator);
void setMenuItemState(int menuID, int checked);
void clearMenu(void);

// Submenu support
int addSubmenu(const char *title);
int addSubmenuItem(int submenuIndex, const char *title, int checked, int disabled);
void addSubmenuSeparator(int submenuIndex);

#endif
