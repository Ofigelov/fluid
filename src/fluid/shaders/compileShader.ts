function addKeywords(source: string, keywords?: string[] | null) {
  if (!keywords) return source;

  return (
    keywords.reduce((acc, keyword) => {
      return acc + "#define " + keyword + "\n";
    }, "") + source
  );
}

export const compileShader = (
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
  keywords?: string[],
) => {
  source = addKeywords(source, keywords);

  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.trace(gl.getShaderInfoLog(shader));
  }

  return shader;
};
