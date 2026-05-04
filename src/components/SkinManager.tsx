import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { open, save } from '@tauri-apps/plugin-dialog';
import { useSkinStore } from '../stores/skinStore';
import { loadSkinPack, clearSkin, exportSkinPack } from '../ipc/skinIpc';

interface SkinManagerProps {
  onClose: () => void;
}

function SkinManager({ onClose }: SkinManagerProps) {
  const { t } = useTranslation();
  const activeSkin = useSkinStore((s) => s.activeSkin);
  const clearSkinStore = useSkinStore((s) => s.clearSkin);
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    try {
      setImporting(true);
      const path = await open({
        filters: [{ name: 'Skin Pack', extensions: ['cfskin'] }],
        multiple: false,
      });
      if (path) {
        const result = await loadSkinPack(path as string);
        useSkinStore.getState().setActiveSkin(result.manifest);
        useSkinStore.getState().setSkinAssets(result.assets);
      }
    } catch (e) {
      console.error('Import skin failed:', e);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
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

  const handleClear = async () => {
    try {
      await clearSkin();
      clearSkinStore();
    } catch (e) {
      console.error('Clear skin failed:', e);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content skin-manager" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('skin.managerTitle')}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="skin-info">
          {activeSkin ? (
            <>
              <p><strong>{t('skin.name')}:</strong> {activeSkin.name}</p>
              <p><strong>{t('skin.author')}:</strong> {activeSkin.author}</p>
              <p><strong>{t('skin.version')}:</strong> {activeSkin.version}</p>
              {activeSkin.description && (
                <p><strong>{t('skin.description')}:</strong> {activeSkin.description}</p>
              )}
            </>
          ) : (
            <p className="skin-no-active">{t('skin.noActiveSkin')}</p>
          )}
        </div>

        <div className="skin-actions">
          <button onClick={handleImport} disabled={importing}>
            {importing ? t('skin.importing') : t('skin.import')}
          </button>
          <button onClick={handleExport} disabled={!activeSkin}>
            {t('skin.export')}
          </button>
          <button onClick={handleClear} disabled={!activeSkin}>
            {t('skin.clear')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SkinManager;
