<p align="center">
  <h1 align="center">CircuitForge</h1>
  <p align="center">从基础门开始，构建一切</p>
  <p align="center">
    <a href="./README_EN.md">English</a> | 中文
  </p>
  <p align="center">
    <a href="https://github.com/Zw-awa/circuit-forge/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="License"></a>
  </p>
</p>

---

**CircuitForge** 是一个开源的万能逻辑电路沙盒编辑器与仿真器。放置逻辑门、连线、切换开关、观察 LED，从最基础的元件出发构建任意复杂的电路系统。

<!-- TODO: 添加应用截图 -->
<!-- ![CircuitForge Screenshot](docs/images/screenshot.png) -->

## 快速开始

> CircuitForge 目前处于活跃开发阶段，尚未发布正式版本。

**下载安装包**（推荐）：前往 [GitHub Releases](https://github.com/Zw-awa/circuit-forge/releases) 下载适合你系统的安装包。

<details>
<summary><b>从源码构建（面向开发者）</b></summary>

需要安装 [Rust](https://www.rust-lang.org/tools/install)、[Bun](https://bun.sh/) 和 [Tauri v2 系统依赖](https://v2.tauri.app/start/prerequisites/)。

```bash
git clone https://github.com/Zw-awa/circuit-forge.git
cd circuit-forge
bun install
bun run tauri dev
```

构建发布版本：

```bash
bun run tauri build
```

</details>

## 目录

- [功能特性](#功能特性)
- [安装](#安装)
- [使用指南](#使用指南)
- [项目结构](#项目结构)
- [用户数据与遥测](#用户数据与遥测)
- [安全](#安全)
- [开发路线](#开发路线)
- [贡献](#贡献)
- [许可证](#许可证)

## 功能特性

**编辑器**
- 无限画布，网格对齐或自由拖拽两种模式
- 16 种内置元件：逻辑门（AND / OR / NOT / NAND / XOR）、开关、按钮、时钟、LED、七段数码管、示波器、延迟线、分线器等
- 总线/分叉连线，L 形自动路由
- 撤销 / 重做，项目保存与加载
- 明暗主题切换，自定义连线颜色

**仿真**
- Rust 驱动的高性能仿真引擎
- 事件驱动模式（标准数字电路）与时钟帧驱动模式（Minecraft 红石风格）
- 可调仿真速度（0.25x ~ 32x）
- 实时信号可视化：连线颜色随信号变化，LED 亮灭

**封装与规则**
- 子电路封装：将电路打包为可复用的自定义元件，支持多层嵌套
- Lua 脚本封装：用 Lua 代码定义元件行为（状态机、计数器等）
- 真值表验证：编写期望的真值表，自动测试元件行为
- 规则包系统：预设 Minecraft 红石 / Terraria / 标准数字电路规则，支持自定义

**更多**
- 中英双语界面
- 封装元件独立导出/导入（.cfcomp 格式）
- 操作历史面板，版本快照

## 安装

### 下载安装包

| 平台 | 格式 | 说明 |
|------|------|------|
| Windows | `.msi` / `.exe` | 双击安装 |
| macOS | `.dmg` | 拖入 Applications |
| Linux | `.AppImage` / `.deb` | AppImage 直接运行，deb 用 dpkg 安装 |

前往 [GitHub Releases](https://github.com/Zw-awa/circuit-forge/releases) 下载最新版本。

> 当前尚未发布正式版本。如需体验，请从源码构建（见[快速开始](#快速开始)）。

### 从源码构建

**环境要求**：
- [Rust](https://www.rust-lang.org/tools/install)（最新稳定版）
- [Bun](https://bun.sh/)（最新版）
- [Tauri v2 系统依赖](https://v2.tauri.app/start/prerequisites/)

```bash
git clone https://github.com/Zw-awa/circuit-forge.git
cd circuit-forge
bun install
bun run tauri dev      # 开发模式
bun run tauri build    # 构建发布版本
```

## 使用指南

1. **放置元件**：从左侧面板选择元件，在画布上点击放置
2. **连线**：切换到连线工具（快捷键 `3`），点击输出引脚，再点击输入引脚
3. **仿真**：点击工具栏的运行按钮，或切换开关观察信号传播
4. **保存**：`Ctrl+S` 保存项目为 `.cfproj` 文件

| 快捷键 | 功能 |
|--------|------|
| `1` | 选择工具 |
| `2` | 放置工具 |
| `3` | 连线工具 |
| `4` | 删除工具 |
| `Ctrl+Z` | 撤销 |
| `Ctrl+Shift+Z` | 重做 |
| 滚轮 | 缩放 |
| 中键拖拽 / 空格+左键 | 平移 |

## 项目结构

```
circuit-forge/
├── src/                    # React + TypeScript 前端
│   ├── components/         # UI 组件
│   ├── renderer/           # WebGL2 渲染器
│   ├── interaction/        # 鼠标/键盘交互
│   ├── stores/             # zustand 状态管理
│   └── i18n/               # 国际化
├── src-tauri/              # Rust 后端
│   └── src/
│       ├── circuit/        # 电路数据模型
│       ├── simulation/     # 仿真引擎
│       ├── scripting/      # Lua 脚本沙盒
│       ├── rules/          # 规则包系统
│       └── verification/   # 真值表验证
└── docs/                   # 文档
```

### 配置

- 项目文件：`.cfproj`（JSON 格式）
- 封装元件：`.cfcomp`（JSON 格式，可独立分享）
- 用户偏好（主题等）存储在系统应用数据目录中

### 国际化

界面支持中文和英文，可在状态栏切换。翻译文件位于 `src/i18n/`。

## 用户数据与遥测

CircuitForge **不收集任何用户数据**。

- 无遥测、无分析、无使用统计
- 无网络请求（除非你主动使用导入/导出功能访问本地文件系统）
- 所有数据保存在本地

## 安全

### 报告漏洞

如果你发现安全漏洞，请通过 [GitHub Security Advisory](https://github.com/Zw-awa/circuit-forge/security/advisories/new) 私密报告，不要在公开 issue 中披露。

## 开发路线

- [x] **Phase 1** — 基础骨架：画布渲染、基础元件、事件驱动仿真、保存加载、撤销重做
- [x] **Phase 2** — 核心体验：全部元件、总线连线、自由拖拽、时钟帧仿真、主题切换
- [x] **Phase 3** — 封装与规则：子电路封装、Lua 脚本封装、规则编辑器、真值表验证
- [x] **Phase 4** — 皮肤与导出：皮肤系统、项目打包(.circuitforge)、分类导出、断点调试、波形查看器
- [ ] **Phase 5** — 社区与插件：创意工坊、插件系统、性能优化

## 贡献

欢迎贡献！请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解如何参与。

## 许可证

[Apache License 2.0](./LICENSE) — 详见 [NOTICE](./NOTICE)

Copyright 2026 Zw-awa
