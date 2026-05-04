import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useEditorStore, editorStore } from '../stores/editorStore';
import { useSimulationStore } from '../stores/simulationStore';
import { useCustomComponentStore } from '../stores/customComponentStore';
import { useDebugStore } from '../stores/debugStore';
import { toggleSwitch, setComponentParam, pressButton, releaseButton, setConstantValue, setWireColor } from '../ipc/simulationIpc';
import { addBreakpoint, removeBreakpoint } from '../ipc/debugIpc';
import type { Breakpoint } from '../types/debug';
import TruthTableEditor from './TruthTableEditor';

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

function PropertyPanel() {
  const { t } = useTranslation();
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const components = useEditorStore((s) => s.components);
  const wires = useEditorStore((s) => s.wires);
  const pins = useEditorStore((s) => s.pins);
  const signals = useSimulationStore((s) => s.signals);
  const subCircuitDefs = useCustomComponentStore((s) => s.subCircuitDefs);

  const [showTruthTable, setShowTruthTable] = useState(false);

  const selectedArray = Array.from(selectedIds);
  const count = selectedArray.length;

  if (count === 0) {
    return (
      <div className="property-panel">
        <div className="panel-header">{t('panel.properties')}</div>
        <div className="property-empty">{t('panel.noSelection')}</div>
      </div>
    );
  }

  if (count > 1) {
    const compCount = selectedArray.filter((id) => components.has(id)).length;
    const wireCount = selectedArray.length - compCount;
    return (
      <div className="property-panel">
        <div className="panel-header">{t('panel.properties')}</div>
        <div className="property-empty">
          {t('panel.multipleSelected', { count })}
          {compCount > 0 && ` (${compCount} components)`}
          {wireCount > 0 && ` (${wireCount} wires)`}
        </div>
      </div>
    );
  }

  const id = selectedArray[0];
  const comp = components.get(id);

  if (comp) {
    const kindKey = comp.kind.toLowerCase();
    const isSwitch = comp.kind === 'Switch';
    const isButton = comp.kind === 'Button';
    const isClock = comp.kind === 'Clock';
    const isDelayLine = comp.kind === 'DelayLine';
    const isConstant = comp.kind === 'Constant';
    const isRandom = comp.kind === 'Random';
    const isSplitter = comp.kind === 'Splitter';
    const isMerger = comp.kind === 'Merger';
    const isOscilloscope = comp.kind === 'Oscilloscope';

    const inputPinsData = comp.inputPins
      .map((pinId) => pins.get(pinId))
      .filter(Boolean);
    const outputPinsData = comp.outputPins
      .map((pinId) => pins.get(pinId))
      .filter(Boolean);

    const getPinSignal = (pinId: number): string => {
      const pin = pins.get(pinId);
      if (!pin) return '-';
      for (const wire of wires.values()) {
        if (wire.start.id === pinId || wire.end.id === pinId) {
          const sig = signals.get(wire.netId);
          return sig === 'High' ? t('panel.high') : sig === 'Low' ? t('panel.low') : '-';
        }
      }
      return '-';
    };

    return (
      <div className="property-panel">
        <div className="panel-header">{t('panel.properties')}</div>
        <div className="property-content">
          <div className="property-row">
            <span className="property-label">{t('panel.id')}</span>
            <span className="property-value">{comp.id}</span>
          </div>
          <div className="property-row">
            <span className="property-label">{t('panel.type')}</span>
            <span className="property-value">{t(`components.${kindKey}`)}</span>
          </div>
          <div className="property-row">
            <span className="property-label">{t('panel.position')}</span>
            <span className="property-value">
              ({comp.x}, {comp.y})
            </span>
          </div>

          <div className="property-section">
            <button
              className="btn btn-sm btn-secondary"
              onClick={async () => {
                const bps = useDebugStore.getState().breakpoints;
                const existing = bps.find(
                  (bp) => 'Component' in bp.target && bp.target.Component === comp.id,
                );
                if (existing) {
                  await removeBreakpoint(existing.id);
                  useDebugStore.getState().removeBreakpoint(existing.id);
                } else {
                  const result = await addBreakpoint(
                    { Component: comp.id },
                    'SignalChanges',
                  );
                  const newBp: Breakpoint = {
                    id: result.id,
                    target: { Component: comp.id },
                    condition: 'SignalChanges',
                    enabled: true,
                  };
                  useDebugStore.getState().addBreakpoint(newBp);
                }
              }}
            >
              {(() => {
                const bps = useDebugStore.getState().breakpoints;
                const existing = bps.find(
                  (bp) => 'Component' in bp.target && bp.target.Component === comp.id,
                );
                return existing ? t('debug.removeBreakpoint') : t('debug.addBreakpoint');
              })()}
            </button>
          </div>

          {inputPinsData.length > 0 && (
            <div className="property-section">
              <div className="property-section-title">{t('panel.inputPins')}</div>
              {inputPinsData.map((pin) => (
                <div key={pin!.id} className="property-row pin-row">
                  <span className="property-label">
                    Pin {pin!.id}
                  </span>
                  <span
                    className="property-value signal"
                    data-signal={
                      getPinSignal(pin!.id) === t('panel.high') ? 'high' : 'low'
                    }
                  >
                    {getPinSignal(pin!.id)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {outputPinsData.length > 0 && (
            <div className="property-section">
              <div className="property-section-title">{t('panel.outputPins')}</div>
              {outputPinsData.map((pin) => (
                <div key={pin!.id} className="property-row pin-row">
                  <span className="property-label">
                    Pin {pin!.id}
                  </span>
                  <span
                    className="property-value signal"
                    data-signal={
                      getPinSignal(pin!.id) === t('panel.high') ? 'high' : 'low'
                    }
                  >
                    {getPinSignal(pin!.id)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {isSwitch && (
            <div className="property-section">
              <div className="property-section-title">{t('panel.switchState')}</div>
              <button
                className="switch-toggle-btn"
                onClick={() => {
                  toggleSwitch(comp.id).then((changed) => {
                    useSimulationStore.getState().updateSignals(changed);
                  });
                }}
              >
                {t('panel.switchState')}
              </button>
            </div>
          )}

          {isButton && (
            <div className="property-section">
              <div className="property-section-title">{t('components.button')}</div>
              <button
                className="switch-toggle-btn"
                onMouseDown={() => {
                  pressButton(comp.id).then((changed) => {
                    useSimulationStore.getState().updateSignals(changed);
                  });
                }}
                onMouseUp={() => {
                  releaseButton(comp.id).then((changed) => {
                    useSimulationStore.getState().updateSignals(changed);
                  });
                }}
              >
                {t('components.button')}
              </button>
            </div>
          )}

          {isClock && (
            <div className="property-section">
              <div className="property-section-title">{t('panel.clockPeriod')}</div>
              <input
                type="number"
                className="property-input"
                defaultValue={2}
                min={1}
                onChange={(e) => {
                  setComponentParam(comp.id, 'clock_period', parseInt(e.target.value, 10));
                }}
              />
              <div className="property-section-title">{t('panel.clockDuty')}</div>
              <input
                type="range"
                className="property-slider"
                defaultValue={50}
                min={0}
                max={100}
                onChange={(e) => {
                        setComponentParam(comp.id, 'clock_duty', parseInt(e.target.value, 10) / 100);
                }}
              />
            </div>
          )}

          {isDelayLine && (
            <div className="property-section">
              <div className="property-section-title">{t('panel.delayTicks')}</div>
              <input
                type="number"
                className="property-input"
                defaultValue={1}
                min={1}
                onChange={(e) => {
                  setComponentParam(comp.id, 'delay_ticks', parseInt(e.target.value, 10));
                }}
              />
            </div>
          )}

          {isConstant && (
            <div className="property-section">
              <div className="property-section-title">{t('panel.constantValue')}</div>
              <select
                className="property-select"
                defaultValue="Low"
                onChange={(e) => {
                  setConstantValue(comp.id, e.target.value).then((changed) => {
                    useSimulationStore.getState().updateSignals(changed);
                  });
                }}
              >
                <option value="Low">{t('panel.low')}</option>
                <option value="High">{t('panel.high')}</option>
              </select>
            </div>
          )}

          {isRandom && (
            <div className="property-section">
              <div className="property-section-title">{t('panel.randomProbability')}</div>
              <input
                type="range"
                className="property-slider"
                defaultValue={50}
                min={0}
                max={100}
                onChange={(e) => {
                  setComponentParam(comp.id, 'random_probability', parseInt(e.target.value, 10));
                }}
              />
            </div>
          )}

          {(isSplitter || isMerger) && (
            <div className="property-section">
              <div className="property-section-title">{t('panel.busWidth')}</div>
              <input
                type="number"
                className="property-input"
                defaultValue={4}
                min={1}
                max={64}
                onChange={(e) => {
                  setComponentParam(comp.id, 'bus_width', parseInt(e.target.value, 10));
                }}
              />
            </div>
          )}

          {isOscilloscope && (
            <div className="property-section">
              <div className="property-section-title">{t('panel.channels')}</div>
              <input
                type="number"
                className="property-input"
                defaultValue={1}
                min={1}
                max={4}
                onChange={(e) => {
                  setComponentParam(comp.id, 'oscilloscope_channels', parseInt(e.target.value, 10));
                }}
              />
              <div className="property-section-title">{t('panel.timeWindow')}</div>
              <input
                type="number"
                className="property-input"
                defaultValue={64}
                min={10}
                max={10000}
                onChange={(e) => {
                  setComponentParam(comp.id, 'oscilloscope_time_window', parseInt(e.target.value, 10));
                }}
              />
            </div>
          )}

          {(comp.subCircuitDefId || comp.luaScriptDefId) && (() => {
            const defId = comp.subCircuitDefId ?? comp.luaScriptDefId!;
            const defType = comp.subCircuitDefId ? 'SubCircuit' : 'LuaScript';
            const def = subCircuitDefs.find((d) => d.id === defId);
            const defName = def?.name ?? `Custom ${defType}`;
            const inputPinNames = comp.inputPins.map((_, i) => `In ${i + 1}`);
            const outputPinNames = comp.outputPins.map((_, i) => `Out ${i + 1}`);
            return (
              <>
                <div className="property-section">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => setShowTruthTable(true)}
                  >
                    {t('truthTable.verify')}
                  </button>
                </div>
                {showTruthTable && (
                  <TruthTableEditor
                    onClose={() => setShowTruthTable(false)}
                    defId={defId}
                    defName={defName}
                    defType={defType}
                    inputPinNames={inputPinNames}
                    outputPinNames={outputPinNames}
                  />
                )}
              </>
            );
          })()}
        </div>
      </div>
    );
  }

  const wire = wires.get(id);
  if (wire) {
    const signal = signals.get(wire.netId);
    const signalText = signal === 'High' ? t('panel.high') : signal === 'Low' ? t('panel.low') : '-';
    const pinAId = wire.start.id;
    const pinBId = wire.end.id;
    return (
      <div className="property-panel">
        <div className="panel-header">{t('panel.properties')}</div>
        <div className="property-content">
          <div className="property-row">
            <span className="property-label">{t('panel.id')}</span>
            <span className="property-value">{wire.id}</span>
          </div>
          <div className="property-row">
            <span className="property-label">{t('panel.pinA')}</span>
            <span className="property-value">{pinAId}</span>
          </div>
          <div className="property-row">
            <span className="property-label">{t('panel.pinB')}</span>
            <span className="property-value">{pinBId}</span>
          </div>
          <div className="property-row">
            <span className="property-label">{t('panel.netId')}</span>
            <span className="property-value">{wire.netId}</span>
          </div>
          <div className="property-row">
            <span className="property-label">{t('panel.signal')}</span>
            <span className="property-value">{signalText}</span>
          </div>
          <div className="property-section">
            <button
              className="btn btn-sm btn-secondary"
              onClick={async () => {
                const bps = useDebugStore.getState().breakpoints;
                const existing = bps.find(
                  (bp) => 'Net' in bp.target && bp.target.Net === wire.netId,
                );
                if (existing) {
                  await removeBreakpoint(existing.id);
                  useDebugStore.getState().removeBreakpoint(existing.id);
                } else {
                  const result = await addBreakpoint(
                    { Net: wire.netId },
                    'SignalChanges',
                  );
                  const newBp: Breakpoint = {
                    id: result.id,
                    target: { Net: wire.netId },
                    condition: 'SignalChanges',
                    enabled: true,
                  };
                  useDebugStore.getState().addBreakpoint(newBp);
                }
              }}
            >
              {(() => {
                const bps = useDebugStore.getState().breakpoints;
                const existing = bps.find(
                  (bp) => 'Net' in bp.target && bp.target.Net === wire.netId,
                );
                return existing ? t('debug.removeBreakpoint') : t('debug.addBreakpoint');
              })()}
            </button>
          </div>
          <div className="property-section">
            <div className="property-section-title">{t('wire.color')}</div>
            <div className="wire-color-row">
              {WIRE_COLORS.map((wc) => {
                const ar = (wc.argb >>> 16) & 0xFF;
                const ag = (wc.argb >>> 8) & 0xFF;
                const ab = wc.argb & 0xFF;
                const isActive = (wc.argb === 0 && !wire.color) || wire.color === wc.argb;
                return (
                  <button
                    key={wc.argb}
                    className={`wire-color-btn${isActive ? ' active' : ''}`}
                    style={wc.argb !== 0 ? { backgroundColor: `rgb(${ar},${ag},${ab})` } : undefined}
                    onClick={async () => {
                      const newColor = wc.argb === 0 ? undefined : wc.argb;
                      if (newColor !== undefined) {
                        await setWireColor(wire.id, newColor);
                      }
                      editorStore.setState((state) => {
                        const next = new Map(state.wires);
                        const existing = next.get(wire.id);
                        if (existing) {
                          next.set(wire.id, { ...existing, color: newColor });
                        }
                        return { wires: next };
                      });
                    }}
                    title={wc.label}
                  >
                    {wc.argb === 0 && t('wire.defaultColor')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="property-panel">
      <div className="panel-header">{t('panel.properties')}</div>
      <div className="property-empty">{t('panel.noSelection')}</div>
    </div>
  );
}

export default PropertyPanel;
