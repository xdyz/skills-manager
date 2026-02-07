import React from "react";
import { Layout, Nav, Button, Breadcrumb, Skeleton, Avatar } from '@douyinfe/semi-ui';
import { IconSemiLogo, IconBell, IconHelpCircle, IconBytedanceLogo, IconHome, IconHistogram, IconLive, IconSetting } from '@douyinfe/semi-icons';
import { Outlet, useNavigate } from "react-router-dom";
import ThemeSwitcher from "../components/theme-switcher";

const PageLayout = () => {
  const { Header, Sider, Content } = Layout;
  const navigate = useNavigate()
  return (
    <Layout style={{ border: '1px solid var(--semi-color-border)', height: '100vh', width: '100vw'}}>
      <Header>
        <div>
          <Nav mode="horizontal" defaultSelectedKeys={['home']}>
            <Nav.Header>
              <IconSemiLogo style={{ height: '36px', fontSize: 36 }} />
            </Nav.Header>
            <span
              style={{
                color: 'var(--semi-color-text-2)',
              }}
            >
              <span
                style={{
                  marginRight: '24px',
                  fontWeight: '600',
                }}
              >
                模版推荐
              </span>
              <span style={{ marginRight: '24px' }}>所有模版</span>
              <span>我的模版</span>
            </span>
            <Nav.Footer>
              <Button
                theme="borderless"
                icon={<IconBell size="large" />}
                style={{
                  color: 'var(--semi-color-text-2)',
                  marginRight: '12px',
                }}
              />
              <Button
                theme="borderless"
                icon={<IconHelpCircle size="large" />}
                style={{
                  color: 'var(--semi-color-text-2)',
                  marginRight: '12px',
                }}
              />
              <ThemeSwitcher />
              <Button
                theme="borderless"
                icon={<IconSetting size="large" />}
                style={{
                  color: 'var(--semi-color-text-2)',
                  marginRight: '12px',
                }}
              />
            </Nav.Footer>
          </Nav>
        </div>
      </Header>
      <Layout>
        <Sider style={{ backgroundColor: 'var(--semi-color-bg-1)' }}>
          <Nav
            style={{ maxWidth: 220, height: '100%' }}
            defaultSelectedKeys={['home']}
            onSelect={({ itemKey }) => {
              navigate(itemKey as string)
            }}
            items={[
              { itemKey: 'home', text: '首页', icon: <IconHome size="large" />,  },
              { itemKey: 'skills', text: 'Skills 技能', icon: <IconHistogram size="large" /> },
            ]}
            footer={{
              collapseButton: true,
            }}
          />
        </Sider>
        <Content
          style={{
            padding: '24px',
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default PageLayout