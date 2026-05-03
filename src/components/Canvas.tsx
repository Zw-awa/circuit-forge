import { useRef, useEffect } from 'react';
import { WebGLRenderer } from '../renderer/WebGLRenderer';
import { InputManager } from '../interaction/InputManager';
import { ToolManager } from '../interaction/ToolManager';
import { Picker } from '../interaction/Picker';
import { listenSimTick } from '../ipc/simulationIpc';
import { simulationStore } from '../stores/simulationStore';

function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const renderer = new WebGLRenderer(canvas);
    renderer.start();

    const picker = new Picker();
    const toolManager = new ToolManager(picker, renderer);
    const inputManager = new InputManager(canvas, renderer.getCamera(), toolManager);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        renderer.resize(width, height);
      }
    });
    resizeObserver.observe(container);

    const unlisten = listenSimTick((payload) => {
      simulationStore.getState().updateSignals(payload.changed);
      simulationStore.getState().incrementTick();
    });

    return () => {
      unlisten.then((fn) => fn());
      resizeObserver.disconnect();
      inputManager.destroy();
      toolManager.destroy();
      renderer.destroy();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} tabIndex={0} />
    </div>
  );
}

export default Canvas;
