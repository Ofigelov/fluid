import {
  createAdvectionShader,
  createBaseVertexShader,
  createClearShader,
  createCopyShader,
  createCurlShader,
  createDivergenceShader,
  createGradientSubtractShader,
  createPressureShader,
  createSplatShader,
  createVorticityShader,
} from "./shaders";
import { WebGLExtensions } from "./types";
import { Program } from "./program";

export class Programs {
  public baseVertexShader: WebGLShader;

  public copy: Program;
  public clear: Program;
  public splat: Program;
  public advection: Program;
  public divergence: Program;
  public curl: Program;
  public vorticity: Program;
  public pressure: Program;
  public gradienSubtract: Program;

  constructor(gl: WebGL2RenderingContext, ext: WebGLExtensions) {
    const base = createBaseVertexShader(gl);
    this.copy = new Program(gl, base, createCopyShader(gl));
    this.clear = new Program(gl, base, createClearShader(gl));
    this.splat = new Program(gl, base, createSplatShader(gl));
    this.advection = new Program(gl, base, createAdvectionShader(gl, ext));
    this.divergence = new Program(gl, base, createDivergenceShader(gl));
    this.curl = new Program(gl, base, createCurlShader(gl));
    this.vorticity = new Program(gl, base, createVorticityShader(gl));
    this.pressure = new Program(gl, base, createPressureShader(gl));
    this.gradienSubtract = new Program(
      gl,
      base,
      createGradientSubtractShader(gl),
    );
    this.baseVertexShader = base;
  }
}
