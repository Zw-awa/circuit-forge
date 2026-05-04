import { useTranslation } from 'react-i18next';
import { useDebugStore } from '../stores/debugStore';
import { useSimulationStore } from '../stores/simulationStore';
import {
  debugStepInto,
  debugStepOver,
  debugContinue,
} from '../ipc/debugIpc';
import { simPause } from '../ipc/simulationIpc';

function DebugToolbar() {
  const { t } = useTranslation();
  const activeHit = useDebugStore((s) => s.activeBreakpointHit);
  const simStatus = useSimulationStore((s) => s.status);

  const isPausedByDebug = simStatus === 'paused';

  if (!isPausedByDebug) return null;

  return (
    <div className="debug-toolbar">
      <span className="debug-toolbar-label">{t('debug.debugger')}</span>
      {activeHit && (
        <span className="debug-hit-info">
          {t('debug.hitAt')} {t('debug.net')} {activeHit.netId}
        </span>
      )}
      <div className="debug-toolbar-actions">
        <button
          className="btn btn-sm btn-primary"
          onClick={async () => {
            const result = await debugStepInto();
            if (result.changed) {
              useSimulationStore.getState().updateSignals(result.changed);
            }
            if (result.breakpointHit) {
              useDebugStore.getState().setActiveBreakpointHit(result.breakpointHit);
            } else {
              useDebugStore.getState().setActiveBreakpointHit(null);
            }
          }}
          title={t('debug.stepInto')}
        >
          {t('debug.stepInto')}
        </button>
        <button
          className="btn btn-sm btn-primary"
          onClick={async () => {
            const result = await debugStepOver();
            if (result.changed) {
              useSimulationStore.getState().updateSignals(result.changed);
            }
            if (result.breakpointHit) {
              useDebugStore.getState().setActiveBreakpointHit(result.breakpointHit);
            } else {
              useDebugStore.getState().setActiveBreakpointHit(null);
            }
          }}
          title={t('debug.stepOver')}
        >
          {t('debug.stepOver')}
        </button>
        <button
          className="btn btn-sm btn-success"
          onClick={async () => {
            useDebugStore.getState().setActiveBreakpointHit(null);
            await debugContinue();
            useSimulationStore.getState().setStatus('running');
          }}
          title={t('debug.continue')}
        >
          {t('debug.continue')}
        </button>
        <button
          className="btn btn-sm btn-danger"
          onClick={async () => {
            useDebugStore.getState().setActiveBreakpointHit(null);
            await simPause();
          }}
          title={t('debug.stop')}
        >
          {t('debug.stop')}
        </button>
      </div>
    </div>
  );
}

export default DebugToolbar;
