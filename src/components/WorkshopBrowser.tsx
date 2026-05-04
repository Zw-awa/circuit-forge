import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkshopStore } from '../stores/workshopStore';
import { workshopDownloadItem } from '../ipc/workshopIpc';
import type { WorkshopItem } from '../ipc/workshopIpc';
import { useSkinStore } from '../stores/skinStore';
import { useCustomComponentStore } from '../stores/customComponentStore';
import { useRuleStore } from '../stores/ruleStore';

interface WorkshopBrowserProps {
  onClose: () => void;
}

const TYPE_TABS: Array<{ key: string; labelKey: string }> = [
  { key: '', labelKey: 'workshop.allTypes' },
  { key: 'component', labelKey: 'workshop.components' },
  { key: 'skin', labelKey: 'workshop.skins' },
  { key: 'rule', labelKey: 'workshop.rules' },
  { key: 'project', labelKey: 'workshop.projects' },
];

const TYPE_ICONS: Record<string, string> = {
  component: '📦',
  skin: '🎨',
  rule: '⚙',
  project: '📁',
};

function WorkshopBrowser({ onClose }: WorkshopBrowserProps) {
  const { t } = useTranslation();
  const index = useWorkshopStore((s) => s.index);
  const loading = useWorkshopStore((s) => s.loading);
  const error = useWorkshopStore((s) => s.error);
  const fetchIndex = useWorkshopStore((s) => s.fetchIndex);
  const searchQuery = useWorkshopStore((s) => s.searchQuery);
  const setSearchQuery = useWorkshopStore((s) => s.setSearchQuery);
  const typeFilter = useWorkshopStore((s) => s.typeFilter);
  const setTypeFilter = useWorkshopStore((s) => s.setTypeFilter);
  const filteredItems = useWorkshopStore((s) => s.filteredItems);

  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchIndex();
  }, [fetchIndex]);

  const handleDownload = useCallback(
    async (item: WorkshopItem) => {
      setDownloading((prev) => ({ ...prev, [item.id]: true }));
      setDownloadMsg(null);
      try {
        const result = await workshopDownloadItem(item.downloadUrl, item.fileType);
        setDownloadMsg(t('workshop.downloaded'));
        if (item.fileType === 'cfskin') {
          const skin = useSkinStore.getState();
          if (result.manifest) {
            skin.setActiveSkin(result.manifest);
            if (result.assets) {
              skin.setSkinAssets(result.assets);
            }
          } else if (result.name) {
            // Fallback for older backend that doesn't return manifest
            skin.setActiveSkin({
              id: result.skinId || item.id,
              name: result.name || item.name,
              author: item.author,
              version: item.version,
              description: item.description,
              component_textures: {},
              wire_style: { thickness: 2, high_color: [0, 1, 0], low_color: [0.2, 0.2, 0.2] },
              grid_style: {
                bg_color: [0.1, 0.1, 0.1, 1],
                minor_color: [0.15, 0.15, 0.15, 1],
                major_color: [0.2, 0.2, 0.2, 1],
                axis_color: [0.3, 0.3, 0.3, 1],
                pattern: 'Line' as const,
                opacity: 1,
              },
            });
          }
        } else if (item.fileType === 'cfcomp') {
          useCustomComponentStore.getState().loadSubCircuitDefs();
        } else if (item.fileType === 'cfrule') {
          useRuleStore.getState().loadRulePacks();
        } else if (item.fileType === 'circuitforge') {
          await useCustomComponentStore.getState().loadSubCircuitDefs();
          await useRuleStore.getState().loadRulePacks();
        }
      } catch (e) {
        setDownloadMsg(`${t('workshop.downloadError')}: ${String(e)}`);
      } finally {
        setDownloading((prev) => ({ ...prev, [item.id]: false }));
        setTimeout(() => setDownloadMsg(null), 3000);
      }
    },
    [t],
  );

  const items = filteredItems();
  const tutorials = index?.tutorials ?? [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large workshop-browser" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('workshop.title')}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body workshop-body">
          <div className="workshop-controls">
            <input
              type="text"
              className="workshop-search"
              placeholder={t('workshop.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              className="workshop-refresh-btn"
              onClick={() => fetchIndex(undefined, true)}
              disabled={loading}
              title={t('workshop.refresh')}
            >
              {loading ? '⏳' : '↻'} {t('workshop.refresh')}
            </button>
          </div>

          <div className="workshop-tabs">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.key}
                className={typeFilter === tab.key ? 'workshop-tab active' : 'workshop-tab'}
                onClick={() => setTypeFilter(tab.key)}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>

          {downloadMsg && <div className="workshop-msg">{downloadMsg}</div>}
          {error && <div className="workshop-error">{t('workshop.fetchError')}: {error}</div>}

          {loading && !index && (
            <div className="workshop-loading">{t('workshop.downloading')}</div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="workshop-empty">{t('workshop.noResults')}</div>
          )}

          {items.length > 0 && (
            <div className="workshop-grid">
              {items.map((item) => (
                <div key={item.id} className="workshop-card">
                  <div className="workshop-card-header">
                    <span className="workshop-type-badge">
                      {TYPE_ICONS[item.type] || '📄'} {item.type}
                    </span>
                  </div>
                  {item.thumbnailUrl && (
                    <img
                      className="workshop-thumb"
                      src={item.thumbnailUrl}
                      alt={item.name}
                      loading="lazy"
                    />
                  )}
                  <div className="workshop-card-body">
                    <div className="workshop-card-title">{item.name}</div>
                    <div className="workshop-card-author">
                      {t('workshop.by')} {item.author}
                    </div>
                    <div className="workshop-card-desc">{item.description}</div>
                    <div className="workshop-card-tags">
                      {item.tags.map((tag) => (
                        <span key={tag} className="workshop-tag">{tag}</span>
                      ))}
                    </div>
                    <div className="workshop-card-meta">
                      <span>v{item.version}</span>
                      <span>{formatSize(item.fileSize)}</span>
                    </div>
                  </div>
                  <div className="workshop-card-actions">
                    <button
                      className="workshop-download-btn"
                      onClick={() => handleDownload(item)}
                      disabled={downloading[item.id]}
                    >
                      {downloading[item.id] ? t('workshop.downloading') : t('workshop.download')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tutorials.length > 0 && (
            <div className="workshop-tutorials">
              <h4>{t('workshop.tutorials')}</h4>
              {tutorials.map((tut) => (
                <div key={tut.url} className="workshop-tutorial-item">
                  <span className="workshop-tutorial-title">{tut.title}</span>
                  <a
                    href={tut.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="workshop-tutorial-link"
                  >
                    {t('workshop.openTutorial')}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default WorkshopBrowser;
