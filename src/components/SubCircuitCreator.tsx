import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistoryStore } from '../stores/historyStore';
import { CreateSubCircuitCmd } from '../commands/CreateSubCircuitCmd';
import type { ExternalPin } from '../types/subcircuit';

interface DanglingPin {
  pinId: number;
  name: string;
  direction: 'input' | 'output';
}

interface SubCircuitCreatorProps {
  onClose: () => void;
  selectedComponentIds: number[];
  danglingPins: DanglingPin[];
}

function SubCircuitCreator({
  onClose,
  selectedComponentIds,
  danglingPins,
}: SubCircuitCreatorProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pinConfigs, setPinConfigs] = useState<Map<number, DanglingPin>>(
    new Map(danglingPins.map((p) => [p.pinId, { ...p }])),
  );
  const [creating, setCreating] = useState(false);

  const updatePinName = (pinId: number, newName: string) => {
    setPinConfigs((prev) => {
      const next = new Map(prev);
      const existing = next.get(pinId);
      if (existing) next.set(pinId, { ...existing, name: newName });
      return next;
    });
  };

  const updatePinDirection = (pinId: number, direction: 'input' | 'output') => {
    setPinConfigs((prev) => {
      const next = new Map(prev);
      const existing = next.get(pinId);
      if (existing) next.set(pinId, { ...existing, direction });
      return next;
    });
  };

  const handleCreate = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);

    try {
      const pinEntries = Array.from(pinConfigs.entries());
      const externalPins: Partial<ExternalPin>[] = pinEntries.map(([pinId, p]) => {
        const isOutput = p.direction === 'output';
        const pinCount = pinEntries.filter(([, dp]) => dp.direction === p.direction).length;
        const ownIndex = pinEntries.filter(([, dp]) => dp.direction === p.direction).findIndex(([pid]) => pid === pinId);
        return {
          name: p.name,
          isOutput,
          internalPinId: pinId,
          offsetX: isOutput ? 8 : -8,
          offsetY: (ownIndex - (pinCount - 1) / 2) * 2,
        };
      });

      const cmd = new CreateSubCircuitCmd(name.trim(), description.trim(), selectedComponentIds, externalPins);
      await useHistoryStore.getState().execute(cmd);

      onClose();
    } catch (e) {
      console.error('Create subcircuit failed:', e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('subcircuit.create')}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>{t('subcircuit.name')}</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('subcircuit.namePlaceholder')}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>{t('subcircuit.description')}</label>
            <input
              type="text"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('subcircuit.descPlaceholder')}
            />
          </div>

          {pinConfigs.size > 0 && (
            <div className="form-group">
              <label>{t('subcircuit.pins')}</label>
              <div className="pin-config-list">
                {Array.from(pinConfigs.entries()).map(([pinId, pin]) => (
                  <div key={pinId} className="pin-config-row">
                    <input
                      type="text"
                      className="form-input pin-name-input"
                      value={pin.name}
                      onChange={(e) => updatePinName(pinId, e.target.value)}
                      placeholder={t('subcircuit.pinName')}
                    />
                    <select
                      className="form-select"
                      value={pin.direction}
                      onChange={(e) =>
                        updatePinDirection(pinId, e.target.value as 'input' | 'output')
                      }
                    >
                      <option value="input">{t('panel.inputPins')}</option>
                      <option value="output">{t('panel.outputPins')}</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>{t('subcircuit.selectedCount', { count: selectedComponentIds.length })}</label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            {t('subcircuit.cancel')}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={!name.trim() || creating}
          >
            {creating ? t('subcircuit.creating') : t('subcircuit.create')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubCircuitCreator;
