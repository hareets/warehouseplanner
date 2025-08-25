export const snapToGrid = (v: number, step: number) =>
    Math.round(v / step) * step;
  
  export const clampAABBInside = (
    x: number, y: number, w: number, h: number,
    boundW: number, boundH: number
  ) => {
    const maxX = Math.max(0, boundW - w);
    const maxY = Math.max(0, boundH - h);
    return {
      x: Math.min(Math.max(0, x), maxX),
      y: Math.min(Math.max(0, y), maxY),
    };
  };