import React, { useEffect, useRef, useState } from 'react';
import Konva from 'konva';
import * as Y from 'yjs';
// @ts-ignore
import { WebsocketProvider } from 'y-websocket';

type YRect = { id: string; x: number; y: number; width: number; height: number; fill: string };

interface ScribbleKonvaBoardProps {
  room?: string;
}

const ScribbleKonvaBoard: React.FC<ScribbleKonvaBoardProps> = ({ room = 'neuraplay-scribble' }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const [doc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);

  useEffect(() => {
    const p = new WebsocketProvider('wss://demos.yjs.dev', room, doc);
    setProvider(p);
    return () => { p.destroy(); doc.destroy(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const stage = new Konva.Stage({ container: containerRef.current, width: containerRef.current.clientWidth, height: 420 });
    const layer = new Konva.Layer();
    stage.add(layer);
    stageRef.current = stage;
    layerRef.current = layer;

    const onResize = () => {
      if (!containerRef.current || !stageRef.current) return;
      stageRef.current.width(containerRef.current.clientWidth);
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); stage.destroy(); };
  }, []);

  useEffect(() => {
    const rects = doc.getArray<YRect>('rects');
    const updateLayer = () => {
      const layer = layerRef.current; if (!layer) return;
      layer.destroyChildren();
      rects.toArray().forEach(r => {
        const rect = new Konva.Rect({ x: r.x, y: r.y, width: r.width, height: r.height, fill: r.fill, draggable: true });
        rect.on('dragend', () => {
          const idx = rects.toArray().findIndex(rr => rr.id === r.id);
          if (idx >= 0) {
            rects.delete(idx, 1);
            rects.insert(idx, [{ ...r, x: rect.x(), y: rect.y() }]);
          }
        });
        layer.add(rect);
      });
      layer.draw();
    };
    const obs = () => updateLayer();
    rects.observe(obs); updateLayer();
    return () => rects.unobserve(obs);
  }, [doc]);

  const addRect = () => {
    const rects = doc.getArray<YRect>('rects');
    rects.push([{ id: `r_${Date.now()}`, x: Math.random()*200+20, y: Math.random()*120+20, width: 120, height: 60, fill: '#6366f1' }]);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm opacity-70">Shared Board: {room}</div>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 text-xs rounded border" onClick={addRect}>Add Rect</button>
          <span className="text-xs opacity-70">Peers: {provider?.awareness?.getStates()?.size || 1}</span>
        </div>
      </div>
      <div ref={containerRef} className="w-full rounded border border-black/10 dark:border-white/10 bg-white dark:bg-black" />
    </div>
  );
};

export default ScribbleKonvaBoard;

