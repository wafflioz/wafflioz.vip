//Iridescence.jsx
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
import { useEffect, useRef } from 'react';
import './Iridescence.css';

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;

varying vec2 vUv;

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;

  uv += (uMouse - vec2(0.5)) * uAmplitude;

  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function Iridescence({ color = [1, 1, 1], speed = 1.0, amplitude = 0.1, mouseReact = true, ...rest }) {
  const ctnDom = useRef(null);
  const mousePos = useRef({ x: 0.5, y: 0.5 });
  const targetMousePos = useRef({ x: 0.5, y: 0.5 });
  const isActive = useRef(true);

  useEffect(() => {
    if (!ctnDom.current) return;
    const ctn = ctnDom.current;

    const renderer = new Renderer();
    const gl = renderer.gl;
    gl.clearColor(1, 1, 1, 1);

    const geometry = new Triangle(gl);
    let program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(...color) },
        uResolution: { value: new Float32Array([gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height]) },
        uMouse: { value: new Float32Array([mousePos.current.x, mousePos.current.y]) },
        uAmplitude: { value: amplitude * 1.5
         }, // Reduced amplitude for smoother effect
        uSpeed: { value: speed }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });
    ctn.appendChild(gl.canvas);

    function resize() {
      renderer.setSize(ctn.offsetWidth, ctn.offsetHeight);
      program.uniforms.uResolution.value[0] = gl.canvas.width;
      program.uniforms.uResolution.value[1] = gl.canvas.height;
      program.uniforms.uResolution.value[2] = gl.canvas.width / gl.canvas.height;
    }

    window.addEventListener('resize', resize);
    resize();

    // Handle global mouse events
    function handleGlobalMouseMove(e) {
      if (!isActive.current || !mouseReact) return;
      targetMousePos.current = {
        x: e.detail.x,
        y: e.detail.y
      };
    }

    if (mouseReact) {
      window.addEventListener('iridescence-mouse', handleGlobalMouseMove);
    }

    // Handle visibility changes
    function handleVisibilityChange() {
      isActive.current = document.visibilityState === 'visible';
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let animateId;
    function update(t) {
      // Smooth mouse movement interpolation
      if (isActive.current && mouseReact) {
        const lerp = (a, b, t) => a + (b - a) * Math.min(1, t);
        const smoothing = 0.1; // Adjust this value to control smoothness (lower = smoother)
        
        mousePos.current.x = lerp(mousePos.current.x, targetMousePos.current.x, smoothing);
        mousePos.current.y = lerp(mousePos.current.y, targetMousePos.current.y, smoothing);
        
        program.uniforms.uMouse.value[0] = mousePos.current.x;
        program.uniforms.uMouse.value[1] = mousePos.current.y;
      }

      program.uniforms.uTime.value = t * 0.001;
      renderer.render({ scene: mesh });
      animateId = requestAnimationFrame(update);
    }
    animateId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener('resize', resize);
      if (mouseReact) {
        window.removeEventListener('iridescence-mouse', handleGlobalMouseMove);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      ctn.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [color, speed, amplitude, mouseReact]);

  return <div ref={ctnDom} className="iridescence-container" {...rest} />;
}
