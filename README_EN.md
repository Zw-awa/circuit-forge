<p align="center">
  <h1 align="center">CircuitForge</h1>
  <p align="center">Build anything from basic gates</p>
  <p align="center">
    <a href="./README.md">中文</a> | English
  </p>
  <p align="center">
    <a href="https://github.com/Zw-awa/circuit-forge/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="License"></a>
  </p>
</p>

---

**CircuitForge** is an open-source, universal logic circuit sandbox editor and simulator. Place logic gates, draw wires, flip switches, watch LEDs — build arbitrarily complex circuits from the most basic components.

<!-- TODO: Add screenshot -->
<!-- ![CircuitForge Screenshot](docs/images/screenshot.png) -->

## Quick Start

> CircuitForge is under active development. No official release yet.

**Download installer** (recommended): Go to [GitHub Releases](https://github.com/Zw-awa/circuit-forge/releases) to download the installer for your platform.

<details>
<summary><b>Build from source (for developers)</b></summary>

Requires [Rust](https://www.rust-lang.org/tools/install), [Bun](https://bun.sh/), and [Tauri v2 system dependencies](https://v2.tauri.app/start/prerequisites/).

```bash
git clone https://github.com/Zw-awa/circuit-forge.git
cd circuit-forge
bun install
bun run tauri dev
```

Build for production:

```bash
bun run tauri build
```

</details>

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [User Data & Telemetry Policy](#user-data--telemetry-policy)
- [Security](#security)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Features

**Editor**
- Infinite canvas with grid-aligned or free-drag placement modes
- 16 built-in components: logic gates (AND / OR / NOT / NAND / XOR), switches, buttons, clocks, LEDs, 7-segment displays, oscilloscopes, delay lines, splitters, and more
- Bus/junction wiring with automatic L-shaped routing
- Undo / redo, project save and load
- Light/dark theme switching, custom wire colors

**Simulation**
- High-performance Rust-powered simulation engine
- Event-driven mode (standard digital circuits) and tick-driven mode (Minecraft redstone style)
- Adjustable simulation speed (0.25x to 32x)
- Real-time signal visualization: wire colors follow signal state, LEDs light up

**Encapsulation & Rules**
- Sub-circuit encapsulation: package circuits into reusable custom components with multi-level nesting
- Lua script encapsulation: define component behavior with Lua code (state machines, counters, etc.)
- Truth table verification: write expected truth tables, automatically test component behavior
- Rule pack system: presets for Minecraft Redstone / Terraria / Standard Digital, with custom rule support

**More**
- Bilingual interface (Chinese / English)
- Custom component export/import (.cfcomp format)
- Operation history panel, version snapshots

## Installation

### Download Installer

| Platform | Format | Notes |
|----------|--------|-------|
| Windows | `.msi` / `.exe` | Double-click to install |
| macOS | `.dmg` | Drag to Applications |
| Linux | `.AppImage` / `.deb` | AppImage runs directly, deb via dpkg |

Go to [GitHub Releases](https://github.com/Zw-awa/circuit-forge/releases) for the latest version.

> No official release yet. To try it out, build from source (see [Quick Start](#quick-start)).

### Build from Source

**Prerequisites**:
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Bun](https://bun.sh/) (latest)
- [Tauri v2 system dependencies](https://v2.tauri.app/start/prerequisites/)

```bash
git clone https://github.com/Zw-awa/circuit-forge.git
cd circuit-forge
bun install
bun run tauri dev      # development mode
bun run tauri build    # production build
```

## Usage

1. **Place components**: Select from the left panel, click on the canvas to place
2. **Draw wires**: Switch to wire tool (shortcut `3`), click an output pin, then an input pin
3. **Simulate**: Click the run button in the toolbar, or toggle switches to watch signal propagation
4. **Save**: `Ctrl+S` to save the project as a `.cfproj` file

| Shortcut | Action |
|----------|--------|
| `1` | Select tool |
| `2` | Place tool |
| `3` | Wire tool |
| `4` | Delete tool |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| Scroll wheel | Zoom |
| Middle-click drag / Space+left-click | Pan |

## Project Structure

```
circuit-forge/
├── src/                    # React + TypeScript frontend
│   ├── components/         # UI components
│   ├── renderer/           # WebGL2 renderer
│   ├── interaction/        # Mouse/keyboard interaction
│   ├── stores/             # zustand state management
│   └── i18n/               # Internationalization
├── src-tauri/              # Rust backend
│   └── src/
│       ├── circuit/        # Circuit data model
│       ├── simulation/     # Simulation engine
│       ├── scripting/      # Lua script sandbox
│       ├── rules/          # Rule pack system
│       └── verification/   # Truth table verification
└── docs/                   # Documentation
```

### Configuration

- Project files: `.cfproj` (JSON format)
- Custom components: `.cfcomp` (JSON format, shareable)
- User preferences (theme, etc.) stored in the system app data directory

### Localization (i18n)

The interface supports Chinese and English, switchable from the status bar. Translation files are in `src/i18n/`.

## User Data & Telemetry Policy

CircuitForge **does not collect any user data**.

- No telemetry, no analytics, no usage statistics
- No network requests (unless you explicitly use import/export features to access the local file system)
- All data stays on your machine

## Security

### Reporting a Vulnerability

If you discover a security vulnerability, please report it privately via [GitHub Security Advisory](https://github.com/Zw-awa/circuit-forge/security/advisories/new). Do not disclose it in a public issue.

## Roadmap

- [x] **Phase 1** — Foundation: canvas rendering, basic components, event-driven simulation, save/load, undo/redo
- [x] **Phase 2** — Core experience: all components, bus wiring, free-drag mode, tick-driven simulation, themes
- [x] **Phase 3** — Encapsulation & rules: sub-circuit packaging, Lua scripting, rule editor, truth table verification
- [ ] **Phase 4** — Skins & export: skin system, Verilog export, debug tools
- [x] **Phase 5** — Community & plugins: workshop, plugin system, performance optimization

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) to get started.

## License

[Apache License 2.0](./LICENSE) — see [NOTICE](./NOTICE) for details.

Copyright 2026 Zw-awa
