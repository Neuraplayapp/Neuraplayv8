import React, { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface FullPageAnimationProps {
    children: React.ReactNode;
}

export const FullPageAnimation: React.FC<FullPageAnimationProps> = ({ children }) => {
    const pageRef = useRef<HTMLDivElement>(null);
    const bgLayer1Ref = useRef<HTMLDivElement>(null);
    const bgLayer2Ref = useRef<HTMLDivElement>(null);
    const contentLayerRef = useRef<HTMLDivElement>(null);

    // This effect handles the mouse-move parallax for the entire page
    useLayoutEffect(() => {
        const pageElement = pageRef.current;
        if (!pageElement) return;

        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const { offsetWidth, offsetHeight } = pageElement;
            const xPos = (clientX / offsetWidth) - 0.5;
            const yPos = (clientY / offsetHeight) - 0.5;

            gsap.to(bgLayer1Ref.current, { 
                x: -xPos * 80, 
                y: -yPos * 50, 
                duration: 1.2, 
                ease: 'power3.out' 
            });
            gsap.to(bgLayer2Ref.current, { 
                x: xPos * 40, 
                y: yPos * 30, 
                duration: 1.2, 
                ease: 'power3.out' 
            });
            gsap.to(contentLayerRef.current, { 
                x: xPos * 60, 
                y: yPos * 40, 
                duration: 1.2, 
                ease: 'power3.out' 
            });
        };
        
        pageElement.addEventListener('mousemove', handleMouseMove);
        return () => {
            pageElement.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <div ref={pageRef} className="relative w-full min-h-screen overflow-hidden">
            {/* Full Page Parallax Background Layers */}
            <div 
                ref={bgLayer1Ref} 
                className="fixed inset-0 hero-rainbow-bg opacity-60"
                style={{
                    background: 'linear-gradient(45deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
                    backgroundSize: '400% 400%',
                    animation: 'gradientShift 15s ease infinite'
                }}
            ></div>
            <div 
                ref={bgLayer2Ref} 
                className="fixed inset-0 bg-hero-pattern opacity-20"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '60px 60px'
                }}
            ></div>

            {/* Content Layer */}
            <div ref={contentLayerRef} className="relative z-10">
                {children}
            </div>

            <style jsx>{`
                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}</style>
        </div>
    );
}; 