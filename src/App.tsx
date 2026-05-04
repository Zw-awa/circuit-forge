import { useEffect } from 'react';
import Layout from './components/Layout';
import { useThemeStore } from './stores/themeStore';
import { editorStore } from './stores/editorStore';
import { useKeybindingStore } from './stores/keybindingStore';
import { saveProject } from './ipc/simulationIpc';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import './App.css';

function App() {
  const theme = useThemeStore((s) => s.theme);
  const loadBindings = useKeybindingStore((s) => s.loadBindings);

  useEffect(() => {
    loadBindings();
  }, [loadBindings]);
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    let autoSavePath = '';

    (async () => {
      try {
        const dir = await appDataDir();
        autoSavePath = await join(dir, 'autosave.cfproj');
        const recovered = await readTextFile(autoSavePath);
        if (recovered) {
        }
      } catch {
      }
    })();

    const interval = setInterval(async () => {
      const state = editorStore.getState();
      if (state.isDirty && state.components.size > 0 && autoSavePath) {
        try {
          const json = await saveProject();
          await writeTextFile(autoSavePath, json);
        } catch {
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return <Layout />;
}

export default App;
