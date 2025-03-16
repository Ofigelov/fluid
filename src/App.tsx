import React, { useEffect, useRef } from "react";
import "./App.css";
import { makeFluidCursor } from "./fluid";

function App() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    makeFluidCursor(ref.current);
  }, [ref]);

  return <canvas ref={ref} />;
}

export default App;
