# Skills Manager

<p align="center">
  <img src="build/appicon.png" width="128" height="128" alt="Skills Manager Logo">
</p>

<p align="center">
  <strong>一站式 AI Agent Skills 管理工具</strong><br>
  基于 <a href="https://wails.io/">Wails v2</a> 构建的 macOS 桌面应用
</p>

<p align="center">
  <a href="https://github.com/xdyz/skills-manager/releases/latest">📦 下载 DMG</a> ·
  <a href="https://skills.sh">🌐 skills.sh</a>
</p>

---

## 什么是 Skills Manager？

Skills Manager 让你通过图形界面统一管理 AI Agent 的 Skills（技能扩展包）。支持从 [skills.sh](https://skills.sh) 搜索、安装远程 Skills，并通过软链接机制一键链接到 **36+ 个 AI Agent**（Claude Code、Cursor、GitHub Copilot、Gemini CLI、Windsurf 等）。

## 功能特性

### 🔧 全局技能管理
- 从 [skills.sh](https://skills.sh) 搜索远程 Skills，一键安装到中央仓库（`~/.agents/skills/`）
- 查看已安装技能详情（名称、描述、语言、框架等）
- 一键更新 / 重新安装 / 删除技能

### 🔗 Agent 链接管理
- 支持 36+ 内置 AI Agent，覆盖主流 IDE 和 CLI 工具
- 灵活配置每个 Skill 关联到哪些 Agent（通过软链接实现）
- 支持添加自定义 Agent
- 自动检测官方 Skills CLI 的 Agent 更新，一键同步新 Agent

### 📁 项目级管理
- 为不同项目独立配置 Skills，互不干扰
- 支持全局软链接或项目本地安装两种模式
- 项目内按 Agent 维度管理：启用/禁用/查看每个 Agent 目录下的 Skills
- 从侧边栏快速切换项目

### 🛡️ 环境检测
- 启动时自动检查 Node.js、npx、Skills CLI 等依赖
- 缺失依赖时引导一键安装

### 🎨 其他
- 支持 Light / Dark 主题切换
- 支持中文 / English 双语
- 首页仪表盘：已安装技能数、Agent 数、总链接数、项目数一览

## 截图

> TODO: 添加应用截图

## 安装

### 方式一：下载 DMG（推荐）

前往 [Releases](https://github.com/xdyz/skills-manager/releases/latest) 下载最新的 `Skills-Manager.dmg`。

1. 打开 DMG，将 **Skills Manager** 拖入 Applications
2. 首次打开：**右键点击应用 → 打开**（因未签名需手动允许一次）

### 方式二：从源码构建

```bash
# 前置条件：Go 1.23+、Node.js 18+、pnpm、Wails CLI
git clone https://github.com/xdyz/skills-manager.git
cd skills-manager
wails build -platform darwin/universal
# 生成的 .app 在 build/bin/ 目录下
```

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Wails v2 |
| 后端 | Go |
| 前端 | React 19 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui (Radix) |
| 图标 | hugeicons-react |
| 包管理 | pnpm（前端）/ Go Modules（后端）|

## 项目结构

```
skills-manager/
├── main.go                      # 应用入口
├── backend/
│   ├── app.go                   # App 主结构
│   └── services/
│       ├── env_service.go       # 环境检测（Node/npx/CLI）
│       ├── folder_service.go    # 项目文件夹管理
│       ├── skills_service.go    # 技能搜索/安装/更新/删除/链接
│       └── agent_service.go     # Agent 管理/更新检测
├── frontend/
│   └── src/
│       ├── components/          # 通用组件（Logo、RemoteSkillSearch 等）
│       ├── pages/
│       │   ├── layout.tsx       # 应用布局（Header + Sidebar + Content）
│       │   ├── home/            # 首页仪表盘
│       │   ├── skills/          # 全局技能管理（本地/远程搜索）
│       │   ├── agents/          # Agent 管理
│       │   └── projects/        # 项目级 Skills 管理
│       ├── i18n/                # 国际化（zh/en）
│       └── routes/              # 路由配置
├── build/                       # 构建资源（图标等）
├── wails.json                   # Wails 配置
└── go.mod
```

## 数据目录

| 路径 | 用途 |
|------|------|
| `~/.agents/skills/` | 中央 Skills 仓库（兼容 `npx skills`）|
| `~/.skills-manager/` | 应用配置（项目列表、自定义 Agent 等）|

## 开发

```bash
# 启动开发模式（前端 Vite 热更新 + Go 后端）
wails dev
```

## 声明

本工具使用 [skills.sh](https://skills.sh) 的公开 API 搜索技能，技能本身来自各自的 GitHub 仓库，遵循其原始许可证。

本项目与 skills.sh 官方无关，仅为社区开发的第三方 GUI 客户端。

## License

MIT
