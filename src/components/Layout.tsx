import { useState } from 'react';
import Toolbar from './Toolbar';
import ComponentPanel from './ComponentPanel';
import PropertyPanel from './PropertyPanel';
import HistoryPanel from './HistoryPanel';
import BreakpointPanel from './BreakpointPanel';
import DebugToolbar from './DebugToolbar';
import StatusBar from './StatusBar';
import Canvas from './Canvas';
import Breadcrumb from './Breadcrumb';
import WaveformViewer from './WaveformViewer';

function Layout() {
  const [waveformVisible, setWaveformVisible] = useState(false);

  return (
    <div className="layout">
      <Toolbar onToggleWaveform={() => setWaveformVisible((v) => !v)} waveformVisible={waveformVisible} />
      <Breadcrumb />
      <DebugToolbar />
      <div className="editor-area">
        <ComponentPanel />
        <div className="canvas-container">
          <Canvas />
        </div>
        <div className="right-panels">
          <PropertyPanel />
          <BreakpointPanel />
          <HistoryPanel />
        </div>
      </div>
      <WaveformViewer visible={waveformVisible} onClose={() => setWaveformVisible(false)} />
      <StatusBar />
    </div>
  );
}

export default Layout;
