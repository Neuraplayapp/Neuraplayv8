import React, { useEffect, useRef, useState } from 'react';
import BouncyLetters from '../components/BouncyLetters';
import MagicLine from '../components/MagicLine';
import LetterReveal from '../components/LetterReveal';
import ModalReveal from '../components/ModalReveal';
import EnhancedTextReveal from '../components/EnhancedTextReveal';
import BlurTextReveal from '../components/BlurTextReveal';
import CardReveal from '../components/CardReveal';
import SequentialVideoScrubber from '../components/SequentialVideoScrubber';
import PlasmaBall from '../components/PlasmaBall';
import DynamicIslandAIAgent from '../components/DynamicIslandAIAgent';
import UniversalAIAgent from '../components/UniversalAIAgent';
import ElevenLabsAIAssistant from '../components/ElevenLabsAIAssistant';
import AIAssistant from '../components/AIAssistant';
import AIGame from '../components/AIGame';
import AITeachingAssistantCard from '../components/AITeachingAssistantCard';
import AITeachingAssistantModal from '../components/AITeachingAssistantModal';
import AIDemoSection from '../components/AIDemoSection';
import GameWrapper from '../components/GameWrapper';
import GameModal from '../components/GameModal';
import GameInfoModal from '../components/GameInfoModal';
import PlaygroundModalReveal from '../components/PlaygroundModalReveal';
import FullscreenPopper from '../components/FullscreenPopper';
import ProfileCard from '../components/ProfileCard';
import TaskManager from '../components/TaskManager';
import StudyCalendar from '../components/StudyCalendar';
import Calendar from '../components/Calendar';
import Diary from '../components/Diary';
import ContactForm from '../components/ContactForm';
import LoginModal from '../components/LoginModal';
import SignUpModal from '../components/SignUpModal';
import SignUpChoiceModal from '../components/SignUpChoiceModal';
import RegularSignUpModal from '../components/RegularSignUpModal';
import ErrorBoundary from '../components/ErrorBoundary';
import Footer from '../components/Footer';
import Header from '../components/Header';
import InteractiveHero from '../components/InteractiveHero';
import FastHeroBackground from '../components/FastHeroBackground';
import MutedPlasmaBackground from '../components/MutedPlasmaBackground';
import OptimizedPlasmaBackground from '../components/OptimizedPlasmaBackground';
import PlasmaBackground from '../components/PlasmaBackground';
import PlasmaBackgroundWithFallback from '../components/PlasmaBackgroundWithFallback';
import ProgressiveHeroBackground from '../components/ProgressiveHeroBackground';
import PlasmaHeroPerformance from '../components/PlasmaHeroPerformance';
import MarginParallax from '../components/MarginParallax';
import PremiumStar from '../components/PremiumStar';
import TextRevealExample from '../components/TextRevealExample';
import LetterRevealExample from '../components/LetterRevealExample';
import MagicLineExample from '../components/MagicLineExample';
import ModalRevealDemo from '../components/ModalRevealDemo';
import BlurTextRevealExample from '../components/BlurTextRevealExample';
import EnhancedTextRevealExample from '../components/EnhancedTextRevealExample';
import EnhancedTextRevealModal from '../components/EnhancedTextRevealModal';
import CardRevealExample from '../components/CardRevealExample';

// Declare GSAP types
declare const gsap: any;
declare const ScrollTrigger: any;

