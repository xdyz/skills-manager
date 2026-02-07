import React from 'react';
import { Dropdown, Button } from '@douyinfe/semi-ui';
import { IconSun, IconMoon, IconDesktop } from '@douyinfe/semi-icons';
import { useTheme } from '../hooks/use-theme';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const getIcon = () => {
    switch (theme) {
      case 'light': return <IconSun size="large" />;
      case 'dark': return <IconMoon size="large" />;
      case 'system': return <IconDesktop size="large" />;
    }
  };

  return (
    <Dropdown
      trigger="click"
      position="bottomRight"
      render={
        <Dropdown.Menu>
          <Dropdown.Item 
            icon={<IconSun />} 
            active={theme === 'light'}
            onClick={() => setTheme('light')}
          >
            浅色模式
          </Dropdown.Item>
          <Dropdown.Item 
            icon={<IconMoon />} 
            active={theme === 'dark'}
            onClick={() => setTheme('dark')}
          >
            深色模式
          </Dropdown.Item>
          <Dropdown.Item 
            icon={<IconDesktop />} 
            active={theme === 'system'}
            onClick={() => setTheme('system')}
          >
            跟随系统
          </Dropdown.Item>
        </Dropdown.Menu>
      }
    >
      <Button
        theme="borderless"
        icon={getIcon()}
        style={{ color: 'var(--semi-color-text-2)' }}
      />
    </Dropdown>
  );
};

export default ThemeSwitcher;
