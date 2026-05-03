import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../stores/editorStore';
import { useSimulationStore } from '../stores/simulationStore';
import { useThemeStore } from '../stores/themeStore';

function StatusBar() {
  const { t, i18n } = useTranslation();
  const zoom = useEditorStore((s) => s.viewport.zoom);
  const cursorX = useEditorStore((s) => s.cursorX);
  const cursorY = useEditorStore((s) => s.cursorY);
  const tickCount = useSimulationStore((s) => s.tickCount);
  const status = useSimulationStore((s) => s.status);
  const simMode = useSimulationStore((s) => s.mode);
  const speedMultiplier = useSimulationStore((s) => s.speedMultiplier);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const zoomPercent = Math.round(zoom / 40 * 100);
  const isZh = i18n.language === 'zh-CN';

  return (
    <div className="status-bar">
      <div className="status-item">
        {t('statusBar.zoom')}: {zoomPercent}%
      </div>
      <div className="status-item">
        {t('statusBar.cursor')}: ({Math.round(cursorX)}, {Math.round(cursorY)})
      </div>
      <div className="status-item">
        {t('statusBar.mode')}: {simMode === 'event' ? t('simulation.eventMode') : t('simulation.tickMode')}
      </div>
      <div className="status-item">
        {t('statusBar.speed')}: {speedMultiplier}x
      </div>
      <div className="status-item">
        {t('statusBar.tick')}: {tickCount} | {t(`simulation.${status}`)}
      </div>
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        title={theme === 'dark' ? t('statusBar.lightTheme') : t('statusBar.darkTheme')}
      >
        {theme === 'dark' ? '☀' : '🌙'}
      </button>
      <button
        className="lang-switch"
        onClick={() => i18n.changeLanguage(isZh ? 'en' : 'zh-CN')}
        title={isZh ? 'Switch to English' : '切换到中文'}
      >
        {isZh ? 'EN' : '中'}
      </button>
    </div>
  );
}

export default StatusBar;
