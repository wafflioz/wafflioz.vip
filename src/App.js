import { useEffect, useState } from 'react';
import AsciiLogo from './AsciiLogo';
import Iridescence from './Iridescence';
import './App.css';

function useReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => window.matchMedia?.(query).matches ?? false);

  useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return;
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return reduced;
}

export default function App() {
  const reducedMotion = useReducedMotion();
  const [motionOverride, setMotionOverride] = useState(null);
  const [shaderAvailable, setShaderAvailable] = useState(false);
  const moving = motionOverride ?? !reducedMotion;

  return (
    <div className="landing">
      <Iridescence moving={moving} onAvailabilityChange={setShaderAvailable} />
      <header className="masthead">
        <span className="site-name">wafflioz.vip</span>
        {shaderAvailable && (
          <button
            className="motion-control"
            type="button"
            onClick={() => setMotionOverride(!moving)}
          >
            <span className="motion-icon" data-moving={moving} aria-hidden="true" />
            {moving ? 'Pause motion' : 'Resume motion'}
          </button>
        )}
      </header>

      <main className="hero">
        <AsciiLogo />
        <p className="hero-caption">Distributed GPU compute</p>
      </main>

      <footer className="site-footer">
        <span>Parallel execution</span>
        <span>GPU-accelerated workloads</span>
      </footer>
    </div>
  );
}
