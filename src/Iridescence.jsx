import { Mesh, Program, Renderer, Triangle } from 'ogl';
import { useEffect, useRef } from 'react';
import './Iridescence.css';

const vertex = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif
precision mediump float;

uniform float uTime;
uniform float uAspect;
uniform vec3 uPointer;
varying vec2 vUv;

void main() {
  const vec3 ink = vec3(0.031, 0.051, 0.055);
  const vec3 steel = vec3(0.10, 0.27, 0.29);
  const vec3 patina = vec3(0.23, 0.50, 0.40);
  const vec3 silver = vec3(0.54, 0.70, 0.59);
  const vec3 mica = vec3(0.55, 0.43, 0.27);

  float landscape = smoothstep(0.62, 1.42, uAspect);
  vec2 aspect = vec2(uAspect, 1.0);
  vec2 origin = mix(vec2(0.74, 0.59), vec2(0.75, 0.50), landscape);
  vec2 p = (vUv - origin) * aspect;
  vec2 delta = (vUv - uPointer.xy) * aspect;
  float lens = uPointer.z * exp(-9.0 * dot(delta, delta));
  vec2 warped = p - 0.22 * lens * delta + 0.11 * lens * (uPointer.xy - 0.5);
  vec2 q = mat2(0.94, 0.34, -0.34, 0.94) * warped * mix(2.5, 2.8, landscape);

  // Retain the original Iridescence phase recurrence as the surface's height field.
  float d = -0.24 * uTime + 0.63;
  float a = 0.0;
  for (int i = 0; i < 8; ++i) {
    a += cos(float(i) - d - a * q.x);
    d += sin(q.y * float(i) + a);
  }
  d += 0.24 * uTime;

  vec2 harmonics = cos(q * vec2(d, a));
  float fold = 0.52 * harmonics.y + 0.48 * harmonics.x;
  float crest = smoothstep(-0.65, 0.97, fold);
  float tint = 0.5 + 0.5 * cos(a + d);
  vec3 metal = mix(steel, patina, tint);

  // Trace iso-lines on the same folds. The derivative keeps the narrow lines stable as they move.
  float phase = (q.y * a + 0.42 * q.x * d) * 0.77;
  float distanceToLine = abs(fract(phase + 0.5) - 0.5);
  float feather = 0.032;
#ifdef GL_OES_standard_derivatives
  feather = clamp(fwidth(phase) * 0.62, 0.014, 0.19);
#endif
  float isoline = 1.0 - smoothstep(feather * 0.35, feather + 0.023, distanceToLine);
  float contour = isoline * (0.16 + 0.84 * smoothstep(0.1, 0.95, crest));
  float highlight = pow(crest, 9.0);
  vec3 filament = mix(silver, mica, 0.16 + 0.57 * tint);

  vec2 ellipse = p * mix(vec2(1.52, 1.64), vec2(1.02, 1.34), landscape);
  float envelope = exp(-3.2 * dot(ellipse, ellipse));
  float silhouette = smoothstep(-0.68, -0.08, p.x + 0.10 * sin(p.y * 5.0));
  float light = envelope * mix(1.0, silhouette, landscape * 0.88);
  vec3 surface = metal * (0.15 + 0.74 * crest * crest)
    + filament * (0.19 * highlight + 0.29 * contour + 0.09 * lens * crest);
  gl_FragColor = vec4(ink + light * surface, 1.0);
}
`;

const contextOptions = { depth: false, premultipliedAlpha: false, powerPreference: 'low-power' };

function createScene(canvas) {
  if (!window.WebGLRenderingContext || !canvas.getContext('webgl', contextOptions)) return null;

  const renderer = new Renderer({ canvas, ...contextOptions, webgl: 1, autoClear: false });
  const { gl } = renderer;
  const uniforms = {
    uTime: { value: 0 },
    uAspect: { value: 1 },
    uPointer: { value: new Float32Array([0.5, 0.5, 0]) },
  };
  const program = new Program(gl, { vertex, fragment, uniforms, depthTest: false, depthWrite: false });
  gl.deleteShader(program.vertexShader);
  gl.deleteShader(program.fragmentShader);
  if (!gl.getProgramParameter(program.program, gl.LINK_STATUS)) {
    program.remove();
    return null;
  }

  const geometry = new Triangle(gl);
  const mesh = new Mesh(gl, { geometry, program, frustumCulled: false });

  return {
    renderer,
    uniforms,
    draw: () => renderer.render({ scene: mesh, sort: false, frustumCull: false }),
    dispose() {
      geometry.remove();
      program.remove();
    },
  };
}

export default function Iridescence({ moving, onAvailabilityChange }) {
  const fieldRef = useRef(null);
  const canvasRef = useRef(null);
  const motionRef = useRef(null);

  useEffect(() => {
    const field = fieldRef.current;
    const canvas = canvasRef.current;
    const coarsePointer = window.matchMedia?.('(pointer: coarse)');
    let scene;
    let frame = 0;
    let animate = false;
    let dirty = true;
    let lastDraw = null;
    let time = 0;
    let width = 0;
    let height = 0;
    let density = 0;
    let mobile = false;
    let targetX = 0.5;
    let targetY = 0.5;
    let targetStrength = 0;

    function schedule() {
      if (!frame && scene && !document.hidden && (animate || dirty)) {
        frame = requestAnimationFrame(draw);
      }
    }

    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastDraw = null;
    }

    function draw(now) {
      frame = 0;
      if (!scene || document.hidden) return;

      const interval = 1000 / (mobile ? 24 : 30);
      const elapsed = lastDraw === null ? interval : now - lastDraw;
      if (!dirty && elapsed < interval - 2) {
        schedule();
        return;
      }

      const { uniforms } = scene;
      if (animate && lastDraw !== null) {
        const dt = Math.min(elapsed, 80) / 1000;
        time = (time + dt) % (Math.PI * 2 / 0.24);
        const blend = 1 - Math.exp(-6 * dt);
        const pointer = uniforms.uPointer.value;
        pointer[0] += (targetX - pointer[0]) * blend;
        pointer[1] += (targetY - pointer[1]) * blend;
        pointer[2] += (targetStrength - pointer[2]) * blend;
      }

      uniforms.uTime.value = time;
      scene.draw();
      if (dirty && !canvas.hasAttribute('data-ready')) canvas.dataset.ready = 'true';
      lastDraw = animate ? now : null;
      dirty = false;
      schedule();
    }

    function resize() {
      if (!scene) return;
      const nextWidth = field.clientWidth;
      const nextHeight = field.clientHeight;
      if (!nextWidth || !nextHeight) return;

      mobile = nextWidth < 680 || Boolean(coarsePointer?.matches);
      const budget = mobile ? 285000 : 1050000;
      const nextDensity = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.25,
        Math.sqrt(budget / (nextWidth * nextHeight)));
      if (nextWidth === width && nextHeight === height && density === nextDensity) return;

      width = nextWidth;
      height = nextHeight;
      density = nextDensity;
      scene.renderer.dpr = density;
      scene.renderer.setSize(width, height);
      scene.uniforms.uAspect.value = width / height;
      dirty = true;
      schedule();
    }

    function initialize() {
      scene = createScene(canvas);
      onAvailabilityChange(Boolean(scene));
      width = 0;
      resize();
    }

    function contextLost(event) {
      event.preventDefault();
      stop();
      scene = null;
      canvas.removeAttribute('data-ready');
      onAvailabilityChange(false);
    }

    function visibilityChanged() {
      if (document.hidden) stop();
      else {
        dirty = true;
        schedule();
      }
    }

    function updatePointer(event) {
      if (!animate || event.pointerType === 'touch' || !width || !height) return;
      targetX = event.clientX / width;
      targetY = 1 - (event.clientY + window.scrollY) / height;
      targetStrength = 1;
    }

    function resetPointer() {
      targetStrength = 0;
    }

    motionRef.current = (nextMoving) => {
      animate = nextMoving;
      if (!animate) stop();
      schedule();
    };

    canvas.addEventListener('webglcontextlost', contextLost);
    canvas.addEventListener('webglcontextrestored', initialize);
    initialize();

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    observer?.observe(field);
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', updatePointer, { passive: true });
    window.addEventListener('blur', resetPointer);
    document.documentElement.addEventListener('pointerleave', resetPointer);
    document.addEventListener('visibilitychange', visibilityChanged);
    coarsePointer?.addEventListener('change', resize);

    return () => {
      stop();
      observer?.disconnect();
      motionRef.current = null;
      canvas.removeAttribute('data-ready');
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', initialize);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', updatePointer);
      window.removeEventListener('blur', resetPointer);
      document.documentElement.removeEventListener('pointerleave', resetPointer);
      document.removeEventListener('visibilitychange', visibilityChanged);
      coarsePointer?.removeEventListener('change', resize);
      scene?.dispose();
    };
  }, [onAvailabilityChange]);

  useEffect(() => motionRef.current?.(moving), [moving]);

  return (
    <div ref={fieldRef} className="iridescence-field" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
