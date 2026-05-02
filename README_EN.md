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

## About

**CircuitForge** is an open-source, universal logic circuit sandbox editor and simulator. It provides the most fundamental logic components (NAND gates, delay lines, switches, etc.) and lets users build anything from simple logic gates to complex processors through a custom rule system and component encapsulation.

Inspired by digital circuits, Minecraft redstone, and Terraria wiring — but not limited to any single model. You define the rules.

## Features

- **Basic Components** — AND, OR, NOT, NAND, XOR logic gates, switches, buttons, clock sources, LEDs, 7-segment displays, oscilloscopes
- **Custom Rules** — Visual rule editor to define signal types, propagation behavior, and attenuation; built-in presets for MC Redstone / Terraria / Standard Digital Circuit styles
- **Player Encapsulation** — Package sub-circuits into reusable components, or define complex behavior with sandboxed JavaScript; supports multi-level nesting
- **Dual Simulation Modes** — Event-driven (efficient) and clock-tick-driven (game-style), switchable; Rust-powered engine for maximum performance
- **Dual Canvas Modes** — Grid-aligned (pixel art style) and free-drag (Logisim style), switchable; WebGL rendering
- **Skin System** — Fully customizable component appearance, wire styles, canvas background, and UI themes
- **Debug Tools** — Real-time signal display, breakpoints, waveform viewer, single-step execution
- **Import/Export** — Separate export for projects, skins, components, and rule packs; Verilog/VHDL code export
- **Workshop** — GitHub/Gitee community integration for sharing projects, components, skins, and rule packs
- **Plugin System** — Third-party plugins to extend components, tools, and export formats
- **Bilingual** — Full Chinese and English interface support

## Tech Stack

| Component | Technology |
|-----------|------------|
| Desktop Framework | Tauri v2 |
| Frontend | React + TypeScript |
| Canvas Rendering | WebGL |
| Simulation Engine | Rust |
| Script Sandbox | JavaScript (QuickJS WASM) |
| Package Manager | bun |

## Getting Started

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Bun](https://bun.sh/) (latest)
- [Tauri System Dependencies](https://v2.tauri.app/start/prerequisites/)

### Build & Run

```bash
# Clone the repository
git clone https://github.com/Zw-awa/circuit-forge.git
cd circuit-forge

# Install frontend dependencies
bun install

# Run in development mode
bun run tauri dev

# Build for production
bun run tauri build
```

## Project Structure

```
circuit-forge/
├── src/                    # React frontend source
├── src-tauri/              # Rust backend source (Tauri + simulation engine)
├── public/                 # Static assets
├── LICENSE                 # Apache 2.0 License
├── NOTICE                  # Copyright notice
├── README.md               # 中文说明
└── README_EN.md            # English README (this file)
```

## Roadmap

- [x] Phase 1 — Foundation (canvas, basic components, simulation engine, save/load)
- [ ] Phase 2 — Core Experience (all components, bus wiring, adjustable simulation, themes)
- [ ] Phase 3 — Encapsulation & Rules (sub-circuit packaging, scripting, rule editor)
- [ ] Phase 4 — Skins & Export (skin system, Verilog export, debug tools)
- [ ] Phase 5 — Community & Plugins (workshop, plugin system, performance optimization)

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) to get started.

## License

This project is licensed under the [Apache License 2.0](./LICENSE). See the [NOTICE](./NOTICE) file for details.

Copyright 2026 Zw-awa
