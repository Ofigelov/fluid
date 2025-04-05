import { generateColor } from "../generateColor";
import { Pointer } from "../../types";

export function updatePointerDownData(
  pointer: Pointer,
  posX: number,
  posY: number,
  canvas: HTMLCanvasElement,
) {
  pointer.moved = false;
  pointer.texcoordX = posX / canvas.width;
  pointer.texcoordY = 1.0 - posY / canvas.height;
  pointer.prevTexcoordX = pointer.texcoordX;
  pointer.prevTexcoordY = pointer.texcoordY;
  pointer.deltaX = 0;
  pointer.deltaY = 0;
  pointer.color = generateColor();
}
