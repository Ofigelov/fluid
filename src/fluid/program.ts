import { createProgram, getUniforms } from "./utils";

export class Program {
  uniforms: { [key: string]: WebGLUniformLocation };
  program: WebGLProgram;

  constructor(
    private readonly gl: WebGL2RenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader,
  ) {
    this.program = createProgram(gl, vertexShader, fragmentShader);
    this.uniforms = getUniforms(gl, this.program);
  }

  public bind = () => {
    this.gl.useProgram(this.program);
  };
}
