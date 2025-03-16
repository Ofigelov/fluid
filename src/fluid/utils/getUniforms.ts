export const getUniforms = (
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
): {
  [key: string]: WebGLUniformLocation;
} => {
  const uniforms: { [key: string]: WebGLUniformLocation } = {};
  const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < uniformCount; i++) {
    const uniformName = gl.getActiveUniform(program, i)!.name!;
    uniforms[uniformName] = gl.getUniformLocation(program, uniformName)!;
  }
  return uniforms;
};
