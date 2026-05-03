import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createLuaComponentDef,
  updateLuaComponentDef,
  validateLuaScript,
} from '../ipc/customComponentIpc';
import type { LuaPinDef } from '../ipc/customComponentIpc';
import { useCustomComponentStore } from '../stores/customComponentStore';

const DEFAULT_TEMPLATE = `function evaluate(inputs, state)
    local output = inputs[1]
    return { output }, state
end
`;

interface LuaScriptEditorProps {
  onClose: () => void;
  editDef?: {
    id: number;
    name: string;
    description: string;
    script_source: string;
    input_pins: LuaPinDef[];
    output_pins: LuaPinDef[];
  };
}

function LuaScriptEditor({ onClose, editDef }: LuaScriptEditorProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(editDef?.name ?? '');
  const [script, setScript] = useState(editDef?.script_source ?? DEFAULT_TEMPLATE);
  const [inputPins, setInputPins] = useState<LuaPinDef[]>(
    editDef?.input_pins ?? [
      { name: 'in1', is_output: false, offset_x: -0.5, offset_y: 0 },
    ],
  );
  const [outputPins, setOutputPins] = useState<LuaPinDef[]>(
    editDef?.output_pins ?? [
      { name: 'out1', is_output: true, offset_x: 0.5, offset_y: 0 },
    ],
  );
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [saving, setSaving] = useState(false);

  const addInputPin = () => {
    const count = inputPins.length + 1;
    const spacing = 1.0 / (inputPins.length + 2);
    setInputPins((prev) => {
      const updated = prev.map((pin, i) => ({
        ...pin,
        offset_y: -0.4 + spacing * (i + 1),
      }));
      return [
        ...updated,
        {
          name: `in${count}`,
          is_output: false,
          offset_x: -0.5,
          offset_y: -0.4 + spacing * count,
        },
      ];
    });
  };

  const removeInputPin = (index: number) => {
    setInputPins((prev) => prev.filter((_, i) => i !== index));
  };

  const updateInputPinName = (index: number, newName: string) => {
    setInputPins((prev) =>
      prev.map((pin, i) => (i === index ? { ...pin, name: newName } : pin)),
    );
  };

  const addOutputPin = () => {
    const count = outputPins.length + 1;
    const spacing = 1.0 / (outputPins.length + 2);
    setOutputPins((prev) => {
      const updated = prev.map((pin, i) => ({
        ...pin,
        offset_y: -0.4 + spacing * (i + 1),
      }));
      return [
        ...updated,
        {
          name: `out${count}`,
          is_output: true,
          offset_x: 0.5,
          offset_y: -0.4 + spacing * count,
        },
      ];
    });
  };

  const removeOutputPin = (index: number) => {
    setOutputPins((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOutputPinName = (index: number, newName: string) => {
    setOutputPins((prev) =>
      prev.map((pin, i) => (i === index ? { ...pin, name: newName } : pin)),
    );
  };

  const handleValidate = async () => {
    try {
      const result = await validateLuaScript(script, inputPins.length, outputPins.length);
      setValidation(result);
    } catch (e) {
      setValidation({ valid: false, errors: [String(e)] });
    }
  };

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);

    try {
      if (editDef) {
        await updateLuaComponentDef(editDef.id, {
          name: name.trim(),
          script_source: script,
          input_pins: inputPins,
          output_pins: outputPins,
        });
      } else {
        await createLuaComponentDef(name.trim(), script, inputPins, outputPins);
      }
      await useCustomComponentStore.getState().loadSubCircuitDefs();
      onClose();
    } catch (e) {
      console.error('Save lua component failed:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editDef ? t('lua.edit') : t('lua.create')}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>{t('lua.name')}</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('lua.namePlaceholder')}
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>{t('lua.inputPins')}</label>
              {inputPins.map((pin, i) => (
                <div key={i} className="pin-edit-row">
                  <input
                    type="text"
                    className="form-input pin-name-input"
                    value={pin.name}
                    onChange={(e) => updateInputPinName(i, e.target.value)}
                  />
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => removeInputPin(i)}
                  >✕</button>
                </div>
              ))}
              <button className="btn btn-sm" onClick={addInputPin}>
                + {t('lua.addInputPin')}
              </button>
            </div>

            <div className="form-group flex-1">
              <label>{t('lua.outputPins')}</label>
              {outputPins.map((pin, i) => (
                <div key={i} className="pin-edit-row">
                  <input
                    type="text"
                    className="form-input pin-name-input"
                    value={pin.name}
                    onChange={(e) => updateOutputPinName(i, e.target.value)}
                  />
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => removeOutputPin(i)}
                  >✕</button>
                </div>
              ))}
              <button className="btn btn-sm" onClick={addOutputPin}>
                + {t('lua.addOutputPin')}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>{t('lua.script')}</label>
            <textarea
              className="form-textarea code-textarea"
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={20}
              spellCheck={false}
            />
          </div>

          {validation && (
            <div className={`validation-result ${validation.valid ? 'valid' : 'invalid'}`}>
              {validation.valid
                ? t('lua.validatePassed')
                : (
                  <>
                    <strong>{t('lua.validateFailed')}</strong>
                    <ul>
                      {validation.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </>
                )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleValidate}>
            {t('lua.validate')}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            {t('subcircuit.cancel')}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!name.trim() || saving}
          >
            {saving ? t('lua.saving') : t('lua.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LuaScriptEditor;
