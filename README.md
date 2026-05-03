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

**CircuitForge** 是一个开源的万能逻辑电路沙盒编辑器与仿真器。

放置逻辑门、连线、切换开关、观察 LED — 从最基础的元件出发，通过自定义规则和封装系统，构建从简单组合逻辑到复杂处理器的任意电路。灵感来源于数字电路、Minecraft 红石和 Terraria 电路，但不局限于任何一种模型。

## 功能亮点

**编辑器**
- 无限画布，网格对齐或自由拖拽两种模式
- 放置逻辑门（AND / OR / NOT / NAND / XOR）、开关、LED 等元件
- 点对点连线，L 形自动路由
- 撤销 / 重做，项目保存与加载

**仿真**
- Rust 驱动的高性能仿真引擎
- 事件驱动模式（标准数字电路）与时钟帧驱动模式（MC 红石风格）
- 实时信号可视化：连线颜色随信号变化，LED 亮灭

**未来规划**
- 子电路封装 — 将电路打包为可复用的自定义元件
- 可视化规则编辑器 — 自定义信号类型、传播方式、衰减行为
- 皮肤系统 — 元件外观、连线样式、UI 主题全面可定制
- 创意工坊 — 社区分享项目、封装和规则包
- Verilog / VHDL 代码导出

## 快速开始

### 环境要求

- [Rust](https://www.rust-lang.org/tools/install)（最新稳定版）
- [Bun](https://bun.sh/)（最新版）
- [Tauri v2 系统依赖](https://v2.tauri.app/start/prerequisites/)

### 构建与运行

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

## 开发路线

- [x] **Phase 1** — 基础骨架：画布渲染、基础元件、事件驱动仿真、保存加载、撤销重做
- [x] **Phase 2** — 核心体验：全部元件、总线连线、自由拖拽、时钟帧仿真、主题切换
- [ ] **Phase 3** — 封装与规则：子电路封装、脚本封装、规则编辑器
- [ ] **Phase 4** — 皮肤与导出：皮肤系统、Verilog 导出、调试工具
- [ ] **Phase 5** — 社区与插件：创意工坊、插件系统、性能优化

## 技术栈

| 组件 | 技术 |
|------|------|
| 桌面框架 | Tauri v2 |
| 前端 | React + TypeScript + Vite |
| 画布渲染 | 自研 WebGL2 |
| 状态管理 | zustand |
| 仿真引擎 | Rust |
| 国际化 | i18next |
| 包管理 | bun |

## 贡献

欢迎贡献！请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解如何参与。

开发者文档位于 [`docs/design/`](./docs/design/)，包含完整的架构设计和实现指南。

## 许可证

[Apache License 2.0](./LICENSE) — 详见 [NOTICE](./NOTICE)

Copyright 2026 Zw-awa
