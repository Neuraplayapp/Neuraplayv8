import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  User, 
  Users, 
  MessageCircle, 
  Star, 
  Trophy, 
  BookOpen, 
  Calendar,
  Settings,
  Bell,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Heart,
  Share2,
  Bookmark
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';

interface Friend {
  id: string;
  username: string;
  avatar: string;
  rank: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

interface SocialActivity {
  id: string;
  type: 'achievement' | 'learning' | 'social' | 'game';
  title: string;
  description: string;
  timestamp: string;
  likes: number;
  comments: number;
  user: {
    username: string;
    avatar: string;
  };
}

const UserProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('profile');

  // Mock data
  const friends: Friend[] = [
    {
      id: '1',
      username: 'Alex',
      avatar: '/assets/images/placeholder.png',
      rank: 'Scholar',
      status: 'online',
    },
    {
      id: '2',
      username: 'Sarah',
      avatar: '/assets/images/placeholder.png',
      rank: 'Explorer',
      status: 'away',
      lastSeen: '2 min ago'
    },
    {
      id: '3',
      username: 'Mike',
      avatar: '/assets/images/placeholder.png',
      rank: 'Learner',
      status: 'offline',
      lastSeen: '1 hour ago'
    }
  ];

  const socialActivities: SocialActivity[] = [
    {
      id: '1',
      type: 'achievement',
      title: 'Memory Master',
      description: 'Completed 10 memory training sessions in a row!',
      timestamp: '2 hours ago',
      likes: 12,
      comments: 3,
      user: {
        username: 'Alex',
        avatar: '/assets/images/placeholder.png'
      }
    },
    {
      id: '2',
      type: 'learning',
      title: 'New Module Completed',
      description: 'Just finished the Advanced Problem Solving module',
      timestamp: '1 day ago',
      likes: 8,
      comments: 2,
      user: {
        username: 'Sarah',
        avatar: '/assets/images/placeholder.png'
      }
    },
    {
      id: '3',
      type: 'game',
      title: 'High Score!',
      description: 'Achieved a new high score in The Cube game',
      timestamp: '3 days ago',
      likes: 15,
      comments: 5,
      user: {
        username: 'Mike',
        avatar: '/assets/images/placeholder.png'
      }
    }
  ];

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'friends', label: 'Friends', icon: <Users className="w-4 h-4" /> },
    { id: 'social', label: 'Social', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'achievements', label: 'Achievements', icon: <Trophy className="w-4 h-4" /> }
  ];

  const isOwnProfile = user?.username === username;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-purple-300 hover:text-white transition-colors">
                ← Back to Dashboard
              </Link>
            </div>

            <div className="flex items-center space-x-2">
              <img 
                src={user?.profile?.avatar || '/assets/images/placeholder.png'} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm font-medium">{user?.username || 'User'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 mb-8 border border-white/10">
          <div className="flex items-center space-x-6">
            <img
              src={user?.profile?.avatar || '/assets/images/placeholder.png'}
              alt="Profile"
              className="w-24 h-24 rounded-full border-4 border-purple-500"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{username || 'User'}</h1>
              <p className="text-purple-300 mb-4">{user?.profile?.rank || 'Learner'}</p>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span>{user?.profile?.stars || 0} Stars</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-purple-400" />
                  <span>{user?.profile?.xp || 0} XP</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span>{friends.length} Friends</span>
                </div>
              </div>
            </div>
            {!isOwnProfile && (
              <button className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition-colors flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Friend</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-black/20 text-gray-300 hover:text-white hover:bg-black/30'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">About</h3>
                <p className="text-gray-300">
                  {user?.profile?.about || 'No bio available.'}
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4">Learning Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <BookOpen className="w-6 h-6 text-blue-400" />
                      <div>
                        <p className="text-sm text-gray-400">Modules Completed</p>
                        <p className="text-2xl font-bold">12</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-6 h-6 text-green-400" />
                      <div>
                        <p className="text-sm text-gray-400">Study Days</p>
                        <p className="text-2xl font-bold">45</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Trophy className="w-6 h-6 text-yellow-400" />
                      <div>
                        <p className="text-sm text-gray-400">Achievements</p>
                        <p className="text-2xl font-bold">8</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Friends ({friends.length})</h3>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search friends..."
                      className="pl-10 pr-4 py-2 bg-black/30 rounded-lg border border-white/20 text-white placeholder-gray-400"
                    />
                  </div>
                  <button className="p-2 hover:bg-black/30 rounded-lg transition-colors">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map(friend => (
                  <div key={friend.id} className="bg-black/30 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={friend.avatar}
                          alt={friend.username}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${
                          friend.status === 'online' ? 'bg-green-500' :
                          friend.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}></div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{friend.username}</h4>
                        <p className="text-sm text-gray-400">{friend.rank}</p>
                        {friend.lastSeen && (
                          <p className="text-xs text-gray-500">Last seen {friend.lastSeen}</p>
                        )}
                      </div>
                      <button className="p-2 hover:bg-black/30 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Social Feed</h3>
                <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors">
                  Share Activity
                </button>
              </div>

              <div className="space-y-4">
                {socialActivities.map(activity => (
                  <div key={activity.id} className="bg-black/30 rounded-lg p-4 border border-white/10">
                    <div className="flex items-start space-x-3">
                      <img
                        src={activity.user.avatar}
                        alt={activity.user.username}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold">{activity.user.username}</span>
                          <span className="text-sm text-gray-400">{activity.timestamp}</span>
                        </div>
                        <h4 className="font-medium mb-1">{activity.title}</h4>
                        <p className="text-gray-300 mb-3">{activity.description}</p>
                        <div className="flex items-center space-x-4">
                          <button className="flex items-center space-x-1 text-gray-400 hover:text-red-400 transition-colors">
                            <Heart className="w-4 h-4" />
                            <span className="text-sm">{activity.likes}</span>
                          </button>
                          <button className="flex items-center space-x-1 text-gray-400 hover:text-blue-400 transition-colors">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm">{activity.comments}</span>
                          </button>
                          <button className="flex items-center space-x-1 text-gray-400 hover:text-purple-400 transition-colors">
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button className="flex items-center space-x-1 text-gray-400 hover:text-yellow-400 transition-colors">
                            <Bookmark className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Achievements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: 'First Steps', description: 'Complete your first learning module', earned: true },
                  { title: 'Memory Master', description: 'Complete 10 memory training sessions', earned: true },
                  { title: 'Social Butterfly', description: 'Make 5 friends', earned: false },
                  { title: 'Dedicated Learner', description: 'Study for 7 days in a row', earned: true },
                  { title: 'Problem Solver', description: 'Complete all logic modules', earned: false },
                  { title: 'Creative Mind', description: 'Unlock all creativity exercises', earned: false }
                ].map((achievement, index) => (
                  <div key={index} className={`bg-black/30 rounded-lg p-4 border border-white/10 ${
                    achievement.earned ? 'opacity-100' : 'opacity-50'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <Trophy className={`w-8 h-8 ${achievement.earned ? 'text-yellow-400' : 'text-gray-600'}`} />
                      <div>
                        <h4 className="font-semibold">{achievement.title}</h4>
                        <p className="text-sm text-gray-400">{achievement.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage; 