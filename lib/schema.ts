import { z } from "zod";

export const ElementSchema = z.object({
  id: z.string(),
  type: z.enum(["rack","zone","door","label","boundary"]),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().finite(),
  label: z.string().optional(),
  fill: z.string().optional(),
  locked: z.boolean().optional(),
  hidden: z.boolean().optional(),
  meta: z.record(z.unknown()).optional(),
});

export const WarehouseSchema = z.object({
  widthM: z.number().positive(),
  heightM: z.number().positive(),
  gridStepM: z.number().positive(),
  elements: z.array(ElementSchema),
  schemaVersion: z.literal(1).optional(),
});

export type ElementDTO = z.infer<typeof ElementSchema>;
export type WarehouseDTO = z.infer<typeof WarehouseSchema>;