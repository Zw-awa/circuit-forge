import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createCustomRulePack } from '../ipc/simulationIpc';
import { useRuleStore } from '../stores/ruleStore';
import type { SignalType, PropagationMode, AttenuationModel, TickBehavior } from '../types/rules';

const PRESETS: Array<{
  nameKey: string;
  signalType: SignalType;
  propagationMode: PropagationMode;
  attenuation: AttenuationModel;
  tickBehavior: TickBehavior;
  gateDelay: number;
}> = [
  {
    nameKey: 'rules.presetMC',
    signalType: { type: 'integer', min: 0, max: 15 },
    propagationMode: 'tick_driven',
    attenuation: { type: 'linear', lossPerUnit: 1 },
    tickBehavior: 'synchronous',
    gateDelay: 1,
  },
  {
    nameKey: 'rules.presetTerraria',
    signalType: { type: 'bit' },
    propagationMode: 'tick_driven',
    attenuation: { type: 'none' },
    tickBehavior: 'asynchronous',
    gateDelay: 0,
  },
  {
    nameKey: 'rules.presetStandard',
    signalType: { type: 'bit' },
    propagationMode: 'event_driven',
    attenuation: { type: 'none' },
    tickBehavior: 'asynchronous',
    gateDelay: 0,
  },
];

