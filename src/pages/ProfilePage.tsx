import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAIAgent } from '../contexts/AIAgentContext';
import { 
  Star, UserPlus, Edit2, Check, X, Users, ShieldAlert, 
  Trophy, Brain, Settings, 
  Activity, Clock, Zap, MessageCircle, Cog,
  ChevronRight, Home, Gamepad2, Users2, FileText, 
  BarChart3, Sparkles, Crown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AIAssistant from '../components/AIAssistant';

const ProfilePage: React.FC = () => {
  const { user, setUser } = useUser();
  const { 
    isDarkMode
  } = useTheme();
  const { showAgent } = useAIAgent();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [bio, setBio] = useState(user?.profile.about || '');
  const [bioSaved, setBioSaved] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [selectedChatFriend, setSelectedChatFriend] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  // Initialize demo friend data if user exists but has no friends
  useEffect(() => {
    if (user && (!user.friends || user.friends.length === 0)) {
      // Add some demo friends
      const demoFriends = ['Alex', 'Sam', 'Jordan'];
      const demoRequests = ['Taylor', 'Casey'];
      
      setUser({
        ...user,
        friends: demoFriends,
        friendRequests: {
          sent: [],
          received: demoRequests
        }
      });
    }
  }, [user, setUser]);

  // Update bio and username state when user changes
  useEffect(() => {
    if (user) {
      setBio(user.profile.about || '');
      setNewUsername(user.username || '');
    }
  }, [user]);
  
  // Show login prompt if user is not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="flex items-center justify-center mb-8">
            <img 
              src="/assets/images/Mascot.png" 
              alt="NeuraPlay Mascot" 
              className="w-32 h-32 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold mb-4 text-purple-900 dark:text-white">Welcome to NeuraPlay!</h1>
          <p className="text-lg mb-8 text-purple-700 dark:text-gray-300">
            Please log in to view and manage your profile.
          </p>
          <div className="space-y-4">
            <button 
              onClick={() => navigate('/forum-registration')}
              className="inline-block w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold px-8 py-4 rounded-full hover:from-violet-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Create Account
            </button>
            <button 
              onClick={() => navigate('/signin')}
              className="inline-block w-full bg-transparent border-2 font-bold px-8 py-4 rounded-full transition-all duration-300 border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Log In
            </button>
          </div>
          <p className="text-sm mt-6 text-purple-600 dark:text-gray-400">
            Join thousands of learners discovering the joy of cognitive development!
          </p>
        </div>
      </div>
    );
  }

  const handleBioSave = () => {
    if (!user) return;
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setUser({ ...user, profile: { ...user.profile, about: bio } });
      setBioSaved(true);
      setTimeout(() => setBioSaved(false), 1500);
      setEditing(false);
      setIsLoading(false);
    }, 500);
  };

  const handleUsernameSave = () => {
    if (!user || !newUsername.trim()) return;
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setUser({ ...user, username: newUsername.trim() });
      setEditingUsername(false);
      setIsLoading(false);
    }, 500);
  };

  const handleUsernameCancel = () => {
    setNewUsername(user?.username || '');
    setEditingUsername(false);
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !selectedChatFriend) return;
    // In a real app, this would send to a backend
    console.log(`Message to ${selectedChatFriend}: ${chatMessage}`);
    setChatMessage('');
  };

  const getOnlineStatus = (friendId: string) => {
    // Simulate online status based on friend ID
    const onlineFriends = ['Alex', 'Sam'];
    return onlineFriends.includes(friendId) ? 'online' : 'offline';
  };



  const handleRemoveFriend = (friendUsername: string) => {
    if (!user) return;
    const currentFriends = user.friends || [];
    setUser({ ...user, friends: currentFriends.filter(fid => fid !== friendUsername) });
  };

  const handleAcceptFriendRequest = (friendUsername: string) => {
    if (!user) return;
    const currentFriends = user.friends || [];
    const currentRequests = user.friendRequests?.received || [];
    setUser({ 
      ...user, 
      friends: [...currentFriends, friendUsername],
      friendRequests: {
        ...user.friendRequests,
        received: currentRequests.filter(fid => fid !== friendUsername)
      }
    });
  };

  const handleRejectFriendRequest = (friendUsername: string) => {
    if (!user) return;
    const currentRequests = user.friendRequests?.received || [];
    setUser({ 
      ...user, 
      friendRequests: {
        ...user.friendRequests,
        received: currentRequests.filter(fid => fid !== friendUsername)
      }
    });
  };



  const triggerAIInsights = () => {
    showAgent({
      gameId: 'profile-analysis',
      agentPersonality: 'analyst',
      sessionData: {
        userLevel: user.profile.rank,
        totalXP: user.profile.xp,
        totalStars: user.profile.stars,
        gamesPlayed: Object.keys(user.profile.gameProgress).length,
        totalPlayTime: Object.values(user.profile.gameProgress).reduce((sum, game) => sum + (game.playTime || 0), 0)
      }
    });

  };

  const getProgressPercentage = () => {
    const currentXP = user.profile.xp;
    const nextLevelXP = user.profile.xpToNextLevel;
    return Math.min((currentXP / nextLevelXP) * 100, 100);
  };

  const getNextLevelXP = () => {
    const currentXP = user.profile.xp;
    const nextLevelXP = user.profile.xpToNextLevel;
    return nextLevelXP - currentXP;
  };

  const getCurrentLevel = () => {
    const currentXP = user.profile.xp;
    const nextLevelXP = user.profile.xpToNextLevel;
    return Math.floor(currentXP / 100) + 1;
  };

  const getTopGames = () => {
    return Object.entries(user.profile.gameProgress)
      .sort(([,a], [,b]) => (b.bestScore || 0) - (a.bestScore || 0))
      .slice(0, 3);
  };

  const getRecentActivity = () => {
    // Safely get recent activity to prevent crashes
    try {
      return user.journeyLog ? user.journeyLog.slice(-5).reverse() : [];
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'friends', label: 'Friends', icon: Users2 },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'ai-insights', label: 'AI Insights', icon: Brain },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];



  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Profile Header */}
        <div className={`backdrop-blur-xl rounded-2xl p-8 mb-8 transition-all duration-500 hover:transform hover:scale-[1.02] ${
          isDarkMode 
            ? 'bg-black/50 border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)]' 
            : 'bg-white/90 border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
        }`}>
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center text-center lg:text-left">
              <div className="relative">
                <img
                  src={user.profile.avatar}
            alt="Avatar"
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-600 shadow-lg mb-4 transition-all hover:scale-105"
                />
                <div className="absolute -top-2 -left-4 bg-green-500 w-6 h-6 rounded-full border-2 border-white dark:border-gray-600"></div>
              </div>
                            <div className="flex items-center gap-2 mb-2">
                {editingUsername ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="text-4xl font-bold text-purple-900 dark:text-white bg-transparent border-b-2 border-purple-300 dark:border-purple-600 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
                      autoFocus
                    />
                    <button
                      onClick={handleUsernameSave}
                      disabled={isLoading}
                      className={`p-1 transition-colors ${
                        isLoading 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-green-600 hover:text-green-700 hover:scale-110'
                      }`}
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                    </button>
                                        <button 
                      onClick={handleUsernameCancel}
                      disabled={isLoading}
                      className={`p-1 transition-colors ${
                        isLoading 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-red-600 hover:text-red-700 hover:scale-110'
                      }`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-4xl font-bold text-purple-900 dark:text-white">
                      {user.username}
                    </h1>
                    <button
                      onClick={() => setEditingUsername(true)}
                      className="p-1 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-4 items-center mb-4">
                <span className="text-lg font-semibold text-purple-700 dark:text-purple-300">{user.role}</span>
                {user.age && <span className="text-lg text-gray-600 dark:text-gray-400">Age: {user.age}</span>}
              </div>
            </div>

            {/* Stats and Progress */}
            <div className="flex-1 space-y-6">
              {/* Level Progress - Dark Blue Purple Gradient */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Crown className="w-8 h-8 text-yellow-400" />
                    <div>
                      <h3 className="text-xl font-bold text-white">{user.profile.rank}</h3>
                      <p className="text-purple-100">Level Progress</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{user.profile.xp} XP</div>
                    <div className="text-sm text-purple-100">Next: {getNextLevelXP()} XP</div>
                  </div>
                </div>
                <div className="w-full rounded-full h-4 mb-2 bg-indigo-800">
                  <div 
                    className="rounded-full h-4 transition-all duration-500 bg-gradient-to-r from-yellow-400 to-orange-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
                <div className="text-sm text-purple-100">
                  Current Level: {getCurrentLevel()}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`rounded-xl p-4 text-center transition-all duration-500 hover:transform hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-black/40 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)]' 
                    : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
                }`}>
                  <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-900 dark:text-white">{user.profile.stars}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Stars</div>
                </div>
                <div className={`rounded-xl p-4 text-center transition-all duration-500 hover:transform hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-black/40 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)]' 
                    : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
                }`}>
                  <Trophy className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-900 dark:text-white">{Object.keys(user.profile.gameProgress).length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Games</div>
                </div>
                <div className={`rounded-xl p-4 text-center transition-all duration-500 hover:transform hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-black/40 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)]' 
                    : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
                }`}>
                  <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-900 dark:text-white">{user.friends.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Friends</div>
                </div>
                <div className={`rounded-xl p-4 text-center transition-all duration-500 hover:transform hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-black/40 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)]' 
                    : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
                }`}>
                  <Clock className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-900 dark:text-white">
                    {Math.round(Object.values(user.profile.gameProgress).reduce((sum, game) => sum + (game.playTime || 0), 0) / 60000)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Minutes</div>
                </div>
              </div>
          </div>
          </div>

          {/* Bio Section */}
          <div className="mt-8">
            {editing ? (
              <div className="space-y-4">
                  <textarea
                  className="w-full p-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                  placeholder="Tell us about yourself..."
                  />
                  <div className="flex gap-2">
                  <button 
                    className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                      isLoading
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 hover:scale-105'
                    }`}
                    onClick={handleBioSave}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    className="px-6 py-2 rounded-xl bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-500 transition-all" 
                    onClick={() => setEditing(false)}
                  >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                </div>
                {bioSaved && <span className="font-semibold text-green-600">Saved!</span>}
                </div>
              ) : (
              <div className={`rounded-xl p-6 transition-all duration-500 hover:transform hover:scale-[1.01] ${
                isDarkMode 
                  ? 'bg-black/50 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)]' 
                  : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-purple-900 dark:text-white">About Me</h3>
                  <button 
                    className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                      isLoading
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 hover:scale-105'
                    }`}
                    onClick={() => setEditing(true)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Edit2 className="w-4 h-4" />
                    )}
                    {isLoading ? 'Saving...' : 'Edit'}
                  </button>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-lg">
                  {user.profile.about || "No bio yet. Click edit to add one!"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`backdrop-blur-xl rounded-2xl p-4 mb-8 transition-all duration-500 ${
          isDarkMode 
            ? 'bg-black/50 border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)]' 
            : 'bg-white/90 border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)]'
        }`}>
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg'
                      : 'bg-white/60 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-600/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className={`backdrop-blur-xl rounded-2xl p-8 transition-all duration-500 ${
          isDarkMode 
            ? 'bg-black/50 border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)]' 
            : 'bg-white/90 border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)]'
        }`}>
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-purple-900 dark:text-white mb-6">Overview</h2>
              
              {/* Recent Activity */}
              <div>
                <h3 className="text-xl font-bold text-purple-900 dark:text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {getRecentActivity().map((activity, index) => (
                    <div key={index} className={`rounded-xl p-4 flex items-center justify-between transition-all duration-500 hover:transform hover:scale-[1.02] ${
                      isDarkMode 
                        ? 'bg-black/40 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)]' 
                        : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
                    }`}>
                      <div>
                        <h4 className="font-semibold text-purple-900 dark:text-white">{activity.title}</h4>
                        <p className="text-gray-600 dark:text-gray-400">{activity.content}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">{activity.date}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-green-600 font-bold">+{activity.xpEarned} XP</div>
                      </div>
                    </div>
                  ))}
                </div>
                  </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-xl font-bold text-purple-900 dark:text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <button 
                    onClick={() => navigate('/playground')}
                    className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-4 rounded-xl hover:from-purple-600 hover:to-blue-700 transition-all flex flex-col items-center gap-2"
                  >
                    <Gamepad2 className="w-6 h-6" />
                    <span className="font-semibold">Play Games</span>
                  </button>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all flex flex-col items-center gap-2"
                  >
                    <BarChart3 className="w-6 h-6" />
                    <span className="font-semibold">Learning Central</span>
                  </button>
                  <button 
                    onClick={() => navigate('/forum')}
                    className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4 rounded-xl hover:from-orange-600 hover:to-red-700 transition-all flex flex-col items-center gap-2"
                  >
                    <MessageCircle className="w-6 h-6" />
                    <span className="font-semibold">Forum</span>
                  </button>
                  <button 
                    onClick={triggerAIInsights}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all flex flex-col items-center gap-2"
                  >
                    <Brain className="w-6 h-6" />
                    <span className="font-semibold">AI Insights</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'games' && (
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-purple-900 dark:text-white mb-6">Games Progress</h2>
              
              {/* Top Games */}
              <div>
                <h3 className="text-xl font-bold text-purple-900 dark:text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Top Games
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {getTopGames().map(([gameId, progress]) => (
                    <div key={gameId} className={`rounded-xl p-6 transition-all duration-500 hover:transform hover:scale-105 ${
                      isDarkMode 
                        ? 'bg-black/40 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)]' 
                        : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-purple-900 dark:text-white capitalize">{gameId.replace(/([A-Z])/g, ' $1').trim()}</h4>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{progress.bestScore}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Best Score</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Level</span>
                          <span className="font-semibold">{progress.level}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Stars</span>
                          <span className="font-semibold text-yellow-600">{progress.stars}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Times Played</span>
                          <span className="font-semibold">{progress.timesPlayed}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Play Time</span>
                          <span className="font-semibold">{Math.round((progress.playTime || 0) / 60000)}m</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
        </div>

              {/* All Games */}
              <div>
                <h3 className="text-xl font-bold text-purple-900 dark:text-white mb-4 flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5" />
                  All Games
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {Object.entries(user.profile.gameProgress).map(([gameId, progress]) => (
                    <div key={gameId} className={`rounded-xl p-4 flex items-center justify-between transition-all duration-500 hover:transform hover:scale-105 ${
                      isDarkMode 
                        ? 'bg-black/40 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)]' 
                        : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
                    }`}>
                      <div>
                        <h4 className="font-semibold text-purple-900 dark:text-white capitalize">{gameId.replace(/([A-Z])/g, ' $1').trim()}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Level {progress.level} • {progress.stars} stars</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">{progress.bestScore}</div>
                        <div className="text-xs text-gray-500">Best Score</div>
                      </div>
                    </div>
                  ))}
                </div>
          </div>
                  </div>
          )}

          {activeTab === 'friends' && (
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-purple-900 dark:text-white mb-6">Friends</h2>
              
              {/* Friends List */}
              <div>
                <h3 className="text-xl font-bold text-purple-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Friends ({(user.friends || []).length})
                </h3>
                {!user.friends || user.friends.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No friends yet. Find friends in the forum!</p>
                    <button 
                      onClick={() => navigate('/forum')}
                      className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-xl hover:from-purple-600 hover:to-blue-700 transition-all"
                    >
                      Go to Forum
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                        {(user.friends || []).map(friendId => (
                      <div key={friendId} className={`rounded-xl p-4 flex items-center justify-between transition-all duration-500 hover:transform hover:scale-105 ${
                        isDarkMode 
                          ? 'bg-black/40 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)]' 
                          : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-300 to-blue-200 flex items-center justify-center">
                              <UserPlus className="w-6 h-6 text-white" />
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                              getOnlineStatus(friendId) === 'online' 
                                ? 'bg-green-500' 
                                : 'bg-gray-400'
                            }`}></div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-purple-900 dark:text-white">{friendId}</h4>
                            <p className={`text-sm ${
                              getOnlineStatus(friendId) === 'online' 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {getOnlineStatus(friendId) === 'online' ? 'Online' : 'Offline'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setSelectedChatFriend(friendId);
                              setShowChat(true);
                            }}
                            className="px-3 py-1 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 hover:scale-105 transition-all text-sm font-medium"
                          >
                            Chat
                          </button>
                          <button 
                            onClick={() => handleRemoveFriend(friendId)}
                            className="px-3 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 hover:scale-105 transition-all text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
            </div>
          )}
        </div>

              {/* Friend Requests */}
              <div>
                <h3 className="text-xl font-bold text-purple-900 dark:text-white mb-4 flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Friend Requests ({(user.friendRequests?.received || []).length})
                </h3>
                {!user.friendRequests?.received || user.friendRequests.received.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400">No pending requests.</p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {(user.friendRequests.received || []).map(friendId => (
                      <div key={friendId} className={`rounded-xl p-4 flex items-center justify-between transition-all duration-500 hover:transform hover:scale-105 ${
                        isDarkMode 
                          ? 'bg-black/40 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)]' 
                          : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-300 to-blue-200 flex items-center justify-center">
                            <UserPlus className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-purple-900 dark:text-white">{friendId}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Wants to be friends</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAcceptFriendRequest(friendId)}
                            className="px-3 py-1 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 hover:scale-105 transition-all text-sm font-medium"
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => handleRejectFriendRequest(friendId)}
                            className="px-3 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 hover:scale-105 transition-all text-sm font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-purple-900 dark:text-white mb-6">Activity Log</h2>
              
              {/* Journey Log */}
              <div>
                <h3 className="text-xl font-bold text-purple-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Learning Journey
                </h3>
                <div className="space-y-4">
                  {user.journeyLog && user.journeyLog.length > 0 ? (
                    user.journeyLog.map((entry, index) => (
                      <div key={index} className={`rounded-xl p-6 transition-all duration-500 hover:transform hover:scale-105 ${
                        isDarkMode 
                          ? 'bg-black/40 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)]' 
                          : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-purple-900 dark:text-white mb-2">{entry.title}</h4>
                            <p className="text-gray-700 dark:text-gray-300 mb-3">{entry.content}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">{entry.date}</p>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-green-600 font-bold text-lg">+{entry.xpEarned} XP</div>
                            <div className="text-sm text-gray-500">Earned</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No activity yet. Start playing games to see your journey!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h3 className="text-xl font-bold text-purple-900 dark:text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Statistics
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`rounded-xl p-4 text-center transition-all duration-500 hover:transform hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-black/40 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)]' 
                      : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
                  }`}>
                    <div className="text-3xl font-bold text-purple-600">{user.journeyLog ? user.journeyLog.length : 0}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Activities</div>
                  </div>
                  <div className={`rounded-xl p-4 text-center transition-all duration-500 hover:transform hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-black/40 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)]' 
                      : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
                  }`}>
                    <div className="text-3xl font-bold text-blue-600">
                      {user.journeyLog ? user.journeyLog.reduce((sum, entry) => sum + entry.xpEarned, 0) : 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total XP Earned</div>
                  </div>
                  <div className={`rounded-xl p-4 text-center transition-all duration-500 hover:transform hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-black/40 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)]' 
                      : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
                  }`}>
                    <div className="text-3xl font-bold text-green-600">
                      {Object.keys(user.profile.gameProgress).length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Games Played</div>
                  </div>
                  <div className={`rounded-xl p-4 text-center transition-all duration-500 hover:transform hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-black/40 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)]' 
                      : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
                  }`}>
                    <div className="text-3xl font-bold text-yellow-600">
                      {Math.round(Object.values(user.profile.gameProgress).reduce((sum, game) => sum + (game.playTime || 0), 0) / 60000)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Minutes Played</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai-insights' && (
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-purple-900 dark:text-white mb-6">AI Insights</h2>
              
              {/* AI Analysis - Dark Blue Purple Gradient */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-6 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <Brain className="w-8 h-8 text-blue-300" />
                  <div>
                    <h3 className="text-xl font-bold text-white">Synapse AI Analysis</h3>
                    <p className="text-purple-100">Your personalized learning insights</p>
                  </div>
                </div>
                <button 
                  onClick={triggerAIInsights}
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  Get AI Insights
                </button>
              </div>

              {/* AI Assistant */}
              <div>
                <h3 className="text-xl font-bold text-purple-900 dark:text-white mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  AI Assistant
                </h3>
                <AIAssistant />
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-purple-900 dark:text-white mb-6">Settings</h2>
              
              {/* Account Settings */}
              <div>
                <h3 className="text-xl font-bold text-purple-900 dark:text-white mb-4 flex items-center gap-2">
                  <Cog className="w-5 h-5" />
                  Account Settings
                </h3>
                <div className="space-y-4">
                  <div className={`rounded-xl p-4 transition-all duration-500 hover:transform hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-black/40 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)]' 
                      : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)]'
                  }`}>
                    <h4 className="font-semibold text-purple-900 dark:text-white mb-2">Profile Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Username:</span>
                        <span className="font-semibold">{user.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Email:</span>
                        <span className="font-semibold">{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Role:</span>
                        <span className="font-semibold capitalize">{user.role}</span>
                      </div>
                      {user.age && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Age:</span>
                          <span className="font-semibold">{user.age}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
        </div>

              {/* Privacy Settings */}
              <div>
                <h3 className="text-xl font-bold text-purple-900 dark:text-white mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  Privacy & Safety
                </h3>
                <div className="space-y-4">
                  <button className={`w-full rounded-xl p-4 text-left transition-all duration-500 hover:transform hover:scale-[1.02] ${
                    isDarkMode 
                      ? 'bg-black/40 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)] hover:bg-black/60' 
                      : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)] hover:bg-white/95'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-purple-900 dark:text-white">Privacy Settings</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Manage your privacy preferences</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                  <button className={`w-full rounded-xl p-4 text-left transition-all duration-500 hover:transform hover:scale-[1.02] ${
                    isDarkMode 
                      ? 'bg-black/40 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)] hover:shadow-[0_12px_24px_-12px_rgba(255,255,255,0.12)] hover:bg-black/60' 
                      : 'bg-white/90 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.35)] hover:bg-white/95'
                  }`}>
                    <div className="flex items-center justify-between">
          <div>
                        <h4 className="font-semibold text-purple-900 dark:text-white">Blocked Users</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Manage blocked users</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                </div>
              </div>
          </div>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && selectedChatFriend && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`w-full max-w-md mx-4 rounded-2xl p-6 transition-all duration-500 ${
            isDarkMode 
              ? 'bg-black/80 backdrop-blur-xl border-2 border-white/30 shadow-[0_8px_16px_-12px_rgba(255,255,255,0.08)]' 
              : 'bg-white/95 backdrop-blur-xl border-2 border-black/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-300 to-blue-200 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                    getOnlineStatus(selectedChatFriend) === 'online' 
                      ? 'bg-green-500' 
                      : 'bg-gray-400'
                  }`}></div>
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900 dark:text-white">{selectedChatFriend}</h3>
                  <p className={`text-sm ${
                    getOnlineStatus(selectedChatFriend) === 'online' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {getOnlineStatus(selectedChatFriend) === 'online' ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowChat(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Chat Messages Area */}
            <div className={`h-64 mb-4 rounded-xl p-4 overflow-y-auto ${
              isDarkMode ? 'bg-black/40 border border-white/20' : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                Start a conversation with {selectedChatFriend}!
              </div>
            </div>
            
            {/* Message Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your message..."
                className={`flex-1 px-4 py-2 rounded-xl border-2 ${
                  isDarkMode 
                    ? 'bg-black/40 border-white/30 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:border-purple-500 focus:outline-none`}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatMessage.trim()}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  chatMessage.trim()
                    ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage; 