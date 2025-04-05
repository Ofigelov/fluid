import { Programs } from "../../Programs";
import { Config, RGB } from "../../types";
import { Framebuffers } from "../../frameBuffers";
import { Blit } from "../blit";

function correctRadius(radius: number, canvas: HTMLCanvasElement) {
  const aspectRatio = canvas.width / canvas.height;
  if (aspectRatio > 1) radius *= aspectRatio;
  return radius;
}

export function splat(
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
  canvas: HTMLCanvasElement,
) {
  programs.splat.bind();
  gl.uniform1i(
    programs.splat.uniforms.uTarget,
    buffers.velocity.read.attach(0),
  );
  gl.uniform1f(
    programs.splat.uniforms.aspectRatio,
    canvas.width / canvas.height,
  );
  gl.uniform2f(programs.splat.uniforms.point, x, y);
  gl.uniform3f(programs.splat.uniforms.color, dx, dy, 0.0);
  gl.uniform1f(
    programs.splat.uniforms.radius,
    correctRadius(config.SPLAT_RADIUS / 100.0, canvas),
  );
  blit(buffers.velocity.write);
  buffers.velocity.swap();

  gl.uniform1i(programs.splat.uniforms.uTarget, buffers.dye.read.attach(0));
  gl.uniform3f(programs.splat.uniforms.color, color.r, color.g, color.b);
  blit(buffers.dye.write);
  buffers.dye.swap();
}