const TestPage: React.FC = () => {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeModalReveal, setActiveModalReveal] = useState<string | null>(null);

  useEffect(() => {
    // Initialize GSAP ScrollTrigger animations
    if (typeof gsap !== 'undefined' && gsap.registerPlugin) {
      gsap.registerPlugin(ScrollTrigger);

      // Scene 1: Continuous parallax layers
      const scene1 = gsap.timeline();
      ScrollTrigger.create({
        animation: scene1,
        trigger: scrollElementRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1
      });

      // Parallax layers moving continuously at different speeds
      scene1.to(".parallax-layer-1", { y: -200, ease: "none" }, 0);
      scene1.to(".parallax-layer-2", { y: -300, rotation: 10, ease: "none" }, 0);
      scene1.to(".parallax-layer-3", { y: -150, ease: "none" }, 0);
      scene1.to(".test-content", { y: -100, opacity: 0.6 }, 0);



      // Scene 2: Cards animation - bidirectional trigger
      const cardsAnimation = gsap.fromTo(".test-card", 
        { y: 100, opacity: 0, scale: 0.8 }, 
        { 
          y: 0, 
          opacity: 1, 
          scale: 1, 
          duration: 1.2, 
          stagger: 0.2,
          ease: "power2.out"
        }
      );
      
      ScrollTrigger.create({
        animation: cardsAnimation,
        trigger: ".cards-section",
        start: "top 85%",
        end: "bottom 15%",
        toggleActions: "play none none none"
      });

      // Ocean section - bidirectional trigger
      const oceanAnimation = gsap.fromTo(".ocean-card", 
        { y: 60, opacity: 0, scale: 0.9 }, 
        { 
          y: 0, 
          opacity: 1, 
          scale: 1,
          duration: 1.0, 
          stagger: 0.15,
          ease: "power2.out"
        }
      );
      
      ScrollTrigger.create({
        animation: oceanAnimation,
        trigger: ".parallax-ocean",
        start: "top 80%",
        end: "bottom 20%",
        toggleActions: "play none none none"
      });

      // Ocean section - continuous parallax background
      ScrollTrigger.create({
        trigger: ".parallax-ocean",
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
        animation: gsap.to(".parallax-ocean", {
          y: -50,
          ease: "none"
        })
      });

      // Forest section - continuous parallax background  
      ScrollTrigger.create({
        trigger: ".parallax-forest",
        start: "top bottom", 
        end: "bottom top",
        scrub: 2,
        animation: gsap.to(".parallax-forest", {
          y: -80,
          ease: "none"
        })
      });

      // Space section - continuous parallax background
      ScrollTrigger.create({
        trigger: ".parallax-space",
        start: "top bottom",
        end: "bottom top", 
        scrub: 1.5,
        animation: gsap.to(".parallax-space", {
          y: -60,
          ease: "none"
        })
      });

      // Space section - card reveal animation (bidirectional trigger)
      const spaceAnimation = gsap.fromTo(".space-card", 
        { y: 80, opacity: 0, scale: 0.8, rotationY: 15 }, 
        { 
          y: 0, 
          opacity: 1, 
          scale: 1, 
          rotationY: 0,
          duration: 1.3, 
          stagger: 0.18,
          ease: "power2.out"
        }
      );
      
      ScrollTrigger.create({
        animation: spaceAnimation,
        trigger: ".parallax-space",
        start: "top 80%",
        end: "bottom 20%",
        toggleActions: "play none none none"
      });

      return () => {
        ScrollTrigger.getAll().forEach((trigger: any) => trigger.kill());
      };
    }
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      
      {/* Parallax Background Layers */}
      <div className="fixed inset-0 overflow-hidden">
        {/* Layer 1 - Floating geometric shapes */}
        <div className="parallax-layer-1 absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-48 h-48 bg-gradient-to-br from-pink-400/15 to-orange-500/15 rounded-full blur-2xl"></div>
          <div className="absolute bottom-32 left-1/3 w-24 h-24 bg-gradient-to-br from-green-400/25 to-blue-500/25 rounded-full blur-lg"></div>
        </div>
        
        {/* Layer 2 - Geometric patterns */}
        <div className="parallax-layer-2 absolute inset-0">
          <div className="absolute top-1/4 right-10 w-16 h-16 bg-gradient-to-r from-purple-500/30 to-pink-500/30 transform rotate-45"></div>
          <div className="absolute top-1/2 left-20 w-20 h-20 bg-gradient-to-r from-blue-500/20 to-teal-500/20 transform rotate-12 rounded-lg"></div>
          <div className="absolute bottom-1/4 right-1/4 w-12 h-12 bg-gradient-to-r from-yellow-500/25 to-orange-500/25 transform -rotate-45"></div>
        </div>
        
        {/* Layer 3 - Abstract lines */}
        <div className="parallax-layer-3 absolute inset-0">
          <svg className="absolute top-0 left-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
            <path d="M0,20 Q25,10 50,25 T100,15" stroke="url(#line-gradient)" strokeWidth="0.5" fill="none" />
            <path d="M0,60 Q30,45 60,65 T100,55" stroke="url(#line-gradient)" strokeWidth="0.3" fill="none" />
            <path d="M0,80 Q40,70 80,85 T100,75" stroke="url(#line-gradient)" strokeWidth="0.4" fill="none" />
          </svg>
        </div>
      </div>

      {/* Scroll content */}
      <div ref={scrollElementRef} className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6">
          <div className="test-content text-center max-w-4xl mx-auto">
            <div className="mb-8">
              <BouncyLetters 
                text="Test Section"
                className="text-6xl md:text-8xl font-bold text-white bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
                delay={0.5}
                stagger={0.12}
                duration={0.7}
                bounceHeight={-150}
                initialScale={0.6}
                initialRotation={-10}
              />
            </div>
            <p className="text-xl md:text-2xl text-white/80 mb-12 leading-relaxed">
              Welcome to the test section demonstrating parallax scrolling effects and modern web animations.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white font-semibold hover:bg-white/20 transition-all duration-300 cursor-pointer">
                Parallax Demo
              </div>
              <div className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 cursor-pointer">
                Interactive Elements
              </div>
              <a 
                href="/text-reveal" 
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl text-white font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 cursor-pointer"
              >
                Text Reveal Demo
              </a>
            </div>
          </div>
        </section>

        {/* Cards Section */}
        <section className="cards-section min-h-screen py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold text-center text-white mb-16">
              Test Features
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Scroll Animations",
                  description: "GSAP-powered scroll-triggered animations with smooth parallax effects",
                  icon: "🎬"
                },
                {
                  title: "Interactive Design",
                  description: "Modern glassmorphism design with interactive hover states",
                  icon: "✨"
                },
                {
                  title: "Performance Optimized",
                  description: "Hardware-accelerated animations for smooth 60fps performance",
                  icon: "⚡"
                },
                {
                  title: "Responsive Layout",
                  description: "Fully responsive design that works on all device sizes",
                  icon: "📱"
                },
                {
                  title: "Visual Hierarchy",
                  description: "Clear typography and spacing following design principles",
                  icon: "🎨"
                },
                {
                  title: "Modern Stack",
                  description: "Built with React, TypeScript, and Tailwind CSS",
                  icon: "🚀"
                }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="test-card bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 hover:bg-white/20 hover:border-white/30 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-white/70 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
              Parallax Implementation
            </h2>
            <div className="bg-black/30 backdrop-blur-md border border-white/20 rounded-2xl p-8 mb-12">
              <p className="text-white/80 text-lg leading-relaxed mb-6">
                This test section demonstrates advanced web animation techniques using GSAP ScrollTrigger. 
                The parallax effects create depth and visual interest while maintaining smooth performance.
              </p>
              <p className="text-white/60 leading-relaxed">
                Key features include hardware-accelerated transforms, scroll-synced animations, 
                and responsive design patterns that work across all devices.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Technical Stack</h3>
                <ul className="text-white/70 space-y-2 text-left">
                  <li>• React 18 with TypeScript</li>
                  <li>• GSAP with ScrollTrigger</li>
                  <li>• Tailwind CSS for styling</li>
                  <li>• Hardware-accelerated animations</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Animation Features</h3>
                <ul className="text-white/70 space-y-2 text-left">
                  <li>• Scroll-triggered parallax</li>
                  <li>• Staggered card animations</li>
                  <li>• Depth-based layering</li>
                  <li>• Smooth easing functions</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Ocean Section */}
        <section className="py-20 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/50 to-teal-900/50 parallax-ocean"></div>
          <div className="absolute inset-0">
            {/* Wave-like elements */}
            <div className="absolute bottom-0 left-0 w-full h-32 opacity-30">
              <svg viewBox="0 0 1200 120" className="w-full h-full">
                <path d="M0,60 C300,120 600,0 900,60 C1050,90 1150,30 1200,60 L1200,120 L0,120 Z" fill="url(#wave-gradient)" />
                <defs>
                  <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">Ocean Depths</h2>
            <p className="text-xl text-white/80 mb-12">Dive into the depths of creativity</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {['Deep Learning', 'Flow State', 'Creative Waves'].map((title, i) => (
                <div key={i} className="ocean-card bg-gradient-to-br from-cyan-500/20 to-blue-600/20 backdrop-blur-sm border border-cyan-400/30 rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
                  <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
                  <p className="text-white/70">Explore the endless possibilities of aquatic inspiration</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Forest Section */}
        <section className="py-20 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-green-900/50 to-emerald-900/50 parallax-forest"></div>
          <div className="absolute inset-0">
            {/* Tree-like silhouettes */}
            <div className="absolute bottom-0 left-10 w-4 h-40 bg-gradient-to-t from-green-800/60 to-green-600/40 rounded-t-full"></div>
            <div className="absolute bottom-0 left-32 w-6 h-32 bg-gradient-to-t from-green-800/50 to-green-600/30 rounded-t-full"></div>
            <div className="absolute bottom-0 right-20 w-5 h-36 bg-gradient-to-t from-green-800/40 to-green-600/20 rounded-t-full"></div>
            <div className="absolute bottom-0 right-40 w-3 h-28 bg-gradient-to-t from-green-800/60 to-green-600/40 rounded-t-full"></div>
          </div>
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">Forest Wisdom</h2>
            <p className="text-xl text-white/80 mb-12">Growing knowledge like ancient trees</p>
            <div className="bg-black/20 backdrop-blur-md border border-green-400/30 rounded-2xl p-8">
              <p className="text-white/80 text-lg leading-relaxed">
                In the quiet of the digital forest, innovation takes root. Each line of code 
                branches out like leaves reaching for the light of understanding.
              </p>
            </div>
          </div>
        </section>

        {/* Space Section */}
        <section className="py-20 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/50 to-indigo-900/50 parallax-space"></div>
          <div className="absolute inset-0">
            {/* Star field */}
            <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-pulse"></div>
            <div className="absolute top-20 right-20 w-1 h-1 bg-blue-300 rounded-full animate-pulse"></div>
            <div className="absolute top-40 left-1/3 w-1 h-1 bg-purple-300 rounded-full animate-pulse"></div>
            <div className="absolute bottom-40 right-1/4 w-1 h-1 bg-pink-300 rounded-full animate-pulse"></div>
            <div className="absolute bottom-60 left-1/4 w-1 h-1 bg-yellow-300 rounded-full animate-pulse"></div>
            {/* Larger glowing orbs */}
            <div className="absolute top-1/4 right-1/3 w-8 h-8 bg-gradient-to-r from-purple-500/40 to-pink-500/40 rounded-full blur-sm animate-pulse"></div>
            <div className="absolute bottom-1/3 left-1/4 w-6 h-6 bg-gradient-to-r from-blue-500/40 to-cyan-500/40 rounded-full blur-sm animate-pulse"></div>
          </div>
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">Cosmic Infinity</h2>
            <p className="text-xl text-white/80 mb-12">Reaching for the stars of possibility</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-card bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-8 hover:scale-105 transition-transform duration-300">
                <h3 className="text-2xl font-bold text-white mb-4">🚀 Innovation</h3>
                <p className="text-white/70">Launching ideas into the digital cosmos</p>
              </div>
              <div className="space-card bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-8 hover:scale-105 transition-transform duration-300">
                <h3 className="text-2xl font-bold text-white mb-4">⭐ Excellence</h3>
                <p className="text-white/70">Stellar performance across all dimensions</p>
              </div>
            </div>
          </div>
        </section>

                                   {/* Letter Reveal Demo Section */}
          <section className="py-20 px-6 text-center relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-6">Letter Reveal</h2>
              <p className="text-white/60 mb-8">
                Experience the sequential left-to-right letter reveal effect
              </p>
                             <div className="space-y-4 mb-8">
                 <LetterReveal 
                   text="Typewriter Letter Animation"
                   className="text-2xl font-bold text-green-400"
                   delay={0.5}
                   stagger={0.08}
                   typewriterEffect={true}
                   cursorBlink={true}
                 />
                 <LetterReveal 
                   text="Non-typewriter Effect"
                   className="text-xl font-bold text-blue-400"
                   delay={1.5}
                   stagger={0.06}
                   typewriterEffect={false}
                   cursorBlink={false}
                 />
               </div>
              <button 
                onClick={() => setShowModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 cursor-pointer"
              >
                Open Magic Modal
              </button>
            </div>
          </section>

         {/* Modal Reveal Section */}
         <section className="py-20 px-6 text-center relative">
           <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
           <div className="relative z-10 max-w-4xl mx-auto">
             <h2 className="text-3xl font-bold text-white mb-6">Modal Reveal Animations</h2>
             <p className="text-white/60 mb-8">
               Experience different types of modal reveal animations with staggered text effects
             </p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
               <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300">
                 <h3 className="text-xl font-bold text-white mb-4">Letter Reveal</h3>
                 <p className="text-white/70 mb-4">Each character appears individually with typewriter effect</p>
                 <button 
                   onClick={() => setActiveModalReveal('letter')}
                   className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
                 >
                   Try Letter Reveal
                 </button>
               </div>
               
               <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300">
                 <h3 className="text-xl font-bold text-white mb-4">Word Reveal</h3>
                 <p className="text-white/70 mb-4">Words appear one by one with smooth transitions</p>
                 <button 
                   onClick={() => setActiveModalReveal('word')}
                   className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                 >
                   Try Word Reveal
                 </button>
               </div>
               
               <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300">
                 <h3 className="text-xl font-bold text-white mb-4">Line Reveal</h3>
                 <p className="text-white/70 mb-4">Entire text appears with blur-to-clear effect</p>
                 <button 
                   onClick={() => setActiveModalReveal('line')}
                   className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-300"
                 >
                   Try Line Reveal
                 </button>
               </div>
               
               <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300">
                 <h3 className="text-xl font-bold text-white mb-4">Fade Reveal</h3>
                 <p className="text-white/70 mb-4">Simple and elegant fade-in effect</p>
                 <button 
                   onClick={() => setActiveModalReveal('fade')}
                   className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-300"
                 >
                   Try Fade Reveal
                 </button>
               </div>
             </div>
           </div>
         </section>

         {/* Premium Components Showcase */}
         <section className="py-20 px-6 text-center relative">
           <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
           <div className="relative z-10 max-w-6xl mx-auto">
             <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">Premium React Components</h2>
             <p className="text-white/60 mb-12 text-lg">
               Advanced components with sophisticated animations and interactions
             </p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
               {/* Text Animation Components */}
               <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                 <h3 className="text-xl font-bold text-white mb-4">Text Animation Components</h3>
                 <ul className="text-white/70 space-y-2 text-left">
                   <li>• BouncyLetters</li>
                   <li>• LetterReveal</li>
                   <li>• MagicLine</li>
                   <li>• EnhancedTextReveal</li>
                   <li>• BlurTextReveal</li>
                   <li>• ModalReveal</li>
                 </ul>
               </div>
               
               {/* AI Components */}
               <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                 <h3 className="text-xl font-bold text-white mb-4">AI & Assistant Components</h3>
                 <ul className="text-white/70 space-y-2 text-left">
                   <li>• DynamicIslandAIAgent</li>
                   <li>• UniversalAIAgent</li>
                   <li>• ElevenLabsAIAssistant</li>
                   <li>• AIAssistant</li>
                   <li>• AIGame</li>
                   <li>• AITeachingAssistantCard</li>
                   <li>• AITeachingAssistantModal</li>
                   <li>• AIDemoSection</li>
                 </ul>
               </div>
               
               {/* Game Components */}
               <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                 <h3 className="text-xl font-bold text-white mb-4">Game & Interactive Components</h3>
                 <ul className="text-white/70 space-y-2 text-left">
                   <li>• GameWrapper</li>
                   <li>• GameModal</li>
                   <li>• GameInfoModal</li>
                   <li>• PlaygroundModalReveal</li>
                   <li>• FullscreenPopper</li>
                   <li>• SequentialVideoScrubber</li>
                 </ul>
               </div>
               
               {/* UI Components */}
               <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                 <h3 className="text-xl font-bold text-white mb-4">UI & Layout Components</h3>
                 <ul className="text-white/70 space-y-2 text-left">
                   <li>• Header</li>
                   <li>• Footer</li>
                   <li>• ProfileCard</li>
                   <li>• TaskManager</li>
                   <li>• StudyCalendar</li>
                   <li>• Calendar</li>
                   <li>• Diary</li>
                   <li>• ContactForm</li>
                 </ul>
               </div>
               
               {/* Modal Components */}
               <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                 <h3 className="text-xl font-bold text-white mb-4">Modal & Form Components</h3>
                 <ul className="text-white/70 space-y-2 text-left">
                   <li>• LoginModal</li>
                   <li>• SignUpModal</li>
                   <li>• SignUpChoiceModal</li>
                   <li>• RegularSignUpModal</li>
                   <li>• ErrorBoundary</li>
                 </ul>
               </div>
               
               {/* Background Components */}
               <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                 <h3 className="text-xl font-bold text-white mb-4">Background & Visual Components</h3>
                 <ul className="text-white/70 space-y-2 text-left">
                   <li>• InteractiveHero</li>
                   <li>• FastHeroBackground</li>
                   <li>• MutedPlasmaBackground</li>
                   <li>• OptimizedPlasmaBackground</li>
                   <li>• PlasmaBackground</li>
                   <li>• PlasmaBackgroundWithFallback</li>
                   <li>• ProgressiveHeroBackground</li>
                   <li>• PlasmaHeroPerformance</li>
                   <li>• MarginParallax</li>
                   <li>• PlasmaBall</li>
                   <li>• PremiumStar</li>
                 </ul>
               </div>
               
               {/* Example Components */}
               <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                 <h3 className="text-xl font-bold text-white mb-4">Example & Demo Components</h3>
                 <ul className="text-white/70 space-y-2 text-left">
                   <li>• TextRevealExample</li>
                   <li>• LetterRevealExample</li>
                   <li>• MagicLineExample</li>
                   <li>• ModalRevealDemo</li>
                   <li>• BlurTextRevealExample</li>
                   <li>• EnhancedTextRevealExample</li>
                   <li>• EnhancedTextRevealModal</li>
                   <li>• CardRevealExample</li>
                 </ul>
               </div>
               
               {/* Special Components */}
               <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                 <h3 className="text-xl font-bold text-white mb-4">Special Components</h3>
                 <ul className="text-white/70 space-y-2 text-left">
                   <li>• CardReveal</li>
                   <li>• DashboardScript</li>
                 </ul>
               </div>
             </div>
             
             <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
               <h3 className="text-2xl font-bold text-white mb-4">Component Categories</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                 <div>
                   <h4 className="text-lg font-semibold text-purple-300 mb-3">Animation & Effects</h4>
                   <p className="text-white/70">Advanced text animations, reveal effects, and interactive visual components</p>
                 </div>
                 <div>
                   <h4 className="text-lg font-semibold text-blue-300 mb-3">AI & Intelligence</h4>
                   <p className="text-white/70">AI-powered assistants, teaching tools, and intelligent game components</p>
                 </div>
                 <div>
                   <h4 className="text-lg font-semibold text-green-300 mb-3">User Interface</h4>
                   <p className="text-white/70">Modern UI components, forms, modals, and layout elements</p>
                 </div>
                 <div>
                   <h4 className="text-lg font-semibold text-pink-300 mb-3">Background & Visual</h4>
                   <p className="text-white/70">Plasma effects, hero backgrounds, and immersive visual experiences</p>
                 </div>
               </div>
             </div>
           </div>
         </section>

         {/* Final Section */}
         <section className="py-20 px-6 text-center relative">
           <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
           <div className="relative z-10 max-w-2xl mx-auto">
             <h2 className="text-3xl font-bold text-white mb-6">Journey Complete</h2>
             <p className="text-white/60 mb-8">
               Experience the beauty of sequential parallax without heavy rendering
             </p>
             <div className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl text-white font-semibold inline-block">
               ✅ Optimized & Beautiful
             </div>
           </div>
         </section>
      </div>

             {/* Scroll indicator */}
       <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 animate-bounce pointer-events-none">
         <div className="flex flex-col items-center">
           <span className="text-sm mb-2">Scroll to explore</span>
           <div className="w-6 h-10 border-2 border-white/60 rounded-full flex justify-center">
             <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
           </div>
         </div>
       </div>

       {/* Magic Modal */}
       {showModal && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
           <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl p-8 max-w-2xl w-full border border-white/20 shadow-2xl">
             <div className="text-center space-y-6">
                               <MagicLine 
                  text="✨ Magic Line ✨"
                  className="text-3xl font-bold text-white mb-4"
                  delay={0.3}
                  duration={1.5}
                  blurAmount={15}
                />
                
                <MagicLine 
                  text="Welcome to the enchanted realm"
                  className="text-xl text-white/80 mb-4"
                  delay={0.8}
                  duration={1.2}
                  blurAmount={12}
                />
                
                <MagicLine 
                  text="Where text appears like magic"
                  className="text-lg text-white/60 mb-6"
                  delay={1.3}
                  duration={1.0}
                  blurAmount={10}
                />
                
                <div className="space-y-4">
                  <MagicLine 
                    text="🌟 Soft blur transitions"
                    className="text-lg text-purple-300"
                    delay={1.8}
                    duration={0.8}
                    blurAmount={8}
                  />
                  
                  <MagicLine 
                    text="🎨 Beautiful animations"
                    className="text-lg text-blue-300"
                    delay={2.1}
                    duration={0.8}
                    blurAmount={8}
                  />
                  
                  <MagicLine 
                    text="✨ Magical effects"
                    className="text-lg text-pink-300"
                    delay={2.4}
                    duration={0.8}
                    blurAmount={8}
                  />
                </div>
               
               <button 
                 onClick={() => setShowModal(false)}
                 className="mt-8 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
               >
                 Close Magic
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Modal Reveal Components */}
       <ModalReveal
         isOpen={activeModalReveal === 'letter'}
         onClose={() => setActiveModalReveal(null)}
         title="Letter Reveal Animation"
         revealType="letter"
         typewriterEffect={true}
         cursorBlink={true}
         stagger={0.08}
         duration={1.2}
         delay={0.3}
       >
         <div className="space-y-6">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
               <span className="text-white font-bold">L</span>
             </div>
             <h3 className="text-xl font-bold text-white">Letter-by-Letter Magic</h3>
           </div>
           <p className="text-white/80 leading-relaxed">
             Watch as each character gracefully appears with a beautiful staggered animation. 
             This creates a mesmerizing typewriter effect that draws attention to your content.
           </p>
           <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/10 rounded-lg p-4">
               <h4 className="font-semibold text-white mb-2">Features</h4>
               <ul className="text-white/70 text-sm space-y-1">
                 <li>• Individual letter animation</li>
                 <li>• Typewriter cursor effect</li>
                 <li>• Smooth stagger timing</li>
                 <li>• Bounce effect on completion</li>
               </ul>
             </div>
             <div className="bg-white/10 rounded-lg p-4">
               <h4 className="font-semibold text-white mb-2">Use Cases</h4>
               <ul className="text-white/70 text-sm space-y-1">
                 <li>• Welcome messages</li>
                 <li>• Feature announcements</li>
                 <li>• Interactive storytelling</li>
                 <li>• Attention-grabbing titles</li>
               </ul>
             </div>
           </div>
         </div>
       </ModalReveal>

       <ModalReveal
         isOpen={activeModalReveal === 'word'}
         onClose={() => setActiveModalReveal(null)}
         title="Word Reveal Animation"
         revealType="word"
         typewriterEffect={false}
         cursorBlink={false}
         stagger={0.15}
         duration={1.2}
         delay={0.3}
       >
         <div className="space-y-6">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
               <span className="text-white font-bold">W</span>
             </div>
             <h3 className="text-xl font-bold text-white">Word-by-Word Elegance</h3>
           </div>
           <p className="text-white/80 leading-relaxed">
             Experience the smooth flow of words appearing in sequence. 
             This creates a natural reading rhythm that guides the user's attention.
           </p>
           <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-6 border border-white/20">
             <h4 className="font-semibold text-white mb-3">Animation Benefits</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <h5 className="text-purple-300 font-medium mb-2">Reading Flow</h5>
                 <p className="text-white/70 text-sm">Natural progression that matches reading patterns</p>
               </div>
               <div>
                 <h5 className="text-blue-300 font-medium mb-2">Visual Hierarchy</h5>
                 <p className="text-white/70 text-sm">Emphasizes important words and phrases</p>
               </div>
             </div>
           </div>
         </div>
       </ModalReveal>

       <ModalReveal
         isOpen={activeModalReveal === 'line'}
         onClose={() => setActiveModalReveal(null)}
         title="Line Reveal Animation"
         revealType="line"
         typewriterEffect={false}
         cursorBlink={false}
         stagger={0.1}
         blurAmount={20}
         duration={1.2}
         delay={0.3}
       >
         <div className="space-y-6">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
               <span className="text-white font-bold">L</span>
             </div>
             <h3 className="text-xl font-bold text-white">Line Magic Effect</h3>
           </div>
           <p className="text-white/80 leading-relaxed">
             Watch as the entire text transforms from blurred to crystal clear. 
             This creates a dramatic reveal that's perfect for important announcements.
           </p>
           <div className="space-y-4">
             <div className="bg-white/10 rounded-lg p-4">
               <h4 className="font-semibold text-white mb-2">Effect Stages</h4>
               <div className="space-y-2 text-sm text-white/70">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                   <span>Initial blur state</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                   <span>Gradual clarity</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                   <span>Glow effect</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                   <span>Final clear state</span>
                 </div>
               </div>
             </div>
           </div>
         </div>
       </ModalReveal>

       <ModalReveal
         isOpen={activeModalReveal === 'fade'}
         onClose={() => setActiveModalReveal(null)}
         title="Fade Reveal Animation"
         revealType="fade"
         typewriterEffect={false}
         cursorBlink={false}
         stagger={0.05}
         duration={1.2}
         delay={0.3}
       >
         <div className="space-y-6">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
               <span className="text-white font-bold">F</span>
             </div>
             <h3 className="text-xl font-bold text-white">Elegant Fade</h3>
           </div>
           <p className="text-white/80 leading-relaxed">
             A clean and professional fade-in animation that's perfect for any content. 
             Simple yet effective for maintaining focus on your message.
           </p>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-white/10 rounded-lg p-4 text-center">
               <div className="w-6 h-6 bg-green-500/20 rounded-full mx-auto mb-2"></div>
               <h5 className="font-medium text-white text-sm">Professional</h5>
               <p className="text-white/60 text-xs">Clean and business-ready</p>
             </div>
             <div className="bg-white/10 rounded-lg p-4 text-center">
               <div className="w-6 h-6 bg-blue-500/20 rounded-full mx-auto mb-2"></div>
               <h5 className="font-medium text-white text-sm">Accessible</h5>
               <p className="text-white/60 text-xs">Works for all users</p>
             </div>
             <div className="bg-white/10 rounded-lg p-4 text-center">
               <div className="w-6 h-6 bg-yellow-500/20 rounded-full mx-auto mb-2"></div>
               <h5 className="font-medium text-white text-sm">Reliable</h5>
               <p className="text-white/60 text-xs">Consistent performance</p>
             </div>
           </div>
         </div>
       </ModalReveal>
     </div>
   );
 };

export default TestPage;
