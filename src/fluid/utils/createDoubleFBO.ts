import { createFBO, type FBO } from "./createFBO";
import { Program } from "../program";
import type { Blit } from "./blit";
import { resizeFBO } from "./resizeFBO";

export type DoubleFBO = {
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  read: FBO;
  write: FBO;
  swap: () => void;
};

export const createDoubleFBO = (
  gl: WebGL2RenderingContext,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  param: number,
) => {
  let fbo1 = createFBO(gl, w, h, internalFormat, format, type, param);
  let fbo2 = createFBO(gl, w, h, internalFormat, format, type, param);

  return {
    width: w,
    height: h,
    texelSizeX: fbo1.texelSizeX,
    texelSizeY: fbo1.texelSizeY,
    get read() {
      return fbo1;
    },
    set read(value) {
      fbo1 = value;
    },
    get write() {
      return fbo2;
    },
    set write(value) {
      fbo2 = value;
    },
    swap() {
      const temp = fbo1;
      fbo1 = fbo2;
      fbo2 = temp;
    },
  };
};

export const resizeDoubleFBO = (
  gl: WebGL2RenderingContext,
  copyProgram: Program,
  blit: Blit,
  target: DoubleFBO,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  param: number,
) => {
  if (target.width == w && target.height == h) return target;
  target.read = resizeFBO(
    gl,
    copyProgram,
    blit,
    target.read,
    w,
    h,
    internalFormat,
    format,
    type,
    param,
  );
  target.write = createFBO(gl, w, h, internalFormat, format, type, param);
  target.width = w;
  target.height = h;
  target.texelSizeX = 1.0 / w;
  target.texelSizeY = 1.0 / h;
  return target;
};
