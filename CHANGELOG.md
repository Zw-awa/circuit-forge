# Changelog

All notable changes to CircuitForge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added (Phase 4 — 皮肤与导出 + 调试工具)
- **皮肤/素材系统**: 支持 .cfskin 格式的元件贴图替换、连线样式虚线/发光、网格点阵/十字模式
- **.circuitforge 打包**: zip 格式完整项目导出/导入，含电路、自定义元件、规则包、皮肤
- **分类导出**: .cfrule 规则包独立导出/导入，统一导出对话框（项目/皮肤/元件/规则）
- **断点调试**: 连线和元件断点，条件触发（SignalEquals/RisingEdge/FallingEdge），Step Into/Step Over/Continue
- **波形查看器**: Canvas 2D 波形面板，多信号监控，时间轴缩放，游标，CSV 导出
- 新增 Rust 模块: `skin/`, `packaging/`, `debugging/`
- 新增依赖: `zip 2.6`, `base64 0.22`

### Added

**Phase 3 — Encapsulation & Rules**
- Sub-circuit encapsulation: select components, define external pins, package as reusable custom component
- Template model: all instances of the same sub-circuit share one definition
- Breadcrumb navigation for editing nested sub-circuits
- Lua scripting (mlua): define component behavior with stateful Lua scripts
- Lua sandbox: restricted environment (no io/os/debug), memory and instruction limits
- Truth table verification: write expected truth tables, auto-test component behavior
- Rule pack system with 3 presets: Minecraft Redstone, Terraria, Standard Digital
- Form-based rule editor for custom signal types, propagation, attenuation
- Signal type extension: Integer(i32) and Float(f64) signals
- Custom component export/import (.cfcomp format)

**Phase 2 — Core Experience**
- 9 new components: Button, Clock, Random, Constant, 7-Segment Display, Oscilloscope, Delay Line, Splitter, Merger
- Bus/junction wiring system with split/merge support
- Tick-driven simulation engine (Minecraft redstone semantics, double-buffered)
- Adjustable simulation speed (0.25x to 32x)
- Light/dark theme switching with localStorage persistence
- Free-drag canvas mode alongside grid mode
- Signal value display on wires
- Operation history panel
- User-defined wire colors
- Auto-save and version snapshots

**Phase 1 — Foundation**
- WebGL2 renderer with Grid/Component/Wire/Selection layers (instanced rendering)
- 7 built-in components: AND, OR, NOT, NAND, XOR, Switch, LED
- Event-driven simulation engine (Rust backend via Tauri IPC)
- Point-to-point L-shaped wire routing
- Command pattern undo/redo system (6 command types)
- Project save/load (JSON format, .cfproj)
- i18n support (Chinese and English) via i18next
- Tauri v2 desktop application (Windows, macOS, Linux)

[Unreleased]: https://github.com/Zw-awa/circuit-forge/compare/main...HEAD
