import React, { useState, useLayoutEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Brain, Target, Sparkles } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// This component is now self-contained for simplicity and robustness.
const FullscreenPopper = ({ videoSrc, children }: { videoSrc: string; children: React.ReactNode }) => {
    return (
        <div className="grid h-full w-full items-center gap-8 p-8 md:grid-cols-2 lg:gap-16">
            <div className="relative flex h-full max-h-[80vh] w-full items-center justify-center">
                <video 
                    src={videoSrc} 
                    playsInline 
                    controls
                    preload="metadata"
                    className="h-auto w-full max-h-full rounded-2xl shadow-2xl" 
                />
            </div>
            <div className="text-left">{children}</div>
        </div>
    );
};

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    // State and data from your original component
    const [activeFeature, setActiveFeature] = useState(0);
    const features = [
        { id: 0, title: "Neuro-psychological teaching methods", description: "Every game, story, and challenge is built upon proven neuropsychological principles...", icon: <Brain className="w-8 h-8 text-violet-600" /> },
        { id: 1, title: "Tailor-made for the learner", description: "Our Synaptic-AI™ is specifically developed to be adaptive and intuitive...", icon: <Target className="w-8 h-8 text-violet-600" /> },
        { id: 2, title: "The Montessori approach", description: "We embrace the Montessori philosophy of self-directed discovery...", icon: <Sparkles className="w-8 h-8 text-violet-600" /> }
    ];

    const pinContainerRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const slideTimelineRef = useRef<gsap.core.Timeline>();

    // This single, comprehensive effect hook manages all animations.
    useLayoutEffect(() => {
        const heroElement = document.querySelector('.hero-slide') as HTMLElement;
        const bgLayer = document.querySelector('.hero-bg-layer') as HTMLElement;
        const textLayer = document.querySelector('.hero-text-layer') as HTMLElement;

        // --- 1. Mouse-Move Parallax Logic ---
        const handleMouseMove = (e: MouseEvent) => {
            if (!heroElement) return;
            const { clientX, clientY } = e;
            const { offsetWidth, offsetHeight } = heroElement;
            const xPos = (clientX / offsetWidth) - 0.5;
            const yPos = (clientY / offsetHeight) - 0.5;
            gsap.to(bgLayer, { x: -xPos * 40, y: -yPos * 20, duration: 0.8, ease: 'power3.out' });
            gsap.to(textLayer, { x: xPos * 30, y: yPos * 15, duration: 0.8, ease: 'power3.out' });
        };
        window.addEventListener('mousemove', handleMouseMove);

        // --- 2. Tab-Controlled Slide Animation Logic ---
        // We create a paused timeline. Clicks will animate it to specific labels.
        const tl = gsap.timeline({ paused: true });
        tl.to(trackRef.current, { xPercent: -100, ease: 'power2.inOut' }).addLabel("slide2");
        tl.to(trackRef.current, { xPercent: -200, ease: 'power2.inOut' }).addLabel("slide3");
        tl.to(trackRef.current, { xPercent: -300, ease: 'power2.inOut' }).addLabel("slide4");
        tl.to(trackRef.current, { xPercent: -400, ease: 'power2.inOut' }).addLabel("slide5");
        tl.to(trackRef.current, { xPercent: -500, ease: 'power2.inOut' }).addLabel("slide6");
        slideTimelineRef.current = tl;

        // --- 3. Pinning Logic ---
        // This ONLY pins the container. It does not scrub any animations.
        const st = ScrollTrigger.create({
            trigger: pinContainerRef.current,
            pin: true,
            start: "top top",
            end: "+=4000" // User must scroll this much to pass the module
        });

        // Cleanup function
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            st.kill();
            tl.kill();
        };
    }, []);

    const goToSlide = (label: string) => {
        if (slideTimelineRef.current) {
            slideTimelineRef.current.tweenTo(label, { duration: 1.2, ease: 'power4.inOut' });
        }
    };

    const globalStyles = `
      /* Rainbow Background Effect */
      .hero-rainbow-bg {
        background: repeating-linear-gradient(-45deg, #4c1d95, #5b21b6, #7c3aed, #c084fc, #7c3aed, #5b21b6, #4c1d95 50%);
        background-size: 800% 800%;
        animation: slide 20s infinite linear alternate;
      }
      @keyframes slide {
        0% { background-position: 0% 50%; }
        100% { background-position: 100% 50%; }
      }
      /* Vertical Parallax styles */
      .parallax-container { height: 100vh; overflow-x: hidden; overflow-y: auto; perspective: 1px; }
      .parallax-group { position: relative; height: 100vh; transform-style: preserve-3d; }
      .parallax-layer { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }
        .layer-base { transform: translateZ(0); }
        .layer-back { transform: translateZ(-1px) scale(2); }
    `;

    return (
        <>
            <style>{globalStyles}</style>
            
            {/* The Pin Container holds the entire interactive filmstrip module */}
            <div ref={pinContainerRef} className="h-screen w-screen overflow-hidden">
                <div ref={trackRef} className="flex h-full w-[600vw]">

                    {/* --- SLIDE 1: INTERACTIVE HERO --- */}
                    <section className="hero-slide h-full w-screen flex-shrink-0 flex flex-col justify-between items-center text-center p-6 text-white relative bg-[#100320]">
                        <div className="hero-bg-layer absolute inset-[-5%] hero-rainbow-bg"></div>
                        <div className="hero-text-layer relative z-10 flex-grow flex flex-col justify-center items-center">
                            <h1 className="text-5xl md:text-8xl font-black leading-tight tracking-tighter mb-4 drop-shadow-lg">
                            Your Child is a Genius
                        </h1>
                            <p className="text-xl md:text-2xl max-w-4xl mx-auto drop-shadow">
                                Unlock the potential with scientifically-backed neuropsychological games.
                            </p>
                        </div>
                        <div className="relative z-10 w-full max-w-5xl p-4">
                            <div className="flex justify-center items-center gap-4 bg-black/20 backdrop-blur-sm p-2 rounded-xl">
                                {/* These buttons now link to actual pages */}
                                <button onClick={() => navigate('/about')} className="flex-1 p-3 rounded-lg hover:bg-white/20 transition-colors duration-300 text-white">What is neuraplay?</button>
                                <button onClick={() => navigate('/forum')} className="flex-1 p-3 rounded-lg hover:bg-white/20 transition-colors duration-300 text-white">Forum</button>
                                <button onClick={() => navigate('/about')} className="flex-1 p-3 rounded-lg hover:bg-white/20 transition-colors duration-300 text-white">About Us</button>
                            </div>
                        </div>
                    </section>
                    
                    {/* --- SLIDES 2, 3, 4: VIDEOS --- */}
                    <section className="h-full w-screen flex-shrink-0 flex justify-center items-center bg-slate-50 p-6"><FullscreenPopper videoSrc="/assets/Videos/neuraplayintrovid4.mp4">...</FullscreenPopper></section>
                    <section className="h-full w-screen flex-shrink-0 flex justify-center items-center bg-slate-100 p-6"><FullscreenPopper videoSrc="/assets/Videos/neuraplayintrovid1.mp4">...</FullscreenPopper></section>
                    <section className="h-full w-screen flex-shrink-0 flex justify-center items-center bg-slate-200 p-6"><FullscreenPopper videoSrc="/assets/Videos/Neuraplayintrovid3.mp4">...</FullscreenPopper></section>
                    
                    {/* --- SLIDE 5: MAIN CONTENT --- */}
                    <section className="h-full w-screen flex-shrink-0 bg-white p-6 overflow-y-auto">
                        <div className="container mx-auto max-w-5xl py-12">
                             <div className="text-center mb-12"><h2 className="text-4xl md:text-5xl font-bold text-slate-900">An investment in their future is priceless</h2></div>
                             <div className="grid md:grid-cols-2 gap-16 items-center">
                                <div>
                                    <h3 className="text-3xl font-bold text-slate-900 mb-6">A whole new way to learn</h3>
                                    <div className="space-y-4">
                                        {features.map((feature, index) => (
                                            <button key={feature.id} onClick={() => setActiveFeature(index)} className={`w-full p-4 rounded-lg text-left transition-all ${activeFeature === index ? 'bg-violet-600 text-white shadow-lg' : 'bg-slate-100 hover:bg-slate-200'}`}>
                                                <div className="flex items-center gap-3">{feature.icon}<span className="font-semibold">{feature.title}</span></div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-slate-100 p-6 rounded-lg min-h-[300px]">
                                     <div className="flex items-center gap-3 mb-4">{features[activeFeature].icon}<h4 className="font-bold text-xl text-violet-600">{features[activeFeature].title}</h4></div>
                                     <p className="text-slate-600">{features[activeFeature].description}</p>
                                </div>
                             </div>
                        </div>
                    </section>

                    {/* --- SLIDE 6: FINAL CTA --- */}
                    <section className="h-full w-screen flex-shrink-0 flex justify-center items-center text-center p-6 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                        <div className="container">
                            <h2 className="text-4xl font-bold mb-6">Ready to unlock your child's potential?</h2>
                            <div className="flex gap-4 justify-center">
                                <Link to="/registration" className="bg-white text-violet-600 font-bold px-8 py-3 rounded-full hover:bg-slate-100 transition-transform hover:scale-105">Start Full Journey</Link>
                                <Link to="/forum-registration" className="bg-violet-900/50 text-white font-bold px-8 py-3 rounded-full hover:bg-violet-900/80 transition-transform hover:scale-105">Join Community</Link>
                        </div>
                        </div>
                    </section>
                    </div>
                </div>

            {/* --- VERTICAL PARALLAX SECTION AFTER THE PINNED MODULE --- */}
            <div className="parallax-container bg-gray-800">

                
                {/* --- DISCOVER NEURAPLAY VIDEOS SECTION --- */}
                <div className="parallax-group">
                    <div className="parallax-layer layer-back">
                        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 to-purple-900/20"></div>
                    </div>
                    <div className="parallax-layer layer-base h-screen bg-gradient-to-b from-[#100320] to-slate-50 flex items-center justify-center p-6">
                        <div className="container mx-auto max-w-7xl">
                            <div className="text-center mb-16">
                                <h2 className="text-6xl md:text-7xl font-bold text-white mb-8 drop-shadow-2xl">Discover Neuraplay</h2>
                                <p className="text-3xl md:text-4xl text-white/90 max-w-5xl mx-auto leading-relaxed drop-shadow-lg font-medium">Embark on a journey where neuroscience meets play, where every game is a step toward unlocking your child's limitless potential.</p>
                            </div>
                            
                            <div className="grid lg:grid-cols-2 gap-16">
                                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300" style={{ minHeight: '500px' }}>
                                    <div className="h-full flex flex-col">
                                        <div className="flex-1 p-6">
                                            <video 
                                                src="/assets/Videos/neuraplayintrovid1.mp4" 
                                                playsInline 
                                                controls
                                                preload="metadata"
                                                className="w-full h-full object-cover rounded-2xl shadow-xl" 
                                                style={{ minHeight: '300px' }}
                                            />
                                        </div>
                                        <div className="p-6 bg-gradient-to-r from-violet-50 to-purple-50">
                                            <h3 className="text-3xl md:text-4xl font-bold text-violet-700 mb-4">Welcome to Neuraplay</h3>
                                            <p className="text-xl text-slate-700 leading-relaxed">Step into a world where learning becomes an adventure. Discover how our neuroscience-based approach transforms education into an engaging journey of discovery and growth.</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300" style={{ minHeight: '500px' }}>
                                    <div className="h-full flex flex-col">
                                        <div className="flex-1 p-6">
                                            <video 
                                                src="/assets/Videos/Neuraplayintrovid3.mp4" 
                                                playsInline 
                                                controls
                                                preload="metadata"
                                                className="w-full h-full object-cover rounded-2xl shadow-xl" 
                                                style={{ minHeight: '300px' }}
                                            />
                                        </div>
                                        <div className="p-6 bg-gradient-to-r from-violet-50 to-purple-50">
                                            <h3 className="text-3xl md:text-4xl font-bold text-violet-700 mb-4">The Neuraplay Experience</h3>
                                            <p className="text-xl text-slate-700 leading-relaxed">Witness the magic of personalized learning in action. See how our platform adapts to each child's unique cognitive profile, creating moments of wonder and achievement.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="parallax-group">
                    <div className="parallax-layer layer-base h-screen bg-white flex items-center justify-center">
                         <h2 className="text-5xl font-bold text-slate-800">Final Page Content</h2>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HomePage;