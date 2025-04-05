import { Config, WebGLExtensions } from "../../types";
import { Framebuffers } from "../../frameBuffers";
import { Blit } from "../blit";
import { Programs } from "../../Programs";

export function step(
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
  gl.uniform1i(programs.advection.uniforms.uSource, buffers.dye.read.attach(1));
  gl.uniform1f(
    programs.advection.uniforms.dissipation,
    config.DENSITY_DISSIPATION,
  );
  blit(buffers.dye.write);
  buffers.dye.swap();
}
