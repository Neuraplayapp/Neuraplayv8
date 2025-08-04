import React, { useState, useRef, useEffect } from 'react';
import { Settings, Sun, Moon, Monitor, Palette, Eye, Smartphone, Globe, User, Shield, HelpCircle, Zap, Cog, ShieldAlert, ChevronRight, Bot, Brain, Heart, Target, Crown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
// FIXED: Add AIAgentContext import
import { useAIAgent } from '../contexts/AIAgentContext';

type TabType = 'theme' | 'accessibility' | 'quick-actions' | 'user' | 'ai-personality';

const SettingsDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('theme');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  
  // FIXED: Connect to AIAgentContext instead of local state
  const { currentContext, updateContext } = useAIAgent();
  const currentPersonality = currentContext?.agentPersonality || 'synapse-normal';

  // FIXED: Update AI personality when changed
  const handlePersonalityChange = (newPersonality: string) => {
    updateContext({ agentPersonality: newPersonality as any });
  };

  const { 
    theme, 
    setTheme, 
    isDarkMode, 
    animationsEnabled, 
    setAnimationsEnabled,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    reducedMotion,
    setReducedMotion,
    focusIndicators,
    setFocusIndicators,
    keyboardNavigation,
    setKeyboardNavigation,
    colorBlindMode,
    setColorBlindMode,
    textSpacing,
    setTextSpacing
  } = useTheme();

  // REMOVED: Local AI Personality state - now using context
  // const [aiPersonality, setAiPersonality] = useState('synapse-normal');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'auto', label: 'Auto', icon: Monitor },
    { value: 'bright', label: 'Bright', icon: Zap },
    { value: 'dark-gradient', label: 'Dark Gradient', icon: Palette },
    { value: 'white-purple-gradient', label: 'Purple Gradient', icon: Palette }
  ];

  const fontSizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'extra-large', label: 'Extra Large' }
  ];

  const colorBlindOptions = [
    { value: 'none', label: 'None' },
    { value: 'protanopia', label: 'Protanopia (Red-Blind)' },
    { value: 'deuteranopia', label: 'Deuteranopia (Green-Blind)' },
    { value: 'tritanopia', label: 'Tritanopia (Blue-Blind)' }
  ];

  const textSpacingOptions = [
    { value: 'normal', label: 'Normal' },
    { value: 'increased', label: 'Increased' },
    { value: 'extra', label: 'Extra Spacing' }
  ];

  const aiPersonalityOptions = [
    { 
      value: 'synapse-normal', 
      label: 'Synapse - Normal', 
      icon: Bot, 
      description: 'Friendly and helpful AI teacher',
      color: 'purple'
    },
    { 
      value: 'coach', 
      label: 'Coach', 
      icon: Target, 
      description: 'Motivational and goal-oriented',
      color: 'blue'
    },
    { 
      value: 'mentor', 
      label: 'Mentor', 
      icon: Brain, 
      description: 'Wise and guiding approach',
      color: 'green'
    },
    { 
      value: 'friend', 
      label: 'Friend', 
      icon: Heart, 
      description: 'Supportive and casual',
      color: 'pink'
    },
    { 
      value: 'analyst', 
      label: 'Analyst', 
      icon: Crown, 
      description: 'Detailed and analytical',
      color: 'orange'
    }
  ];

  const getColorClasses = (color: string, isSelected: boolean) => {
    const baseClasses = isDarkMode
      ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100';
    
    const selectedClasses = {
      purple: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300',
      blue: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300',
      green: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-600 text-green-700 dark:text-green-300',
      pink: 'bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-600 text-pink-700 dark:text-pink-300',
      orange: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300'
    };

    return isSelected ? selectedClasses[color as keyof typeof selectedClasses] : baseClasses;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 text-purple-900 dark:text-white hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-full transition-all"
        title="Settings"
      >
        <Settings className="w-5 h-5 text-current" />
      </button>

      {isOpen && (
        <div className={`absolute left-1/2 transform -translate-x-1/2 top-[calc(100%+30px)] w-96 rounded-xl shadow-2xl z-50 overflow-hidden ${
          isDarkMode 
            ? 'bg-gray-800 border-2 border-gray-700' 
            : 'bg-white border-2 border-gray-300'
        }`}>
          <div className="flex">
            {/* Side Tabs */}
            <div className={`w-20 border-r-2 ${
              isDarkMode 
                ? 'bg-gray-900 border-gray-700' 
                : 'bg-gray-50 border-gray-300'
            }`}>
              <div className="p-2 space-y-1">
                <button
                  onClick={() => setActiveTab('theme')}
                  className={`w-full p-3 rounded-lg transition-all ${
                    activeTab === 'theme'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  title="Theme"
                >
                  <Palette className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={() => setActiveTab('accessibility')}
                  className={`w-full p-3 rounded-lg transition-all ${
                    activeTab === 'accessibility'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  title="Accessibility"
                >
                  <Eye className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={() => setActiveTab('ai-personality')}
                  className={`w-full p-3 rounded-lg transition-all ${
                    activeTab === 'ai-personality'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  title="AI Personality"
                >
                  <Bot className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={() => setActiveTab('quick-actions')}
                  className={`w-full p-3 rounded-lg transition-all ${
                    activeTab === 'quick-actions'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  title="Quick Actions"
                >
                  <Zap className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={() => setActiveTab('user')}
                  className={`w-full p-3 rounded-lg transition-all ${
                    activeTab === 'user'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  title="User Settings"
                >
                  <Cog className="w-5 h-5 mx-auto" />
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
              {/* Header */}
              <div className={`flex items-center justify-between border-b-2 pb-4 mb-6 ${
                isDarkMode ? 'border-gray-700' : 'border-gray-300'
              }`}>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {activeTab === 'theme' && 'Theme Settings'}
                  {activeTab === 'accessibility' && 'Accessibility'}
                  {activeTab === 'ai-personality' && 'AI Personality'}
                  {activeTab === 'quick-actions' && 'Quick Actions'}
                  {activeTab === 'user' && 'User Settings'}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'theme' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {themeOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setTheme(option.value as any)}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                            theme === option.value
                              ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300'
                              : isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'ai-personality' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Choose how your AI assistant behaves and communicates with you.
                  </p>
                  <div className="space-y-3">
                    {aiPersonalityOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = currentPersonality === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => handlePersonalityChange(option.value)}
                          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            getColorClasses(option.color, isSelected)
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              isSelected 
                                ? 'bg-white/20' 
                                : isDarkMode 
                                  ? 'bg-gray-600' 
                                  : 'bg-gray-200'
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-sm">{option.label}</div>
                              <div className="text-xs opacity-75 mt-1">{option.description}</div>
                            </div>
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-current"></div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'accessibility' && (
                <div className="space-y-4">
                  {/* Font Size */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Font Size</label>
                    <select
                      value={fontSize}
                      onChange={(e) => setFontSize(e.target.value)}
                      className={`w-full p-2 border-2 rounded-lg ${
                        isDarkMode
                          ? 'border-gray-600 bg-gray-700 text-white'
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                    >
                      {fontSizeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* High Contrast */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">High Contrast</span>
                    </div>
                    <button
                      onClick={() => setHighContrast(!highContrast)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        highContrast ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          highContrast ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Reduced Motion */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reduced Motion</span>
                    </div>
                    <button
                      onClick={() => setReducedMotion(!reducedMotion)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        reducedMotion ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          reducedMotion ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Focus Indicators */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Focus Indicators</span>
                    </div>
                    <button
                      onClick={() => setFocusIndicators(!focusIndicators)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        focusIndicators ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          focusIndicators ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Keyboard Navigation */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Keyboard Navigation</span>
                    </div>
                    <button
                      onClick={() => setKeyboardNavigation(!keyboardNavigation)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        keyboardNavigation ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          keyboardNavigation ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Color Blind Mode */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Color Blind Mode</label>
                    <select
                      value={colorBlindMode}
                      onChange={(e) => setColorBlindMode(e.target.value)}
                      className={`w-full p-2 border-2 rounded-lg ${
                        isDarkMode
                          ? 'border-gray-600 bg-gray-700 text-white'
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                    >
                      {colorBlindOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Text Spacing */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Text Spacing</label>
                    <select
                      value={textSpacing}
                      onChange={(e) => setTextSpacing(e.target.value)}
                      className={`w-full p-2 border-2 rounded-lg ${
                        isDarkMode
                          ? 'border-gray-600 bg-gray-700 text-white'
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                    >
                      {textSpacingOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Animations */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Animations</span>
                    </div>
                    <button
                      onClick={() => setAnimationsEnabled(!animationsEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        animationsEnabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          animationsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'quick-actions' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}>
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">Profile</span>
                    </button>
                    <button className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}>
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-medium">Privacy</span>
                    </button>
                    <button className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}>
                      <Globe className="w-4 h-4" />
                      <span className="text-sm font-medium">Language</span>
                    </button>
                    <button className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}>
                      <HelpCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Help</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'user' && (
                <div className="space-y-4">
                  {/* Account Information */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Account Information</h4>
                    <div className={`rounded-lg p-3 border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-gray-50 border-gray-300'
                    }`}>
                      {user ? (
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Username:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{user.username}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Email:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{user.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Role:</span>
                            <span className="font-medium text-gray-900 dark:text-white capitalize">{user.role}</span>
                          </div>
                          {user.age && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Age:</span>
                              <span className="font-medium text-gray-900 dark:text-white">{user.age}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-1 border-t border-gray-300 dark:border-gray-600">
                            <span className="text-gray-500 dark:text-gray-400">XP:</span>
                            <span className="font-medium text-purple-600 dark:text-purple-400">{user.profile.xp}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Stars:</span>
                            <span className="font-medium text-yellow-600 dark:text-yellow-400">{user.profile.stars}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Please sign in to view account details</p>
                      )}
                    </div>
                  </div>

                  {/* Privacy & Safety */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Privacy & Safety</h4>
                    <div className="space-y-2">
                      <button className={`w-full rounded-lg p-3 text-left border transition-all hover:scale-[1.02] ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                          : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-purple-600" />
                            <div>
                              <h5 className="text-xs font-medium text-gray-900 dark:text-white">Privacy Settings</h5>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Manage data & privacy</p>
                            </div>
                          </div>
                          <ChevronRight className="w-3 h-3 text-gray-400" />
                        </div>
                      </button>
                      
                      <button className={`w-full rounded-lg p-3 text-left border transition-all hover:scale-[1.02] ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                          : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-red-600" />
                            <div>
                              <h5 className="text-xs font-medium text-gray-900 dark:text-white">Blocked Users</h5>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Manage blocked users</p>
                            </div>
                          </div>
                          <ChevronRight className="w-3 h-3 text-gray-400" />
                        </div>
                      </button>

                      <button className={`w-full rounded-lg p-3 text-left border transition-all hover:scale-[1.02] ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                          : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-600" />
                            <div>
                              <h5 className="text-xs font-medium text-gray-900 dark:text-white">Data Export</h5>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Download your data</p>
                            </div>
                          </div>
                          <ChevronRight className="w-3 h-3 text-gray-400" />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Account Actions</h4>
                    <div className="space-y-2">
                      <button className={`w-full rounded-lg p-3 text-left border transition-all hover:scale-[1.02] ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                          : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-green-600" />
                            <div>
                              <h5 className="text-xs font-medium text-gray-900 dark:text-white">Edit Profile</h5>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Update your information</p>
                            </div>
                          </div>
                          <ChevronRight className="w-3 h-3 text-gray-400" />
                        </div>
                      </button>

                      <button className={`w-full rounded-lg p-3 text-left border transition-all hover:scale-[1.02] ${
                        isDarkMode 
                          ? 'bg-red-900/20 border-red-800 hover:bg-red-900/30' 
                          : 'bg-red-50 border-red-200 hover:bg-red-100'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-red-600" />
                            <div>
                              <h5 className="text-xs font-medium text-red-700 dark:text-red-400">Delete Account</h5>
                              <p className="text-xs text-red-600 dark:text-red-500">Permanently delete account</p>
                            </div>
                          </div>
                          <ChevronRight className="w-3 h-3 text-red-400" />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsDropdown;