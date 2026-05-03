import Toolbar from './Toolbar';
import ComponentPanel from './ComponentPanel';
import PropertyPanel from './PropertyPanel';
import HistoryPanel from './HistoryPanel';
import StatusBar from './StatusBar';
import Canvas from './Canvas';

function Layout() {
  return (
    <div className="layout">
      <Toolbar />
      <div className="editor-area">
        <ComponentPanel />
        <div className="canvas-container">
          <Canvas />
        </div>
        <div className="right-panels">
          <PropertyPanel />
          <HistoryPanel />
        </div>
      </div>
      <StatusBar />
    </div>
  );
}

export default Layout;
