import { Config, WebGLExtensions } from "./types";
import {
  Blit,
  createDoubleFBO,
  createFBO,
  DoubleFBO,
  FBO,
  getResolution,
  resizeDoubleFBO,
} from "./utils";
import { Program } from "./program";

export class Framebuffers {
  public dye: DoubleFBO;
  public velocity: DoubleFBO;
  //@ts-expect-error TS2564
  public divergence: FBO;
  //@ts-expect-error TS2564
  public curl: FBO;
  //@ts-expect-error TS2564
  public pressure: DoubleFBO;

  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly config: Config,
    private readonly ext: WebGLExtensions,
    private readonly copyProgram: Program,
    private readonly blit: Blit,
  ) {
    const { simRes, dyeRes, texType, rgba, rg, filtering } = this.sizes;

    this.gl.disable(this.gl.BLEND);

    this.dye = createDoubleFBO(
      gl,
      dyeRes.width,
      dyeRes.height,
      rgba.internalFormat,
      rgba.format,
      texType,
      filtering,
    );
    this.velocity = createDoubleFBO(
      gl,
      simRes.width,
      simRes.height,
      rg.internalFormat,
      rg.format,
      texType,
      filtering,
    );
    this.setNotResizeable();
  }

  private setNotResizeable = () => {
    const { simRes, texType, r } = this.sizes;

    this.divergence = createFBO(
      this.gl,
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      this.gl.NEAREST,
    );
    this.curl = createFBO(
      this.gl,
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      this.gl.NEAREST,
    );
    this.pressure = createDoubleFBO(
      this.gl,
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      this.gl.NEAREST,
    );
  };

  private get sizes() {
    return {
      simRes: getResolution(this.gl, this.config.SIM_RESOLUTION),
      dyeRes: getResolution(this.gl, this.config.DYE_RESOLUTION),
      texType: this.ext.halfFloatTexType,
      rgba: this.ext.formatRGBA,
      rg: this.ext.formatRG,
      r: this.ext.formatR,
      filtering: this.ext.supportLinearFiltering
        ? this.gl.LINEAR
        : this.gl.NEAREST,
    };
  }

  update = () => {
    const { simRes, dyeRes, texType, rgba, rg, filtering } = this.sizes;

    this.gl.disable(this.gl.BLEND);

    this.dye = resizeDoubleFBO(
      this.gl,
      this.copyProgram,
      this.blit,
      this.dye,
      dyeRes.width,
      dyeRes.height,
      rgba.internalFormat,
      rgba.format,
      texType,
      filtering,
    );

    this.velocity = resizeDoubleFBO(
      this.gl,
      this.copyProgram,
      this.blit,
      this.velocity,
      simRes.width,
      simRes.height,
      rg.internalFormat,
      rg.format,
      texType,
      filtering,
    );

    this.setNotResizeable();
  };
}
