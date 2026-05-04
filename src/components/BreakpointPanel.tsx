import { useTranslation } from 'react-i18next';
import { useDebugStore } from '../stores/debugStore';
import { removeBreakpoint, setBreakpointEnabled } from '../ipc/debugIpc';
import type { Breakpoint, BreakpointTarget, BreakpointCondition } from '../types/debug';

function targetLabel(target: BreakpointTarget, t: (key: string) => string): string {
  if ('Net' in target) return `${t('debug.net')} ${target.Net}`;
  return `${t('debug.component')} ${target.Component}`;
}

function conditionLabel(cond: BreakpointCondition): string {
  if (typeof cond === 'string') {
    return cond;
  }
  if ('SignalEquals' in cond) {
    return `= ${cond.SignalEquals}`;
  }
  return String(cond);
}

function BreakpointPanel() {
  const { t } = useTranslation();
  const breakpoints = useDebugStore((s) => s.breakpoints);

  const handleRemove = (bp: Breakpoint) => {
    removeBreakpoint(bp.id);
    useDebugStore.getState().removeBreakpoint(bp.id);
  };

  const handleToggle = (bp: Breakpoint) => {
    const newEnabled = !bp.enabled;
    setBreakpointEnabled(bp.id, newEnabled);
    useDebugStore.getState().setBreakpointEnabled(bp.id, newEnabled);
  };

  if (breakpoints.length === 0) {
    return (
      <div className="breakpoint-panel">
        <div className="panel-header">{t('debug.breakpoints')}</div>
        <div className="property-empty">{t('debug.noBreakpoints')}</div>
      </div>
    );
  }

  return (
    <div className="breakpoint-panel">
      <div className="panel-header">{t('debug.breakpoints')}</div>
      <div className="property-content">
        {breakpoints.map((bp) => (
          <div
            key={bp.id}
            className={`breakpoint-row ${bp.enabled ? '' : 'bp-disabled'}`}
          >
            <div className="breakpoint-info">
              <span className="bp-target">{targetLabel(bp.target, t)}</span>
              <span className="bp-condition">{conditionLabel(bp.condition)}</span>
            </div>
            <div className="breakpoint-actions">
              <button
                className={`btn btn-sm ${bp.enabled ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => handleToggle(bp)}
                title={bp.enabled ? t('debug.disable') : t('debug.enable')}
              >
                {bp.enabled ? t('debug.enabled') : t('debug.disabled')}
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleRemove(bp)}
                title={t('debug.remove')}
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BreakpointPanel;
