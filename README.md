# Skills Manager

一个基于 [Wails v2](https://wails.io/) 构建的桌面应用，用于统一管理 AI Agent Skills。

支持从 [skills.sh](https://skills.sh) 搜索、安装、更新远程 Skills，并通过软链接机制将 Skill 关联到 36+ 个 AI Agent（Claude Code、Cursor、GitHub Copilot、Gemini CLI 等）。

## 功能特性

- **全局技能管理** — 搜索远程 Skills、一键安装到中央仓库、批量链接到多个 Agent
- **项目级管理** — 为不同项目独立配置 Skills，支持全局软链接或项目本地安装
- **Agent 链接** — 灵活配置每个 Skill 关联哪些 Agent，支持 36+ 内置 Agent 及自定义 Agent
- **环境检测** — 启动时自动检查 Node.js / Skills CLI 等依赖，引导一键安装
- **深浅主题** — 支持 Light / Dark 模式切换

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Wails v2 |
| 后端 | Go 1.23 |
| 前端 | React 19 + TypeScript + Vite 7 |
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
│       └── skills_service.go    # 核心：技能搜索/安装/更新/删除/链接
├── frontend/
│   └── src/
│       └── pages/
│           ├── layout.tsx       # 应用布局（Header + Sidebar + Content）
│           ├── home/            # 首页仪表盘
│           ├── skills/          # 全局技能管理（本地/远程搜索/Agent 管理）
│           ├── projects/        # 项目级 Skills 管理
│           └── setup/           # 环境检查与初始化
├── build/                       # 构建资源（图标等）
├── wails.json                   # Wails 配置
└── go.mod
```

## 开发

### 前置条件

- Go 1.23+
- Node.js 18+
- pnpm
- [Wails CLI](https://wails.io/docs/gettingstarted/installation)

### 启动开发模式

```bash
wails dev
```

前端热更新由 Vite 提供，修改代码后自动刷新。

### 构建发布包

```bash
wails build
```

生成的可执行文件在 `build/bin/` 目录下。

## 数据目录

| 路径 | 用途 |
|------|------|
| `~/.agents/skills/` | 中央 Skills 仓库 |
| `~/.skills-manager/` | 应用配置（已打开的项目列表等）|
| `~/.config/skills-manager/` | 自定义 Agent 配置 |
