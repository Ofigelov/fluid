import { WebGLExtensions } from "./types";

type WebGLContextResult = {
  gl: WebGL2RenderingContext;
  ext: WebGLExtensions;
};
function supportRenderTextureFormat(
  gl: WebGL2RenderingContext,
  internalFormat: number,
  format: number,
  type: number,
): boolean {
  const texture = gl.createTexture();
  if (!texture) {
    return false;
  }
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

  const fbo = gl.createFramebuffer();
  if (!fbo) {
    return false;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0,
  );

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.deleteTexture(texture);
  gl.deleteFramebuffer(fbo);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return status === gl.FRAMEBUFFER_COMPLETE;
}

function getSupportedFormat(
  gl: WebGL2RenderingContext,
  internalFormat: number,
  format: number,
  type: number,
): { internalFormat: number; format: number } {
  if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
    switch (internalFormat) {
      case gl.R16F:
        return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
      case gl.RG16F:
        return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
      default:
        // не уверен на счет правильности
        return { internalFormat: gl.RGBA16F, format: gl.RGBA };
    }
  }
  return {
    internalFormat,
    format,
  };
}
export const getWebGLContext = (
  canvas: HTMLCanvasElement,
): WebGLContextResult => {
  const params: WebGLContextAttributes = {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: false,
  };

  const gl = canvas.getContext(
    "webgl2",
    params,
  ) as WebGL2RenderingContext | null;

  if (!gl) {
    throw new Error("WebGL 2 context not supported");
  }

  gl.getExtension("EXT_color_buffer_float");
  const supportLinearFiltering = gl.getExtension(
    "OES_texture_float_linear",
  ) as OES_texture_float_linear | null;

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  const halfFloatTexType = gl.HALF_FLOAT;

  const formatRGBA = getSupportedFormat(
    gl,
    gl.RGBA16F,
    gl.RGBA,
    halfFloatTexType,
  );
  const formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
  const formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);

  return {
    gl,
    ext: {
      formatRGBA,
      formatRG,
      formatR,
      halfFloatTexType,
      supportLinearFiltering,
    },
  };
};
