import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useKeybindingStore } from '../stores/keybindingStore';

interface RecordingState {
  action: string;
}

interface ConflictInfo {
  action: string;
  key: string;
  conflictingAction: string;
  newKey: string;
}

const ACTION_CATEGORIES: Array<{ id: string; labelKey: string; actions: string[] }> = [
  {
    id: 'tools',
    labelKey: 'keybindings.tools',
    actions: ['tool.select', 'tool.place', 'tool.wire', 'tool.delete'],
  },
  {
    id: 'editing',
    labelKey: 'keybindings.editing',
    actions: ['edit.undo', 'edit.redo', 'edit.redo_alt', 'edit.delete', 'edit.delete_alt'],
  },
  {
    id: 'file',
    labelKey: 'keybindings.file',
    actions: ['file.save', 'file.open'],
  },
  {
    id: 'canvas',
    labelKey: 'keybindings.canvas',
    actions: ['canvas.escape', 'canvas.pan', 'canvas.freeMode', 'canvas.gridMode'],
  },
  {
    id: 'simulation',
    labelKey: 'keybindings.simulation',
    actions: ['sim.signalDisplay'],
  },
  {
    id: 'other',
    labelKey: 'keybindings.other',
    actions: ['snapshot.create', 'theme.toggle'],
  },
];

function normalizeEventKey(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');
  if (e.key === ' ') {
    parts.push('Space');
  } else if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
    parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
  }
  return parts.join('+');
}

export default function KeybindingSettings({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const bindings = useKeybindingStore((s) => s.bindings);
  const loadBindings = useKeybindingStore((s) => s.loadBindings);
  const setBinding = useKeybindingStore((s) => s.setBinding);
  const resetDefaults = useKeybindingStore((s) => s.resetDefaults);
  const exportConfig = useKeybindingStore((s) => s.exportConfig);
  const importConfig = useKeybindingStore((s) => s.importConfig);

  const [recording, setRecording] = useState<RecordingState | null>(null);
  const [conflict, setConflict] = useState<ConflictInfo | null>(null);

  useEffect(() => {
    loadBindings();
  }, [loadBindings]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!recording) return;
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setRecording(null);
        return;
      }

      const keyStr = normalizeEventKey(e);
      const conflictingAction = Array.from(bindings.entries()).find(
        ([, currentKey]) => currentKey === keyStr,
      );

      if (conflictingAction && conflictingAction[0] !== recording.action) {
        setConflict({
          action: recording.action,
          key: keyStr,
          conflictingAction: conflictingAction[0],
          newKey: keyStr,
        });
      } else {
        applyBinding(recording.action, keyStr);
      }
    },
    [recording, bindings],
  );

  useEffect(() => {
    if (recording) {
      window.addEventListener('keydown', handleKeyDown, true);
      return () => window.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [recording, handleKeyDown]);

  const applyBinding = async (action: string, key: string) => {
    try {
      await setBinding(action, key);
    } catch (err) {
      console.error('Set binding failed:', err);
    }
    setRecording(null);
    setConflict(null);
  };

  const handleOverride = async () => {
    if (!conflict) return;
    try {
      await setBinding(conflict.action, conflict.newKey);
    } catch (err) {
      console.error('Override binding failed:', err);
    }
    setRecording(null);
    setConflict(null);
  };

  const handleExport = async () => {
    try {
      const json = await exportConfig();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'keybindings.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleImport = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const text = await file.text();
        await importConfig(text);
      };
      input.click();
    } catch (err) {
      console.error('Import failed:', err);
    }
  };

  const getBindingEntry = (action: string): string => {
    return bindings.get(action) || '';
  };

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal-content keybinding-settings" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('keybindings.title')}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="keybinding-toolbar">
          <button onClick={() => resetDefaults()}>
            {t('keybindings.resetDefaults')}
          </button>
          <button onClick={handleExport}>
            {t('keybindings.export')}
          </button>
          <button onClick={handleImport}>
            {t('keybindings.import')}
          </button>
        </div>

        <div className="keybinding-list">
          {ACTION_CATEGORIES.map((category) => (
            <div key={category.id} className="keybinding-category">
              <h3>{t(category.labelKey)}</h3>
              {category.actions.map((action) => {
                const currentKey = getBindingEntry(action);
                if (!currentKey) return null;
                return (
                  <div key={action} className="keybinding-row">
                    <span className="keybinding-label">
                      {t(`keybindings.actions.${action}`, action)}
                    </span>
                    <span className="keybinding-key">
                      {recording?.action === action
                        ? t('keybindings.pressKey')
                        : currentKey}
                    </span>
                    <button
                      className="keybinding-edit-btn"
                      onClick={() => {
                        if (recording?.action === action) {
                          setRecording(null);
                        } else {
                          setRecording({ action });
                        }
                      }}
                    >
                      {recording?.action === action
                        ? t('keybindings.recording')
                        : t('keybindings.modify')}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {conflict && (
          <div className="keybinding-conflict-overlay">
            <div className="keybinding-conflict-dialog">
              <p>{t('keybindings.conflict')}</p>
              <p>
                {t('keybindings.conflictWith', {
                  action: t(`keybindings.actions.${conflict.conflictingAction}`, conflict.conflictingAction),
                })}
              </p>
              <div className="keybinding-conflict-actions">
                <button onClick={handleOverride}>
                  {t('keybindings.override')}
                </button>
                <button onClick={() => { setConflict(null); setRecording(null); }}>
                  {t('keybindings.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
