import { create } from 'zustand';
import type { CircuitComponent, Wire, Pin, Junction, ComponentKind } from '../types/circuit';
import type { ToolType, Viewport, CanvasMode } from '../types/editor';
import type { WireData } from '../ipc/simulationIpc';
import { enterSubCircuit, exitSubCircuit } from '../ipc/customComponentIpc';

function convertWireData(wire: WireData): Wire {
  return {
    id: wire.id,
    start: 'Pin' in (wire.start as Record<string, unknown>)
      ? { type: 'pin' as const, id: (wire.start as { Pin: number }).Pin }
      : { type: 'junction' as const, id: (wire.start as { Junction: number }).Junction },
    end: 'Pin' in (wire.end as Record<string, unknown>)
      ? { type: 'pin' as const, id: (wire.end as { Pin: number }).Pin }
      : { type: 'junction' as const, id: (wire.end as { Junction: number }).Junction },
    netId: wire.netId,
    color: wire.color ?? undefined,
  };
}

interface SubCircuitFrame {
  defId: number;
  defName: string;
  parentComponentId: number;
  savedState: {
    components: CircuitComponent[];
    wires: Wire[];
    pins: Pin[];
    junctions: Junction[];
  };
}

interface EditorState {
  components: Map<number, CircuitComponent>;
  wires: Map<number, Wire>;
  pins: Map<number, Pin>;
  junctions: Map<number, Junction>;
  activeTool: ToolType;
  placingComponentKind: ComponentKind | null;
  activeSubCircuitDefId: number | null;
  activeLuaDefId: number | null;
  selectedIds: Set<number>;
  hoveredId: number | null;
  viewport: Viewport;
  cursorX: number;
  cursorY: number;
  canvasMode: CanvasMode;
  activeWireColor: number | undefined;
  isDirty: boolean;
  subCircuitStack: SubCircuitFrame[];

  addComponent: (comp: CircuitComponent) => void;
  setCursor: (x: number, y: number) => void;
  removeComponent: (id: number) => void;
  moveComponent: (id: number, x: number, y: number) => void;
  addWire: (wire: Wire) => void;
  removeWire: (id: number) => void;
  addPins: (pins: Pin[]) => void;
  removePins: (ids: number[]) => void;
  setActiveTool: (tool: ToolType) => void;
  setPlacingComponentKind: (kind: ComponentKind | null) => void;
  setActiveSubCircuitDefId: (id: number | null) => void;
  setActiveLuaDefId: (id: number | null) => void;
  setSelection: (ids: number[]) => void;
  addToSelection: (id: number) => void;
  removeFromSelection: (id: number) => void;
  clearSelection: () => void;
  setHoveredId: (id: number | null) => void;
  setViewport: (viewport: Viewport) => void;
  loadCircuit: (components: CircuitComponent[], wires: Wire[], pins: Pin[]) => void;
  clearCircuit: () => void;
  addJunction: (junction: Junction) => void;
  removeJunction: (id: number) => void;
  setCanvasMode: (mode: CanvasMode) => void;
  setWireColor: (color: number | undefined) => void;
  markDirty: () => void;
  markClean: () => void;
  enterSubCircuit: (componentId: number) => Promise<void>;
  exitSubCircuit: () => Promise<void>;
  exitToLevel: (level: number) => Promise<void>;
}

