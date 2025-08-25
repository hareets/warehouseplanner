"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Stage, Layer, Rect, Line } from "react-konva";
import Konva from "konva";
import { useStore } from "@/state/useStore";

const SCALE = 20;      // 1 meter = 20 px
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 5;
const ZOOM_STEP = 1.2;

export default function CanvasStage() {
  const stageRef = useRef<Konva.Stage>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [vw, setVw] = useState(1000);
  const [vh, setVh] = useState(600);

  const elements = useStore((s) => s.warehouse.elements);
  const Wm = useStore((s) => s.warehouse.widthM);
  const Hm = useStore((s) => s.warehouse.heightM);
  const stepM = useStore((s) => s.warehouse.gridStepM);
  const selected = useStore((s) => s.selectedIds);
  const select = useStore((s) => s.selectElements);
  const clear = useStore((s) => s.clearSelection);
  const moveBy = useStore((s) => s.moveBy);
  const snapOn = useStore((s) => s.snapToGridOn);
  const toggleSnap = useStore((s) => s.toggleSnap);

  // measure wrapper & react to resize
  useEffect(() => {
    const measure = () => {
      if (!wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      setVw(Math.max(600, Math.floor(r.width)));
      setVh(Math.max(400, Math.floor(r.height)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, []);

  // helpers
  const fitToScreen = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const targetW = Wm * SCALE;
    const targetH = Hm * SCALE;
    const margin = 24; // px
    const fit = Math.min((vw - margin * 2) / targetW, (vh - margin * 2) / targetH);
    const scale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fit));
    stage.scale({ x: scale, y: scale });
    stage.position({ x: (vw - targetW * scale) / 2, y: (vh - targetH * scale) / 2 });
    stage.batchDraw();
  }, [vw, vh, Wm, Hm]);

  const zoomAtPoint = (factor: number, point: { x: number; y: number }) => {
    const stage = stageRef.current!;
    const old = stage.scaleX();
    const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, old * factor));
    const abs = stage.getAbsoluteTransform().copy();
    abs.invert();
    const mousePointTo = abs.point(point);
    stage.scale({ x: next, y: next });
    stage.position({ x: point.x - mousePointTo.x * next, y: point.y - mousePointTo.y * next });
    stage.batchDraw();
  };

  const zoomCentered = (factor: number) => {
    zoomAtPoint(factor, { x: vw / 2, y: vh / 2 });
  };

  // initial fit & center
  useEffect(() => {
    fitToScreen();
  }, [fitToScreen]);

  // pan
  const enablePan = (evt: any) => {
    const stage = stageRef.current!;
    stage.draggable(true);
    stage.startDrag(evt);
  };
  const disablePan = () => {
    const stage = stageRef.current!;
    stage.draggable(false);
  };

  // wheel zoom to cursor
  const onWheel = (e: any) => {
    e.evt.preventDefault();
    const dir = e.evt.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP;
    const stage = stageRef.current!;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    zoomAtPoint(dir, pointer);
  };

  // keyboard: F fit, +/− zoom, 0 fit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F" || e.key === "0") {
        e.preventDefault();
        fitToScreen();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomCentered(ZOOM_STEP);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomCentered(1 / ZOOM_STEP);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fitToScreen, vw, vh]);

  // drag elements: px -> meters
  const onDragStart = useCallback((elId: string, elPxX: number, elPxY: number, e: any) => {
    e.target.setAttrs({ _startPxX: elPxX, _startPxY: elPxY });
  }, []);
  const onDragEnd = useCallback(
    (id: string, e: any) => {
      const node = e.target;
      const sx = node.attrs._startPxX as number;
      const sy = node.attrs._startPxY as number;
      const dxPx = node.x() - sx;
      const dyPx = node.y() - sy;
      moveBy(id, dxPx / SCALE, dyPx / SCALE);
      node.position({ x: sx, y: sy }); // snap visual back; store is source of truth
    },
    [moveBy]
  );

  // grid lines
  const gridLines = (() => {
    const lines = [];
    const stepPx = stepM * SCALE;
    const Wpx = Wm * SCALE;
    const Hpx = Hm * SCALE;
    for (let x = 0; x <= Wpx + 0.5; x += stepPx) {
      lines.push(<Line key={`gx-${x}`} points={[x, 0, x, Hpx]} stroke="#e5e7eb" strokeWidth={1} listening={false} />);
    }
    for (let y = 0; y <= Hpx + 0.5; y += stepPx) {
      lines.push(<Line key={`gy-${y}`} points={[0, y, Wpx, y]} stroke="#e5e7eb" strokeWidth={1} listening={false} />);
    }
    return lines;
  })();

  const Wpx = Wm * SCALE;
  const Hpx = Hm * SCALE;

  return (
    <div ref={wrapRef} className="relative w-full h-[calc(100vh-140px)] bg-slate-100 rounded-lg p-2">
      {/* Toolbar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-white/90 backdrop-blur px-2 py-1 rounded-md shadow">
        <button className="px-2 py-1 text-sm rounded bg-slate-200 hover:bg-slate-300" onClick={() => zoomCentered(1 / ZOOM_STEP)}>
          −
        </button>
        <button className="px-2 py-1 text-sm rounded bg-slate-200 hover:bg-slate-300" onClick={() => zoomCentered(ZOOM_STEP)}>
          +
        </button>
        <button className="px-2 py-1 text-sm rounded bg-slate-200 hover:bg-slate-300" onClick={fitToScreen}>
          Fit
        </button>
        <label className="ml-2 text-sm inline-flex items-center gap-1">
          <input type="checkbox" checked={snapOn} onChange={() => toggleSnap()} />
          Snap
        </label>
      </div>

      <Stage
        ref={stageRef}
        width={vw}
        height={vh}
        style={{ background: "transparent" }}
        onWheel={onWheel}
        draggable={false}
      >
        <Layer>
          {/* workspace background + hit area */}
          <Rect
            x={0}
            y={0}
            width={Wpx}
            height={Hpx}
            fill="#f8fafc"
            shadowColor="rgba(0,0,0,0.08)"
            shadowBlur={8}
            shadowOffset={{ x: 0, y: 2 }}
            listening
            onMouseDown={(e) => {
              clear();
              const stageEvt = (e as any).evt;
              const stage = stageRef.current!;
              stage.draggable(true);
              stage.startDrag(stageEvt);
            }}
            onMouseUp={() => {
              const stage = stageRef.current!;
              stage.draggable(false);
            }}
          />

          {/* grid */}
          {gridLines}

          {/* boundary */}
          <Rect x={0} y={0} width={Wpx} height={Hpx} stroke="#334155" strokeWidth={2} listening={false} />

          {/* elements */}
          {elements.map((el) => {
            const px = el.x * SCALE;
            const py = el.y * SCALE;
            const pw = el.width * SCALE;
            const ph = el.height * SCALE;
            const isSel = selected.includes(el.id);

            return (
              <Rect
                key={el.id}
                x={px}
                y={py}
                width={pw}
                height={ph}
                rotation={el.rotation}
                name={`el-${el.id}`} // future transformer/marquee
                fill={isSel ? "#dbeafe" : el.fill ?? "#93c5fd"}
                stroke={isSel ? "#2563eb" : "#1d4ed8"}
                strokeWidth={1}
                draggable
                onDragStart={(e) => onDragStart(el.id, px, py, e)}
                onDragEnd={(e) => onDragEnd(el.id, e)}
                onMouseDown={(e) => {
                  if (e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey) {
                    const next = new Set(selected);
                    next.add(el.id);
                    select(Array.from(next));
                  } else {
                    select([el.id]);
                  }
                  e.cancelBubble = true;
                }}
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}