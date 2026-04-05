import React, { useState, useRef, useEffect } from "react";

export default function GlassUI() {
  const [showHomePage, setShowHomePage] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const comingSoonRef = useRef(null);
  const canvasRef = useRef(null);
  const canvasWrapRef = useRef(null);

  const asciiArt = `                                          
                                                               .G$$G.                               
                                                               ?$$$G                                
                                                               5$$$^                                
                                                               P$$P                                 
                                                               G$$!                                 
                                                               B$#.                                 
               5B^  .JPP!                                     .#$5  :^.                             
  ~PBP^       Y$B. :B$$$$J          .      ..     ..      ..  :&$7 P$$#^       .7?^     :~7?JJJJJJ?~
 !$$$$7      ~$&^ .G$$&$$$! ^?:   7##BPPPGB##G^  7##BPPPGB##G::$$~ 7GGY.  ^YP5Y&$$#.  .G$$$$$$$$$$$#
^&$$&!       B$?  Y$$5^$$$BJ$$?   B$$&&$$$$&&B^  #$$&&$$$$&&B:^$&:.?5Y:  ^&$$$$5:B$7  .Y#B5?7P$$&P7.
P$$$!       ?$B  ~$$G. G$$$$$&:  .#$$^.:::::.   :&$&^.:::::.  ~$# ?$$$5  PU$$Y!  B$7       !B$#J:   
&$$5       .&$~  G$&^  7$$$$$G   :$$B           ^$$B          !$B ~$$&: ^$$$Y   .&$^     7#$G!.     
$$$!       Y$P  !$$?  .5$G!P$Y   ^$$5           ~$$Y          !$B :&$J  ?$$&.   7$B    !B$P~        
#$$! 7BB! :&$^  P$B  7&$?  P$?  ~5$$##5       .~5$$##5        !$B .#$!  J$$P   :#$7  ^G$G~.^7J5P5~  
7$$#P$$$&^J$P  .&$Y~B$P:   G$? ^&$$$J^.       ^$$$$?^.        ~$#. B$!  7$$Y  .G$5  ?$$G5B#BG5J?J^  
 ^5BBY^?$&&$!   G$$$G!     5$Y  ^G$$~          ^G$$^          :&$! 5$?  :#$B:~B$5  J$$&GY!:         
        !&$B    .!7^       :!:   ^$$Y          ^$$J           7Y^ .^.   ~B$&$#7   ?57:             
         :!:                     .#$&:         .&$&:                      ^~^                      
                                  G$?           B$7                                               
                                  Y$J           5$J                                               
                                  ^&$!          ~&$~                                               `;

  const scrollToHome = () => {
    if (isScrolling) return;
    setIsScrolling(true);

    const startTime = performance.now();
    const duration = 1500;

    const easeInOutCubic = (t) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);

      if (comingSoonRef.current) {
        comingSoonRef.current.style.transform = `translateY(-${
          easedProgress * 100
        }vh)`;
        comingSoonRef.current.style.opacity = `${1 - easedProgress}`;
      }

      // Emit scroll progress for parallax effect
      window.scrollProgress = easedProgress;
      window.dispatchEvent(new Event("scroll-update"));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        window.scrollProgress = 0;
        setShowHomePage(true);
        setIsScrolling(false);
      }
    };

    requestAnimationFrame(animate);
  };

  // Canvas-based wiggle: one GPU layer, one rAF loop, every char moves independently.
  useEffect(() => {
    if (!showHomePage) return;
    const canvas = canvasRef.current;
    const wrap = canvasWrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const lines = asciiArt.split("\n");
    const maxCols = lines.reduce((m, l) => Math.max(m, l.length), 0);

    // Build a flat list of non-space characters, each with its own phase offsets.
    // Spaces are skipped entirely (they're invisible and just burn cycles to draw).
    let chars = [];
    let cssW = 0;
    let cssH = 0;
    let charW = 6;
    let lineH = 11;

    const setup = () => {
      const available = Math.max(120, wrap.clientWidth);
      // Monospace aspect ratio ≈ 0.6 — fit longest line into available width.
      const fontSize = Math.max(
        4,
        Math.min(16, Math.floor(available / maxCols / 0.6))
      );
      lineH = Math.ceil(fontSize * 1.1);

      ctx.font = `${fontSize}px monospace`;
      charW = ctx.measureText("M").width;

      cssW = Math.ceil(maxCols * charW);
      cssH = Math.ceil(lines.length * lineH);

      canvas.width = Math.ceil(cssW * dpr);
      canvas.height = Math.ceil(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${fontSize}px monospace`;
      ctx.fillStyle = "white";
      ctx.textBaseline = "top";

      chars = [];
      for (let row = 0; row < lines.length; row++) {
        const line = lines[row];
        const y = row * lineH;
        for (let col = 0; col < line.length; col++) {
          const ch = line[col];
          if (ch === " ") continue;
          chars.push({
            ch,
            x: col * charW,
            y,
            // Random phase 0..1 — equivalent to CSS animation-delay 0..2s on a 2s cycle.
            phase: Math.random(),
          });
        }
      }
    };

    setup();

    let raf = 0;
    const start = performance.now();
    // Match the original CSS @keyframes wiggle exactly:
    //   0%:(0,0)  25%:(0.5,-0.5)  50%:(-0.5,0.5)  75%:(0.5,0.5)  100%:(0,0)
    // with `ease-in-out` between waypoints, 2s duration, random per-char delay.
    const WX = [0, 0.5, -0.5, 0.5, 0];
    const WY = [0, -0.5, 0.5, 0.5, 0];
    const DURATION = 2; // seconds, matches original

    const draw = (now) => {
      const tNorm = (now - start) / 1000 / DURATION;
      ctx.clearRect(0, 0, cssW, cssH);
      for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        // Normalized progress 0..1 through the 2s cycle for this char.
        let p = tNorm + c.phase;
        p = p - (p | 0); // fast fmod for positive values
        // Which of the 4 segments (0→25%, 25→50%, 50→75%, 75→100%) we're in.
        const seg4 = p * 4;
        const segIdx = seg4 | 0;
        const segT = seg4 - segIdx;
        // Smoothstep — visually indistinguishable from CSS ease-in-out at this amplitude.
        const eased = segT * segT * (3 - 2 * segT);
        const x0 = WX[segIdx];
        const y0 = WY[segIdx];
        const x1 = WX[segIdx + 1];
        const y1 = WY[segIdx + 1];
        const dx = x0 + (x1 - x0) * eased;
        const dy = y0 + (y1 - y0) * eased;
        ctx.fillText(c.ch, c.x + dx, c.y + dy);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onResize = () => setup();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [showHomePage, asciiArt]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        zIndex: 1,
        pointerEvents: "none",
      }}
    >
      {/* Coming Soon Page */}
      {!showHomePage && (
        <div
          ref={comingSoonRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            willChange: "transform, opacity",
          }}
        >
          <h1
            style={{
              color: "white",
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: "700",
              lineHeight: "1.2",
              textShadow: "0 4px 20px rgba(0,0,0,0.2)",
              letterSpacing: "-0.02em",
              textAlign: "center",
              marginBottom: "3rem",
              animation: "fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both",
            }}
          >
            Something big
            <br />
            is coming soon...
          </h1>

          {/* Down Arrow Button */}
          <button
            onClick={scrollToHome}
            disabled={isScrolling}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "50%",
              width: "48px",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isScrolling ? "default" : "pointer",
              transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              pointerEvents: "auto",
              opacity: isScrolling ? 0.3 : 1,
              animation:
                "fadeInBounce 1s cubic-bezier(0.16, 1, 0.3, 1) 0.8s both, float 3s ease-in-out 1.8s infinite",
            }}
            onMouseEnter={(e) => {
              if (!isScrolling) {
                e.target.style.transform = "translateY(4px) scale(1.05)";
                e.target.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.2)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isScrolling) {
                e.target.style.transform = "translateY(0) scale(1)";
                e.target.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.1)";
              }
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Home Page */}
      {showHomePage && (
        <>
          {/* Top Navigation Bar */}
          <nav
            style={{
              position: "absolute",
              top: "2rem",
              left: "50%",
              transform: "translateX(-50%)",
              width: "70%",
              maxWidth: "1200px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRadius: "100px",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              padding: "1.2rem 2rem",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              pointerEvents: "auto",
              animation: "slideDown 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              opacity: 0,
              animationFillMode: "forwards",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <span
                style={{
                  color: "white",
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  textShadow: "0 2px 10px rgba(0,0,0,0.1)",
                }}
              >
                wafflioz.vip
              </span>
            </div>
            <div style={{ display: "flex", gap: "2rem" }}>
              <a
                href="https://www.wafflioz.vip"
                style={{
                  color: "white",
                  textDecoration: "none",
                  fontSize: "1rem",
                  fontWeight: "500",
                  transition: "all 0.3s ease",
                  textShadow: "0 2px 10px rgba(0,0,0,0.1)",
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = "0.7";
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = "1";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                Home
              </a>
              <a
                href="https://wafflioz.vip"
                style={{
                  color: "white",
                  textDecoration: "none",
                  fontSize: "1rem",
                  fontWeight: "500",
                  transition: "all 0.3s ease",
                  textShadow: "0 2px 10px rgba(0,0,0,0.1)",
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = "0.7";
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = "1";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                Docs
              </a>
            </div>
          </nav>

          {/* Home Page - ASCII Art */}
          <div
            style={{
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              width: "90%",
              maxWidth: "900px",
              margin: "0 auto",
              pointerEvents: "auto",
            }}
          >
            <div
              ref={canvasWrapRef}
              style={{
                width: "100%",
                marginBottom: "5rem",
                display: "flex",
                justifyContent: "center",
                animation:
                  "fadeInScale 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both",
              }}
            >
              <canvas
                ref={canvasRef}
                style={{
                  display: "block",
                  filter: "drop-shadow(0 0 6px rgba(255,255,255,0.5))",
                }}
              />
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
            filter: blur(10px);
          }
          to {
            opacity: 1;
            transform: scale(1);
            filter: blur(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInBounce {
          0% {
            opacity: 0;
            transform: translateY(-20px) scale(0.8);
          }
          60% {
            opacity: 1;
            transform: translateY(5px) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  );
}
