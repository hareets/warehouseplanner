"use client";
import dynamic from "next/dynamic";
import { useStore } from "@/state/useStore";

const CanvasStage = dynamic(() => import("@/components/CanvasStage"), { ssr: false });

export default function Home() {
  const add = useStore((s) => s.addElement);
  const del = useStore((s) => s.deleteSelected);
  const snap = useStore((s) => s.snapToGridOn);
  const toggleSnap = useStore((s) => s.toggleSnap);

  return (
    <main className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1 rounded bg-blue-600 text-white"
          onClick={() => add({ type: "rack", x: 2, y: 2, width: 2.7, height: 1.1, rotation: 0, label: "R01" })}
        >
          + Rack
        </button>
        <button
          className="px-3 py-1 rounded bg-slate-600 text-white"
          onClick={() => add({ type: "zone", x: 6, y: 3, width: 6, height: 3, rotation: 0, label: "Staging", fill: "#fde68a" })}
        >
          + Zone
        </button>
        <button className="px-3 py-1 rounded bg-rose-600 text-white" onClick={() => del()}>
          Delete Selected
        </button>
        <label className="ml-4 inline-flex items-center gap-2">
          <input type="checkbox" checked={snap} onChange={() => toggleSnap()} />
          <span>Snap</span>
        </label>
      </div>
      <CanvasStage />
    </main>
  );
}