function RuleEditor({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const loadRulePacks = useRuleStore((s) => s.loadRulePacks);

  const [presetIndex, setPresetIndex] = useState(2);
  const [signalType, setSignalType] = useState<SignalType>(PRESETS[2].signalType);
  const [propagationMode, setPropagationMode] = useState<PropagationMode>(PRESETS[2].propagationMode);
  const [attenuation, setAttenuation] = useState<AttenuationModel>(PRESETS[2].attenuation);
  const [tickBehavior, setTickBehavior] = useState<TickBehavior>(PRESETS[2].tickBehavior);
  const [gateDelay, setGateDelay] = useState(PRESETS[2].gateDelay);
  const [ruleName, setRuleName] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const applyPreset = (index: number) => {
    setPresetIndex(index);
    const preset = PRESETS[index];
    setSignalType(preset.signalType);
    setPropagationMode(preset.propagationMode);
    setAttenuation(preset.attenuation);
    setTickBehavior(preset.tickBehavior);
    setGateDelay(preset.gateDelay);
  };

  const handleSave = async () => {
    if (!ruleName.trim() || saving) return;
    setSaving(true);
    try {
      await createCustomRulePack({
        name: ruleName.trim(),
        description: ruleDescription.trim(),
        signalType,
        propagationMode,
        attenuation,
        tickBehavior,
        gateDelay,
      });
      await loadRulePacks();
      onClose();
    } catch (e) {
      console.error('Save rule pack failed:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('rules.title')}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>{t('rules.preset')}</label>
            <select
              className="form-select"
              value={presetIndex}
              onChange={(e) => applyPreset(parseInt(e.target.value, 10))}
            >
              {PRESETS.map((p, i) => (
                <option key={i} value={i}>{t(p.nameKey)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{t('rules.signalType')}</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="signalType"
                  checked={signalType.type === 'bit'}
                  onChange={() => setSignalType({ type: 'bit' })}
                />
                {t('rules.signalTypeBit')}
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="signalType"
                  checked={signalType.type === 'integer'}
                  onChange={() => setSignalType({ type: 'integer', min: 0, max: 15 })}
                />
                {t('rules.signalTypeInteger')}
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="signalType"
                  checked={signalType.type === 'float'}
                  onChange={() => setSignalType({ type: 'float', min: 0, max: 1.0 })}
                />
                {t('rules.signalTypeFloat')}
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="signalType"
                  checked={signalType.type === 'bus'}
                  onChange={() => setSignalType({ type: 'bus', width: 8 })}
                />
                {t('rules.signalTypeBus')}
              </label>
            </div>
            {(signalType.type === 'integer' || signalType.type === 'float') && (
              <div className="range-inputs">
                <input
                  type="number"
                  className="form-input range-input"
                  value={signalType.type === 'integer' ? (signalType as { min: number }).min : (signalType as { min: number }).min}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (signalType.type === 'integer') {
                      setSignalType({ type: 'integer', min: v, max: (signalType as { max: number }).max });
                    } else if (signalType.type === 'float') {
                      setSignalType({ type: 'float', min: v, max: (signalType as { max: number }).max });
                    }
                  }}
                  placeholder="Min"
                />
                <span>-</span>
                <input
                  type="number"
                  className="form-input range-input"
                  value={signalType.type === 'integer' ? (signalType as { max: number }).max : signalType.type === 'float' ? (signalType as { max: number }).max : 0}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (signalType.type === 'integer') {
                      setSignalType({ type: 'integer', min: (signalType as { min: number }).min, max: v });
                    } else if (signalType.type === 'float') {
                      setSignalType({ type: 'float', min: (signalType as { min: number }).min, max: v });
                    }
                  }}
                  placeholder="Max"
                />
              </div>
            )}
            {signalType.type === 'bus' && (
              <div className="range-inputs">
                <input
                  type="number"
                  className="form-input range-input"
                  value={(signalType as { width: number }).width}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10) || 1;
                    setSignalType({ type: 'bus', width: Math.min(64, Math.max(1, v)) });
                  }}
                  min={1}
                  max={64}
                  placeholder={t('rules.busWidth')}
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>{t('rules.propagation')}</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="propagation"
                  checked={propagationMode === 'event_driven'}
                  onChange={() => setPropagationMode('event_driven')}
                />
                {t('rules.propagationEvent')}
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="propagation"
                  checked={propagationMode === 'tick_driven'}
                  onChange={() => setPropagationMode('tick_driven')}
                />
                {t('rules.propagationTick')}
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>{t('rules.attenuation')}</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="attenuation"
                  checked={attenuation.type === 'none'}
                  onChange={() => setAttenuation({ type: 'none' })}
                />
                {t('rules.attenuationNone')}
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="attenuation"
                  checked={attenuation.type === 'linear'}
                  onChange={() => setAttenuation({ type: 'linear', lossPerUnit: 1 })}
                />
                {t('rules.attenuationLinear')}
              </label>
            </div>
            {attenuation.type === 'linear' && (
              <div className="range-inputs">
                <label className="form-label-sm">{t('rules.lossPerUnit')}</label>
                <input
                  type="number"
                  className="form-input range-input"
                  value={attenuation.lossPerUnit}
                  onChange={(e) =>
                    setAttenuation({ type: 'linear', lossPerUnit: parseInt(e.target.value, 10) || 0 })
                  }
                  min={0}
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>{t('rules.tickBehavior')}</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="tickBehavior"
                  checked={tickBehavior === 'synchronous'}
                  onChange={() => setTickBehavior('synchronous')}
                />
                {t('rules.tickSync')}
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="tickBehavior"
                  checked={tickBehavior === 'asynchronous'}
                  onChange={() => setTickBehavior('asynchronous')}
                />
                {t('rules.tickAsync')}
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>{t('rules.gateDelay')}</label>
            <input
              type="number"
              className="form-input"
              value={gateDelay}
              onChange={(e) => setGateDelay(parseInt(e.target.value, 10) || 0)}
              min={0}
            />
          </div>

          <div className="form-group">
            <label>{t('rules.customName')}</label>
            <input
              type="text"
              className="form-input"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder={t('rules.customNamePlaceholder')}
            />
          </div>

          <div className="form-group">
            <label>{t('rules.description')}</label>
            <input
              type="text"
              className="form-input"
              value={ruleDescription}
              onChange={(e) => setRuleDescription(e.target.value)}
              placeholder={t('rules.descriptionPlaceholder')}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            {t('subcircuit.cancel')}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!ruleName.trim() || saving}
          >
            {saving ? t('rules.saving') : t('rules.saveCustom')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RuleEditor;
