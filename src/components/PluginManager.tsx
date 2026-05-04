import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-dialog';
import { usePluginStore } from '../stores/pluginStore';

interface PluginManagerProps {
  onClose: () => void;
}

function PluginManager({ onClose }: PluginManagerProps) {
  const { t } = useTranslation();
  const plugins = usePluginStore((s) => s.plugins);
  const pluginComponents = usePluginStore((s) => s.pluginComponents);
  const loadPlugins = usePluginStore((s) => s.loadPlugins);
  const loadPlugin = usePluginStore((s) => s.loadPlugin);
  const unloadPlugin = usePluginStore((s) => s.unloadPlugin);
  const setEnabled = usePluginStore((s) => s.setEnabled);
  const [expandedPlugin, setExpandedPlugin] = useState<string | null>(null);

  useEffect(() => {
    loadPlugins();
  }, [loadPlugins]);

  const handleLoad = async () => {
    const selected = await open({ directory: true, multiple: false });
    if (selected) {
      await loadPlugin(selected as string);
    }
  };

  const handleUnload = async (pluginId: string) => {
    await unloadPlugin(pluginId);
  };

  const handleToggleEnabled = async (pluginId: string, enabled: boolean) => {
    await setEnabled(pluginId, !enabled);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content plugin-manager" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('plugins.managerTitle')}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="plugin-manager-toolbar">
          <button onClick={handleLoad}>📂 {t('plugins.load')}</button>
        </div>

        <div className="plugin-list">
          {plugins.length === 0 && (
            <div className="plugin-empty">{t('plugins.noPlugins')}</div>
          )}
          {plugins.map((plugin) => {
            const registrations = pluginComponents[plugin.id] || [];
            const isExpanded = expandedPlugin === plugin.id;

            return (
              <div key={plugin.id} className="plugin-item">
                <div
                  className="plugin-item-header"
                  onClick={() => setExpandedPlugin(isExpanded ? null : plugin.id)}
                >
                  <span className="plugin-expand-icon">{isExpanded ? '▾' : '▸'}</span>
                  <span className="plugin-name">{plugin.name}</span>
                  <span className="plugin-version">v{plugin.version}</span>
                  <span className="plugin-author">{t('plugins.by')} {plugin.author}</span>
                  <label
                    className="plugin-toggle"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={plugin.enabled}
                      onChange={() => handleToggleEnabled(plugin.id, plugin.enabled)}
                    />
                    <span>{plugin.enabled ? t('plugins.enabled') : t('plugins.disabled')}</span>
                  </label>
                  <button
                    className="plugin-unload-btn"
                    onClick={(e) => { e.stopPropagation(); handleUnload(plugin.id); }}
                    title={t('plugins.unload')}
                  >
                    ✕
                  </button>
                </div>

                {isExpanded && (
                  <div className="plugin-item-details">
                    <p className="plugin-description">{plugin.description}</p>
                    {registrations.length > 0 && (
                      <div className="plugin-registrations">
                        <div className="plugin-section-title">{t('plugins.registeredComponents')}</div>
                        {registrations.map((reg) => (
                          <div key={reg.kind_name} className="plugin-registration-item">
                            📜 <strong>{reg.icon_label}</strong>
                            <span className="plugin-kind-name">({reg.kind_name})</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {registrations.length === 0 && plugin.enabled && (
                      <div className="plugin-no-registrations">{t('plugins.noComponents')}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PluginManager;
