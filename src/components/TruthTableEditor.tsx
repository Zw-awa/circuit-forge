import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getTruthTable,
  createTruthTable,
  updateTruthTable,
  verifyTruthTable,
} from '../ipc/customComponentIpc';
import type { TruthTableRow, VerificationResult } from '../ipc/customComponentIpc';

interface TruthTableEditorProps {
  onClose: () => void;
  defId: number;
  defName: string;
  defType: 'SubCircuit' | 'LuaScript';
  inputPinNames: string[];
  outputPinNames: string[];
}

function TruthTableEditor({
  onClose,
  defId,
  defName,
  defType,
  inputPinNames,
  outputPinNames,
}: TruthTableEditorProps) {
  const { t } = useTranslation();
  const [tableId, setTableId] = useState<number | null>(null);
  const [rows, setRows] = useState<TruthTableRow[]>([]);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [keepOutputs, setKeepOutputs] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const existing = await getTruthTable(defId, defType);
        if (existing) {
          setTableId(existing.id);
          setRows(existing.rows);
        } else {
          const emptyRow: TruthTableRow = {
            inputs: inputPinNames.map(() => 'Low'),
            expected_outputs: outputPinNames.map(() => 'Low'),
          };
          setRows([emptyRow]);
        }
      } catch (e) {
        console.error('Load truth table failed:', e);
        const emptyRow: TruthTableRow = {
          inputs: inputPinNames.map(() => 'Low'),
          expected_outputs: outputPinNames.map(() => 'Low'),
        };
        setRows([emptyRow]);
      } finally {
        setLoading(false);
      }
    })();
  }, [defId, defType, inputPinNames, outputPinNames]);

  const updateCell = useCallback(
    (rowIndex: number, colIndex: number, value: string, isInput: boolean) => {
      setRows((prev) => {
        const next = prev.map((row, ri) => {
          if (ri !== rowIndex) return row;
          if (isInput) {
            const newInputs = row.inputs.map((v, ci) => (ci === colIndex ? value : v));
            return { ...row, inputs: newInputs };
          } else {
            const newOutputs = row.expected_outputs.map((v, ci) => (ci === colIndex ? value : v));
            return { ...row, expected_outputs: newOutputs };
          }
        });
        return next;
      });
      setVerification(null);
    },
    [],
  );

  const addRow = () => {
    setRows((prev) => {
      if (prev.length >= 1024) return prev;
      return [
        ...prev,
        {
          inputs: inputPinNames.map(() => 'Low'),
          expected_outputs: outputPinNames.map(() => 'Low'),
        },
      ];
    });
    setVerification(null);
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
    setVerification(null);
  };

  const autoFillAll = () => {
    const inputCount = inputPinNames.length;
    if (inputCount > 8) return;
    const total = 1 << inputCount;
    const newRows: TruthTableRow[] = [];
    for (let i = 0; i < total; i++) {
      const inputs: string[] = [];
      for (let bit = inputCount - 1; bit >= 0; bit--) {
        inputs.push((i >> bit) & 1 ? 'High' : 'Low');
      }
      if (keepOutputs && i < rows.length) {
        newRows.push({
          inputs,
          expected_outputs: [...rows[i].expected_outputs],
        });
      } else {
        newRows.push({
          inputs,
          expected_outputs: outputPinNames.map(() => 'Low'),
        });
      }
    }
    setRows(newRows);
    setVerification(null);
  };

  const handleSave = async () => {
    try {
      if (tableId !== null) {
        await updateTruthTable(tableId, rows);
      } else {
        const result = await createTruthTable(defId, defType, rows);
        setTableId(result.id);
      }
    } catch (e) {
      console.error('Save truth table failed:', e);
    }
  };

  const handleVerify = async () => {
    try {
      const result = await verifyTruthTable(defId, defType);
      setVerification(result);
    } catch (e) {
      console.error('Verify truth table failed:', e);
    }
  };

  const handleClose = () => {
    if (verification && !verification.passed) {
      if (!window.confirm(t('truthTable.exitWarning'))) return;
    }
    onClose();
  };

  const toggleSignal = (current: string) => (current === 'High' ? 'Low' : 'High');

  if (loading) {
    return (
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-body">{t('truthTable.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('truthTable.title')} — {defName}</h3>
          <button className="modal-close" onClick={handleClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="truth-table-actions">
            <button className="btn btn-sm" onClick={addRow}>
              + {t('truthTable.addRow')}
            </button>
            <button className="btn btn-sm" onClick={handleSave}>
              {t('truthTable.save')}
            </button>
            <button
              className="btn btn-sm"
              onClick={autoFillAll}
              disabled={inputPinNames.length > 8}
              title={inputPinNames.length > 8 ? t('truthTable.tooManyInputs') : ''}
            >
              {t('truthTable.autoFill')}
            </button>
            <label className="tt-keep-toggle" title={t('truthTable.keepOutputsHint')}>
              <input
                type="checkbox"
                checked={keepOutputs}
                onChange={(e) => setKeepOutputs(e.target.checked)}
              />
              {t('truthTable.keepOutputs')}
            </label>
            <button className="btn btn-primary btn-sm" onClick={handleVerify}>
              {t('truthTable.verify')}
            </button>
          </div>

          {verification && (
            <div className={`verification-summary ${verification.passed ? 'passed' : 'failed'}`}>
              {t('truthTable.verifyResult', {
                passed: verification.passed_rows,
                total: verification.total_rows,
              })}
              {verification.failures.length > 0 && (
                <ul className="failure-list">
                  {verification.failures.map((f, i) => (
                    <li key={i}>
                      {t('truthTable.rowIndex', { index: f.row_index })}:{' '}
                      {t('truthTable.expected')} [{f.expected.join(', ')}]{' '}
                      {t('truthTable.got')} [{f.actual.join(', ')}]
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="truth-table-scroll">
            <table className="truth-table">
              <thead>
                <tr>
                  {inputPinNames.map((name) => (
                    <th key={`in-${name}`} className="tt-header-input">
                      {name}
                    </th>
                  ))}
                  <th className="tt-header-divider" />
                  {outputPinNames.map((name) => (
                    <th key={`out-${name}`} className="tt-header-output">
                      {name}
                    </th>
                  ))}
                  <th className="tt-header-action" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => {
                  const isFailed = verification?.failures.some((f) => f.row_index === ri);
                  return (
                    <tr key={ri} className={isFailed ? 'row-failed' : ''}>
                      {row.inputs.map((value, ci) => (
                        <td key={`in-${ci}`} className="tt-cell-input">
                          <button
                            className="tt-signal-btn"
                            onClick={() => updateCell(ri, ci, toggleSignal(value), true)}
                          >
                            {value === 'High' ? '1' : '0'}
                          </button>
                        </td>
                      ))}
                      <td className="tt-cell-divider" />
                      {row.expected_outputs.map((value, ci) => (
                        <td key={`out-${ci}`} className="tt-cell-output">
                          <button
                            className={`tt-signal-btn ${isFailed ? 'mismatch' : ''}`}
                            onClick={() => updateCell(ri, ci, toggleSignal(value), false)}
                          >
                            {value === 'High' ? '1' : '0'}
                          </button>
                        </td>
                      ))}
                      <td className="tt-cell-action">
                        <button
                          className="btn btn-danger btn-xs"
                          onClick={() => removeRow(ri)}
                        >✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose}>
            {t('subcircuit.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TruthTableEditor;
