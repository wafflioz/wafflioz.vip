import React, { useState, useRef, useEffect } from "react";

export default function GlassUI() {
  const [showHomePage, setShowHomePage] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const comingSoonRef = useRef(null);
  const asciiRef = useRef(null);

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

  // Populate the ASCII pre with span-wrapped characters so each char can animate
  useEffect(() => {
    const pre = asciiRef.current;
    if (!pre) return;

    // Clear any previous content when toggling
    pre.innerHTML = "";

    if (!showHomePage) return;

    /* asciiArt.split("\n").forEach((line) => {
      const div = document.createElement("div");
      for (const char of line) {
        const span = document.createElement("span");
        span.textContent = char === " " ? "\u00A0" : char;
        span.className = "wiggle";
        span.style.animationDelay = `${Math.random() * 2}s`;
        div.appendChild(span);
      }
      pre.appendChild(div);
    }); 
*/
    return () => {
      pre.innerHTML = "";
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
            <pre
              id="ascii"
              ref={asciiRef}
              style={{
                color: "white",
                fontSize: "clamp(1rem, 0.8vw, 0.5rem)",
                fontWeight: "400",
                marginBottom: "5rem",
                lineHeight: "1.1",
                textShadow: "0 0 10px rgba(255,255,255,0.5)",
                letterSpacing: "0",
                fontFamily: "monospace",
                whiteSpace: "pre",
                overflow: "hidden",
                animation:
                  "fadeInScale 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both",
              }}
            ></pre>

            {/* CTA Buttons */}
            <div
              style={{
                display: "flex",
                gap: "1.5rem",
                justifyContent: "center",
                flexWrap: "wrap",
                animation:
                  "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both",
              }}
            >
              <button
                style={{
                  background: "rgba(255, 255, 255, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "100px",
                  padding: "1rem 2.5rem",
                  color: "#1a1a2e",
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
                  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-4px) scale(1.02)";
                  e.target.style.boxShadow = "0 16px 48px rgba(0, 0, 0, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0) scale(1)";
                  e.target.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.15)";
                }}
              >
                Learn More
              </button>

              <button
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "100px",
                  padding: "1rem 2.5rem",
                  color: "white",
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  textShadow: "0 2px 10px rgba(0,0,0,0.1)",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.25)";
                  e.target.style.transform = "translateY(-4px) scale(1.02)";
                  e.target.style.boxShadow = "0 16px 48px rgba(0, 0, 0, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.15)";
                  e.target.style.transform = "translateY(0) scale(1)";
                  e.target.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.1)";
                }}
              >
                Get Started
              </button>
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
        /* .wiggle { display: inline-block; animation: wiggle 2s infinite ease-in-out; } @keyframes wiggle { 0%, 100% { transform: translate(0px, 0px); } 25% { transform: translate(0.5px, -0.5px); } 50% { transform: translate(-0.5px, 0.5px); } 75% { transform: translate(0.5px, 0.5px); } } */
      `}</style>
    </div>
  );
}
