import { getWebGLContext } from "./getWebglContext";
import { displayShaderSource } from "./shaders";
import {
  Blit,
  createBlit,
  FBO,
  generateColor,
  makePointer,
  resizeCanvas,
  scaleByPixelRatio,
} from "./utils";
import { Material } from "./material";
import { Config, Pointer, RGB, WebGLExtensions } from "./types";
import { Framebuffers } from "./frameBuffers";
import { Programs } from "./Programs";

const config: Config = {
  SIM_RESOLUTION: 128,
  DYE_RESOLUTION: 1440,
  CAPTURE_RESOLUTION: 512,
  DENSITY_DISSIPATION: 3.5,
  VELOCITY_DISSIPATION: 2,
  PRESSURE: 0.1,
  PRESSURE_ITERATIONS: 20,
  CURL: 3,
  SHADING: true,
  SPLAT_RADIUS: 0.2,
  SPLAT_FORCE: 6000,
  COLOR_UPDATE_SPEED: 10,
  PAUSED: false,
  BACK_COLOR: { r: 0.5, g: 0, b: 0 },
  TRANSPARENT: true,
};

let isInited = false;

export const makeFluidCursor = (rootCanvas: HTMLCanvasElement) => {
  if (isInited) {
    return;
  }

  isInited = true;

  resizeCanvas(rootCanvas);

  const cursorPointer: Pointer = makePointer(-1);

  const logicPointer: Pointer = makePointer(1);

  const pointers = [cursorPointer, logicPointer];

  const { gl, ext } = getWebGLContext(rootCanvas);

  if (!ext.supportLinearFiltering) {
    config.DYE_RESOLUTION = 256;
    config.SHADING = false;
  }

  const blit = createBlit(gl);

  const programs = new Programs(gl, ext);

  const displayMaterial = new Material(
    gl,
    programs.baseVertexShader,
    displayShaderSource,
  );

  const buffers = new Framebuffers(gl, config, ext, programs.copy, blit);

  if (config.SHADING) displayMaterial.setKeywords(["SHADING"]);

  let lastUpdateTime = Date.now();
  let colorUpdateTimer = 0.0;

  function updateColors(deltaTime: number, config: Config) {
    colorUpdateTimer += deltaTime * config.COLOR_UPDATE_SPEED;
    if (colorUpdateTimer >= 10) {
      colorUpdateTimer = wrap(colorUpdateTimer, 0, 1);
      pointers.forEach((p) => {
        p.color = generateColor();
      });
    }
  }

  function update() {
    const deltaTime = calcDeltaTime();
    if (resizeCanvas(rootCanvas)) buffers.update();
    //updateColors(deltaTime, config);
    applyInputs();
    step(gl, ext, deltaTime, buffers, blit, programs, config);
    render(gl, displayMaterial, config, buffers, null);
    requestAnimationFrame(update);
  }

  function calcDeltaTime() {
    const now = Date.now();
    const dt = Math.min((now - lastUpdateTime) / 1000, 0.016666);
    lastUpdateTime = now;
    return dt;
  }

  function applyInputs() {
    pointers.forEach((p) => {
      if (p.moved) {
        p.moved = false;
        splatPointer(p, blit);
      }
    });
  }

  function step(
    gl: WebGL2RenderingContext,
    ext: WebGLExtensions,
    deltaTime: number,
    buffers: Framebuffers,
    blit: Blit,
    programs: Programs,
    config: Config,
  ) {
    gl.disable(gl.BLEND);

    programs.curl.bind();
    gl.uniform2f(
      programs.curl.uniforms.texelSize,
      buffers.velocity.texelSizeX,
      buffers.velocity.texelSizeY,
    );

    gl.uniform1i(
      programs.curl.uniforms.uVelocity,
      buffers.velocity.read.attach(0),
    );
    blit(buffers.curl);

    programs.vorticity.bind();
    gl.uniform2f(
      programs.vorticity.uniforms.texelSize,
      buffers.velocity.texelSizeX,
      buffers.velocity.texelSizeY,
    );
    gl.uniform1i(
      programs.vorticity.uniforms.uVelocity,
      buffers.velocity.read.attach(0),
    );
    gl.uniform1i(programs.vorticity.uniforms.uCurl, buffers.curl.attach(1));
    gl.uniform1f(programs.vorticity.uniforms.curl, config.CURL);
    gl.uniform1f(programs.vorticity.uniforms.dt, deltaTime);
    blit(buffers.velocity.write);
    buffers.velocity.swap();

    programs.divergence.bind();
    gl.uniform2f(
      programs.divergence.uniforms.texelSize,
      buffers.velocity.texelSizeX,
      buffers.velocity.texelSizeY,
    );
    gl.uniform1i(
      programs.divergence.uniforms.uVelocity,
      buffers.velocity.read.attach(0),
    );
    blit(buffers.divergence);

    programs.clear.bind();
    gl.uniform1i(
      programs.clear.uniforms.uTexture,
      buffers.pressure.read.attach(0),
    );
    gl.uniform1f(programs.clear.uniforms.value, config.PRESSURE);
    blit(buffers.pressure.write);
    buffers.pressure.swap();

    programs.pressure.bind();
    gl.uniform2f(
      programs.pressure.uniforms.texelSize,
      buffers.velocity.texelSizeX,
      buffers.velocity.texelSizeY,
    );
    gl.uniform1i(
      programs.pressure.uniforms.uDivergence,
      buffers.divergence.attach(0),
    );
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(
        programs.pressure.uniforms.uPressure,
        buffers.pressure.read.attach(1),
      );
      blit(buffers.pressure.write);
      buffers.pressure.swap();
    }

    programs.gradienSubtract.bind();
    gl.uniform2f(
      programs.gradienSubtract.uniforms.texelSize,
      buffers.velocity.texelSizeX,
      buffers.velocity.texelSizeY,
    );
    gl.uniform1i(
      programs.gradienSubtract.uniforms.uPressure,
      buffers.pressure.read.attach(0),
    );
    gl.uniform1i(
      programs.gradienSubtract.uniforms.uVelocity,
      buffers.velocity.read.attach(1),
    );
    blit(buffers.velocity.write);
    buffers.velocity.swap();

    programs.advection.bind();
    gl.uniform2f(
      programs.advection.uniforms.texelSize,
      buffers.velocity.texelSizeX,
      buffers.velocity.texelSizeY,
    );
    if (!ext.supportLinearFiltering)
      gl.uniform2f(
        programs.advection.uniforms.dyeTexelSize,
        buffers.velocity.texelSizeX,
        buffers.velocity.texelSizeY,
      );
    const velocityId = buffers.velocity.read.attach(0);
    gl.uniform1i(programs.advection.uniforms.uVelocity, velocityId);
    gl.uniform1i(programs.advection.uniforms.uSource, velocityId);
    gl.uniform1f(programs.advection.uniforms.dt, deltaTime);
    gl.uniform1f(
      programs.advection.uniforms.dissipation,
      config.VELOCITY_DISSIPATION,
    );
    blit(buffers.velocity.write);
    buffers.velocity.swap();

    if (!ext.supportLinearFiltering)
      gl.uniform2f(
        programs.advection.uniforms.dyeTexelSize,
        buffers.dye.texelSizeX,
        buffers.dye.texelSizeY,
      );
    gl.uniform1i(
      programs.advection.uniforms.uVelocity,
      buffers.velocity.read.attach(0),
    );
    gl.uniform1i(
      programs.advection.uniforms.uSource,
      buffers.dye.read.attach(1),
    );
    gl.uniform1f(
      programs.advection.uniforms.dissipation,
      config.DENSITY_DISSIPATION,
    );
    blit(buffers.dye.write);
    buffers.dye.swap();
  }

  function render(
    gl: WebGL2RenderingContext,
    displayMaterial: Material,
    config: Config,
    buffers: Framebuffers,
    target: null | FBO,
  ) {
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    drawDisplay(gl, displayMaterial, config, buffers, target);
  }

  function drawDisplay(
    gl: WebGL2RenderingContext,
    displayMaterial: Material,
    config: Config,
    buffers: Framebuffers,
    target: null | FBO,
  ) {
    const width = target == null ? gl.drawingBufferWidth : target.width;
    const height = target == null ? gl.drawingBufferHeight : target.height;

    displayMaterial.bind();
    if (config.SHADING)
      gl.uniform2f(
        displayMaterial.uniforms.texelSize,
        1.0 / width,
        1.0 / height,
      );
    gl.uniform1i(displayMaterial.uniforms.uTexture, buffers.dye.read.attach(0));
    blit(target);
  }

  function splatPointer(pointer: Pointer, blit: Blit) {
    const dx = pointer.deltaX * config.SPLAT_FORCE;
    const dy = pointer.deltaY * config.SPLAT_FORCE;
    splat(
      gl,
      programs,
      config,
      buffers,
      pointer.texcoordX,
      pointer.texcoordY,
      dx,
      dy,
      pointer.color,
      blit,
    );
  }

  function clickSplat(pointer: Pointer, blit: Blit) {
    const color = generateColor();
    color.r *= 10.0;
    color.g *= 10.0;
    color.b *= 10.0;
    const dx = 10 * (Math.random() - 0.5);
    const dy = 30 * (Math.random() - 0.5);
    splat(
      gl,
      programs,
      config,
      buffers,
      pointer.texcoordX,
      pointer.texcoordY,
      dx,
      dy,
      color,
      blit,
    );
  }

  function splat(
    gl: WebGL2RenderingContext,
    programs: Programs,
    config: Config,
    buffers: Framebuffers,
    x: number,
    y: number,
    dx: number,
    dy: number,
    color: RGB,
    blit: Blit,
  ) {
    programs.splat.bind();
    gl.uniform1i(
      programs.splat.uniforms.uTarget,
      buffers.velocity.read.attach(0),
    );
    gl.uniform1f(
      programs.splat.uniforms.aspectRatio,
      rootCanvas.width / rootCanvas.height,
    );
    gl.uniform2f(programs.splat.uniforms.point, x, y);
    gl.uniform3f(programs.splat.uniforms.color, dx, dy, 0.0);
    gl.uniform1f(
      programs.splat.uniforms.radius,
      correctRadius(config.SPLAT_RADIUS / 100.0),
    );
    blit(buffers.velocity.write);
    buffers.velocity.swap();

    gl.uniform1i(programs.splat.uniforms.uTarget, buffers.dye.read.attach(0));
    gl.uniform3f(programs.splat.uniforms.color, color.r, color.g, color.b);
    blit(buffers.dye.write);
    buffers.dye.swap();
  }

  function correctRadius(radius: number) {
    const aspectRatio = rootCanvas.width / rootCanvas.height;
    if (aspectRatio > 1) radius *= aspectRatio;
    return radius;
  }

  window.addEventListener("mousedown", (e) => {
    const posX = scaleByPixelRatio(e.clientX);
    const posY = scaleByPixelRatio(e.clientY);
    updatePointerDownData(cursorPointer, posX, posY);
    clickSplat(cursorPointer, blit);
  });

  document.body.addEventListener("mousemove", function handleFirstMouseMove(e) {
    console.log("mousemove");
    const posX = scaleByPixelRatio(e.clientX);
    const posY = scaleByPixelRatio(e.clientY);
    const color = generateColor();

    update();
    updatePointerMoveData(cursorPointer, posX, posY, color);

    // Remove this event listener after the first mousemove event
    document.body.removeEventListener("mousemove", handleFirstMouseMove);
  });

  window.addEventListener("mousemove", (e) => {
    const posX = scaleByPixelRatio(e.clientX);
    const posY = scaleByPixelRatio(e.clientY);
    const color = cursorPointer.color;

    updatePointerMoveData(cursorPointer, posX, posY, color);
  });

  document.body.addEventListener(
    "touchstart",
    function handleFirstTouchStart(e) {
      const touches = e.targetTouches;

      for (let i = 0; i < touches.length; i++) {
        const posX = scaleByPixelRatio(touches[i].clientX);
        const posY = scaleByPixelRatio(touches[i].clientY);

        update();
        updatePointerDownData(cursorPointer, posX, posY);
      }

      // Remove this event listener after the first touchstart event
      document.body.removeEventListener("touchstart", handleFirstTouchStart);
    },
  );

  window.addEventListener("touchstart", (e) => {
    const touches = e.targetTouches;
    for (let i = 0; i < touches.length; i++) {
      const posX = scaleByPixelRatio(touches[i].clientX);
      const posY = scaleByPixelRatio(touches[i].clientY);
      updatePointerDownData(cursorPointer, posX, posY);
    }
  });

  window.addEventListener(
    "touchmove",
    (e) => {
      const touches = e.targetTouches;
      for (let i = 0; i < touches.length; i++) {
        const posX = scaleByPixelRatio(touches[i].clientX);
        const posY = scaleByPixelRatio(touches[i].clientY);
        updatePointerMoveData(cursorPointer, posX, posY, cursorPointer.color);
      }
    },
    false,
  );

  function updatePointerDownData(pointer: Pointer, posX: number, posY: number) {
    pointer.moved = false;
    pointer.texcoordX = posX / rootCanvas.width;
    pointer.texcoordY = 1.0 - posY / rootCanvas.height;
    pointer.prevTexcoordX = pointer.texcoordX;
    pointer.prevTexcoordY = pointer.texcoordY;
    pointer.deltaX = 0;
    pointer.deltaY = 0;
    pointer.color = generateColor();
  }

  function updatePointerMoveData(
    pointer: Pointer,
    posX: number,
    posY: number,
    color: RGB,
  ) {
    function correctDeltaX(delta: number) {
      const aspectRatio = rootCanvas.width / rootCanvas.height;
      if (aspectRatio < 1) delta *= aspectRatio;
      return delta;
    }

    function correctDeltaY(delta: number) {
      const aspectRatio = rootCanvas.width / rootCanvas.height;
      if (aspectRatio > 1) delta /= aspectRatio;
      return delta;
    }

    pointer.prevTexcoordX = pointer.texcoordX;
    pointer.prevTexcoordY = pointer.texcoordY;
    pointer.texcoordX = posX / rootCanvas.width;
    pointer.texcoordY = 1.0 - posY / rootCanvas.height;
    pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
    pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
    pointer.moved =
      Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
    pointer.color = color;
  }

  function wrap(value: number, min: number, max: number) {
    const range = max - min;
    if (range == 0) return min;
    return ((value - min) % range) + min;
  }
};
