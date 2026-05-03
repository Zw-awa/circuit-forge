import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import { saveProject, loadProject } from '../ipc/simulationIpc';
import type { ComponentData, PinData, WireData } from '../ipc/simulationIpc';
import type { ComponentKind, CircuitComponent, Pin, Wire } from '../types/circuit';
import { editorStore, useEditorStore } from '../stores/editorStore';
import { historyStore, useHistoryStore } from '../stores/historyStore';
import { simulationStore, useSimulationStore } from '../stores/simulationStore';
import { simStart, simPause, simStep, simReset, setSimSpeed, setSimMode, simStepN } from '../ipc/simulationIpc';
import { SnapToGridCmd } from '../commands/SnapToGridCmd';

const SPEEDS: Array<{ label: string; value: number }> = [
  { label: 'simulation.speed025x', value: 0.25 },
  { label: 'simulation.speed05x', value: 0.5 },
  { label: 'simulation.speed1x', value: 1.0 },
  { label: 'simulation.speed2x', value: 2.0 },
  { label: 'simulation.speed4x', value: 4.0 },
  { label: 'simulation.speedMax', value: 32.0 },
];

const WIRE_COLORS: Array<{ label: string; argb: number }> = [
  { label: 'Default (Signal)', argb: 0 },
  { label: 'Red', argb: 0xFFE74C3C },
  { label: 'Orange', argb: 0xFFE67E22 },
  { label: 'Yellow', argb: 0xFFF1C40F },
  { label: 'Green', argb: 0xFF2ECC71 },
  { label: 'Teal', argb: 0xFF1ABC9C },
  { label: 'Blue', argb: 0xFF3498DB },
  { label: 'Purple', argb: 0xFF9B59B6 },
  { label: 'Pink', argb: 0xFFE91E63 },
  { label: 'White', argb: 0xFFECF0F1 },
];

