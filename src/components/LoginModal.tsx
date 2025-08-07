import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import ModalReveal from './ModalReveal';
import { LogIn, User, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  redirectTo?: string;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  redirectTo = '/dashboard'
}) => {
  const { setUser } = useUser();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Clear any existing user data before authentication attempt
      setUser(null);
      localStorage.removeItem('neuraplay_user');

      // Secret Admin Access
      if (formData.email.toLowerCase() === 'smt@neuraplay.com' && formData.password === 'GH2300!') {
        const adminUser = {
          id: 'admin_2025',
          username: 'NeuraPlay Admin',
          email: 'smt@neuraplay.com',
          role: 'admin' as const,
          isVerified: true,
          subscription: {
            tier: 'unlimited' as const,
            startDate: new Date().toISOString(),
            status: 'active' as const
          },
          usage: {
            aiPrompts: { count: 0, lastReset: new Date().toISOString(), history: [] },
            imageGeneration: { count: 0, lastReset: new Date().toISOString(), history: [] }
          },
          profile: {
            avatar: '/assets/images/Mascot.png',
            rank: 'System Administrator',
            xp: 999999,
            xpToNextLevel: 0,
            stars: 999999,
            about: 'NeuraPlay System Administrator',
            gameProgress: {}
          },
          journeyLog: [],
          hasPosted: true,
          friends: [],
          friendRequests: { sent: [], received: [] }
        };
        
        setUser(adminUser);
        onSuccess?.();
        onClose();
        navigate(redirectTo);
        return;
      }

      // Call authentication API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          password: formData.password
        })
      });

      const result = await response.json();

      if (response.ok && result.user) {
        // Check if user needs to verify their email
        if (!result.user.isVerified) {
          setError('Please verify your email address before logging in. Check your inbox for a verification link.');
          return;
        }

        setUser(result.user);
        onSuccess?.();
        onClose();
        navigate(redirectTo);
      } else {
        setError(result.message || 'Invalid email or password. Please check your credentials or create a new account.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalReveal
      isOpen={isOpen}
      onClose={onClose}
      title="Welcome Back to NeuraPlay"
      revealType="letter"
      typewriterEffect={true}
      cursorBlink={true}
      stagger={0.08}
      duration={1.2}
      delay={0.3}
    >
      <div className="space-y-6">
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
          }`}>Sign In to Your Account</h2>
          <p className={`${
            isDarkMode ? 'text-white/70' : 'text-gray-600'
          }`}>Continue your learning journey with NeuraPlay</p>
        </div>

        {/* Important Notice */}
        <div className={`rounded-xl p-4 border ${
          isDarkMode 
            ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400/30'
            : 'bg-gradient-to-r from-amber-100 to-orange-100 border-amber-300/50'
        }`}>
          <div className="text-center">
            <p className={`text-sm font-medium ${
              isDarkMode ? 'text-amber-200' : 'text-amber-800'
            }`}>
              ✉️ Email verification is now required
            </p>
            <p className={`text-xs mt-1 ${
              isDarkMode ? 'text-amber-300/80' : 'text-amber-700'
            }`}>
              Please verify your email address after signing up to access all features.
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block font-bold mb-3 text-lg flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <User className="w-5 h-5" />
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full p-4 rounded-xl border focus:ring-2 focus:ring-violet-400/20 transition-all ${
                isDarkMode 
                  ? 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-violet-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-violet-500'
              }`}
              required
            />
          </div>

          <div>
            <label className={`block font-bold mb-3 text-lg flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <Lock className="w-5 h-5" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full p-4 pr-12 rounded-xl border focus:ring-2 focus:ring-violet-400/20 transition-all ${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-violet-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-violet-500'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                  isDarkMode 
                    ? 'text-white/60 hover:text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !formData.email || !formData.password}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold px-8 py-4 rounded-xl hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg text-lg flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Signing In...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Additional Info */}
        <div className="text-center space-y-3">
          <p className={`text-sm ${
            isDarkMode ? 'text-white/60' : 'text-gray-600'
          }`}>
            Don't have an account?{' '}
            <button
              onClick={() => {
                onClose();
                navigate('/forum-registration');
              }}
              className="text-violet-400 hover:text-violet-300 font-semibold transition-colors"
            >
              Create one here
            </button>
          </p>
          

        </div>
      </div>
    </ModalReveal>
  );
};

export default LoginModal; 