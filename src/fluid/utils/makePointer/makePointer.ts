import type { Pointer } from "../../types";

export const makePointer = (id: number): Pointer => ({
  id,
  texcoordX: 0,
  texcoordY: 0,
  prevTexcoordX: 0,
  prevTexcoordY: 0,
  deltaX: 0,
  deltaY: 0,
  moved: false,
  color: { r: 0, g: 0, b: 0 },
});