function Toolbar() {
  const { t } = useTranslation();
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const canUndo = useHistoryStore((s) => s.canUndo);
  const canRedo = useHistoryStore((s) => s.canRedo);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const simStatus = useSimulationStore((s) => s.status);
  const simMode = useSimulationStore((s) => s.mode);
  const speedMultiplier = useSimulationStore((s) => s.speedMultiplier);
  const canvasMode = useEditorStore((s) => s.canvasMode);
  const setCanvasMode = useEditorStore((s) => s.setCanvasMode);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [stepNInput, setStepNInput] = useState<string | null>(null);

  const handleSpeedChange = useCallback(async (multiplier: number) => {
    try {
      await setSimSpeed(multiplier);
      simulationStore.getState().setSpeedMultiplier(multiplier);
    } catch (e) { console.error('Set speed failed:', e); }
    setSpeedOpen(false);
  }, []);

  const handleModeToggle = useCallback(async () => {
    const next = simMode === 'event' ? 'tick' : 'event';
    try {
      await setSimMode(next);
      simulationStore.getState().setMode(next);
    } catch (e) { console.error('Set mode failed:', e); }
  }, [simMode]);

  const handleStepN = useCallback(async () => {
    const n = stepNInput ? parseInt(stepNInput, 10) : null;
    setStepNInput(null);
    if (n && n > 0 && n <= 1000) {
      try {
        const changed = await simStepN(n);
        simulationStore.getState().updateSignals(changed);
      } catch (e) { console.error('Step N failed:', e); }
    }
  }, [stepNInput]);

  // ---- Save/Load handlers ----

  async function handleSave() {
    try {
      const json = await saveProject();
      const path = await save({
        filters: [{ name: 'CircuitForge Project', extensions: ['cfproj'] }],
      });
      if (path) {
        await writeTextFile(path, json);
        editorStore.getState().markClean();
        const name = path.split(/[\\/]/).pop()?.replace('.cfproj', '') || t('file.untitled');
        document.title = `${name} - CircuitForge`;
      }
    } catch (e) {
      console.error('Save failed:', e);
    }
  }

  async function handleLoad() {
    try {
      const path = await open({
        filters: [{ name: 'CircuitForge Project', extensions: ['cfproj'] }],
        multiple: false,
      });
      if (path) {
        const json = await readTextFile(path as string);
        const result = await loadProject(json);

        // Clear all state
        editorStore.getState().clearCircuit();
        historyStore.getState().clear();
        simulationStore.getState().reset();

        // Build component map for pin worldX/worldY calculation
        const compMap = new Map<number, ComponentData>(
          result.components.map((c: ComponentData) => [c.id, c]),
        );
        const pinsWithWorld: Pin[] = result.pins.map((p: PinData) => {
          const owner = compMap.get(p.owner);
          return {
            id: p.id,
            ownerId: p.owner,
            isOutput: p.isOutput,
            worldX: (owner ? owner.x : 0) + p.offsetX,
            worldY: (owner ? owner.y : 0) + p.offsetY,
            offsetX: p.offsetX,
            offsetY: p.offsetY,
          };
        });

        const components: CircuitComponent[] = result.components.map((c: ComponentData) => ({
          id: c.id,
          kind: c.kind as ComponentKind,
          x: c.x,
          y: c.y,
          inputPins: c.inputPins,
          outputPins: c.outputPins,
        }));

        const wires: Wire[] = result.wires.map((w: WireData) => ({
          id: w.id,
          start: 'Pin' in w.start
            ? { type: 'pin' as const, id: w.start.Pin }
            : { type: 'junction' as const, id: w.start.Junction as number },
          end: 'Pin' in w.end
            ? { type: 'pin' as const, id: w.end.Pin }
            : { type: 'junction' as const, id: w.end.Junction as number },
          netId: w.netId,
          color: w.color ?? undefined,
        }));

        editorStore.getState().loadCircuit(components, wires, pinsWithWorld);

        const name = (path as string).split(/[\\/]/).pop()?.replace('.cfproj', '') || t('file.untitled');
        document.title = `${name} - CircuitForge`;
      }
    } catch (e) {
      console.error('Load failed:', e);
    }
  }

  // ---- Keyboard shortcut listeners ----

  useEffect(() => {
    const onSave = () => { handleSave(); };
    const onOpen = () => { handleLoad(); };
    window.addEventListener('circuit-save', onSave);
    window.addEventListener('circuit-open', onOpen);
    return () => {
      window.removeEventListener('circuit-save', onSave);
      window.removeEventListener('circuit-open', onOpen);
    };
  }, []);

  return (
    <>
    <div className="toolbar">
      <div className="toolbar-group">
        <button
          className={activeTool === 'select' ? 'active' : ''}
          onClick={() => setActiveTool('select')}
          title={t('toolbar.select')}
        >
          {t('toolbar.select')} (1)
        </button>
        <button
          className={activeTool === 'place' ? 'active' : ''}
          onClick={() => setActiveTool('place')}
          title={t('toolbar.place')}
        >
          {t('toolbar.place')} (2)
        </button>
        <button
          className={activeTool === 'wire' ? 'active' : ''}
          onClick={() => setActiveTool('wire')}
          title={t('toolbar.wire')}
        >
          {t('toolbar.wire')} (3)
        </button>
        <button
          className={activeTool === 'delete' ? 'active' : ''}
          onClick={() => setActiveTool('delete')}
          title={t('toolbar.delete')}
        >
          {t('toolbar.delete')} (4)
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          disabled={simStatus === 'running'}
          onClick={() => {
            simStart().then(() => useSimulationStore.getState().setStatus('running')).catch(e => console.error('Sim start failed:', e));
          }}
          title={t('simulation.run')}
        >
          ▶ {t('simulation.run')}
        </button>
        <button
          disabled={simStatus === 'stopped' || simStatus === 'paused'}
          onClick={() => {
            simPause().then(() => useSimulationStore.getState().setStatus('paused')).catch(e => console.error('Sim pause failed:', e));
          }}
          title={t('simulation.pause')}
        >
          ⏸ {t('simulation.pause')}
        </button>
        <button
          onClick={() => {
            simStep().then(changed => useSimulationStore.getState().updateSignals(changed)).catch(e => console.error('Sim step failed:', e));
          }}
          title={t('simulation.step')}
        >
          ⏭ {t('simulation.step')}
        </button>
        <button
          onClick={() => {
            simReset().then(() => useSimulationStore.getState().reset()).catch(e => console.error('Sim reset failed:', e));
          }}
          title={t('simulation.reset')}
        >
          ⏹ {t('simulation.reset')}
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <div className="toolbar-speed-wrapper">
          <button
            className="toolbar-speed-btn"
            onClick={() => setSpeedOpen(!speedOpen)}
            title={t('simulation.speedLabel')}
          >
            {SPEEDS.find(s => s.value === speedMultiplier)?.value ?? speedMultiplier}x
          </button>
          {speedOpen && (
            <div className="toolbar-speed-dropdown">
              {SPEEDS.map(s => (
                <button
                  key={s.value}
                  className={speedMultiplier === s.value ? 'active' : ''}
                  onClick={() => handleSpeedChange(s.value)}
                >
                  {t(s.label)}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleModeToggle}
          title={simMode === 'event' ? t('toolbar.modeTickDriven') : t('toolbar.modeEventDriven')}
        >
          {simMode === 'event' ? t('simulation.eventMode') : t('simulation.tickMode')}
        </button>
        {stepNInput !== null ? (
          <div className="toolbar-stepn-wrapper">
            <input
              type="number"
              min={1}
              max={1000}
              className="toolbar-stepn-input"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleStepN(); if (e.key === 'Escape') setStepNInput(null); }}
              onChange={(e) => setStepNInput(e.target.value)}
            />
            <button onClick={handleStepN}>{t('simulation.stepN')}</button>
          </div>
        ) : (
          <button onClick={() => setStepNInput('1')} title={t('simulation.stepN')}>
            ⏭N
          </button>
        )}
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          onClick={() => {
            const next = canvasMode === 'grid' ? 'free' : 'grid';
            setCanvasMode(next);
            if (next === 'grid') {
              const cmd = new SnapToGridCmd();
              historyStore.getState().execute(cmd);
            }
          }}
          title={canvasMode === 'grid' ? t('toolbar.freeMode') : t('toolbar.gridMode')}
        >
          {canvasMode === 'grid' ? '⊞ Grid' : '⊡ Free'}
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button disabled={!canUndo} onClick={() => undo()} title={t('toolbar.undo')}>
          ↩ {t('toolbar.undo')}
        </button>
        <button disabled={!canRedo} onClick={() => redo()} title={t('toolbar.redo')}>
          ↪ {t('toolbar.redo')}
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button onClick={handleSave} title={t('toolbar.save')}>
          💾 {t('toolbar.save')}
        </button>
        <button onClick={handleLoad} title={t('toolbar.load')}>
          📂 {t('toolbar.load')}
        </button>
        <button onClick={async () => {
          try {
            const json = await saveProject();
            const ts = new Date().toISOString().replace(/[:.]/g, '-');
            const path = await save({
              filters: [{ name: 'CircuitForge Project', extensions: ['cfproj'] }],
              defaultPath: `snapshot-${ts}.cfproj`,
            });
            if (path) await writeTextFile(path, json);
          } catch (e) { console.error('Snapshot failed:', e); }
        }} title={t('toolbar.snapshot')}>
          📸 {t('toolbar.snapshot')}
        </button>
      </div>
    </div>
    {activeTool === 'wire' && (
      <div className="wire-color-bar">
        {WIRE_COLORS.map((wc) => {
          const ar = (wc.argb >>> 16) & 0xFF;
          const ag = (wc.argb >>> 8) & 0xFF;
          const ab = wc.argb & 0xFF;
          return (
            <button
              key={wc.argb}
              className="wire-color-btn"
              style={wc.argb !== 0 ? { backgroundColor: `rgb(${ar},${ag},${ab})` } : undefined}
              onClick={() => editorStore.getState().setWireColor(wc.argb === 0 ? undefined : wc.argb)}
              title={wc.label}
            >
              {wc.argb === 0 && t('wire.defaultColor')}
            </button>
          );
        })}
      </div>
    )}
    </>
  );
}

export default Toolbar;