export const editorStore = create<EditorState>()((set, get) => ({
  components: new Map(),
  wires: new Map(),
  pins: new Map(),
  junctions: new Map(),
  activeTool: 'select',
  placingComponentKind: null,
  activeSubCircuitDefId: null,
  activeLuaDefId: null,
  selectedIds: new Set(),
  hoveredId: null,
  viewport: { centerX: 0, centerY: 0, zoom: 40 },
  cursorX: 0,
  cursorY: 0,
  canvasMode: 'grid',
  activeWireColor: undefined,
  isDirty: false,
  subCircuitStack: [],

  setCursor: (x, y) => set({ cursorX: x, cursorY: y }),

  addComponent: (comp) =>
    set((state) => {
      const next = new Map(state.components);
      next.set(comp.id, comp);
      return { components: next, isDirty: true };
    }),

  removeComponent: (id) =>
    set((state) => {
      const next = new Map(state.components);
      next.delete(id);
      const nextPins = new Map(state.pins);
      for (const [pinId, pin] of nextPins) {
        if (pin.ownerId === id) nextPins.delete(pinId);
      }
      const nextWires = new Map(state.wires);
      const removedPinIds = new Set<number>();
      for (const pin of state.pins.values()) {
        if (pin.ownerId === id) removedPinIds.add(pin.id);
      }
      for (const [wireId, wire] of nextWires) {
        if (removedPinIds.has(wire.start.id) || removedPinIds.has(wire.end.id)) {
          nextWires.delete(wireId);
        }
      }
      const nextSelected = new Set(state.selectedIds);
      nextSelected.delete(id);
      return { components: next, pins: nextPins, wires: nextWires, selectedIds: nextSelected, isDirty: true };
    }),

  moveComponent: (id, x, y) =>
    set((state) => {
      const nextComponents = new Map(state.components);
      const comp = nextComponents.get(id);
      if (!comp) return {};
      const moved = { ...comp, x, y };
      nextComponents.set(id, moved);

      const nextPins = new Map(state.pins);
      for (const [pinId, pin] of nextPins) {
        if (pin.ownerId === id) {
          nextPins.set(pinId, {
            ...pin,
            worldX: x + pin.offsetX,
            worldY: y + pin.offsetY,
          });
        }
      }
      return { components: nextComponents, pins: nextPins, isDirty: true };
    }),

  addWire: (wire) =>
    set((state) => {
      const next = new Map(state.wires);
      next.set(wire.id, wire);
      return { wires: next, isDirty: true };
    }),

  removeWire: (id) =>
    set((state) => {
      const next = new Map(state.wires);
      next.delete(id);
      return { wires: next, isDirty: true };
    }),

  addPins: (pins) =>
    set((state) => {
      const next = new Map(state.pins);
      for (const pin of pins) {
        next.set(pin.id, pin);
      }
      return { pins: next, isDirty: true };
    }),

  removePins: (ids) =>
    set((state) => {
      const next = new Map(state.pins);
      for (const id of ids) {
        next.delete(id);
      }
      const nextWires = new Map(state.wires);
      const idSet = new Set(ids);
      for (const [wireId, wire] of nextWires) {
        if (idSet.has(wire.start.id) || idSet.has(wire.end.id)) {
          nextWires.delete(wireId);
        }
      }
      return { pins: next, wires: nextWires, isDirty: true };
    }),

  setActiveTool: (tool) => set({ activeTool: tool }),

  setPlacingComponentKind: (kind) => set({ placingComponentKind: kind }),

  setActiveSubCircuitDefId: (id) => set({ activeSubCircuitDefId: id }),

  setActiveLuaDefId: (id) => set({ activeLuaDefId: id }),

  setSelection: (ids) => set({ selectedIds: new Set(ids) }),

  addToSelection: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      next.add(id);
      return { selectedIds: next };
    }),

  removeFromSelection: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      next.delete(id);
      return { selectedIds: next };
    }),

  clearSelection: () => set({ selectedIds: new Set() }),

  setHoveredId: (id) => set({ hoveredId: id }),

  setViewport: (viewport) => set({ viewport }),

  loadCircuit: (components, wires, pins) =>
    set({
      components: new Map(components.map((c) => [c.id, c])),
      wires: new Map(wires.map((w) => [w.id, w])),
      pins: new Map(pins.map((p) => [p.id, p])),
      junctions: new Map(),
      selectedIds: new Set(),
      hoveredId: null,
      activeTool: 'select' as ToolType,
      placingComponentKind: null,
      activeSubCircuitDefId: null,
      activeLuaDefId: null,
      viewport: { centerX: 0, centerY: 0, zoom: 40 },
      cursorX: 0,
      cursorY: 0,
      canvasMode: 'grid',
      activeWireColor: undefined,
      isDirty: false,
      subCircuitStack: [],
    }),

  clearCircuit: () =>
    set({
      components: new Map(),
      wires: new Map(),
      pins: new Map(),
      junctions: new Map(),
      selectedIds: new Set(),
      hoveredId: null,
      canvasMode: 'grid',
      activeWireColor: undefined,
      isDirty: false,
      subCircuitStack: [],
    }),

  addJunction: (junction) =>
    set((state) => {
      const next = new Map(state.junctions);
      next.set(junction.id, junction);
      return { junctions: next, isDirty: true };
    }),

  removeJunction: (id) =>
    set((state) => {
      const next = new Map(state.junctions);
      next.delete(id);
      return { junctions: next, isDirty: true };
    }),

  setCanvasMode: (mode) => set({ canvasMode: mode }),

  setWireColor: (color) => set({ activeWireColor: color }),

  markDirty: () => set({ isDirty: true }),

  markClean: () => set({ isDirty: false }),

  enterSubCircuit: async (componentId: number) => {
    const state = get();
    const comp = state.components.get(componentId);
    if (!comp?.subCircuitDefId) return;

    const innerData = await enterSubCircuit(componentId);

    const savedState: SubCircuitFrame['savedState'] = {
      components: Array.from(state.components.values()),
      wires: Array.from(state.wires.values()),
      pins: Array.from(state.pins.values()),
      junctions: Array.from(state.junctions.values()),
    };

    const innerComps: CircuitComponent[] = innerData.components.map((c) => ({
      id: c.id,
      kind: c.kind as ComponentKind,
      x: c.x,
      y: c.y,
      inputPins: c.inputPins,
      outputPins: c.outputPins,
    }));

    const innerWires: Wire[] = innerData.wires.map(convertWireData);

    const compMap = new Map<number, CircuitComponent>(
      innerComps.map((c) => [c.id, c]),
    );
    const innerPins: Pin[] = innerData.pins.map((p) => {
      const owner = compMap.get(p.owner);
      return {
        id: p.id,
        ownerId: p.owner,
        isOutput: p.isOutput,
        offsetX: p.offsetX,
        offsetY: p.offsetY,
        worldX: (owner ? owner.x : 0) + p.offsetX,
        worldY: (owner ? owner.y : 0) + p.offsetY,
      };
    });

    set({
      subCircuitStack: [
        ...state.subCircuitStack,
        {
          defId: comp.subCircuitDefId,
          defName: innerData.defName,
          parentComponentId: componentId,
          savedState,
        },
      ],
      components: new Map(innerComps.map((c) => [c.id, c])),
      wires: new Map(innerWires.map((w) => [w.id, w])),
      pins: new Map(innerPins.map((p) => [p.id, p])),
      junctions: new Map(),
      selectedIds: new Set(),
      hoveredId: null,
    });
  },

  exitSubCircuit: async () => {
    const { subCircuitStack } = get();
    if (subCircuitStack.length === 0) return;
    await exitSubCircuit();
    const frame = subCircuitStack[subCircuitStack.length - 1];
    set({
      subCircuitStack: subCircuitStack.slice(0, -1),
      components: new Map(frame.savedState.components.map((c) => [c.id, c])),
      wires: new Map(frame.savedState.wires.map((w) => [w.id, w])),
      pins: new Map(frame.savedState.pins.map((p) => [p.id, p])),
      junctions: new Map(frame.savedState.junctions.map((j) => [j.id, j])),
      selectedIds: new Set(),
      hoveredId: null,
    });
  },

  exitToLevel: async (level: number) => {
    while (get().subCircuitStack.length > level) {
      await get().exitSubCircuit();
    }
  },
}));

export const useEditorStore = editorStore;
