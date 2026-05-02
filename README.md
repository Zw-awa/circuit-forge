<p align="center">
  <h1 align="center">CircuitForge</h1>
  <p align="center">从基础门开始，构建一切 — Build anything from basic gates</p>
  <p align="center">
    <a href="./README_EN.md">English</a> | 中文
  </p>
  <p align="center">
    <a href="https://github.com/Zw-awa/circuit-forge/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="License"></a>
  </p>
</p>

---

## 简介

**CircuitForge** 是一个开源的万能逻辑电路沙盒编辑器与仿真器。它提供最基础的逻辑元件（与非门、延迟线、开关等），让用户通过自定义规则和封装系统，构建从简单逻辑门到复杂处理器的任意电路系统。

灵感来源于数字电路、Minecraft 红石和 Terraria 电路，但不局限于任何一种模型 — 规则由你定义。

## 特性

- **基础元件** — AND、OR、NOT、NAND、XOR 等逻辑门，开关、按钮、时钟源，LED、数码管、示波器
- **自定义规则** — 可视化规则编辑器，定义信号类型、传播方式、衰减行为，内置 MC红石/Terraria/标准数字电路预设
- **玩家封装** — 将子电路封装为新元件，或用 JavaScript 脚本定义复杂行为，支持多层嵌套
- **双模式仿真** — 事件驱动（高效）与时钟帧驱动（游戏风格）可切换，Rust 引擎极致性能
- **双模式画布** — 网格对齐（像素风）与自由拖拽（Logisim 风）可切换，WebGL 渲染
- **皮肤系统** — 元件外观、连线样式、画布背景、UI 主题全面可自定义
- **调试工具** — 信号实时显示、断点调试、波形图、单步执行
- **导入导出** — 项目/皮肤/封装/规则分类导出，支持 Verilog/VHDL 代码导出
- **创意工坊** — GitHub/Gitee 社区集成，分享项目、封装、皮肤和规则包
- **插件系统** — 第三方插件扩展新元件、工具和导出格式
- **中英双语** — 界面完整支持中文和英文

## 技术栈

| 组件 | 技术 |
|------|------|
| 桌面框架 | Tauri v2 |
| 前端 | React + TypeScript |
| 画布渲染 | WebGL |
| 仿真引擎 | Rust |
| 脚本沙盒 | JavaScript (QuickJS WASM) |
| 包管理 | bun |

## 快速开始

### 环境要求

- [Rust](https://www.rust-lang.org/tools/install) (最新稳定版)
- [Bun](https://bun.sh/) (最新版)
- [Tauri 系统依赖](https://v2.tauri.app/start/prerequisites/)

### 构建与运行

```bash
# 克隆仓库
git clone https://github.com/Zw-awa/circuit-forge.git
cd circuit-forge

# 安装前端依赖
bun install

# 开发模式运行
bun run tauri dev

# 构建发布版本
bun run tauri build
```

## 项目结构

```
circuit-forge/
├── src/                    # React 前端源码
├── src-tauri/              # Rust 后端源码（Tauri + 仿真引擎）
├── public/                 # 静态资源
├── LICENSE                 # Apache 2.0 许可证
├── NOTICE                  # 版权声明
├── README.md               # 中文说明（本文件）
└── README_EN.md            # English README
```

## 开发路线

- [x] Phase 1 — 基础骨架（画布、基础元件、仿真引擎、保存加载）
- [ ] Phase 2 — 核心体验（全部元件、总线连线、调速仿真、主题切换）
- [ ] Phase 3 — 封装与规则（子电路封装、脚本封装、规则编辑器）
- [ ] Phase 4 — 皮肤与导出（皮肤系统、Verilog导出、调试工具）
- [ ] Phase 5 — 社区与插件（创意工坊、插件系统、性能优化）

## 贡献

欢迎贡献！请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解如何参与。

## 许可证

本项目基于 [Apache License 2.0](./LICENSE) 开源。详见 [NOTICE](./NOTICE) 文件。

Copyright 2026 Zw-awa
