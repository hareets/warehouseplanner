export type ElementType = "rack" | "zone" | "door" | "label" | "boundary";

export type ElementBase = {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  label?: string;
  fill?: string;
  locked?: boolean;
  hidden?: boolean;
  meta?: Record<string, unknown>;
};

export type Warehouse = {
  widthM: number;
  heightM: number;
  gridStepM: number;
  elements: ElementBase[];
  schemaVersion?: 1;
};