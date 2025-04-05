import React, { useEffect, useRef } from "react";
import "./App.css";
import { makeFluidCursor } from "./fluid";
import { Config } from "./fluid/types";

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
};

function App() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    makeFluidCursor(ref.current, config);
  }, [ref]);

  return <canvas ref={ref} />;
}

export default App;
