import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ElementBase, Warehouse } from "@/lib/models";
import { snapToGrid, clampAABBInside } from "@/lib/geometry";
import { generateId } from "@/lib/id";

type CanvasState = {
  warehouse: Warehouse;
  selectedIds: string[];
  snapToGridOn: boolean;
};

type CanvasActions = {
  reset: () => void;
  addElement: (el: Omit<ElementBase, "id">) => void;
  selectElements: (ids: string[]) => void;
  clearSelection: () => void;
  deleteSelected: () => void;
  moveBy: (id: string, dx: number, dy: number) => void;
  resizeTo: (id: string, width: number, height: number) => void;
  rotateTo: (id: string, deg: number) => void;
  toggleSnap: (on?: boolean) => void;
};

const defaultWarehouse: Warehouse = {
  widthM: 40,
  heightM: 20,
  gridStepM: 0.5,
  elements: [],
  schemaVersion: 1,
};

export const useStore = create<CanvasState & CanvasActions>()(
  immer((set, get) => ({
    warehouse: defaultWarehouse,
    selectedIds: [],
    snapToGridOn: true,

    reset: () =>
      set((s) => {
        s.warehouse = { ...defaultWarehouse, elements: [] };
        s.selectedIds = [];
        s.snapToGridOn = true;
      }),

    addElement: (el) =>
      set((s) => {
        s.warehouse.elements.push({ id: generateId(), ...el });
      }),

    selectElements: (ids) =>
      set((s) => {
        s.selectedIds = [...new Set(ids)];
      }),

    clearSelection: () =>
      set((s) => {
        s.selectedIds = [];
      }),

    deleteSelected: () =>
      set((s) => {
        const ids = new Set(s.selectedIds);
        s.warehouse.elements = s.warehouse.elements.filter((e) => !ids.has(e.id));
        s.selectedIds = [];
      }),

    moveBy: (id, dx, dy) =>
      set((s) => {
        const el = s.warehouse.elements.find((e) => e.id === id);
        if (!el) return;
        let nx = el.x + dx;
        let ny = el.y + dy;
        if (get().snapToGridOn) {
          nx = snapToGrid(nx, s.warehouse.gridStepM);
          ny = snapToGrid(ny, s.warehouse.gridStepM);
        }
        const clamped = clampAABBInside(nx, ny, el.width, el.height, s.warehouse.widthM, s.warehouse.heightM);
        el.x = clamped.x;
        el.y = clamped.y;
      }),

    resizeTo: (id, width, height) =>
      set((s) => {
        const el = s.warehouse.elements.find((e) => e.id === id);
        if (!el) return;
        let w = Math.max(0.1, width);
        let h = Math.max(0.1, height);
        if (get().snapToGridOn) {
          w = snapToGrid(w, s.warehouse.gridStepM);
          h = snapToGrid(h, s.warehouse.gridStepM);
        }
        const clamped = clampAABBInside(el.x, el.y, w, h, s.warehouse.widthM, s.warehouse.heightM);
        el.x = clamped.x; el.y = clamped.y; el.width = w; el.height = h;
      }),

    rotateTo: (id, deg) =>
      set((s) => {
        const el = s.warehouse.elements.find((e) => e.id === id);
        if (el) el.rotation = ((deg % 360) + 360) % 360;
      }),

    toggleSnap: (on) =>
      set((s) => {
        s.snapToGridOn = typeof on === "boolean" ? on : !s.snapToGridOn;
      }),
  }))
);