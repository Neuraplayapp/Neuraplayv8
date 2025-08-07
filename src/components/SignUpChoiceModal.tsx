import React from 'react';
import ModalReveal from './ModalReveal';
import { useTheme } from '../contexts/ThemeContext';
import { Crown, Users, Star, Zap, Brain, Trophy, Gift, ArrowRight } from 'lucide-react';

interface SignUpChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPremiumSignUp: () => void;
  onRegularSignUp: () => void;
  onShowLogin?: () => void;
}

const SignUpChoiceModal: React.FC<SignUpChoiceModalProps> = ({
  isOpen,
  onClose,
  onPremiumSignUp,
  onRegularSignUp,
  onShowLogin
}) => {
  const { isDarkMode } = useTheme();
  const premiumFeatures = [
    {
      icon: <Brain className="w-6 h-6 text-purple-400" />,
      title: "AI-Powered Learning",
      description: "Personalized cognitive development plans"
    },
    {
      icon: <Trophy className="w-6 h-6 text-yellow-400" />,
      title: "Advanced Games",
      description: "Access to premium cognitive training games"
    },
    {
      icon: <Zap className="w-6 h-6 text-blue-400" />,
      title: "Real-time Analytics",
      description: "Detailed progress tracking and insights"
    },
    {
      icon: <Star className="w-6 h-6 text-pink-400" />,
      title: "Expert Support",
      description: "Direct access to child development experts"
    }
  ];

  return (
    <ModalReveal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Your Journey"
      revealType="letter"
      typewriterEffect={true}
      cursorBlink={true}
      stagger={0.08}
      duration={1.2}
      delay={0.3}
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Header with mascot */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/assets/images/Mascot.png" 
              alt="NeuraPlay Mascot" 
              className="w-20 h-20 object-contain"
            />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Welcome to NeuraPlay</h2>
          <p className={`text-base ${
            isDarkMode ? 'text-white/70' : 'text-gray-600'
          }`}>Choose your path to unlock your child's potential</p>
        </div>

        {/* Premium Options */}
        <div className="space-y-4">
          {/* Monthly Premium Option */}
          <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-xl p-6 border border-violet-400/30">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-8 h-8 text-yellow-400" />
              <div>
                <h3 className={`text-xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Premium Journey - Monthly</h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>Full access to all features and personalized learning</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  {feature.icon}
                  <div>
                    <div className={`font-medium text-sm ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{feature.title}</div>
                    <div className={`text-xs leading-tight ${
                      isDarkMode ? 'text-white/60' : 'text-gray-600'
                    }`}>{feature.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-3 border border-yellow-400/30 mb-4">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-yellow-400" />
                <span className={`font-semibold text-sm ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>7-Day Free Trial</span>
              </div>
              <p className={`text-xs mt-1 ${
                isDarkMode ? 'text-white/80' : 'text-gray-600'
              }`}>Start free, cancel anytime</p>
            </div>

            <button
              onClick={onPremiumSignUp}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold px-6 py-3 rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-base flex items-center justify-center gap-2"
            >
              Begin Monthly Premium
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Yearly Premium Option with Discount */}
          <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl p-6 border border-emerald-400/30 relative">
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              20% OFF
            </div>
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-8 h-8 text-emerald-400" />
              <div>
                <h3 className={`text-xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Premium Journey - Yearly</h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>Full access to all features and personalized learning</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  {feature.icon}
                  <div>
                    <div className={`font-medium text-sm ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{feature.title}</div>
                    <div className={`text-xs leading-tight ${
                      isDarkMode ? 'text-white/60' : 'text-gray-600'
                    }`}>{feature.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-lg p-3 border border-emerald-400/30 mb-4">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-400" />
                <span className="text-theme-primary font-semibold text-sm">7-Day Free Trial + 20% Discount</span>
              </div>
              <p className="text-theme-secondary text-xs mt-1">Best value - Save 20% with yearly plan</p>
            </div>

            <button
              onClick={onPremiumSignUp}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold px-6 py-3 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-base flex items-center justify-center gap-2"
            >
              Begin Yearly Premium
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Regular Option */}
        <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-400/30">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-8 h-8 text-blue-400" />
            <div>
                              <h3 className="text-xl font-bold text-theme-primary">Community Access</h3>
                <p className="text-theme-secondary text-sm">Join our community and start your learning journey</p>
            </div>
          </div>
          
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-blue-400" />
              <span className="text-theme-primary text-sm">Access to community forum</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-blue-400" />
              <span className="text-theme-primary text-sm">Basic learning games</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-blue-400" />
              <span className="text-theme-primary text-sm">AI avatar generation</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-blue-400" />
              <span className="text-theme-primary text-sm">Free forever</span>
            </div>
          </div>

          <button
            onClick={onRegularSignUp}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold px-6 py-3 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-base flex items-center justify-center gap-2"
          >
            Join Community
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-theme-secondary text-sm">
            Already have an account?{' '}
            <button
              onClick={() => {
                onClose();
                onShowLogin?.();
              }}
              className="text-violet-400 hover:text-violet-300 font-semibold transition-colors"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </ModalReveal>
  );
};

export default SignUpChoiceModal; 