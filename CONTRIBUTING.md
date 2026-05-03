# 贡献指南

感谢你对 CircuitForge 的关注！以下是参与贡献的方式。

## 报告 Bug

1. 在 [Issues](https://github.com/Zw-awa/circuit-forge/issues) 中搜索是否已有相同问题
2. 如果没有，创建新 issue，包含：
   - 操作系统和版本
   - CircuitForge 版本（或 commit hash）
   - 复现步骤
   - 期望行为 vs 实际行为
   - 截图（如果涉及 UI）

## 提交功能建议

在 [Issues](https://github.com/Zw-awa/circuit-forge/issues) 中创建 feature request，描述你想要的功能和使用场景。

## 提交代码

### 环境准备

- [Rust](https://www.rust-lang.org/tools/install)（最新稳定版）
- [Bun](https://bun.sh/)（最新版）
- [Tauri v2 系统依赖](https://v2.tauri.app/start/prerequisites/)

```bash
git clone https://github.com/Zw-awa/circuit-forge.git
cd circuit-forge
bun install
bun run tauri dev
```

### 开发流程

1. Fork 仓库并创建分支：`git checkout -b feature/my-feature`
2. 修改代码
3. 确保编译通过：
   - 前端：`bun run build`（TypeScript 类型检查 + Vite 构建）
   - 后端：`cd src-tauri && cargo check`
4. 提交：commit message 使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式
   - `feat: 新功能`
   - `fix: 修复 bug`
   - `docs: 文档变更`
   - `refactor: 重构`
5. 推送并创建 Pull Request

### 代码规范

**TypeScript**
- 使用 TypeScript strict mode
- 避免 `any`，必要时用 `unknown` + 类型守卫
- zustand store 使用 interface 定义状态类型

**Rust**
- 使用 `Result<T, String>` 作为 Tauri 命令返回类型
- 避免 `unwrap()`，使用 `?` 操作符
- 公共结构体派生 `Serialize`/`Deserialize`

**GLSL**
- 着色器版本：`#version 300 es`
- uniform 命名 `u_` 前缀，attribute 命名 `a_` 前缀

### 项目结构

```
src/                    # React + TypeScript 前端
src-tauri/src/          # Rust 后端
docs/design/            # 设计文档（不公开，仅本地）
```

详细架构说明见 `docs/design/DEVELOPER.md`。

## 国际化

如果你修改了 UI 文字，请同时更新 `src/i18n/en.json` 和 `src/i18n/zh-CN.json`。

## 许可证

提交代码即表示你同意将代码以 [Apache License 2.0](./LICENSE) 许可证发布。
