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

**CircuitForge** is an open-source, universal logic circuit sandbox editor and simulator.

Place logic gates, draw wires, flip switches, watch LEDs — starting from the most basic components, build anything from simple combinational logic to complex processors through custom rules and component encapsulation. Inspired by digital circuits, Minecraft redstone, and Terraria wiring, but not limited to any single model.

## Features

**Editor**
- Infinite canvas with grid-aligned or free-drag placement modes
- Logic gates (AND / OR / NOT / NAND / XOR), switches, LEDs, and more
- Point-to-point wiring with automatic L-shaped routing
- Undo / redo, project save and load

**Simulation**
- High-performance Rust-powered simulation engine
- Event-driven mode (standard digital circuits) and tick-driven mode (MC redstone style)
- Real-time signal visualization: wire colors follow signal state, LEDs light up

**Planned**
- Sub-circuit encapsulation — package circuits into reusable custom components
- Visual rule editor — define custom signal types, propagation, and attenuation
- Skin system — fully customizable component appearance, wire styles, and UI themes
- Workshop — community sharing of projects, components, and rule packs
- Verilog / VHDL code export

## Getting Started

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Bun](https://bun.sh/) (latest)
- [Tauri v2 system dependencies](https://v2.tauri.app/start/prerequisites/)

### Build & Run

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

## Roadmap

- [x] **Phase 1** — Foundation: canvas rendering, basic components, event-driven simulation, save/load, undo/redo
- [ ] **Phase 2** — Core experience: all components, bus wiring, free-drag mode, tick-driven simulation, themes
- [ ] **Phase 3** — Encapsulation & rules: sub-circuit packaging, scripting, rule editor
- [ ] **Phase 4** — Skins & export: skin system, Verilog export, debug tools
- [ ] **Phase 5** — Community & plugins: workshop, plugin system, performance optimization

## Tech Stack

| Component | Technology |
|-----------|------------|
| Desktop Framework | Tauri v2 |
| Frontend | React + TypeScript + Vite |
| Canvas Rendering | Custom WebGL2 |
| State Management | zustand |
| Simulation Engine | Rust |
| Internationalization | i18next |
| Package Manager | bun |

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) to get started.

Developer documentation is in [`docs/design/`](./docs/design/), with full architecture design and implementation guides.

## License

[Apache License 2.0](./LICENSE) — see [NOTICE](./NOTICE) for details.

Copyright 2026 Zw-awa
