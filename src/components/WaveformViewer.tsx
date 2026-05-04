import { useRef, useEffect, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { useWaveformStore } from '../stores/waveformStore';
import { useSimulationStore } from '../stores/simulationStore';
import { signalToNormalized } from '../ipc/debugIpc';
import type { SignalJson } from '../ipc/debugIpc';

const WAVEFORM_COLORS = [
  '#4ade80', '#f87171', '#60a5fa', '#facc15', '#c084fc',
  '#fb923c', '#2dd4bf', '#f472b6', '#a78bfa', '#22d3ee',
];

const ROW_HEIGHT = 32;
const LABEL_WIDTH = 60;

interface WaveformViewerProps {
  visible: boolean;
  onClose: () => void;
}

function signalToY(signal: SignalJson, yHi: number, yLo: number): number {
  const norm = signalToNormalized(signal);
  return yLo + (yHi - yLo) * norm;
}

function WaveformViewer({ visible, onClose }: WaveformViewerProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ dragging: boolean; startX: number; startScroll: number }>({
    dragging: false,
    startX: 0,
    startScroll: 0,
  });

  const monitoredNets = useWaveformStore((s) => s.monitoredNets);
  const waveformData = useWaveformStore((s) => s.waveformData);
  const cursorTick = useWaveformStore((s) => s.cursorTick);
  const autoScroll = useWaveformStore((s) => s.autoScroll);
  const zoomLevel = useWaveformStore((s) => s.zoomLevel);
  const addNet = useWaveformStore((s) => s.addNet);
  const removeNet = useWaveformStore((s) => s.removeNet);
  const setCursorTick = useWaveformStore((s) => s.setCursorTick);
  const toggleAutoScroll = useWaveformStore((s) => s.toggleAutoScroll);
  const setZoom = useWaveformStore((s) => s.setZoom);
  const fetchHistory = useWaveformStore((s) => s.fetchHistory);
  const exportCsv = useWaveformStore((s) => s.exportCsv);
  const simTickCount = useSimulationStore((s) => s.tickCount);

  const [netIdInput, setNetIdInput] = useState('');
  const [scrollOffset, setScrollOffset] = useState(0);

  const maxTickRef = useRef(0);
  const cursorValuesRef = useRef(new Map<number, SignalJson>());

  const computeCursorValues = useCallback(
    (tick: number | null) => {
      const values = new Map<number, SignalJson>();
      if (tick === null) return values;
      for (const netId of monitoredNets) {
        const pts = waveformData.get(netId);
        if (!pts || pts.length === 0) continue;
        let lo = 0;
        let hi = pts.length - 1;
        let found: SignalJson = 'Low';
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (pts[mid].tick <= tick) {
            found = pts[mid].signal;
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }
        values.set(netId, found);
      }
      return values;
    },
    [monitoredNets, waveformData],
  );

  useEffect(() => {
    cursorValuesRef.current = computeCursorValues(cursorTick);
  }, [cursorTick, computeCursorValues]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w <= 0 || h <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const bgColor = isDark ? '#1e1e2e' : '#f0f0f5';
    const gridColor = isDark ? '#2a2a3e' : '#d0d0e0';
    const textColor = isDark ? '#a0a0b0' : '#666680';
    const cursorColor = isDark ? '#7c6ff0' : '#6c5ce7';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    const drawWidth = w - LABEL_WIDTH;
    if (drawWidth <= 0) return;

    const rowCount = Math.max(monitoredNets.length, 1);
    const totalRowsHeight = rowCount * ROW_HEIGHT;
    const canvasHeight = h;
    const rowsStartY = Math.max(0, (canvasHeight - totalRowsHeight) / 2);
    const maxTick = Math.max(maxTickRef.current, simTickCount);

    const pixelsPerTick = zoomLevel;
    const visibleTicks = drawWidth / pixelsPerTick;
    const startTick = scrollOffset;
    const endTick = Math.max(maxTick, Math.ceil(scrollOffset + visibleTicks));

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;

    const tickStep = Math.max(1, Math.floor(visibleTicks / 10));
    for (let t = Math.floor(startTick / tickStep) * tickStep; t <= endTick; t += tickStep) {
      const sx = LABEL_WIDTH + (t - startTick) * pixelsPerTick;
      if (sx < LABEL_WIDTH || sx > w) continue;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, canvasHeight);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`t=${t}`, sx, canvasHeight - 2);
    }

    if (cursorTick !== null && cursorTick >= startTick && cursorTick <= endTick) {
      const cx = LABEL_WIDTH + (cursorTick - startTick) * pixelsPerTick;
      ctx.strokeStyle = cursorColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, canvasHeight);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    for (let i = 0; i < monitoredNets.length; i++) {
      const netId = monitoredNets[i];
      const rowY = rowsStartY + i * ROW_HEIGHT;
      const midY = rowY + ROW_HEIGHT / 2;
      const color = WAVEFORM_COLORS[i % WAVEFORM_COLORS.length];

      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
      ctx.fillRect(LABEL_WIDTH, rowY, drawWidth, ROW_HEIGHT);

      ctx.fillStyle = color;
      ctx.font = '11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`net ${netId}`, LABEL_WIDTH - 4, midY + 4);

      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, rowY + ROW_HEIGHT);
      ctx.lineTo(w, rowY + ROW_HEIGHT);
      ctx.stroke();

      const cv = cursorValuesRef.current.get(netId);
      if (cv !== undefined) {
        ctx.fillStyle = color;
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        const label = typeof cv === 'string' ? cv : JSON.stringify(cv);
        ctx.fillText(label, LABEL_WIDTH + 2, midY + 4);
      }

      const pts = waveformData.get(netId);
      if (!pts || pts.length === 0) continue;

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      const yHi = midY - 8;
      const yLo = midY + 8;

      let firstPoint = true;
      let iPt = 0;
      while (iPt < pts.length && pts[iPt].tick <= endTick) {
        const pt = pts[iPt];
        const nextPt = pts[iPt + 1];

        const sy = signalToY(pt.signal, yHi, yLo);
        const sx = LABEL_WIDTH + (pt.tick - startTick) * pixelsPerTick;

        if (firstPoint) {
          ctx.moveTo(sx, sy);
          firstPoint = false;
        } else {
          ctx.lineTo(sx, sy);
        }

        if (!nextPt) break;

        iPt++;
        const nextEndTick = nextPt.tick;
        if (nextEndTick > endTick) break;

        const ny = signalToY(nextPt.signal, yHi, yLo);
        const nx = LABEL_WIDTH + (nextPt.tick - startTick) * pixelsPerTick;
        const nyPrev = signalToY(pt.signal, yHi, yLo);

        ctx.lineTo(nx, nyPrev);
        ctx.lineTo(nx, ny);
      }
      ctx.stroke();
    }
  }, [monitoredNets, waveformData, cursorTick, zoomLevel, scrollOffset, simTickCount]);

  useEffect(() => {
    maxTickRef.current = simTickCount;
    if (autoScroll) {
      const drawWidth = (containerRef.current?.getBoundingClientRect().width || 800) - LABEL_WIDTH;
      if (drawWidth > 0) {
        const visibleTicks = drawWidth / zoomLevel;
        setScrollOffset(Math.max(0, simTickCount - visibleTicks));
      }
    }
  }, [simTickCount, autoScroll, zoomLevel]);

  useEffect(() => {
    draw();
    const raf = requestAnimationFrame(() => draw());
    return () => cancelAnimationFrame(raf);
  }, [draw]);

  useEffect(() => {
    if (!visible) return;
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [visible, draw]);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const drawWidth = rect.width - LABEL_WIDTH;

      if (x < LABEL_WIDTH) {
        const rowCount = Math.max(monitoredNets.length, 1);
        const totalRowsHeight = rowCount * ROW_HEIGHT;
        const rowsStartY = Math.max(0, (rect.height - totalRowsHeight) / 2);
        const rowIdx = Math.floor((e.clientY - rect.top - rowsStartY) / ROW_HEIGHT);
        if (rowIdx >= 0 && rowIdx < monitoredNets.length) {
          removeNet(monitoredNets[rowIdx]);
        }
        return;
      }

      if (drawWidth > 0) {
        const tick = Math.round(scrollOffset + (x - LABEL_WIDTH) / zoomLevel);
        setCursorTick(tick >= 0 ? tick : null);
      }

      dragState.current = { dragging: true, startX: e.clientX, startScroll: scrollOffset };
    },
    [monitoredNets, scrollOffset, zoomLevel, setCursorTick, removeNet],
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState.current.dragging) return;
      const dx = e.clientX - dragState.current.startX;
      const tickShift = dx / zoomLevel;
      setScrollOffset(Math.max(0, dragState.current.startScroll - tickShift));
    },
    [zoomLevel],
  );

  const handleCanvasMouseUp = useCallback(() => {
    dragState.current.dragging = false;
  }, []);

  const handleAddNet = useCallback(() => {
    const id = parseInt(netIdInput, 10);
    if (!isNaN(id) && id > 0) {
      addNet(id);
    }
    setNetIdInput('');
  }, [netIdInput, addNet]);

  const handleExportCSV = useCallback(async () => {
    if (monitoredNets.length === 0) return;
    try {
      const csv = await exportCsv(monitoredNets);
      const path = await save({
        filters: [{ name: 'CSV File', extensions: ['csv'] }],
        defaultPath: 'waveform.csv',
      });
      if (path) {
        await writeTextFile(path, csv);
      }
    } catch (e) {
      console.error('Export CSV failed:', e);
    }
  }, [monitoredNets, exportCsv]);

  const handleFetchHistory = useCallback(async () => {
    if (monitoredNets.length === 0) return;
    try {
      await fetchHistory(monitoredNets);
    } catch (e) {
      console.error('Fetch history failed:', e);
    }
  }, [monitoredNets, fetchHistory]);

  if (!visible) return null;

  return (
    <div className="waveform-viewer">
      <div className="waveform-toolbar">
        <span className="waveform-title">{t('waveform.panelTitle')}</span>
        <div className="waveform-toolbar-group">
          <input
            type="number"
            className="waveform-net-input"
            placeholder={t('waveform.netIdPlaceholder')}
            value={netIdInput}
            onChange={(e) => setNetIdInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddNet(); }}
          />
          <button onClick={handleAddNet}>+ {t('waveform.add')}</button>
          <button onClick={handleFetchHistory} disabled={monitoredNets.length === 0}>
            ↻ {t('waveform.fetchHistory')}
          </button>
          <button onClick={handleExportCSV} disabled={monitoredNets.length === 0}>
            ⬇ {t('waveform.exportCsv')}
          </button>
          <label className="waveform-checkbox">
            <input type="checkbox" checked={autoScroll} onChange={toggleAutoScroll} />
            {t('waveform.autoScroll')}
          </label>
<button onClick={() => setZoom(Math.max(1, zoomLevel / 2))}>{t('waveform.zoomOut')}</button>
<button onClick={() => setZoom(Math.min(64, zoomLevel * 2))}>{t('waveform.zoomIn')}</button>
          <button onClick={() => setScrollOffset(Math.max(0, scrollOffset - 50))}>◀</button>
          <button onClick={() => setScrollOffset(scrollOffset + 50)}>▶</button>
        </div>
        <button className="waveform-close-btn" onClick={onClose}>✕</button>
      </div>
      <div ref={containerRef} className="waveform-canvas-container">
        <canvas
          ref={canvasRef}
          className="waveform-canvas"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        />
      </div>
    </div>
  );
}

export default WaveformViewer;
