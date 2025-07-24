import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Volume2, Play } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface Props {
  videoSrc: string;
  children: React.ReactNode;
}

export const FullscreenPopper: React.FC<Props> = ({ videoSrc, children }) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const popperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  useLayoutEffect(() => {
    const popper = popperRef.current;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerRef.current,
          start: 'top top',
          end: 'bottom+=360 top', // 10% closer than previous value
          scrub: 1,
          pin: true,
        },
      });
      tl.fromTo(popper, 
        { scale: 0.8, autoAlpha: 0, y: '20vh' },
        { scale: 1, autoAlpha: 1, y: 0, duration: 1, ease: 'power2.out' }
      );
      tl.to(popper, { duration: 1 });
      tl.to(popper, 
        { scale: 0.8, autoAlpha: 0, y: '20vh', duration: 1, ease: 'power2.in' }
      );
    }, triggerRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleVideoEnd = () => {
      setIsMuted(true);
      video.currentTime = 0;
    };
    video.addEventListener('ended', handleVideoEnd);
    return () => video.removeEventListener('ended', handleVideoEnd);
  }, []);

  const handlePlayAndUnmute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = false;
      video.play();
      setIsMuted(false);
    }
  };

  return (
    // Decreased vertical distance between poppers by 20%
    <div ref={triggerRef} className="h-[72vh]">
      <div ref={popperRef} className="fixed inset-0 flex items-start justify-center invisible p-8 pt-20">
        <div className="w-[90vw] h-[80vh] grid md:grid-cols-2 gap-8 lg:gap-16 items-center bg-white p-8 rounded-3xl shadow-2xl">
          {/* Left Column: Video now has a custom button overlay */}
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              src={videoSrc}
              muted
              playsInline
              className="w-full h-auto max-h-full rounded-2xl"
            />
            {/* The custom "Unmute to Play" button */}
            {isMuted && (
              <div 
                onClick={handlePlayAndUnmute}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-2xl cursor-pointer group"
              >
                <div className="flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full transition-all duration-300 group-hover:bg-white/30 group-hover:scale-110">
                  <Play className="w-10 h-10 text-white" fill="white" />
                </div>
                <p className="text-white font-semibold mt-4 text-lg">Click to Play with Sound</p>
              </div>
            )}
          </div>
          <div className="text-left">{children}</div>
        </div>
      </div>
    </div>
  );
}; 