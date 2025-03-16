import { compileShader } from "./compileShader";

export const createColorShader = (gl: WebGL2RenderingContext) =>
  compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    `
       precision mediump float;
   
       uniform vec4 color;
   
       void main () {
           gl_FragColor = color;
       }
   `,
  );
