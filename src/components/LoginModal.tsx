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

  // Mock user credentials for demo purposes
  const mockUsers = [
    {
      email: 'demo@neuraplay.com',
      password: 'demo123',
      user: {
        id: '1',
        username: 'DemoUser',
        email: 'demo@neuraplay.com',
        role: 'learner' as const,
        age: 8,
        profile: {
          avatar: '/assets/images/Mascot.png',
          rank: 'Advanced Learner',
          xp: 1250,
          xpToNextLevel: 2000,
          stars: 45,
          about: 'Learning and growing with NeuraPlay!',
          gameProgress: {
            'the-cube': { completed: true, score: 95 },
            'counting-adventure': { completed: true, score: 88 },
            'memory-sequence': { completed: false, score: 0 }
          }
        },
        journeyLog: [
          { date: '2024-01-15', activity: 'Completed The Cube', xp: 100 },
          { date: '2024-01-14', activity: 'Finished Counting Adventure', xp: 75 },
          { date: '2024-01-13', activity: 'Started Memory Training', xp: 50 }
        ],
        hasPosted: true,
        friends: ['user2', 'user3'],
        friendRequests: []
      }
    },
    {
      email: 'parent@neuraplay.com',
      password: 'parent123',
      user: {
        id: '2',
        username: 'ParentUser',
        email: 'parent@neuraplay.com',
        role: 'parent' as const,
        profile: {
          avatar: '/assets/images/Mascot.png',
          rank: 'Supportive Parent',
          xp: 800,
          xpToNextLevel: 1000,
          stars: 30,
          about: 'Supporting my child\'s learning journey',
          gameProgress: {}
        },
        journeyLog: [
          { date: '2024-01-15', activity: 'Reviewed child\'s progress', xp: 50 },
          { date: '2024-01-14', activity: 'Set learning goals', xp: 75 },
          { date: '2024-01-13', activity: 'Joined community', xp: 25 }
        ],
        hasPosted: false,
        friends: [],
        friendRequests: []
      }
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = mockUsers.find(u => 
      u.email === formData.email && u.password === formData.password
    );

    if (user) {
      setUser(user.user);
      onSuccess?.();
      navigate(redirectTo);
      onClose();
    } else {
      setError('Invalid email or password. Please try again.');
    }

    setIsLoading(false);
  };

  const handleDemoLogin = async () => {
    setFormData({ email: 'demo@neuraplay.com', password: 'demo123' });
    setError('');
    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const demoUser = mockUsers.find(u => u.email === 'demo@neuraplay.com');
    if (demoUser) {
      setUser(demoUser.user);
      onSuccess?.();
      navigate(redirectTo);
      onClose();
    }

    setIsLoading(false);
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

        {/* Demo Login Button */}
        <div className={`rounded-xl p-4 border ${
          isDarkMode 
            ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-400/30'
            : 'bg-gradient-to-r from-violet-100 to-purple-100 border-violet-300/50'
        }`}>
          <div className="text-center">
            <p className={`text-sm mb-3 ${
              isDarkMode ? 'text-white/80' : 'text-gray-700'
            }`}>Try the demo experience</p>
            <button
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? 'Signing In...' : 'Demo Login'}
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className={`w-full border-t ${
              isDarkMode ? 'border-white/20' : 'border-gray-300'
            }`}></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className={`px-2 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white/60'
                : 'bg-white text-gray-600'
            }`}>Or sign in manually</span>
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
          
          <div className={`rounded-xl p-4 ${
            isDarkMode ? 'bg-white/5' : 'bg-gray-50'
          }`}>
            <h4 className={`font-semibold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Demo Credentials</h4>
            <div className={`space-y-1 text-sm ${
              isDarkMode ? 'text-white/70' : 'text-gray-600'
            }`}>
              <p><strong>Learner:</strong> demo@neuraplay.com / demo123</p>
              <p><strong>Parent:</strong> parent@neuraplay.com / parent123</p>
            </div>
          </div>
        </div>
      </div>
    </ModalReveal>
  );
};

export default LoginModal; 