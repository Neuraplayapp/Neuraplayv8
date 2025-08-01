import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Target, Sparkles, Star, Heart, Trophy, Zap, Users, BookOpen, Gamepad2, ChevronDown, UserPlus, X, Shield, Award, Clock } from 'lucide-react';
import PlasmaHeroPerformance from '../components/PlasmaHeroPerformance';
import Footer from '../components/Footer';
import BouncyLetters from '../components/BouncyLetters';
import LetterReveal from '../components/LetterReveal';
import SignUpChoiceModal from '../components/SignUpChoiceModal';
import SignUpModal from '../components/SignUpModal';
import RegularSignUpModal from '../components/RegularSignUpModal';
import LoginModal from '../components/LoginModal';
import { useTheme } from '../contexts/ThemeContext';

// Use the globally loaded GSAP from CDN
declare const gsap: any;
declare const ScrollTrigger: any;

const SmoothScrollSection = ({ children, className = "", ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => {
    return (
        <section className={`min-h-screen w-full ${className}`} {...props}>
            {children}
        </section>
    );
};

const HomePage: React.FC = () => {
    const [currentSection, setCurrentSection] = useState(0);
    const [activeFeature, setActiveFeature] = useState(0);
    const [showSignUpModal, setShowSignUpModal] = useState(false);
    const [showRegularSignUpModal, setShowRegularSignUpModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const navigate = useNavigate();
    const scrollElementRef = useRef<HTMLDivElement>(null);
    const { isDarkMode, getThemeConfig } = useTheme();

    const sections = [
        { id: 'hero', title: 'Hero' },
        { id: 'features', title: 'Features' },
        { id: 'videos', title: 'Videos' },
        { id: 'content', title: 'Content' },
        { id: 'cta', title: 'Call to Action' },
        { id: 'releases', title: 'Releases' }
    ];

    useEffect(() => {
        // Simplified GSAP ScrollTrigger animations
        if (typeof gsap !== 'undefined' && gsap.registerPlugin) {
            gsap.registerPlugin(ScrollTrigger);

            // Simplified hero parallax
            const heroScene = gsap.timeline();
            ScrollTrigger.create({
                animation: heroScene,
                trigger: "#hero",
                start: "top top",
                end: "bottom top",
                scrub: 1
            });

            heroScene.to(".hero-content", { y: -50, opacity: 0.9 }, 0);

            // Simplified Features section - gentle fade in
            const featuresAnimation = gsap.timeline();
            
            gsap.set(".feature-card", {
                y: 30,
                opacity: 0
            });
            
            featuresAnimation.to(".feature-card", {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.2,
                ease: "power2.out"
            });
            
            ScrollTrigger.create({
                animation: featuresAnimation,
                trigger: "#features",
                start: "top 80%",
                end: "bottom 20%",
                toggleActions: "play none none none"
            });

            // Simplified Videos section
            const videosAnimation = gsap.timeline();
            
            gsap.set("#videos .video-card", {
                y: 40,
                opacity: 0
            });
            
            videosAnimation.to("#videos .video-card", {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.3,
                ease: "power2.out"
            });
            
            ScrollTrigger.create({
                animation: videosAnimation,
                trigger: "#videos",
                start: "top 80%",
                end: "bottom 20%",
                toggleActions: "play none none none"
            });
            
            // Simplified Content section
            const contentAnimation = gsap.timeline();
            
            gsap.set(".content-card", {
                y: 30,
                opacity: 0
            });
            
            contentAnimation.to(".content-card", {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.2,
                ease: "power2.out"
            });
            
            ScrollTrigger.create({
                animation: contentAnimation,
                trigger: "#content",
                start: "top 75%",
                end: "bottom 25%",
                toggleActions: "play none none none"
            });

            // Simplified CTA section
            const ctaAnimation = gsap.timeline();
            
            gsap.set("#cta .cta-element", {
                y: 30,
                opacity: 0
            });
            
            ctaAnimation.to("#cta .cta-element", {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.2,
                ease: "power2.out"
            });
            
            ScrollTrigger.create({
                animation: ctaAnimation,
                trigger: "#cta",
                start: "top 75%",
                end: "bottom 25%",
                toggleActions: "play none none none"
            });
            
            // Simplified Releases section
            const releasesAnimation = gsap.timeline();
            
            gsap.set(".release-card", {
                y: 30,
                opacity: 0
            });
            
            releasesAnimation.to(".release-card", {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.15,
                ease: "power2.out"
            });
            
            ScrollTrigger.create({
                animation: releasesAnimation,
                trigger: "#releases",
                start: "top 70%",
                end: "bottom 30%",
                toggleActions: "play none none none"
            });

            return () => {
                ScrollTrigger.getAll().forEach((trigger: any) => trigger.kill());
            };
        }
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const windowHeight = window.innerHeight;
            const currentSection = Math.floor(scrollTop / windowHeight);
            setCurrentSection(currentSection);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const features = [
        {
            id: 'neuro',
            title: 'Neuro-psychological teaching methods',
            description: 'Every game, story, and challenge is built upon proven neuropsychological principles that target specific cognitive skills. Our platform adapts to your child\'s unique learning style, ensuring optimal brain development.',
            icon: <Brain className="w-8 h-8 text-purple-600" />
        },
        {
            id: 'tailored',
            title: 'Tailor-made for the learner',
            description: 'Our adaptive AI creates personalized learning paths that evolve with your child\'s progress. Each experience is carefully crafted to match their cognitive profile and learning pace.',
            icon: <Target className="w-8 h-8 text-purple-600" />
        },
        {
            id: 'montessori',
            title: 'The Montessori approach',
            description: 'Inspired by Montessori principles, our platform encourages self-directed learning and discovery. Children explore concepts at their own pace, building confidence and independence.',
            icon: <Sparkles className="w-8 h-8 text-purple-600" />
        }
    ];

    const globalStyles = `
        html {
            scroll-behavior: smooth;
        }
        
        ::-webkit-scrollbar {
            width: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: rgba(15, 23, 42, 0.1);
        }
        
        ::-webkit-scrollbar-thumb {
            background: linear-gradient(45deg, #8b5cf6, #3b82f6);
            border-radius: 4px;
        }
        
        /* Simplified animations */
        .fade-in-up {
            animation: fadeInUp 0.8s ease-out forwards;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .slide-in-left {
            animation: slideInLeft 0.8s ease-out forwards;
        }
        
        @keyframes slideInLeft {
            from {
                opacity: 0;
                transform: translateX(-30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        .slide-in-right {
            animation: slideInRight 0.8s ease-out forwards;
        }
        
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        /* Simplified hover effects */
        .enhanced-hover {
            transition: all 0.3s ease;
        }
        
        .enhanced-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .card-glow {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.1);
            transition: box-shadow 0.3s ease;
        }
        
        .card-glow:hover {
            box-shadow: 0 0 30px rgba(139, 92, 246, 0.2);
        }
        
        .gradient-text {
            background: linear-gradient(45deg, #8b5cf6, #3b82f6, #06b6d4);
            background-size: 200% 200%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: gradientShift 3s ease infinite;
        }
        
        @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        
        .hero-full-width {
            width: 100vw;
            margin-left: calc(-50vw + 50%);
            margin-right: calc(-50vw + 50%);
        }
        
        /* Parent-minded spacing */
        .section-spacing {
            padding: 6rem 0;
        }
        
        .content-spacing {
            padding: 4rem 0;
        }
        
        .card-spacing {
            padding: 2rem;
            margin: 1rem 0;
        }
    `;

    return (
        <>
            <style>{globalStyles}</style>
            
            <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-[9998] space-y-4">
                {sections.map((section, index) => (
                    <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            currentSection === index 
                                ? 'bg-purple-500 scale-125' 
                                : 'bg-white/30 hover:bg-white/50'
                        }`}
                        title={section.title}
                    />
                ))}
            </div>

            <div ref={scrollElementRef} className="relative z-20">
                <SmoothScrollSection id="hero" className="relative flex items-center justify-center text-white hero-full-width">
                <PlasmaHeroPerformance className="absolute inset-0 z-10" />
                <div className="hero-content relative z-20 text-center px-6 max-w-6xl text-animation-container">
                    <div className="mb-12 fade-in-up">
                        <BouncyLetters 
                            text="Your Child is a Genius"
                            className="text-6xl md:text-8xl font-black leading-tight tracking-tighter mb-8 gradient-text"
                            delay={0.1}
                            stagger={0.08}
                            duration={0.7}
                            bounceHeight={-150}
                            initialScale={0.6}
                            initialRotation={-10}
                            triggerOnScroll={false}
                        />
                        <LetterReveal 
                            text="unlock the potential of your child - through AI and psychology"
                            className="text-2xl md:text-3xl max-w-4xl mx-auto text-white/90 leading-relaxed"
                            delay={1.2}
                            stagger={0.04}
                            duration={0.3}
                            typewriterEffect={true}
                            cursorBlink={false}
                        />
                    </div>
                    
                    {/* Mascot - Flying in after text */}
                    <div className="mb-8 fade-in-up">
                        <div className="flex justify-center mb-6">
                            <img 
                                src="/assets/images/Mascot.png" 
                                alt="NeuraPlay Mascot" 
                                className="w-24 h-24 md:w-32 md:h-32 object-contain"
                                loading="eager"
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-5xl mx-auto">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 enhanced-hover slide-in-left" style={{animationDelay: '0.2s'}}>
                            <Zap className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
                            <h3 className="font-bold text-xl mb-2">Smart Learning</h3>
                            <p className="text-white/80">AI-powered adaptive education</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 enhanced-hover" style={{animationDelay: '0.4s'}}>
                            <Users className="w-10 h-10 text-purple-400 mx-auto mb-4" />
                            <h3 className="font-bold text-xl mb-2">Family Focused</h3>
                            <p className="text-white/80">Progress tracking for parents</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 enhanced-hover slide-in-right" style={{animationDelay: '0.6s'}}>
                            <Gamepad2 className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                            <h3 className="font-bold text-xl mb-2">Fun Games</h3>
                            <p className="text-white/80">Engaging cognitive challenges</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                        <button 
                            onClick={() => navigate('/about')} 
                            className="bg-white font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-all duration-300 text-lg text-purple-600 enhanced-hover"
                        >
                            What is neuraplay?
                        </button>
                        <button 
                            onClick={() => setShowSignUpModal(true)} 
                            className="bg-gradient-to-r from-violet-600 to-purple-600 font-bold px-8 py-4 rounded-full hover:from-violet-700 hover:to-purple-700 transition-all duration-300 text-lg text-white enhanced-hover flex items-center gap-2"
                        >
                            <UserPlus className="w-5 h-5" />
                            Sign Up
                        </button>
                        <button 
                            onClick={() => navigate('/forum')} 
                            className="bg-white/20 backdrop-blur-sm font-bold px-8 py-4 rounded-full hover:bg-white/30 transition-all duration-300 text-lg text-white border-2 border-white/30 enhanced-hover"
                        >
                            Forum
                        </button>
                        <button 
                            onClick={() => navigate('/about')} 
                            className="bg-white/20 backdrop-blur-sm font-bold px-8 py-4 rounded-full hover:bg-white/30 transition-all duration-300 text-lg text-white border-2 border-white/30 enhanced-hover"
                        >
                            About Us
                        </button>
                    </div>
                </div>
                
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                    <ChevronDown className="w-8 h-8 text-white/70" />
                </div>
            </SmoothScrollSection>
            </div>

            <main className="main-content" style={{position: 'relative', zIndex: 20}}>
                <SmoothScrollSection id="features" className="section-spacing flex items-center justify-center" style={{
                  background: isDarkMode 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #312e81 100%)'
                    : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)'
                }}>
                    <div className="container mx-auto max-w-6xl px-6">
                        <div className="text-center mb-20">
                            <BouncyLetters 
                                text="An investment in their future is priceless"
                                className="text-5xl md:text-6xl font-bold mb-8 gradient-text"
                                delay={0.1}
                                stagger={0.05}
                                duration={0.6}
                                bounceHeight={-100}
                                initialScale={0.8}
                                initialRotation={-5}
                                triggerOnScroll={true}
                            />
                            <LetterReveal 
                                text="Give your child the tools they need to succeed in a rapidly evolving world"
                                className="text-xl text-gray-200 max-w-3xl mx-auto"
                                delay={1.5}
                                stagger={0.03}
                                duration={0.4}
                                typewriterEffect={true}
                                cursorBlink={false}
                            />
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div>
                                <BouncyLetters 
                                    text="A whole new way to learn"
                                    className="text-4xl font-bold text-white mb-8"
                                    delay={2.5}
                                    stagger={0.05}
                                    duration={0.6}
                                    bounceHeight={-80}
                                    initialScale={0.9}
                                    initialRotation={-3}
                                    triggerOnScroll={true}
                                />
                                <div className="space-y-6">
                                    {features.map((feature, index) => (
                                        <button 
                                            key={feature.id} 
                                            onClick={() => setActiveFeature(index)} 
                                            className={`feature-card w-full p-6 rounded-2xl text-left transition-all duration-300 enhanced-hover border-2 ${
                                                activeFeature === index 
                                                    ? 'text-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.4)] bg-gradient-to-r from-purple-600 to-blue-600 border-purple-500' 
                                                    : isDarkMode
                                                        ? 'bg-white/10 backdrop-blur-sm text-white border-white/20 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_35px_60px_-15px_rgba(0,0,0,0.4)] hover:border-purple-500'
                                                        : 'bg-white text-gray-800 border-gray-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] hover:border-purple-500'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`${activeFeature === index ? 'text-white' : isDarkMode ? 'text-white' : 'text-gray-600'}`}>
                                                    {feature.icon}
                                                </div>
                                                <span className={`font-semibold text-lg ${activeFeature === index ? 'text-white' : isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                                    {feature.title}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className={`p-8 rounded-3xl shadow-2xl border-3 min-h-[400px] enhanced-hover ${
                                isDarkMode 
                                    ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)]'
                                    : 'bg-white border-gray-200 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)]'
                            }`}>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={isDarkMode ? 'text-white' : 'text-gray-600'}>{features[activeFeature].icon}</div>
                                    <h4 className={`font-bold text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{features[activeFeature].title}</h4>
                                </div>
                                <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>{features[activeFeature].description}</p>
                            </div>
                        </div>
                    </div>
                </SmoothScrollSection>

                <SmoothScrollSection id="videos" className={`section-spacing flex items-center justify-center ${
                    isDarkMode 
                        ? 'bg-gradient-to-br from-purple-900 to-indigo-900'
                        : 'bg-gradient-to-br from-blue-50 to-indigo-50'
                }`}>
                    <div className="container mx-auto max-w-7xl px-6">
                        <div className="text-center mb-20">
                            <BouncyLetters 
                                text="Discover Neuraplay"
                                className="text-5xl md:text-6xl font-bold mb-8 gradient-text"
                                delay={0.1}
                                stagger={0.05}
                                duration={0.6}
                                bounceHeight={-100}
                                initialScale={0.8}
                                initialRotation={-5}
                                triggerOnScroll={true}
                            />
                            <LetterReveal 
                                text="Embark on a journey where neuroscience meets play. Every game is a step toward unlocking your child's limitless potential."
                                className="text-xl text-gray-200 max-w-4xl mx-auto"
                                delay={0.8}
                                stagger={0.03}
                                duration={0.4}
                                typewriterEffect={true}
                                cursorBlink={false}
                            />
                        </div>
                        
                        <div className="grid lg:grid-cols-2 gap-16">
                            <div className="video-card bg-gray-900 rounded-3xl shadow-2xl overflow-hidden enhanced-hover shadow-[0_40px_80px_-20px_rgba(139,92,246,0.3)] border-2 border-purple-600">
                                <div className="p-10">
                                    <video 
                                        src="/assets/Videos/neuraplayintrovid1.mp4" 
                                        playsInline 
                                        controls
                                        preload="metadata"
                                        className="w-full h-full object-cover rounded-2xl shadow-xl" 
                                    />
                                </div>
                                <div className="p-10 bg-gradient-to-r from-gray-800 to-gray-900">
                                    <h3 className="text-3xl font-bold mb-4 text-white">Welcome to Neuraplay</h3>
                                    <p className="text-lg text-gray-200 leading-relaxed">Step into a world where learning becomes an adventure. Discover how our neuroscience-based approach transforms education.</p>
                                </div>
                            </div>
                            
                            <div className="video-card bg-gray-900 rounded-3xl shadow-2xl overflow-hidden enhanced-hover shadow-[0_40px_80px_-20px_rgba(139,92,246,0.4)] border-2 border-purple-600">
                                <div className="p-10">
                                    <video 
                                        src="/assets/Videos/Neuraplayintrovid3.mp4" 
                                        playsInline 
                                        controls
                                        preload="metadata"
                                        className="w-full h-full object-cover rounded-2xl shadow-xl" 
                                    />
                                </div>
                                <div className="p-10 bg-gradient-to-r from-gray-800 to-gray-900">
                                    <h3 className="text-3xl font-bold mb-4 text-white">The Neuraplay Experience</h3>
                                    <p className="text-lg text-gray-200 leading-relaxed">Witness the magic of personalized learning in action. See how our platform adapts to each child's unique cognitive profile.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </SmoothScrollSection>

                <SmoothScrollSection id="content" className="content-spacing bg-white flex items-center justify-center">
                    <div className="container mx-auto max-w-6xl px-6">
                        <div className="text-center mb-16">
                            <BouncyLetters 
                                text="New Releases"
                                className="text-5xl md:text-6xl font-bold mb-4 gradient-text"
                                delay={0.1}
                                stagger={0.05}
                                duration={0.6}
                                bounceHeight={-100}
                                initialScale={0.8}
                                initialRotation={-5}
                                triggerOnScroll={true}
                            />
                            <LetterReveal 
                                text="Discover our latest games and features designed to enhance cognitive development"
                                className="text-xl text-gray-600 max-w-4xl mx-auto"
                                delay={0.8}
                                stagger={0.03}
                                duration={0.4}
                                typewriterEffect={true}
                                cursorBlink={false}
                            />
                        </div>
                        
                        <div className="grid lg:grid-cols-3 gap-8 mb-16">
                            <div className="content-card rounded-3xl shadow-2xl overflow-hidden enhanced-hover bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-[0_50px_100px_-25px_rgba(0,0,0,0.5)] border-2 border-purple-300">
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-2xl font-bold">🧩 The Cube</h3>
                                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">NEW</span>
                                    </div>
                                    <p className="text-white/90 mb-6 leading-relaxed">
                                        Advanced 3D Rubik's Cube with real-time cognitive tracking. Targets 22 neuropsychological concepts.
                                    </p>
                                    <Link to="/playground" className="inline-block bg-white font-bold px-6 py-3 rounded-full hover:bg-gray-100 transition-colors text-purple-600">
                                        Try The Cube
                                    </Link>
                                </div>
                            </div>

                            <div className="content-card rounded-3xl shadow-2xl overflow-hidden enhanced-hover bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-[0_50px_100px_-25px_rgba(0,0,0,0.5)] border-2 border-purple-300">
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-2xl font-bold">🤖 Enhanced AI</h3>
                                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">UPDATED</span>
                                    </div>
                                    <p className="text-white/90 mb-6 leading-relaxed">
                                        Upgraded AI assistant with voice capabilities, multi-language support, and personalized learning recommendations.
                                    </p>
                                    <Link to="/ai-assistant" className="inline-block bg-white font-bold px-6 py-3 rounded-full hover:bg-gray-100 transition-colors text-blue-600">
                                        Meet Synapse
                                    </Link>
                                </div>
                            </div>

                            <div className="content-card rounded-3xl shadow-2xl overflow-hidden enhanced-hover bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-[0_50px_100px_-25px_rgba(0,0,0,0.5)] border-2 border-purple-300">
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-2xl font-bold">📊 Analytics</h3>
                                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">ENHANCED</span>
                                    </div>
                                    <p className="text-white/90 mb-6 leading-relaxed">
                                        Comprehensive cognitive development tracking with detailed progress reports and performance analytics.
                                    </p>
                                    <Link to="/ai-report" className="inline-block bg-white font-bold px-6 py-3 rounded-full hover:bg-gray-100 transition-colors text-pink-600">
                                        View Reports
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </SmoothScrollSection>

                <SmoothScrollSection id="cta" className="section-spacing bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white">
                    <div className="container mx-auto max-w-6xl text-center px-6">
                        <div className="mb-16">
                            <BouncyLetters 
                                text="Ready to unlock your child's potential?"
                                className="text-5xl md:text-6xl font-bold mb-8"
                                delay={0}
                                stagger={0.02}
                                duration={0.4}
                                bounceHeight={-40}
                                initialScale={0.9}
                                initialRotation={-3}
                                triggerOnScroll={true}
                            />
                            <LetterReveal 
                                text="Join thousands of parents who trust Neuraplay for their child's cognitive development"
                                className="text-xl md:text-2xl text-white/90 max-w-5xl mx-auto mb-12 leading-relaxed"
                                delay={0.6}
                                stagger={0.01}
                                duration={0.3}
                                typewriterEffect={true}
                                cursorBlink={false}
                            />
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-8 justify-center items-center mb-16">
                            <Link 
                                to="/registration" 
                                className="cta-element bg-white font-bold px-12 py-6 rounded-full hover:bg-gray-100 transition-all duration-300 text-xl text-purple-600 enhanced-hover"
                            >
                                Start Full Journey
                            </Link>
                            <Link 
                                to="/forum-registration" 
                                className="cta-element text-white font-bold px-12 py-6 rounded-full hover:bg-white/20 transition-all duration-300 border-2 border-white/30 text-xl bg-white/20 enhanced-hover"
                            >
                                Join Community
                            </Link>
                        </div>
                        
                        <div className="flex justify-center items-center gap-12 text-white/80">
                            <div className="flex items-center gap-3">
                                <Trophy className="w-8 h-8 text-yellow-300" />
                                <span className="text-lg">Proven Results</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Users className="w-8 h-8 text-purple-300" />
                                <span className="text-lg">Join a growing family with more than ever active users!</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <BookOpen className="w-8 h-8 text-blue-300" />
                                <span className="text-lg">Science-Based</span>
                            </div>
                        </div>
                    </div>
                </SmoothScrollSection>

                <SmoothScrollSection id="releases" className="section-spacing bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center text-white">
                    <div className="container mx-auto max-w-6xl px-6">
                        <div className="text-center mb-20">
                            <BouncyLetters 
                                text="Coming Soon"
                                className="text-5xl md:text-6xl font-bold mb-8 gradient-text"
                                delay={0.1}
                                stagger={0.05}
                                duration={0.48}
                                bounceHeight={-50}
                                initialScale={0.9}
                                initialRotation={-3}
                                triggerOnScroll={true}
                            />
                            <LetterReveal 
                                text="Exciting new features and experiences on the horizon"
                                className="text-2xl text-white/80 max-w-4xl mx-auto"
                                delay={0.8}
                                stagger={0.03}
                                duration={0.32}
                                typewriterEffect={true}
                                cursorBlink={false}
                            />
                        </div>
                        
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="release-card rounded-2xl p-8 border-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-400 enhanced-hover">
                                <h4 className="text-2xl font-bold mb-4 text-purple-300">Virtual Reality</h4>
                                <p className="text-white/70">Immersive 3D learning experiences</p>
                            </div>
                            <div className="release-card rounded-2xl p-8 border-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-purple-400 enhanced-hover">
                                <h4 className="text-2xl font-bold mb-4 text-blue-300">Social Learning</h4>
                                <p className="text-white/70">Collaborative problem-solving games</p>
                            </div>
                            <div className="release-card rounded-2xl p-8 border-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400 enhanced-hover">
                                <h4 className="text-2xl font-bold mb-4 text-pink-300">Adaptive AI</h4>
                                <p className="text-white/70">Dynamic difficulty adjustment</p>
                            </div>
                            <div className="release-card rounded-2xl p-8 border-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-purple-400 enhanced-hover">
                                <h4 className="text-2xl font-bold mb-4 text-pink-300">Parent Portal</h4>
                                <p className="text-white/70">Comprehensive progress monitoring</p>
                            </div>
                        </div>
                    </div>
                </SmoothScrollSection>
            </main>

            <Footer />

            {/* Sign Up Choice Modal */}
            <SignUpChoiceModal
                isOpen={showSignUpModal}
                onClose={() => setShowSignUpModal(false)}
                onPremiumSignUp={() => {
                    setShowSignUpModal(false);
                    // Navigate to premium sign-up page
                    navigate('/registration');
                }}
                onRegularSignUp={() => {
                    setShowSignUpModal(false);
                    // Show regular sign-up modal
                    setShowRegularSignUpModal(true);
                }}
                onShowLogin={() => {
                    setShowSignUpModal(false);
                    setShowLoginModal(true);
                }}
            />

            {/* Regular Sign Up Modal */}
            <RegularSignUpModal
                isOpen={showRegularSignUpModal}
                onClose={() => setShowRegularSignUpModal(false)}
                onSuccess={() => {
                    console.log('Regular sign up successful!');
                }}
                onShowLogin={() => {
                    setShowRegularSignUpModal(false);
                    setShowLoginModal(true);
                }}
            />

            {/* Login Modal */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onSuccess={() => {
                    console.log('Login successful!');
                }}
                redirectTo="/dashboard"
            />
        </>
    );
};

export default HomePage;