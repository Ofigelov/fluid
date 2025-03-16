export const scaleByPixelRatio = (canvasSize: number) => {
  const pixelRatio = window.devicePixelRatio || 1;
  return Math.floor(canvasSize * pixelRatio);
};
