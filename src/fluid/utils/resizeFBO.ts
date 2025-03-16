import { createFBO, type FBO } from "./createFBO";
import { type Program } from "../program";
import { type Blit } from "./blit";

export const resizeFBO = (
  gl: WebGL2RenderingContext,
  copyProgram: Program,
  blit: Blit,
  target: FBO,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  param: number,
) => {
  const newFBO = createFBO(gl, w, h, internalFormat, format, type, param);
  copyProgram.bind();
  gl.uniform1i(copyProgram.uniforms.uTexture, target.attach(0));
  blit(newFBO);
  return newFBO;
};
