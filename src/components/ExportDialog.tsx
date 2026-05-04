import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import { exportRulePack, importRulePack, saveProject, loadProject } from '../ipc/simulationIpc';
import { exportCircuitForge, importCircuitForge } from '../ipc/packagingIpc';
import { exportCustomComponent, importCustomComponent } from '../ipc/customComponentIpc';
import { useSkinStore } from '../stores/skinStore';
import { exportSkinPack } from '../ipc/skinIpc';
import { editorStore } from '../stores/editorStore';
import { historyStore } from '../stores/historyStore';
import { simulationStore } from '../stores/simulationStore';
import type { ComponentData, PinData, WireData } from '../ipc/simulationIpc';
import type { ComponentKind, CircuitComponent, Pin, Wire } from '../types/circuit';

interface ExportDialogProps {
  onClose: () => void;
}

function ExportDialog({ onClose }: ExportDialogProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'project' | 'skin' | 'component' | 'rule'>('project');
  const activeSkin = useSkinStore((s) => s.activeSkin);

  const handleExportProject = async () => {
    try {
      const path = await save({
        filters: [{ name: 'CircuitForge Package', extensions: ['circuitforge'] }],
      });
      if (path) {
        await exportCircuitForge('CircuitForge Project', path as string);
      }
    } catch (e) {
      console.error('Export project failed:', e);
    }
  };

  const handleImportProject = async () => {
    try {
      const path = await open({
        filters: [{ name: 'CircuitForge Package', extensions: ['circuitforge'] }],
        multiple: false,
      });
      if (path) {
        await importCircuitForge(path as string);
        // import_circuitforge already loaded into engine via load_project
        const json = await saveProject();
        await loadProjectIntoEditor(await loadProject(json));
      }
    } catch (e) {
      console.error('Import project failed:', e);
    }
  };

  const handleExportSkin = async () => {
    if (!activeSkin) return;
    try {
      const path = await save({
        filters: [{ name: 'Skin Pack', extensions: ['cfskin'] }],
        defaultPath: `${activeSkin.id}.cfskin`,
      });
      if (path) {
        await exportSkinPack(path as string, activeSkin);
      }
    } catch (e) {
      console.error('Export skin failed:', e);
    }
  };

  const handleImportSkin = async () => {
    try {
      const path = await open({
        filters: [{ name: 'Skin Pack', extensions: ['cfskin'] }],
        multiple: false,
      });
      if (path) {
        const { loadSkinPack } = await import('../ipc/skinIpc');
        const result = await loadSkinPack(path as string);
        useSkinStore.getState().setActiveSkin(result.manifest);
        useSkinStore.getState().setSkinAssets(result.assets);
      }
    } catch (e) {
      console.error('Import skin failed:', e);
    }
  };

  const handleExportComponent = async () => {
    try {
      const state = editorStore.getState();
      const selectedIds = state.selectedIds;
      for (const id of selectedIds) {
        const comp = state.components.get(id);
        if (!comp) continue;
        if (comp.kind === 'SubCircuit' && comp.subCircuitDefId) {
          const json = await exportCustomComponent(comp.subCircuitDefId, 'subcircuit');
          const path = await save({
            filters: [{ name: 'CircuitForge Component', extensions: ['cfcomp'] }],
          });
          if (path) {
            await writeTextFile(path, json);
          }
          break;
        }
        if (comp.kind === 'LuaScript' && comp.luaScriptDefId) {
          const json = await exportCustomComponent(comp.luaScriptDefId, 'lua');
          const path = await save({
            filters: [{ name: 'CircuitForge Component', extensions: ['cfcomp'] }],
          });
          if (path) {
            await writeTextFile(path, json);
          }
          break;
        }
      }
    } catch (e) {
      console.error('Export component failed:', e);
    }
  };

  const handleImportComponent = async () => {
    try {
      const path = await open({
        filters: [{ name: 'CircuitForge Component', extensions: ['cfcomp'] }],
        multiple: false,
      });
      if (path) {
        const json = await readTextFile(path as string);
        await importCustomComponent(json);
      }
    } catch (e) {
      console.error('Import component failed:', e);
    }
  };

  const handleExportRule = async () => {
    try {
      const { useRuleStore } = await import('../stores/ruleStore');
      const activeRulePackId = useRuleStore.getState().activeRulePackId;
      if (activeRulePackId) {
        const json = await exportRulePack(activeRulePackId);
        const path = await save({
          filters: [{ name: 'CircuitForge Rule', extensions: ['cfrule'] }],
        });
        if (path) {
          await writeTextFile(path, json);
        }
      }
    } catch (e) {
      console.error('Export rule failed:', e);
    }
  };

  const handleImportRule = async () => {
    try {
      const path = await open({
        filters: [{ name: 'CircuitForge Rule', extensions: ['cfrule'] }],
        multiple: false,
      });
      if (path) {
        const json = await readTextFile(path as string);
        await importRulePack(json);
        const { useRuleStore } = await import('../stores/ruleStore');
        useRuleStore.getState().loadRulePacks();
      }
    } catch (e) {
      console.error('Import rule failed:', e);
    }
  };

  const tabs = [
    { key: 'project' as const, label: t('export.projectTab') },
    { key: 'skin' as const, label: t('export.skinTab') },
    { key: 'component' as const, label: t('export.componentTab') },
    { key: 'rule' as const, label: t('export.ruleTab') },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content export-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('export.title')}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="export-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`export-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="export-tab-content">
          {activeTab === 'project' && (
            <div className="export-actions">
              <button onClick={handleExportProject}>{t('export.exportProject')}</button>
              <button onClick={handleImportProject}>{t('export.importProject')}</button>
            </div>
          )}
          {activeTab === 'skin' && (
            <div className="export-actions">
              <button onClick={handleExportSkin} disabled={!activeSkin}>{t('export.exportSkin')}</button>
              <button onClick={handleImportSkin}>{t('export.importSkin')}</button>
            </div>
          )}
          {activeTab === 'component' && (
            <div className="export-actions">
              <button onClick={handleExportComponent}>{t('export.exportComponent')}</button>
              <button onClick={handleImportComponent}>{t('export.importComponent')}</button>
            </div>
          )}
          {activeTab === 'rule' && (
            <div className="export-actions">
              <button onClick={handleExportRule}>{t('export.exportRule')}</button>
              <button onClick={handleImportRule}>{t('export.importRule')}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

async function loadProjectIntoEditor(result: {
  components: ComponentData[];
  wires: WireData[];
  pins: PinData[];
}) {
  const { simReset } = await import('../ipc/simulationIpc');

  await simReset();
  editorStore.getState().clearCircuit();
  historyStore.getState().clear();
  simulationStore.getState().reset();

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
      netId: p.net,
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
      : { type: 'junction' as const, id: w.start.Junction },
    end: 'Pin' in w.end
      ? { type: 'pin' as const, id: w.end.Pin }
      : { type: 'junction' as const, id: w.end.Junction },
    netId: w.netId,
    color: w.color ?? undefined,
  }));

  editorStore.getState().loadCircuit(components, wires, pinsWithWorld);
}

export default ExportDialog;
