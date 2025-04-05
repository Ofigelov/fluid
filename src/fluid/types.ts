export type WebGLExtensions = {
  formatRGBA: { internalFormat: number; format: number };
  formatRG: { internalFormat: number; format: number };
  formatR: { internalFormat: number; format: number };
  halfFloatTexType: number;
  supportLinearFiltering: OES_texture_float_linear | null;
};

export type Config = {
  SIM_RESOLUTION: number;
  DYE_RESOLUTION: number;
  CAPTURE_RESOLUTION: number;
  DENSITY_DISSIPATION: number;
  VELOCITY_DISSIPATION: number;
  PRESSURE: number;
  PRESSURE_ITERATIONS: number;
  CURL: number;
  SHADING: boolean;
  SPLAT_RADIUS: number;
  SPLAT_FORCE: number;
  COLOR_UPDATE_SPEED: number;
};

export type Pointer = {
  id: number;
  texcoordX: number;
  texcoordY: number;
  prevTexcoordX: number;
  prevTexcoordY: number;
  deltaX: number;
  deltaY: number;
  moved: boolean;
  color: RGB;
};

export type RGB = {
  r: number;
  g: number;
  b: number;
};
