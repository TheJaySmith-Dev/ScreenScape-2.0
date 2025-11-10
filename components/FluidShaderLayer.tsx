import React, { useEffect, useRef } from "react";
// html2canvas is used only to grab a one-time snapshot of the page background
// so the shader can refract it without continuously re-rendering the DOM.
// If it fails due to CORS or availability, we gracefully fall back to a
// synthetic gradient background.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import html2canvas from "html2canvas";

type FluidShaderLayerProps = {
  containerRef?: React.RefObject<HTMLElement>;
  strength?: number; // overall distortion magnitude
};

// Minimal WebGL helpers
function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("Shader compile failed: " + info);
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string
) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error("Program link failed: " + info);
  }
  return program;
}

const VERT_SRC = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5; // [-1,1] -> [0,1]
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAG_SRC = `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_pointer;
uniform float u_strength;
uniform float u_hasTex;
varying vec2 v_uv;

void main(){
  vec2 uv = v_uv;
  // pointer-driven ripple field
  vec2 p = uv - u_pointer;
  float d = length(p) + 1e-5;
  float ripple = sin(12.0*d - u_time*4.0) * exp(-6.0*d);
  vec2 disp = normalize(p) * ripple * (0.04 * u_strength);
  // ambient wave fields
  disp += (0.012 * u_strength) * vec2(
    sin(uv.y*18.0 + u_time*1.2),
    sin(uv.x*20.0 - u_time*1.1)
  );
  vec2 duv = uv + disp;

  vec3 color;
  if (u_hasTex > 0.5) {
    // sample the static snapshot of the background
    color = texture2D(u_tex, duv).rgb;
  } else {
    // fallback: synthetic background gradient with a soft light band
    vec3 baseA = vec3(0.07,0.08,0.10);
    vec3 baseB = vec3(0.10,0.12,0.15);
    color = mix(baseA, baseB, uv.y);
    float band = smoothstep(0.45, 0.55, sin(uv.x*6.0 + u_time*0.8)*0.5+0.5);
    color += band*0.05;
  }

  // subtle bloom based on luminance
  float lum = dot(color, vec3(0.299,0.587,0.114));
  color += vec3(smoothstep(0.8,1.0,lum))*0.04;

  gl_FragColor = vec4(color, 0.85);
}
`;

export default function FluidShaderLayer({ containerRef, strength = 1.0 }: FluidShaderLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const texRef = useRef<WebGLTexture | null>(null);
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const hasTexRef = useRef<boolean>(false);

  // Fit canvas to parent size
  const fitCanvas = () => {
    const canvas = canvasRef.current!;
    const parent = canvas.parentElement!;
    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    fitCanvas();

    // Initialize GL
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: true });
    if (!gl) return; // silently fail; layer will be invisible
    glRef.current = gl;

    const program = createProgram(gl, VERT_SRC, FRAG_SRC);
    programRef.current = program;
    gl.useProgram(program);

    // Quad buffer
    const posLoc = gl.getAttribLocation(program, "a_position");
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const quad = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uTime = gl.getUniformLocation(program, "u_time");
    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uPointer = gl.getUniformLocation(program, "u_pointer");
    const uStrength = gl.getUniformLocation(program, "u_strength");
    const uHasTex = gl.getUniformLocation(program, "u_hasTex");
    const uTex = gl.getUniformLocation(program, "u_tex");
    gl.uniform1f(uStrength, strength);
    gl.uniform1f(uHasTex, 0.0);
    gl.uniform1i(uTex, 0);

    // Texture setup
    const texture = gl.createTexture();
    if (texture) {
      texRef.current = texture;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    // Snapshot the page behind for realistic refraction (one-time)
    const trySnapshot = async () => {
      try {
        // Hide the container briefly to avoid capturing it in the snapshot
        const host = containerRef?.current as HTMLElement | undefined;
        const prevVis = host?.style.visibility;
        if (host) host.style.visibility = "hidden";

        const snapshot = await html2canvas(document.body, {
          useCORS: true,
          backgroundColor: null,
          logging: false,
          scale: 1,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
        });

        if (host) host.style.visibility = prevVis ?? "";

        if (texRef.current) {
          const snapW = snapshot.width;
          const snapH = snapshot.height;
          gl.bindTexture(gl.TEXTURE_2D, texRef.current);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            snapshot
          );
          hasTexRef.current = true;
        }
      } catch (e) {
        // Fallback to synthetic gradient
        hasTexRef.current = false;
      }
    };

    trySnapshot();

    const onPointerMove = (ev: MouseEvent) => {
      const parent = canvas.parentElement!;
      const rect = parent.getBoundingClientRect();
      const x = (ev.clientX - rect.left) / Math.max(1, rect.width);
      const y = (ev.clientY - rect.top) / Math.max(1, rect.height);
      pointerRef.current = { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
    };
    window.addEventListener("mousemove", onPointerMove, { passive: true });

    const onResize = () => fitCanvas();
    window.addEventListener("resize", onResize);

    const start = performance.now();
    const loop = () => {
      const now = performance.now();
      const t = (now - start) / 1000;

      fitCanvas();

      const w = canvas.width;
      const h = canvas.height;
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, w, h);
      gl.uniform2f(uPointer, pointerRef.current.x, 1.0 - pointerRef.current.y);
      gl.uniform1f(uHasTex, hasTexRef.current ? 1.0 : 0.0);

      if (texRef.current) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texRef.current);
      }

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("resize", onResize);
      if (programRef.current) gl.deleteProgram(programRef.current);
      if (texRef.current) gl.deleteTexture(texRef.current);
    };
  }, [containerRef, strength]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 28,
        pointerEvents: "none",
        // Slightly blend to sit like a fluid layer under the capsule
        mixBlendMode: "soft-light",
        willChange: "transform, opacity",
      }}
    />
  );
}

