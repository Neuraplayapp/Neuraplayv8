import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import ModalReveal from './ModalReveal';
import { User, Mail, Users, Sparkles, Lock, Eye, EyeOff } from 'lucide-react';

interface RegularSignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onShowLogin?: () => void;
}

const RegularSignUpModal: React.FC<RegularSignUpModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowLogin
}) => {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    role: '',
    age: 5,
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: '/assets/placeholder.png'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarPrompt, setAvatarPrompt] = useState('');
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [generatedAvatars, setGeneratedAvatars] = useState<string[]>([]);

  const handleSubmit = async () => {
    if (!formData.role || !formData.username.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword) {
      setError('Please fill out all required fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Call backend registration API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          age: formData.role === 'learner' ? formData.age : undefined,
          profile: {
            avatar: formData.avatar,
            rank: 'New Learner',
            xp: 0,
            xpToNextLevel: 100,
            stars: 0,
            about: '',
            gameProgress: {}
          }
        })
      });

      const result = await response.json();

      if (response.ok && result.user) {
        setUser(result.user);
        onSuccess?.();
        navigate('/forum');
        onClose();
      } else {
        console.error('Registration failed:', result.message);
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error during registration. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!avatarPrompt.trim()) {
      setAvatarError('Please enter a description for your avatar.');
      return;
    }
    setGeneratingAvatar(true);
    setAvatarError('');
    
    try {
      console.log('Generating avatar with prompt:', avatarPrompt);
      
      const response = await fetch('/api/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: 'image',
          input_data: avatarPrompt
        })
      });
      
      console.log('Avatar generation response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to get response' }));
        console.error('Avatar generation error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Avatar generation result:', result);
      
      if (result.data && result.data.length > 0) {
        const imageBlob = `data:${result.contentType || 'image/png'};base64,${result.data}`;
        console.log('Generated avatar blob length:', imageBlob.length);
        setGeneratedAvatars(prev => [...prev, imageBlob]);
        setFormData({ ...formData, avatar: imageBlob });
      } else if (result.data) {
        // Handle case where data is a string (not array)
        const imageBlob = `data:${result.contentType || 'image/png'};base64,${result.data}`;
        console.log('Generated avatar blob length:', imageBlob.length);
        setGeneratedAvatars(prev => [...prev, imageBlob]);
        setFormData({ ...formData, avatar: imageBlob });
      } else {
        console.error('No image data in response:', result);
        setAvatarError('Failed to generate avatar. Please try again.');
      }
    } catch (error) {
      console.error('Avatar generation error:', error);
      setAvatarError(`Error generating avatar: ${error.message}. Please try again.`);
    } finally {
      setGeneratingAvatar(false);
    }
  };

  return (
    <ModalReveal
      isOpen={isOpen}
      onClose={onClose}
      title="Join NeuraPlay Community"
      revealType="letter"
      typewriterEffect={true}
      cursorBlink={true}
      stagger={0.08}
      duration={1.2}
      delay={0.3}
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Header with mascot */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center mb-3">
            <img 
              src="/assets/images/Mascot.png" 
              alt="NeuraPlay Mascot" 
              className="w-16 h-16 object-contain"
            />
          </div>
                      <h2 className="text-xl font-bold text-theme-primary mb-1">Join Our Community</h2>
            <p className="text-theme-secondary text-sm">Create your free account and start your learning journey</p>
        </div>

        {/* Sign Up Form */}
        <div className="space-y-3">
          <div>
            <label className="block font-bold mb-2 text-theme-primary text-base">I am a...</label>
            <div className="grid grid-cols-2 gap-2">
              {['learner', 'parent'].map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setFormData({ ...formData, role })}
                  className={`p-2 rounded-lg font-semibold text-sm transition-all border-2 ${
                    formData.role === role
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-blue-600 shadow-lg'
                      : 'bg-white/10 text-gray-300 border-white/20 hover:border-blue-400 hover:bg-white/20'
                  }`}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {formData.role === 'learner' && (
            <div>
              <label className="block font-bold mb-1 text-theme-primary text-base">Learner's age</label>
              <select
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm"
              >
                <option value={4} className="bg-slate-800">3-5 years</option>
                <option value={7} className="bg-slate-800">6-8 years</option>
                <option value={10} className="bg-slate-800">9-12 years</option>
              </select>
            </div>
          )}

          <div>
            <label className="block font-bold mb-1 text-theme-primary text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Username
            </label>
            <input
              type="text"
              placeholder="Create a unique username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm"
              required
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-theme-primary text-base flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm"
              required
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-theme-primary text-base flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-2 pr-10 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1 text-theme-secondary text-xs">Password must be at least 6 characters long</p>
          </div>

          <div>
            <label className="block font-bold mb-1 text-theme-primary text-base flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full p-2 pr-10 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-3 text-theme-primary text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Choose your hero avatar
            </h4>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={avatarPrompt}
                onChange={e => setAvatarPrompt(e.target.value)}
                placeholder="Describe your avatar (e.g. brave robot, magical cat)"
                className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm"
                disabled={generatingAvatar}
              />
              <button
                type="button"
                onClick={handleGenerateAvatar}
                disabled={generatingAvatar || !avatarPrompt.trim()}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 text-sm"
              >
                {generatingAvatar ? 'Generating...' : 'Generate'}
              </button>
            </div>
            {avatarError && <div className="text-red-400 text-xs mb-3">{avatarError}</div>}
                
            {/* Avatar Preview - Only show when generating or when avatar is selected */}
            {generatingAvatar && (
              <div className="flex justify-center mb-4">
                <div className="relative w-24 h-24">
                  {/* Outer force field ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-blue-400/30 animate-pulse"></div>
                  {/* Middle force field ring */}
                  <div className="absolute inset-2 rounded-full border-2 border-blue-400/50 animate-spin" style={{ animationDuration: '3s' }}></div>
                  {/* Inner force field ring */}
                  <div className="absolute inset-4 rounded-full border border-blue-400/70 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
                  {/* Central energy core */}
                  <div className="absolute inset-8 rounded-full bg-gradient-to-br from-blue-400/20 to-cyan-400/20 animate-pulse">
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-400/40 to-cyan-400/40 animate-spin" style={{ animationDuration: '1.5s' }}></div>
                  </div>
                  {/* Energy particles */}
                  <div className="absolute inset-0 rounded-full">
                    <div className="absolute top-2 left-1/2 w-1 h-1 bg-blue-400 rounded-full animate-ping"></div>
                    <div className="absolute bottom-2 left-1/2 w-1 h-1 bg-cyan-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute left-2 top-1/2 w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute right-2 top-1/2 w-1 h-1 bg-cyan-400 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {!generatingAvatar && formData.avatar && (formData.avatar !== '/assets/placeholder.png' || formData.avatar.startsWith('data:')) && (
              <div className="flex justify-center mb-4">
                <img
                  src={formData.avatar}
                  alt="Avatar Preview"
                  className="w-24 h-24 rounded-full border-4 border-blue-400 shadow-lg"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isLoading || !formData.role || !formData.username.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold px-6 py-3 rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg text-base flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Creating Account...
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                Join Community
              </>
            )}
          </button>
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-theme-secondary text-xs">
            Already have an account?{' '}
            <button
              onClick={() => {
                onClose();
                onShowLogin?.();
              }}
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </ModalReveal>
  );
};

export default RegularSignUpModal; 