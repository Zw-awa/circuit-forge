import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../stores/editorStore';
import { useCustomComponentStore } from '../stores/customComponentStore';
import { usePluginStore } from '../stores/pluginStore';
import type { ComponentKind } from '../types/circuit';
import LuaScriptEditor from './LuaScriptEditor';

const COMPONENT_KINDS: Array<{ key: string; kind: ComponentKind }> = [
  { key: 'and', kind: 'And' },
  { key: 'or', kind: 'Or' },
  { key: 'not', kind: 'Not' },
  { key: 'nand', kind: 'Nand' },
  { key: 'xor', kind: 'Xor' },
  { key: 'switch', kind: 'Switch' },
  { key: 'led', kind: 'Led' },
  { key: 'button', kind: 'Button' },
  { key: 'clock', kind: 'Clock' },
  { key: 'random', kind: 'Random' },
  { key: 'constant', kind: 'Constant' },
  { key: 'sevenSegment', kind: 'SevenSegment' },
  { key: 'oscilloscope', kind: 'Oscilloscope' },
  { key: 'delayLine', kind: 'DelayLine' },
  { key: 'splitter', kind: 'Splitter' },
  { key: 'merger', kind: 'Merger' },
];

function ComponentPanel() {
  const { t } = useTranslation();
  const activeTool = useEditorStore((s) => s.activeTool);
  const placingComponentKind = useEditorStore((s) => s.placingComponentKind);
  const activeSubCircuitDefId = useEditorStore((s) => s.activeSubCircuitDefId);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const setPlacingComponentKind = useEditorStore((s) => s.setPlacingComponentKind);
  const setActiveSubCircuitDefId = useEditorStore((s) => s.setActiveSubCircuitDefId);

  const subCircuitDefs = useCustomComponentStore((s) => s.subCircuitDefs);
  const loadSubCircuitDefs = useCustomComponentStore((s) => s.loadSubCircuitDefs);

  const pluginComponents = usePluginStore((s) => s.pluginComponents);
  const plugins = usePluginStore((s) => s.plugins);
  const loadPlugins = usePluginStore((s) => s.loadPlugins);
  const activePluginId = useEditorStore((s) => s.activePluginId);
  const activePluginKindName = useEditorStore((s) => s.activePluginKindName);
  const setActivePlugin = useEditorStore((s) => s.setActivePlugin);

  const [showLuaEditor, setShowLuaEditor] = useState(false);

  useEffect(() => {
    loadSubCircuitDefs();
    loadPlugins();
  }, [loadSubCircuitDefs, loadPlugins]);

  const handleClick = (kind: ComponentKind) => {
    setActiveTool('place');
    setPlacingComponentKind(kind);
    setActiveSubCircuitDefId(null);
    setActivePlugin(null, null);
  };

  const handleCustomClick = (defId: number) => {
    setActiveTool('place');
    setPlacingComponentKind('SubCircuit');
    setActiveSubCircuitDefId(defId);
    setActivePlugin(null, null);
  };

  const handlePluginClick = (pluginId: string, kindName: string) => {
    setActiveTool('place');
    setPlacingComponentKind('Plugin');
    setActiveSubCircuitDefId(null);
    setActivePlugin(pluginId, kindName);
  };

  const isPlacingCustom = activeTool === 'place' && placingComponentKind === 'SubCircuit';
  const isPlacingPlugin = activeTool === 'place' && placingComponentKind === 'Plugin';

  return (
    <>
      <div className="component-panel">
        <div className="panel-header">{t('panel.components')}</div>
        <div className="component-list">
          {COMPONENT_KINDS.map(({ key, kind }) => (
            <div
              key={key}
              className={
                'component-item' +
                (activeTool === 'place' && placingComponentKind === kind ? ' active' : '')
              }
              onClick={() => handleClick(kind)}
            >
              {t(`components.${key}`)}
            </div>
          ))}
        </div>

        {subCircuitDefs.length > 0 && (
          <>
            <div className="panel-header">{t('panel.customComponents')}</div>
            <div className="component-list">
              {subCircuitDefs.map((def) => (
                <div
                  key={def.id}
                  className={
                    'component-item' +
                    (isPlacingCustom && activeSubCircuitDefId === def.id ? ' active' : '')
                  }
                  onClick={() => handleCustomClick(def.id)}
                >
                  📦 {def.name}
                </div>
              ))}
            </div>
          </>
        )}

        {Object.keys(pluginComponents).length > 0 && (
          <>
            <div className="panel-header">{t('panel.plugins')}</div>
            <div className="component-list">
              {plugins.filter((p) => p.enabled).map((plugin) =>
                (pluginComponents[plugin.id] || []).map((reg) => (
                  <div
                    key={`${plugin.id}_${reg.kind_name}`}
                    className={
                      'component-item' +
                      (isPlacingPlugin && activePluginId === plugin.id && activePluginKindName === reg.kind_name ? ' active' : '')
                    }
                    onClick={() => handlePluginClick(plugin.id, reg.kind_name)}
                  >
                    📜 {reg.icon_label}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        <div className="panel-header">{t('panel.custom')}</div>
        <div className="component-list">
          <div
            className="component-item"
            onClick={() => setShowLuaEditor(true)}
          >
            📝 {t('lua.newComponent')}
          </div>
        </div>
      </div>

      {showLuaEditor && (
        <LuaScriptEditor onClose={() => setShowLuaEditor(false)} />
      )}
    </>
  );
}

export default ComponentPanel;
