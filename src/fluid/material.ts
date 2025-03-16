import { compileShader } from "./shaders";
import { createProgram, getUniforms, hashCode } from "./utils";

export class Material {
  vertexShader: WebGLShader;
  fragmentShaderSource: string;
  programs: { [key: number]: WebGLProgram };
  activeProgram: WebGLProgram | null;
  uniforms: { [key: string]: WebGLUniformLocation };

  constructor(
    private readonly gl: WebGL2RenderingContext,
    vertexShader: WebGLShader,
    fragmentShaderSource: string,
  ) {
    this.vertexShader = vertexShader;
    this.fragmentShaderSource = fragmentShaderSource;
    this.programs = {};
    this.activeProgram = null;
    this.uniforms = {};
  }

  public setKeywords = (keywords: string[]) => {
    const hash = keywords.reduce((acc, item) => acc + hashCode(item), 0);
    let program = this.programs[hash];
    if (program == null) {
      const fragmentShader = compileShader(
        this.gl,
        this.gl.FRAGMENT_SHADER,
        this.fragmentShaderSource,
        keywords,
      );
      program = createProgram(this.gl, this.vertexShader, fragmentShader);
      this.programs[hash] = program;
    }
    if (program == this.activeProgram) {
      return;
    }
    this.uniforms = getUniforms(this.gl, program);
    this.activeProgram = program;
  };

  public bind = () => {
    this.gl.useProgram(this.activeProgram!);
  };
}
