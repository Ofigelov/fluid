export const getResolution = (
  gl: WebGL2RenderingContext,
  resolution: number,
) => {
  let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
  if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;

  const min = Math.round(resolution);
  const max = Math.round(resolution * aspectRatio);

  if (gl.drawingBufferWidth > gl.drawingBufferHeight)
    return { width: max, height: min };
  else return { width: min, height: max };
};
