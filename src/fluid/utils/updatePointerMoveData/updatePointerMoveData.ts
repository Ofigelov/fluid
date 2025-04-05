import { Pointer, RGB } from "../../types";

function correctDeltaX(delta: number, canvas: HTMLCanvasElement) {
  const aspectRatio = canvas.width / canvas.height;
  if (aspectRatio < 1) delta *= aspectRatio;
  return delta;
}

function correctDeltaY(delta: number, canvas: HTMLCanvasElement) {
  const aspectRatio = canvas.width / canvas.height;
  if (aspectRatio > 1) delta /= aspectRatio;
  return delta;
}

export function updatePointerMoveData(
  pointer: Pointer,
  posX: number,
  posY: number,
  color: RGB,
  canvas: HTMLCanvasElement,
) {
  pointer.prevTexcoordX = pointer.texcoordX;
  pointer.prevTexcoordY = pointer.texcoordY;
  pointer.texcoordX = posX / canvas.width;
  pointer.texcoordY = 1.0 - posY / canvas.height;
  pointer.deltaX = correctDeltaX(
    pointer.texcoordX - pointer.prevTexcoordX,
    canvas,
  );
  pointer.deltaY = correctDeltaY(
    pointer.texcoordY - pointer.prevTexcoordY,
    canvas,
  );
  pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
  pointer.color = color;
}
