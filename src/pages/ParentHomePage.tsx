import * as React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Brain, Target, Sparkles, Star, Heart, Trophy, Zap, Users, BookOpen, 
  Gamepad2, ChevronDown, UserPlus, X, Shield, Award, Clock, 
  GraduationCap, TrendingUp, Lock, Eye, BarChart3, Smartphone,
  Monitor, Tablet, Globe, Wifi, WifiOff, CheckCircle, AlertCircle,
  ArrowRight, Play, Pause, Volume2, Cpu
} from 'lucide-react';
import Footer from '../components/Footer';
import SignUpChoiceModal from '../components/SignUpChoiceModal';
import SignUpModal from '../components/SignUpModal';
import RegularSignUpModal from '../components/RegularSignUpModal';
import LoginModal from '../components/LoginModal';
import GlassVideoPlayer from '../components/GlassVideoPlayer';
import { useTheme } from '../contexts/ThemeContext';

const GlassCard = ({ children, className = "", ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => {
  return (
    <div 
      className={`backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-3xl shadow-2xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, description, className = "" }: {
  icon: any;
  title: string;
  value: string;
  description: string;
  className?: string;
}) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`p-8 text-center rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:transform hover:scale-105 ${
      isDarkMode 
        ? 'bg-black/40 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)]' 
        : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
    } ${className}`}>
      <div className="flex justify-center mb-6">
        <div className={`p-4 rounded-full border ${
          isDarkMode 
            ? 'bg-purple-500/40 border-purple-400/60' 
            : 'bg-purple-200 border-purple-400'
        }`}>
          <Icon className={`w-10 h-10 ${
            isDarkMode ? 'text-purple-300' : 'text-purple-600'
          }`} />
        </div>
      </div>
      <h3 className={`text-3xl font-bold mb-4 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>{value}</h3>
      <p className={`text-xl font-semibold mb-3 ${
        isDarkMode ? 'text-white/90' : 'text-gray-800'
      }`}>{title}</p>
      <p className={`text-sm ${
        isDarkMode ? 'text-white/70' : 'text-gray-600'
      }`}>{description}</p>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description, benefits, className = "" }: {
  icon: any;
  title: string;
  description: string;
  benefits: string[];
  className?: string;
}) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`p-16 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:transform hover:scale-105 ${
      isDarkMode 
        ? 'bg-black/50 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)]' 
        : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
    } ${className}`}>
      <div className="flex items-center gap-8 mb-12">
        <div className="p-5 rounded-full bg-gradient-to-r from-purple-500/30 to-purple-600/30 border border-purple-500/50">
          <Icon className={`w-12 h-12 ${
            isDarkMode ? 'text-purple-300' : 'text-purple-600'
          }`} />
        </div>
        <h3 className={`text-3xl font-bold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>{title}</h3>
      </div>
      <p className={`mb-12 leading-relaxed text-lg ${
        isDarkMode ? 'text-white/90' : 'text-gray-700'
      }`}>{description}</p>
      <div className="space-y-6">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex items-center gap-5">
            <CheckCircle className={`w-7 h-7 ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`} />
            <span className={`text-lg ${
              isDarkMode ? 'text-white/80' : 'text-gray-600'
            }`}>{benefit}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ParentHomePage: React.FC = () => {
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showRegularSignUpModal, setShowRegularSignUpModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const stats = [
    {
      icon: Users,
      title: "Active Families",
      value: "Join a growing family",
      description: "With more than ever active users!"
    },
    {
      icon: TrendingUp,
      title: "Scientifically Proven Benefits",
      value: "41",
      description: "Cognitive skills enhanced through neuroscience research"
    },
    {
      icon: Clock,
      title: "Daily Usage",
      value: "45 min",
      description: "Average time children spend learning"
    }
  ];

  const features = [
    {
      icon: Brain,
      title: "Neuroscience-Based Learning",
      description: "Every activity is designed based on peer-reviewed neuroscience research that targets specific cognitive skills and brain development areas.",
      benefits: [
        "41 cognitive skills targeted",
        "Research-backed methodologies",
        "Real-time progress tracking",
        "Evidence-based learning paths"
      ]
    },
    {
      icon: Shield,
      title: "AI-Guard Safety System",
      description: "Advanced AI-powered safety system monitors all interactions in real-time, ensuring your child's online experience is completely secure and age-appropriate.",
      benefits: [
        "AI content filtering & monitoring",
        "Real-time safety alerts",
        "Automated inappropriate content detection",
        "24/7 AI safety supervision"
      ]
    },
    {
      icon: GraduationCap,
      title: "AI-Teacher Personalization",
      description: "Our intelligent AI-teacher adapts to your child's learning style and pace, providing personalized instruction and real-time feedback.",
      benefits: [
        "Adaptive learning algorithms",
        "Personalized instruction paths",
        "Real-time AI feedback",
        "Individualized progress tracking"
      ]
    },
    {
      icon: BarChart3,
      title: "Research-Driven Analytics",
      description: "Get comprehensive insights into your child's learning progress with detailed reports based on cognitive science research.",
      benefits: [
        "Weekly progress reports",
        "Cognitive skill tracking",
        "Research-based analysis",
        "Evidence-backed recommendations"
      ]
    },
    {
      icon: BookOpen,
      title: "Montessori Approach",
      description: "Our learning methodology incorporates Montessori principles, emphasizing hands-on learning, self-directed activity, and collaborative play.",
      benefits: [
        "Hands-on learning experiences",
        "Self-directed exploration",
        "Collaborative play environments",
        "Child-centered learning paths"
      ]
    },
    {
      icon: Cpu,
      title: "AI-Adaptive Learning",
      description: "Advanced artificial intelligence continuously adapts to your child's learning patterns, creating personalized educational experiences that evolve with their development.",
      benefits: [
        "Dynamic difficulty adjustment",
        "Personalized learning paths",
        "Real-time adaptation algorithms",
        "Continuous skill assessment"
      ]
    }
  ];

  const safetyFeatures = [
    {
      icon: Lock,
      title: "Data Privacy",
      description: "Your child's data is protected with enterprise-grade encryption and never shared with third parties."
    },
    {
      icon: Shield,
      title: "AI-Guard Protection",
      description: "Advanced AI system monitors all interactions in real-time, automatically detecting and blocking inappropriate content."
    },
    {
      icon: Eye,
      title: "Content Monitoring",
      description: "All content is carefully curated and regularly reviewed by educational experts and child psychologists."
    },
    {
      icon: Wifi,
      title: "Secure Connection",
      description: "All communications are encrypted using SSL/TLS protocols to ensure maximum security."
    }
  ];

  const globalStyles = `
    .glass-gradient {
      background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.2);
    }
    
    .dark-glass-gradient {
      background: linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.1);
    }
    
    .hero-gradient {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    }
    
    .dark-hero-gradient {
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
    }
    
    .light-hero-gradient {
      background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #f3e8ff 100%);
    }
    
    .floating {
      animation: float 6s ease-in-out infinite;
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }
    
    .glow {
      box-shadow: 0 0 30px rgba(168, 85, 247, 0.4);
    }
    
    .glow:hover {
      box-shadow: 0 0 50px rgba(168, 85, 247, 0.6);
    }
    
    .hero-card-shadow {
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    
    .dark .hero-card-shadow {
      box-shadow: 0 25px 50px -12px rgba(255, 255, 255, 0.25);
    }
    
    .hero-card-shadow:hover {
      box-shadow: 0 35px 70px -12px rgba(0, 0, 0, 0.4);
    }
    
    .dark .hero-card-shadow:hover {
      box-shadow: 0 35px 70px -12px rgba(255, 255, 255, 0.4);
    }
    
    .refined-card {
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(16px);
      border: 2px solid rgba(255, 255, 255, 0.12);
      border-radius: 24px;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .refined-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      border-color: rgba(255, 255, 255, 0.2);
    }
    
    .dark .refined-card {
      background: rgba(0, 0, 0, 0.3);
      border-color: rgba(255, 255, 255, 0.08);
    }
    
    .dark .refined-card:hover {
      border-color: rgba(255, 255, 255, 0.15);
    }
  `;

  return (
    <>
      <style>{globalStyles}</style>
      
      <div className="font-sf">
        {/* Hero Section */}
        <section className={`min-h-screen relative overflow-hidden ${
          isDarkMode ? 'dark-hero-gradient' : 'light-hero-gradient'
        }`}>
        <div className="absolute inset-0">
          {/* Removed overlay to eliminate dark spots - using only the gradient background */}
        </div>
        
        <div className="relative z-10 container mx-auto px-6 py-32">
          <div className="text-center max-w-6xl mx-auto">
            <div className={`p-16 mb-16 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 ${
              isDarkMode 
                ? 'bg-black/50 backdrop-blur-xl border-2 border-white/30 shadow-[0_10px_20px_-12px_rgba(255,255,255,0.1)] hover:shadow-[0_15px_30px_-12px_rgba(255,255,255,0.15)]' 
                : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] hover:shadow-[0_35px_70px_-12px_rgba(0,0,0,0.4)]'
            }`}>
              <h1 className={`text-6xl md:text-8xl font-black mb-12 leading-tight ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Your Child's Future
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-purple-600">
                  Starts Here
                </span>
              </h1>
              <p className={`text-2xl md:text-3xl mb-16 leading-relaxed ${
                isDarkMode ? 'text-white/90' : 'text-gray-700'
              }`}>
                Discover how neuroscience research, AI-teacher personalization, and AI-guard safety combine to unlock your child's cognitive potential with scientifically proven methods
              </p>
              
              <div className="flex flex-col md:flex-row gap-8 justify-center items-center mb-16">
                <button 
                  onClick={() => setShowSignUpModal(true)} 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold px-16 py-8 rounded-full text-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 glow"
                >
                  Start Free Trial
                </button>
                <button 
                  onClick={() => setShowLoginModal(true)} 
                  className={`border-2 font-bold px-16 py-8 rounded-full text-xl transition-all duration-300 ${
                    isDarkMode 
                      ? 'border-white/30 text-white hover:bg-white/10' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Log In
                </button>
                <button 
                  onClick={() => navigate('/about')} 
                  className={`border-2 font-bold px-16 py-8 rounded-full text-xl transition-all duration-300 ${
                    isDarkMode 
                      ? 'border-white/30 text-white hover:bg-white/10' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Learn More
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-40 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 to-black' : 'bg-gradient-to-br from-purple-50 to-purple-100'}`}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-24">
            <div className={`p-12 mb-12 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 ${
              isDarkMode 
                ? 'bg-black/50 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)]' 
                : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
            }`}>
              <h2 className={`text-5xl md:text-6xl font-bold mb-8 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Why Parents Choose Neuraplay
              </h2>
              <p className={`text-xl max-w-4xl mx-auto ${
                isDarkMode ? 'text-white/90' : 'text-gray-700'
              }`}>
                Join thousands of parents who trust our research-based approach to their child's cognitive development
              </p>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 xl:gap-20">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} className="mb-8" />
            ))}
          </div>
        </div>
      </section>

      {/* Videos Section */}
      <section className={`py-32 ${isDarkMode ? 'bg-gradient-to-br from-black to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'}`}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-24">
            <div className={`p-12 rounded-3xl shadow-2xl ${
              isDarkMode 
                ? 'bg-black/50 backdrop-blur-xl border border-white/20 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)]' 
                : 'bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)]'
            }`}>
              <h2 className={`text-5xl md:text-6xl font-bold mb-8 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                See Neuraplay in Action
              </h2>
              <p className={`text-xl max-w-4xl mx-auto ${
                isDarkMode ? 'text-white/90' : 'text-gray-700'
              }`}>
                Watch how our neuroscience-based platform transforms learning into an engaging adventure
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-7xl mx-auto">
            <GlassVideoPlayer
              src="/assets/Videos/neuraplayintrovid1_720p.mp4"
              title="What is Neuraplay?"
              description="Step into a world where learning becomes an adventure. Discover how our neuroscience-based approach transforms education and unlocks your child's cognitive potential."
              secondarySrc="/assets/Videos/neuraplayintrovid4_720p.mp4"
              secondaryTitle="AI-Guard Safety System"
              secondaryDescription="Learn about our advanced AI-powered safety system that monitors all interactions in real-time, ensuring your child's online experience is completely secure."
              className="h-full"
              qualityVariants={{
                high: "/assets/Videos/neuraplayintrovid1_1080p.mp4",
                medium: "/assets/Videos/neuraplayintrovid1_720p.mp4",
                low: "/assets/Videos/neuraplayintrovid1_480p.mp4"
              }}
              secondaryQualityVariants={{
                high: "/assets/Videos/neuraplayintrovid4_1080p.mp4",
                medium: "/assets/Videos/neuraplayintrovid4_720p.mp4",
                low: "/assets/Videos/neuraplayintrovid4_480p.mp4"
              }}
            />
            
            <GlassVideoPlayer
              src="/assets/Videos/Neuraplayintroduction_720p.mp4"
              title="What do users say?"
              description="Explore how our research-backed methodologies target specific cognitive skills and brain development areas for optimal learning outcomes."
              className="h-full"
              qualityVariants={{
                high: "/assets/Videos/Neuraplayintroduction_1080p.mp4",
                medium: "/assets/Videos/Neuraplayintroduction_720p.mp4",
                low: "/assets/Videos/Neuraplayintroduction_480p.mp4"
              }}
            />
          </div>
        </div>
      </section>

      {/* Safety & Security Section */}
      <section className={`py-32 ${isDarkMode ? 'bg-gradient-to-br from-black to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'}`}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-24">
            <div className={`p-12 rounded-3xl shadow-2xl ${
              isDarkMode 
                ? 'bg-black/50 backdrop-blur-xl border border-white/20 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)]' 
                : 'bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)]'
            }`}>
              <h2 className={`text-5xl md:text-6xl font-bold mb-8 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Your Child's Safety is Our Priority
              </h2>
              <p className={`text-xl max-w-4xl mx-auto ${
                isDarkMode ? 'text-white/90' : 'text-gray-700'
              }`}>
                We understand that nothing is more important than your child's safety and privacy
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {safetyFeatures.map((feature, index) => (
              <div key={index} className={`p-8 text-center rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 ${
                isDarkMode 
                  ? 'bg-black/50 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)]' 
                  : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
              }`}>
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                    <feature.icon className="w-10 h-10 text-green-400" />
                  </div>
                </div>
                <h3 className={`text-xl font-bold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{feature.title}</h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={`py-32 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 to-black' : 'bg-gradient-to-br from-purple-50 to-purple-100'}`}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-24">
            <div className={`p-12 rounded-3xl shadow-2xl ${
              isDarkMode 
                ? 'bg-black/50 backdrop-blur-xl border border-white/20 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)]' 
                : 'bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)]'
            }`}>
              <h2 className={`text-5xl md:text-6xl font-bold mb-8 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                How Neuraplay Works
              </h2>
              <p className={`text-xl max-w-4xl mx-auto ${
                isDarkMode ? 'text-white/90' : 'text-gray-700'
              }`}>
                A simple three-step process to unlock your child's potential
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className={`p-12 text-center rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 ${
              isDarkMode 
                ? 'bg-black/50 backdrop-blur-xl border-2 border-white/30 shadow-[0_20px_40px_-12px_rgba(255,255,255,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(255,255,255,0.35)]' 
                : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
            }`}>
              <div className="flex justify-center mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                  1
                </div>
              </div>
              <h3 className={`text-2xl font-bold mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Create Account</h3>
              <p className={`mb-8 ${
                isDarkMode ? 'text-white/70' : 'text-gray-600'
              }`}>
                Sign up and set up your child's profile with age-appropriate settings and learning goals.
              </p>
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className={`text-sm ${
                    isDarkMode ? 'text-white/70' : 'text-gray-600'
                  }`}>Quick 2-minute setup</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className={`text-sm ${
                    isDarkMode ? 'text-white/70' : 'text-gray-600'
                  }`}>Age-appropriate content</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className={`text-sm ${
                    isDarkMode ? 'text-white/70' : 'text-gray-600'
                  }`}>Parental controls</span>
                </div>
              </div>
            </div>
            
            <div className={`p-12 text-center rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 ${
              isDarkMode 
                ? 'bg-black/50 backdrop-blur-xl border-2 border-white/30 shadow-[0_20px_40px_-12px_rgba(255,255,255,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(255,255,255,0.35)]' 
                : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
            }`}>
              <div className="flex justify-center mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                  2
                </div>
              </div>
              <h3 className={`text-2xl font-bold mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Start Learning</h3>
              <p className={`mb-8 ${
                isDarkMode ? 'text-white/70' : 'text-gray-600'
              }`}>
                Your child begins their personalized learning journey with AI-teacher adapted games and activities, protected by AI-guard safety.
              </p>
                              <div className="space-y-4 text-left">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <span className={`text-sm ${
                      isDarkMode ? 'text-white/70' : 'text-gray-600'
                    }`}>AI-teacher personalization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <span className={`text-sm ${
                      isDarkMode ? 'text-white/70' : 'text-gray-600'
                    }`}>AI-guard safety protection</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <span className={`text-sm ${
                      isDarkMode ? 'text-white/70' : 'text-gray-600'
                    }`}>Real-time AI feedback</span>
                  </div>
                </div>
            </div>
            
            <div className={`p-12 text-center rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 ${
              isDarkMode 
                ? 'bg-black/50 backdrop-blur-xl border-2 border-white/30 shadow-[0_20px_40px_-12px_rgba(255,255,255,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(255,255,255,0.35)]' 
                : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
            }`}>
              <div className="flex justify-center mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                  3
                </div>
              </div>
              <h3 className={`text-2xl font-bold mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Track Progress</h3>
              <p className={`mb-8 ${
                isDarkMode ? 'text-white/70' : 'text-gray-600'
              }`}>
                Monitor your child's development with detailed reports and actionable insights.
              </p>
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className={`text-sm ${
                    isDarkMode ? 'text-white/70' : 'text-gray-600'
                  }`}>Weekly reports</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className={`text-sm ${
                    isDarkMode ? 'text-white/70' : 'text-gray-600'
                  }`}>Skill development</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className={`text-sm ${
                    isDarkMode ? 'text-white/70' : 'text-gray-600'
                  }`}>Expert recommendations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-32 ${isDarkMode ? 'bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800' : 'bg-gradient-to-br from-purple-100 to-purple-200'}`}>
        <div className="container mx-auto px-6 text-center">
          <div className={`p-16 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 ${
            isDarkMode 
              ? 'bg-black/50 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)]' 
              : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_35px_70px_-12px_rgba(0,0,0,0.35)]'
          }`}>
            <h2 className={`text-5xl md:text-6xl font-bold mb-12 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Ready to Transform Your Child's Learning?
            </h2>
            <p className={`text-xl mb-16 max-w-3xl mx-auto ${
              isDarkMode ? 'text-white/90' : 'text-gray-700'
            }`}>
              Join thousands of parents who have already discovered the power of neuroscience-based learning enhanced by AI-teacher personalization and AI-guard safety with scientifically proven results
            </p>
            
            <div className="flex flex-col md:flex-row gap-8 justify-center items-center mb-16">
              <button 
                onClick={() => setShowSignUpModal(true)} 
                className={`font-bold px-16 py-8 rounded-full text-xl transition-all duration-300 glow ${
                  isDarkMode 
                    ? 'bg-white text-purple-900 hover:bg-gray-100' 
                    : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                }`}
              >
                Start Free Trial
              </button>
              <button 
                onClick={() => setShowLoginModal(true)} 
                className={`border-2 font-bold px-16 py-8 rounded-full text-xl transition-all duration-300 ${
                  isDarkMode 
                    ? 'border-white/30 text-white hover:bg-white/10' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Log In
              </button>
              <button 
                onClick={() => navigate('/about')} 
                className={`border-2 font-bold px-16 py-8 rounded-full text-xl transition-all duration-300 ${
                  isDarkMode 
                    ? 'border-white/30 text-white hover:bg-white/10' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Learn More
              </button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12">
              <div className={`flex items-center justify-center gap-4 ${
                isDarkMode ? 'text-white/80' : 'text-gray-600'
              }`}>
                <Trophy className="w-10 h-10 text-yellow-400" />
                <span className="text-lg">No Credit Card Required</span>
              </div>
              <div className={`flex items-center justify-center gap-4 ${
                isDarkMode ? 'text-white/80' : 'text-gray-600'
              }`}>
                <Shield className="w-10 h-10 text-green-400" />
                <span className="text-lg">100% Safe & Secure</span>
              </div>
              <div className={`flex items-center justify-center gap-4 ${
                isDarkMode ? 'text-white/80' : 'text-gray-600'
              }`}>
                <Clock className="w-10 h-10 text-blue-400" />
                <span className="text-lg">Cancel Anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Sign Up Choice Modal */}
      <SignUpChoiceModal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        onPremiumSignUp={() => {
          setShowSignUpModal(false);
          navigate('/registration');
        }}
        onRegularSignUp={() => {
          setShowSignUpModal(false);
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
    </div>
    </>
  );
};

export default ParentHomePage; 