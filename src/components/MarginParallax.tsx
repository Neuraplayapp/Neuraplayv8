import React, { useEffect } from 'react';
import './MarginParallax.css';

// Use the globally loaded GSAP from CDN
declare const gsap: any;
declare const ScrollTrigger: any;

const MarginParallax = () => {
  useEffect(() => {
    // Set initial states for all SVG elements
    gsap.set(".svg-element", { 
      opacity: 0, 
      y: "50vh",
      scale: 0.8 
    });

    // Create the main timeline with continuous scroll trigger
    const mainTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        pin: false,
        markers: false
      }
    });

    // Section 1: Dawn Mountain - Elongated by 300% with reversed logic
    // Start with the blue sky background (dawn-hill-1 contains the gradient)
    mainTimeline.to("#dawn-hill-1", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    }, 0);
    
    // Clouds drift in early
    mainTimeline.to("#dawn-cloud-1", { 
      opacity: 1, 
      x: "-20vw",
      duration: 0.3,
      ease: "power1.out"
    }, 0.4);
    
    mainTimeline.to("#dawn-cloud-2", { 
      opacity: 1, 
      x: "15vw",
      duration: 0.3,
      ease: "power1.out"
    }, 0.5);
    
    // Background mountain moves up slowly (elongated scene)
    mainTimeline.to("#dawn-hill-1", { 
      y: "-15vh", 
      duration: 5.4, // 300% longer (1.8 * 3)
      ease: "none"
    }, 0.6);
    
    // Second mountain layer appears after 1 second of scrolling
    mainTimeline.to("#dawn-hill-2", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    }, 1.0);
    
    // Third mountain layer appears after 1 second of scrolling
    mainTimeline.to("#dawn-hill-3", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    }, 1.3);
    
    // Mountains move up with increased separation (50% slower, 50% more separation)
    mainTimeline.to("#dawn-hill-2", { 
      y: "-30vh", 
      duration: 1.8,
      ease: "none"
    }, 1.6);
    
    mainTimeline.to("#dawn-hill-3", { 
      y: "-15vh", 
      duration: 1.8,
      ease: "none"
    }, 1.6);
    
    // Keep dawn scene visible much longer (elongated)
    mainTimeline.to("#dawn-scene", { 
      opacity: 1, 
      duration: 0.1 
    }, 2.7);

    // Section 2: Boy studying + House - Sequential introduction
    // Background appears
    mainTimeline.to("#study-bg", { 
      opacity: 1, 
      duration: 0.1 
    }, 0.9);
    
    // Boy studying appears with dramatic entrance
    mainTimeline.to("#boy-studying", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.4,
      ease: "power3.out"
    }, 1.0);
    
    // House appears
    mainTimeline.to("#house", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    }, 1.1);
    
    // Elements move up (original speed)
    mainTimeline.to(["#boy-studying", "#house"], { 
      y: "-25vh", 
      duration: 1.2,
      ease: "none"
    }, 1.3);
    
    // Keep study scene visible longer
    mainTimeline.to("#study-scene", { 
      opacity: 1, 
      duration: 0.1 
    }, 1.8);

    // Section 3: Hill + Chalkboard - Sequential introduction
    // Background appears
    mainTimeline.to("#classroom-bg", { 
      opacity: 1, 
      duration: 0.1 
    }, 1.8);
    
    // Hill appears
    mainTimeline.to("#hill", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    }, 1.9);
    
    // Chalkboard appears
    mainTimeline.to("#chalkboard", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    }, 2.0);
    
    // Elements move up (original speed)
    mainTimeline.to(["#hill", "#chalkboard"], { 
      y: "-25vh", 
      duration: 0.8,
      ease: "none"
    }, 2.2);
    
    // Fade out classroom scene
    mainTimeline.to("#classroom-scene", { 
      opacity: 0, 
      duration: 0.3 
    }, 2.7);

    // Section 4: Garden + Sparrow - Sequential introduction
    // Background appears
    mainTimeline.to("#garden-bg", { 
      opacity: 1, 
      duration: 0.1 
    }, 2.7);
    
    // Garden elements appear
    mainTimeline.to("#garden", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    }, 2.8);
    
    // Sparrow appears with flight animation
    mainTimeline.to("#sparrow", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.4,
      ease: "power3.out"
    }, 2.9);
    
    // Elements move up (original speed)
    mainTimeline.to(["#garden", "#sparrow"], { 
      y: "-25vh", 
      duration: 0.8,
      ease: "none"
    }, 3.1);
    
    // Fade out garden scene
    mainTimeline.to("#garden-scene", { 
      opacity: 0, 
      duration: 0.3 
    }, 3.6);

    // Section 5: Park - Sequential introduction
    // Background appears
    mainTimeline.to("#park-bg", { 
      opacity: 1, 
      duration: 0.1 
    }, 3.6);
    
    // Park elements appear sequentially
    mainTimeline.to("#park-tree-1", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.2,
      ease: "power2.out"
    }, 3.7);
    
    mainTimeline.to("#park-tree-2", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.2,
      ease: "power2.out"
    }, 3.8);
    
    mainTimeline.to("#park-bench", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    }, 3.9);
    
    mainTimeline.to("#park-people", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    }, 4.0);
    
    // Elements move up (original speed)
    mainTimeline.to(["#park-tree-1", "#park-tree-2", "#park-bench", "#park-people"], { 
      y: "-25vh", 
      duration: 0.8,
      ease: "none"
    }, 4.2);
    
    // Fade out park scene
    mainTimeline.to("#park-scene", { 
      opacity: 0, 
      duration: 0.3 
    }, 4.5);

    // RIGHT MARGIN ANIMATIONS
    // Section 1: Dawn Mountain Right - Sequential element introduction
    // Start with the blue sky background (dawn-hill-1-right contains the gradient)
    mainTimeline.to("#dawn-hill-1-right", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    }, 0);
    
    // Second mountain layer appears
    mainTimeline.to("#dawn-hill-2-right", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    }, 0.3);
    
    // Third mountain layer appears
    mainTimeline.to("#dawn-hill-3-right", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    }, 0.6);
    
    // Clouds drift in
    mainTimeline.to("#dawn-cloud-1-right", { 
      opacity: 1, 
      x: "-20vw",
      duration: 0.3,
      ease: "power1.out"
    }, 0.4);
    
    mainTimeline.to("#dawn-cloud-2-right", { 
      opacity: 1, 
      x: "15vw",
      duration: 0.3,
      ease: "power1.out"
    }, 0.5);
    
    // Mountains move up with increased separation (50% slower, 50% more separation)
    mainTimeline.to("#dawn-hill-1-right", { 
      y: "-45vh", 
      duration: 1.8,
      ease: "none"
    }, 0.6);
    
    mainTimeline.to("#dawn-hill-2-right", { 
      y: "-30vh", 
      duration: 1.8,
      ease: "none"
    }, 0.6);
    
    mainTimeline.to("#dawn-hill-3-right", { 
      y: "-15vh", 
      duration: 1.8,
      ease: "none"
    }, 0.6);
    
    // Keep dawn scene visible longer
    mainTimeline.to("#dawn-scene-right", { 
      opacity: 1, 
      duration: 0.1 
    }, 0.9);

    // Section 2: House Scene
    mainTimeline.to("#house-bg", { 
      opacity: 1, 
      duration: 0.1 
    }, 0.9);
    
    mainTimeline.to("#house", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.4,
      ease: "power3.out"
    }, 1.0);
    
    // House moves up (original speed)
    mainTimeline.to("#house", { 
      y: "-25vh", 
      duration: 1.2,
      ease: "none"
    }, 1.3);
    
    // Keep house scene visible longer
    mainTimeline.to("#house-scene", { 
      opacity: 1, 
      duration: 0.1 
    }, 1.8);

    // Section 3: Chalkboard Scene
    mainTimeline.to("#chalkboard-bg", { 
      opacity: 1, 
      duration: 0.1 
    }, 1.8);
    
    mainTimeline.to("#chalkboard", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    }, 1.9);
    
    // Chalkboard moves up (original speed)
    mainTimeline.to("#chalkboard", { 
      y: "-25vh", 
      duration: 1.2,
      ease: "none"
    }, 2.1);
    
    // Keep chalkboard scene visible longer
    mainTimeline.to("#chalkboard-scene", { 
      opacity: 1, 
      duration: 0.1 
    }, 2.7);

    // Section 4: Sparrow Scene
    mainTimeline.to("#sparrow-bg", { 
      opacity: 1, 
      duration: 0.1 
    }, 2.7);
    
    mainTimeline.to("#sparrow", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    }, 2.8);
    
    // Sparrow moves up (original speed)
    mainTimeline.to("#sparrow", { 
      y: "-25vh", 
      duration: 1.2,
      ease: "none"
    }, 3.0);
    
    // Keep sparrow scene visible longer
    mainTimeline.to("#sparrow-scene", { 
      opacity: 1, 
      duration: 0.1 
    }, 3.6);

    // Section 5: Park Right Scene
    mainTimeline.to("#park-bg-right", { 
      opacity: 1, 
      duration: 0.1 
    }, 3.6);
    
    // Park elements appear sequentially
    mainTimeline.to("#park-tree-1-right", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.2,
      ease: "power2.out"
    }, 3.7);
    
    mainTimeline.to("#park-tree-2-right", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.2,
      ease: "power2.out"
    }, 3.8);
    
    mainTimeline.to("#park-bench-right", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    }, 3.9);
    
    mainTimeline.to("#park-people-right", { 
      opacity: 1, 
      y: "0vh", 
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    }, 4.0);
    
    // Elements move up (original speed)
    mainTimeline.to(["#park-tree-1-right", "#park-tree-2-right", "#park-bench-right", "#park-people-right"], { 
      y: "-25vh", 
      duration: 0.8,
      ease: "none"
    }, 4.2);
    
    // Keep park scene visible longer
    mainTimeline.to("#park-scene-right", { 
      opacity: 1, 
      duration: 0.1 
    }, 4.5);

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <>
      <div className="left-margin-container">
        
        {/* Dawn Mountain Scene */}
        <div id="dawn-scene" className="svg-scene">
          <div id="dawn-bg" className="svg-element dawn-bg"></div>
          <div id="dawn-hill-1" className="svg-element dawn-hill">
            <svg viewBox="0 0 1604.1533 1109.8041" className="svg-content">
              <defs>
                <linearGradient id="dawn-gradient-1">
                  <stop stopColor="#618ce6" offset="0"/>
                  <stop stopColor="#4270cc" offset=".12308"/>
                  <stop stopColor="#335eb5" offset=".23778"/>
                  <stop stopColor="#153b88" offset=".58813"/>
                  <stop stopColor="#04215c" offset="1"/>
                </linearGradient>
              </defs>
              <g transform="translate(-3.8859 -244.09)" clipPath="url(#y)">
                <path d="m3.1778 242h1603.4a1.2778 1.278 0 0 1 1.2778 1.278v1095.4a1.2778 1.278 0 0 1 -1.2778 1.278h-1603.4a1.2778 1.278 0 0 1 -1.2778 -1.3v-1095.4a1.2778 1.278 0 0 1 1.2778 -1.278" fill="url(#dawn-gradient-1)"/>
              </g>
            </svg>
          </div>
          <div id="dawn-hill-2" className="svg-element dawn-hill">
            <svg viewBox="0 0 1604.1533 1109.8041" className="svg-content">
              <g transform="translate(-3.8859 -244.09)">
                <path d="m-2.1 859.25c16.75-9.75 56 38 67 40s52 7 58 9 34-13 40-13 18-4 22-6 7-10.5 17-11 12 8 23 9 27.09 2.45 40 7c8.15 2.88 6.96 5.78 11 8.41 6.43 4.18 4-11.41 13-7.41s2.75 8 16 3 28-22 37-23 30 11 38 12 40-14 49-14 25.75 4.75 46 4 25-10 35-7 15.25 6.5 25 9 18.5-2 19.5 4 14.25 8.75 26.5 10 10-10 17-8 37 20 46 19 5-9 14-7 11 9 20 10 24-5 35-5 27-8 32-12 46-15 54-16 45-5 60-10 74.79-18.24 87.52-15.41c12.41 2.76 38.48 40.41 58.48 41.41s69 4 77-2 69-21 77-14 52-8 57-9c1.89-0.37 37.34 1.93 42.16 14.05 6.28 15.81 46.73 28.81 78.22 31.45 25.44 2.13 57.9 19.39 117.6 1.36 8.87-2.67 51.7-17.7 80-12.6 17.15 3.09 65.29-1.51 78.02 5.02v301.72h-1614v-347z" fill="#335eb5"/>
              </g>
            </svg>
          </div>
          <div id="dawn-hill-3" className="svg-element dawn-hill">
            <svg viewBox="0 0 1604.1533 1109.8041" className="svg-content">
              <g transform="translate(-3.8859 -244.09)">
                <path d="m1611.9 934.72c-16.75-7.46-56 29.08-67 30.61s-52 5.35-58 6.88c-6 1.54-34-9.94-40-9.94s-18-3.06-22-4.59c-4-1.54-7-8.04-17-8.42-10-0.39-12 6.12-23 6.88-11 0.77-27.09 1.87-40 5.36-8.15 2.2-6.95 4.42-11 6.43-6.43 3.2-4-8.72-13-5.66s-2.75 6.12-16 2.29c-13.25-3.82-28-16.83-37-17.6-9-0.76-30 8.42-38 9.18-8 0.77-40-10.71-49-10.71s-25.75 3.64-46 3.06c-20.25-0.57-25-7.65-35-5.35-10 2.29-15.25 4.97-25 6.88-9.75 1.92-18.5-1.53-19.5 3.06-1 4.6-14.25 6.7-26.5 7.66-12.25 0.95-10-7.66-17-6.13s-37 15.31-46 14.54c-9-0.76-5-6.88-14-5.35s-11 6.88-20 7.65c-9 0.76-24-3.83-35-3.83s-27-6.12-32-9.18-46-11.48-54-12.24c-8-0.77-45-3.83-60-7.66-15-3.82-74.79-13.95-87.51-11.79-12.42 2.11-38.49 30.93-58.49 31.69-20 0.77-69 3.06-77-1.53s-69-16.07-77-10.71c-8 5.35-52-6.13-57-6.89-1.89-0.29-37.34 1.47-42.16 10.75-6.28 12.1-46.73 22.04-78.22 24.06-25.44 1.63-57.9 14.84-117.6 1.05-8.87-2.05-51.7-13.55-80-9.65-17.15 2.37-65.29-1.15-78.02 3.85v387.49h1614v-422.18z" fill="#153b88"/>
              </g>
            </svg>
          </div>
          <div id="dawn-cloud-1" className="svg-element dawn-cloud">
            <svg viewBox="0 0 1604.1533 1109.8041" className="svg-content">
              <g transform="translate(-3.8859 -244.09)">
                <path d="m2706 842c4-14 21.51-17.27 27.51-35.27 16.54-35.34 58.06-28.44 86.73-20.63 14 4 39.76 7.9 51.76-2.1s62 8 64-26 4-68 26-68 38-16 46-38 26-30 44-16 38 44 44 60-6 170-6 170l-436-2s32-18 52-22z" fill="#ffffff" opacity="0.6"/>
              </g>
            </svg>
          </div>
          <div id="dawn-cloud-2" className="svg-element dawn-cloud">
            <svg viewBox="0 0 1604.1533 1109.8041" className="svg-content">
              <g transform="translate(-3.8859 -244.09)">
                <path d="m60.63 938c0-114.68 124.2-14.83 151.06 55.99 28.61-57.33 98.96-69.76 126.51-19.19 42.25-0.56 52.78 86.04 82.38 18.47 45.46-63.91 89.69 33.18 99.58 70.09 29.36 2.66 53.09-30.69 72.38 7.74 32.67-32.78 57.78 20.24 94.8 0.97 29.64 37.88 89.69 14.58 92.45 63.58 44.83 8.11 95.25 1.03 95.25 47.72h-818.41c-138.46-43.5-139.89-152.6 4-245.4z" fill="#ffffff" opacity="0.5"/>
              </g>
            </svg>
          </div>
        </div>
        
        {/* Study Scene */}
        <div id="study-scene" className="svg-scene">
          <div id="study-bg" className="svg-element study-bg"></div>
          <div id="boy-studying" className="svg-element boy-studying">
            <img src="/assets/SVG/Boystudying.svg" alt="Boy studying" className="svg-content" />
          </div>
        </div>
        
        {/* Classroom Scene */}
        <div id="classroom-scene" className="svg-scene">
          <div id="classroom-bg" className="svg-element classroom-bg"></div>
          <div id="hill" className="svg-element hill">
            <img src="/assets/SVG/hill.svg" alt="Hill" className="svg-content" />
          </div>
        </div>
        
        {/* Garden Scene */}
        <div id="garden-scene" className="svg-scene">
          <div id="garden-bg" className="svg-element garden-bg"></div>
          <div id="garden" className="svg-element garden">
            <img src="/assets/SVG/garden.svg" alt="Garden" className="svg-content" />
          </div>
        </div>
        
        {/* Park Scene */}
        <div id="park-scene" className="svg-scene">
          <div id="park-bg" className="svg-element park-bg"></div>
          <div id="park-tree-1" className="svg-element park-tree">
            <img src="/assets/SVG/park.svg" alt="Park tree 1" className="svg-content" />
          </div>
          <div id="park-tree-2" className="svg-element park-tree">
            <img src="/assets/SVG/park.svg" alt="Park tree 2" className="svg-content" />
          </div>
          <div id="park-bench" className="svg-element park-bench">
            <img src="/assets/SVG/park.svg" alt="Park bench" className="svg-content" />
          </div>
          <div id="park-people" className="svg-element park-people">
            <img src="/assets/SVG/park.svg" alt="Park people" className="svg-content" />
          </div>
        </div>
      </div>
      
      <div className="right-margin-container">
        {/* Dawn Mountain Scene */}
        <div id="dawn-scene-right" className="svg-scene">
          <div id="dawn-bg-right" className="svg-element dawn-bg"></div>
          <div id="dawn-hill-1-right" className="svg-element dawn-hill">
            <svg viewBox="0 0 1604.1533 1109.8041" className="svg-content">
              <defs>
                <linearGradient id="dawn-gradient-1-right">
                  <stop stopColor="#618ce6" offset="0"/>
                  <stop stopColor="#4270cc" offset=".12308"/>
                  <stop stopColor="#335eb5" offset=".23778"/>
                  <stop stopColor="#153b88" offset=".58813"/>
                  <stop stopColor="#04215c" offset="1"/>
                </linearGradient>
              </defs>
              <g transform="translate(-3.8859 -244.09)" clipPath="url(#y)">
                <path d="m3.1778 242h1603.4a1.2778 1.278 0 0 1 1.2778 1.278v1095.4a1.2778 1.278 0 0 1 -1.2778 1.278h-1603.4a1.2778 1.278 0 0 1 -1.2778 -1.3v-1095.4a1.2778 1.278 0 0 1 1.2778 -1.278" fill="url(#dawn-gradient-1-right)"/>
              </g>
            </svg>
          </div>
          <div id="dawn-hill-2-right" className="svg-element dawn-hill">
            <svg viewBox="0 0 1604.1533 1109.8041" className="svg-content">
              <g transform="translate(-3.8859 -244.09)">
                <path d="m-2.1 859.25c16.75-9.75 56 38 67 40s52 7 58 9 34-13 40-13 18-4 22-6 7-10.5 17-11 12 8 23 9 27.09 2.45 40 7c8.15 2.88 6.96 5.78 11 8.41 6.43 4.18 4-11.41 13-7.41s2.75 8 16 3 28-22 37-23 30 11 38 12 40-14 49-14 25.75 4.75 46 4 25-10 35-7 15.25 6.5 25 9 18.5-2 19.5 4 14.25 8.75 26.5 10 10-10 17-8 37 20 46 19 5-9 14-7 11 9 20 10 24-5 35-5 27-8 32-12 46-15 54-16 45-5 60-10 74.79-18.24 87.52-15.41c12.41 2.76 38.48 40.41 58.48 41.41s69 4 77-2 69-21 77-14 52-8 57-9c1.89-0.37 37.34 1.93 42.16 14.05 6.28 15.81 46.73 28.81 78.22 31.45 25.44 2.13 57.9 19.39 117.6 1.36 8.87-2.67 51.7-17.7 80-12.6 17.15 3.09 65.29-1.51 78.02 5.02v301.72h-1614v-347z" fill="#335eb5"/>
              </g>
            </svg>
          </div>
          <div id="dawn-hill-3-right" className="svg-element dawn-hill">
            <svg viewBox="0 0 1604.1533 1109.8041" className="svg-content">
              <g transform="translate(-3.8859 -244.09)">
                <path d="m1611.9 934.72c-16.75-7.46-56 29.08-67 30.61s-52 5.35-58 6.88c-6 1.54-34-9.94-40-9.94s-18-3.06-22-4.59c-4-1.54-7-8.04-17-8.42-10-0.39-12 6.12-23 6.88-11 0.77-27.09 1.87-40 5.36-8.15 2.2-6.95 4.42-11 6.43-6.43 3.2-4-8.72-13-5.66s-2.75 6.12-16 2.29c-13.25-3.82-28-16.83-37-17.6-9-0.76-30 8.42-38 9.18-8 0.77-40-10.71-49-10.71s-25.75 3.64-46 3.06c-20.25-0.57-25-7.65-35-5.35-10 2.29-15.25 4.97-25 6.88-9.75 1.92-18.5-1.53-19.5 3.06-1 4.6-14.25 6.7-26.5 7.66-12.25 0.95-10-7.66-17-6.13s-37 15.31-46 14.54c-9-0.76-5-6.88-14-5.35s-11 6.88-20 7.65c-9 0.76-24-3.83-35-3.83s-27-6.12-32-9.18-46-11.48-54-12.24c-8-0.77-45-3.83-60-7.66-15-3.82-74.79-13.95-87.51-11.79-12.42 2.11-38.49 30.93-58.49 31.69-20 0.77-69 3.06-77-1.53s-69-16.07-77-10.71c-8 5.35-52-6.13-57-6.89-1.89-0.29-37.34 1.47-42.16 10.75-6.28 12.1-46.73 22.04-78.22 24.06-25.44 1.63-57.9 14.84-117.6 1.05-8.87-2.05-51.7-13.55-80-9.65-17.15 2.37-65.29-1.15-78.02 3.85v387.49h1614v-422.18z" fill="#153b88"/>
              </g>
            </svg>
          </div>
          <div id="dawn-cloud-1-right" className="svg-element dawn-cloud">
            <svg viewBox="0 0 1604.1533 1109.8041" className="svg-content">
              <g transform="translate(-3.8859 -244.09)">
                <path d="m2706 842c4-14 21.51-17.27 27.51-35.27 16.54-35.34 58.06-28.44 86.73-20.63 14 4 39.76 7.9 51.76-2.1s62 8 64-26 4-68 26-68 38-16 46-38 26-30 44-16 38 44 44 60-6 170-6 170l-436-2s32-18 52-22z" fill="#ffffff" opacity="0.6"/>
              </g>
            </svg>
          </div>
          <div id="dawn-cloud-2-right" className="svg-element dawn-cloud">
            <svg viewBox="0 0 1604.1533 1109.8041" className="svg-content">
              <g transform="translate(-3.8859 -244.09)">
                <path d="m60.63 938c0-114.68 124.2-14.83 151.06 55.99 28.61-57.33 98.96-69.76 126.51-19.19 42.25-0.56 52.78 86.04 82.38 18.47 45.46-63.91 89.69 33.18 99.58 70.09 29.36 2.66 53.09-30.69 72.38 7.74 32.67-32.78 57.78 20.24 94.8 0.97 29.64 37.88 89.69 14.58 92.45 63.58 44.83 8.11 95.25 1.03 95.25 47.72h-818.41c-138.46-43.5-139.89-152.6 4-245.4z" fill="#ffffff" opacity="0.5"/>
              </g>
            </svg>
          </div>
        </div>
        
        {/* House Scene */}
        <div id="house-scene" className="svg-scene">
          <div id="house-bg" className="svg-element house-bg"></div>
          <div id="house" className="svg-element house">
            <img src="/assets/SVG/house-2023960.svg" alt="House" className="svg-content" />
          </div>
        </div>
        
        {/* Chalkboard Scene */}
        <div id="chalkboard-scene" className="svg-scene">
          <div id="chalkboard-bg" className="svg-element chalkboard-bg"></div>
          <div id="chalkboard" className="svg-element chalkboard">
            <img src="/assets/SVG/chalkboardclassroom.svg" alt="Chalkboard" className="svg-content" />
          </div>
        </div>
        
        {/* Sparrow Scene */}
        <div id="sparrow-scene" className="svg-scene">
          <div id="sparrow-bg" className="svg-element sparrow-bg"></div>
          <div id="sparrow" className="svg-element sparrow">
            <img src="/assets/SVG/Sparrow.svg" alt="Sparrow" className="svg-content" />
          </div>
        </div>
        
        {/* Park Scene */}
        <div id="park-scene-right" className="svg-scene">
          <div id="park-bg-right" className="svg-element park-bg"></div>
          <div id="park-tree-1-right" className="svg-element park-tree">
            <img src="/assets/SVG/park.svg" alt="Park tree 1" className="svg-content" />
          </div>
          <div id="park-tree-2-right" className="svg-element park-tree">
            <img src="/assets/SVG/park.svg" alt="Park tree 2" className="svg-content" />
          </div>
          <div id="park-bench-right" className="svg-element park-bench">
            <img src="/assets/SVG/park.svg" alt="Park bench" className="svg-content" />
          </div>
          <div id="park-people-right" className="svg-element park-people">
            <img src="/assets/SVG/park.svg" alt="Park people" className="svg-content" />
          </div>
        </div>
      </div>
    </>
  );
};

export default MarginParallax; 