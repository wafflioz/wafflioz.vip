import React, { useState, useEffect, useRef } from 'react';
import Iridescence from './Iridescence.jsx';
import GlassUI from './GlassUI.jsx';

function App() {
  const [setScrollProgress] = useState(0);
  const iridescenceRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      // Listen for custom scroll events from GlassUI
      const progress = window.scrollProgress || 0;
      setScrollProgress(progress);
      
      // Apply parallax effect to background
      if (iridescenceRef.current) {
        const parallaxAmount = progress * 20; // More subtle parallax
        iridescenceRef.current.style.transform = `scale(${1 + progress * 0.05}) translateY(${parallaxAmount}px)`;
        iridescenceRef.current.style.filter = `blur(${progress * 3}px)`;
      }
    };

    // Handle mouse movement for the entire window
    const handleMouseMove = (e) => {
      if (iridescenceRef.current) {
        // Broadcast the mouse position to the Iridescence component
        const event = new CustomEvent('iridescence-mouse', {
          detail: {
            x: e.clientX / window.innerWidth,
            y: 1.0 - (e.clientY / window.innerHeight)
          }
        });
        window.dispatchEvent(event);
      }
    };

    window.addEventListener('scroll-update', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll-update', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh', 
      margin: 0, 
      padding: 0, 
      overflow: 'hidden' 
    }}>
      <div 
        ref={iridescenceRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transition: 'transform 0.1s ease-out, filter 0.1s ease-out',
          willChange: 'transform, filter'
        }}
      >
        <Iridescence
          color={[0.5, 0.6, 0.8]}
          mouseReact={true}
          amplitude={0.1}
          speed={1.5}
        />
      </div>
      <GlassUI />
    </div>
  );
}

export default App;