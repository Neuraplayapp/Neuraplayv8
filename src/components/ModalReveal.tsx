import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

// Declare GSAP types
declare const gsap: any;
declare const ScrollTrigger: any;

interface ModalRevealProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  backdropClassName?: string;
  modalClassName?: string;
  // Animation props
  delay?: number;
  stagger?: number;
  duration?: number;
  blurAmount?: number;
  revealType?: 'letter' | 'word' | 'line' | 'fade';
  revealDirection?: 'left' | 'right' | 'center' | 'random';
  typewriterEffect?: boolean;
  cursorBlink?: boolean;
  // Modal animation props
  modalScale?: boolean;
  backdropBlur?: boolean;
  // Content animation props
  contentStagger?: number;
  contentDelay?: number;
  showCloseButton?: boolean;
  closeButtonText?: string;
}

const ModalReveal: React.FC<ModalRevealProps> = ({
  isOpen,
  onClose,
  title = "Modal Reveal",
  children,
  className = "",
  backdropClassName = "",
  modalClassName = "",
  // Animation props
  delay = 0.3,
  stagger = 0.08,
  duration = 1.2,
  blurAmount = 15,
  revealType = 'letter',
  revealDirection = 'center',
  typewriterEffect = true,
  cursorBlink = true,
  // Modal animation props
  modalScale = true,
  backdropBlur = true,
  // Content animation props
  contentStagger = 0.1,
  contentDelay = 0.5,
  showCloseButton = true,
  closeButtonText = "Close"
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (!isOpen || typeof gsap === 'undefined' || !gsap.registerPlugin) return;

    gsap.registerPlugin(ScrollTrigger);
    setIsAnimating(true);

    // Set initial states
    gsap.set(backdropRef.current, {
      opacity: 0,
      backdropFilter: backdropBlur ? 'blur(0px)' : 'none'
    });

    gsap.set(modalRef.current, {
      opacity: 0,
      scale: modalScale ? 0.8 : 1,
      y: 50,
      filter: `blur(${blurAmount}px)`
    });

    gsap.set(titleRef.current, {
      opacity: 0,
      y: -30,
      filter: `blur(${blurAmount}px)`
    });

    gsap.set(contentRef.current, {
      opacity: 0,
      y: 30,
      filter: `blur(${blurAmount}px)`
    });

    gsap.set(closeButtonRef.current, {
      opacity: 0,
      scale: 0.8
    });

    // Create the main timeline
    const tl = gsap.timeline({ delay });

    // Backdrop animation
    tl.to(backdropRef.current, {
      opacity: 1,
      backdropFilter: backdropBlur ? 'blur(8px)' : 'none',
      duration: duration * 0.3,
      ease: "power2.out"
    }, 0);

    // Modal container animation
    tl.to(modalRef.current, {
      opacity: 1,
      scale: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: duration * 0.6,
      ease: "back.out(1.7)"
    }, duration * 0.1);

    // Title animation based on reveal type
    if (revealType === 'letter') {
      // Letter-by-letter reveal
      const titleLetters = titleRef.current?.querySelectorAll('.modal-letter');
      if (titleLetters) {
        gsap.set(titleLetters, {
          opacity: 0,
          scale: 0.3,
          y: -20,
          rotationX: 90
        });

        tl.to(titleLetters, {
          opacity: 1,
          scale: 1,
          y: 0,
          rotationX: 0,
          duration: duration * 0.8,
          stagger: stagger,
          ease: "back.out(1.7)"
        }, duration * 0.3);

        if (typewriterEffect) {
          tl.to(titleLetters, {
            scale: 1.1,
            duration: 0.1,
            stagger: stagger * 0.5,
            ease: "power2.out"
          }, "-=0.1");

          tl.to(titleLetters, {
            scale: 1,
            duration: 0.1,
            stagger: stagger * 0.5,
            ease: "bounce.out"
          }, "-=0.05");
        }
      }
    } else if (revealType === 'word') {
      // Word-by-word reveal
      const titleWords = titleRef.current?.querySelectorAll('.modal-word');
      if (titleWords) {
        gsap.set(titleWords, {
          opacity: 0,
          y: -30,
          filter: `blur(${blurAmount}px)`
        });

        tl.to(titleWords, {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: duration * 0.8,
          stagger: stagger * 2,
          ease: "power2.out"
        }, duration * 0.3);
      }
    } else if (revealType === 'line') {
      // Line reveal (like MagicLine)
      tl.to(titleRef.current, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: duration * 0.8,
        ease: "power2.out"
      }, duration * 0.3);

      // Add glow effect
      tl.to(titleRef.current, {
        textShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
        duration: duration * 0.2,
        ease: "power2.out"
      }, "-=0.3");

      tl.to(titleRef.current, {
        textShadow: '0 0 0px rgba(255, 255, 255, 0)',
        duration: duration * 0.2,
        ease: "power2.out"
      }, "+=0.1");
    } else {
      // Simple fade
      tl.to(titleRef.current, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: duration * 0.6,
        ease: "power2.out"
      }, duration * 0.3);
    }

    // Content animation
    tl.to(contentRef.current, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: duration * 0.8,
      ease: "power2.out"
    }, duration * 0.5);

    // Close button animation
    tl.to(closeButtonRef.current, {
      opacity: 1,
      scale: 1,
      duration: duration * 0.4,
      ease: "back.out(1.7)"
    }, duration * 0.7);

    // Complete animation
    tl.call(() => {
      setIsAnimating(false);
    });

    return () => {
      tl.kill();
    };
  }, [isOpen, title, delay, stagger, duration, blurAmount, revealType, typewriterEffect, modalScale, backdropBlur]);

  // Handle close animation
  const handleClose = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    const tl = gsap.timeline();

    // Reverse animations
    tl.to(closeButtonRef.current, {
      opacity: 0,
      scale: 0.8,
      duration: duration * 0.3,
      ease: "power2.in"
    });

    tl.to([titleRef.current, contentRef.current], {
      opacity: 0,
      y: 20,
      filter: `blur(${blurAmount}px)`,
      duration: duration * 0.4,
      ease: "power2.in"
    }, "-=0.2");

    tl.to(modalRef.current, {
      opacity: 0,
      scale: modalScale ? 0.8 : 1,
      y: 50,
      filter: `blur(${blurAmount}px)`,
      duration: duration * 0.5,
      ease: "power2.in"
    }, "-=0.3");

    tl.to(backdropRef.current, {
      opacity: 0,
      backdropFilter: backdropBlur ? 'blur(0px)' : 'none',
      duration: duration * 0.3,
      ease: "power2.in"
    }, "-=0.2");

    tl.call(() => {
      onClose();
      setIsAnimating(false);
    });
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isAnimating) {
      handleClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isAnimating) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isAnimating]);

  if (!isOpen) return null;

  // Render title based on reveal type
  const renderTitle = () => {
    const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
    
    if (revealType === 'letter') {
      return (
        <div ref={titleRef} className={`text-2xl font-bold ${textColor} mb-6`}>
          {title.split('').map((char, index) => (
            <span
              key={index}
              className="modal-letter inline-block"
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
          {cursorBlink && typewriterEffect && (
            <span className="inline-block w-0.5 h-6 bg-current ml-1 animate-pulse"></span>
          )}
        </div>
      );
    } else if (revealType === 'word') {
      return (
        <div ref={titleRef} className={`text-2xl font-bold ${textColor} mb-6`}>
          {title.split(' ').map((word, index) => (
            <span
              key={index}
              className="modal-word inline-block mr-2"
            >
              {word}
            </span>
          ))}
        </div>
      );
    } else {
      return (
        <div ref={titleRef} className={`text-2xl font-bold ${textColor} mb-6`}>
          {title}
        </div>
      );
    }
  };

  return (
    <div
      ref={backdropRef}
      className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 isolate ${backdropClassName}`}
      onClick={handleBackdropClick}
      style={{ 
        backdropFilter: backdropBlur ? 'blur(8px)' : 'none',
        WebkitBackdropFilter: backdropBlur ? 'blur(8px)' : 'none',
        background: isDarkMode 
          ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
          : 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #f3e8ff 100%)'
      }}
    >
      <div
        ref={modalRef}
        className={`rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border isolate backdrop-blur-xl ${
          isDarkMode 
            ? 'border-white/20 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)]' 
            : 'border-gray-200 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)]'
        } ${modalClassName} ${className}`}
        style={{ 
          transform: 'translateZ(0)',
          willChange: 'transform, opacity',
          background: isDarkMode 
            ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
            : 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #f3e8ff 100%)'
        }}
      >
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b ${isDarkMode ? 'border-white/20' : 'border-gray-200'}`}>
          {renderTitle()}
          {showCloseButton && (
            <button
              ref={closeButtonRef}
              onClick={handleClose}
              className={`${isDarkMode ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} text-2xl font-bold transition-colors p-2 rounded-full`}
              disabled={isAnimating}
            >
              ×
            </button>
          )}
        </div>

        {/* Content */}
        <div ref={contentRef} className="p-6">
          {children}
        </div>

        {/* Footer */}
        {showCloseButton && (
          <div className={`flex justify-end p-6 border-t ${isDarkMode ? 'border-white/20' : 'border-gray-200'}`}>
            <button
              onClick={handleClose}
              className={`px-6 py-3 rounded-xl transition-all duration-300 font-semibold border ${
                isDarkMode 
                  ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
              }`}
              disabled={isAnimating}
            >
              {closeButtonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalReveal; 