import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistoryStore, historyStore } from '../stores/historyStore';

function HistoryPanel() {
  const { t } = useTranslation();
  const undoStack = useHistoryStore((s) => s.undoStack);
  const redoStack = useHistoryStore((s) => s.redoStack);
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="history-panel">
        <div className="panel-header" onClick={() => setCollapsed(false)} style={{ cursor: 'pointer' }}>
          ▶ {t('history.title')}
        </div>
      </div>
    );
  }

  return (
    <div className="history-panel">
      <div className="panel-header" onClick={() => setCollapsed(true)} style={{ cursor: 'pointer' }}>
        ▼ {t('history.title')}
      </div>
      <div className="history-content">
        {undoStack.length === 0 && redoStack.length === 0 && (
          <div className="property-empty">{t('history.empty')}</div>
        )}
        {undoStack.length > 0 && (
          <>
            <div className="property-section-title">{t('history.undoStack')}</div>
            {[...undoStack].reverse().map((cmd, i) => (
              <div
                key={i}
                className="history-item"
                onClick={async () => {
                  let target = undoStack.length - 1 - i;
                  while (historyStore.getState().canUndo && historyStore.getState().undoStack.length > target) {
                    await historyStore.getState().undo();
                  }
                }}
              >
                ↶ {cmd.description}
              </div>
            ))}
          </>
        )}
        {redoStack.length > 0 && (
          <>
            <div className="property-section-title">{t('history.redoStack')}</div>
            {[...redoStack].reverse().map((cmd, i) => (
              <div
                key={i}
                className="history-item"
                onClick={async () => {
                  let target = redoStack.length - 1 - i;
                  while (historyStore.getState().canRedo && historyStore.getState().redoStack.length > target) {
                    await historyStore.getState().redo();
                  }
                }}
              >
                ↷ {cmd.description}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default HistoryPanel;
