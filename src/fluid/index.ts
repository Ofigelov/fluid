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
  splat,
  step,
  updatePointerDownData,
  updatePointerMoveData,
} from "./utils";
import { Material } from "./material";
import { Config, Pointer } from "./types";
import { Framebuffers } from "./frameBuffers";
import { Programs } from "./Programs";

let isInited = false;

export const makeFluidCursor = (
  rootCanvas: HTMLCanvasElement,
  config: Config,
) => {
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
    if (colorUpdateTimer >= 1) {
      colorUpdateTimer = wrap(colorUpdateTimer, 0, 1);
      pointers.forEach((p) => {
        p.color = generateColor();
      });
    }
  }

  function update() {
    const deltaTime = calcDeltaTime();
    if (resizeCanvas(rootCanvas)) buffers.update();
    updateColors(deltaTime, config);
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
      rootCanvas,
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
      rootCanvas,
    );
  }

  window.addEventListener("mousedown", (e) => {
    const posX = scaleByPixelRatio(e.clientX);
    const posY = scaleByPixelRatio(e.clientY);
    updatePointerDownData(cursorPointer, posX, posY, rootCanvas);
    clickSplat(cursorPointer, blit);
  });

  document.body.addEventListener("mousemove", function handleFirstMouseMove(e) {
    console.log("mousemove");
    const posX = scaleByPixelRatio(e.clientX);
    const posY = scaleByPixelRatio(e.clientY);
    const color = generateColor();

    update();
    updatePointerMoveData(cursorPointer, posX, posY, color, rootCanvas);

    // Remove this event listener after the first mousemove event
    document.body.removeEventListener("mousemove", handleFirstMouseMove);
  });

  window.addEventListener("mousemove", (e) => {
    const posX = scaleByPixelRatio(e.clientX);
    const posY = scaleByPixelRatio(e.clientY);
    const color = cursorPointer.color;

    updatePointerMoveData(cursorPointer, posX, posY, color, rootCanvas);
  });

  document.body.addEventListener(
    "touchstart",
    function handleFirstTouchStart(e) {
      const touches = e.targetTouches;

      for (let i = 0; i < touches.length; i++) {
        const posX = scaleByPixelRatio(touches[i].clientX);
        const posY = scaleByPixelRatio(touches[i].clientY);

        update();
        updatePointerDownData(cursorPointer, posX, posY, rootCanvas);
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
      updatePointerDownData(cursorPointer, posX, posY, rootCanvas);
    }
  });

  window.addEventListener(
    "touchmove",
    (e) => {
      const touches = e.targetTouches;
      for (let i = 0; i < touches.length; i++) {
        const posX = scaleByPixelRatio(touches[i].clientX);
        const posY = scaleByPixelRatio(touches[i].clientY);
        updatePointerMoveData(
          cursorPointer,
          posX,
          posY,
          cursorPointer.color,
          rootCanvas,
        );
      }
    },
    false,
  );

  function wrap(value: number, min: number, max: number) {
    const range = max - min;
    if (range == 0) return min;
    return ((value - min) % range) + min;
  }
};
