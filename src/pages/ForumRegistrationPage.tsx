import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';

const ForumRegistrationPage: React.FC = () => {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    role: '',
    age: 5,
    username: '',
    email: '',
    avatar: '/assets/placeholder.png'
  });
  const [avatarPrompt, setAvatarPrompt] = useState('');
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [generatedAvatars, setGeneratedAvatars] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!formData.role || !formData.username.trim() || !formData.email.trim()) {
      alert('Please fill out all fields.');
      return;
    }

    const newUser = {
      id: Date.now().toString(),
      username: formData.username,
      email: formData.email,
      role: formData.role as 'learner' | 'parent',
      age: formData.role === 'learner' ? formData.age : undefined,
      profile: {
        avatar: formData.avatar,
        rank: 'New Learner',
        xp: 0,
        xpToNextLevel: 100,
        stars: 0,
        about: '',
        gameProgress: {}
      },
      journeyLog: [],
      hasPosted: false
    };

    setUser(newUser);
    navigate('/forum');
  };

  const handleGenerateAvatar = async () => {
    if (!avatarPrompt.trim()) {
      setAvatarError('Please enter a description for your avatar.');
      return;
    }
    setGeneratingAvatar(true);
    setAvatarError('');
    try {
      const response = await fetch('/.netlify/functions/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: 'image',
          input_data: `Cartoon avatar, ${avatarPrompt}, child-friendly, bright colors, round face, smiling, high quality, detailed, 4k`
        })
      });
      const result = await response.json();
      if (result.data) {
        const imageBlob = `data:${result.contentType};base64,${result.data}`;
        setGeneratedAvatars(prev => [...prev, imageBlob]);
        setFormData({ ...formData, avatar: imageBlob });
      } else {
        setAvatarError('Failed to generate avatar. Please try again.');
      }
    } catch (error) {
      setAvatarError('Error generating avatar. Please try again.');
    } finally {
      setGeneratingAvatar(false);
    }
  };

  const avatars = [
    ...generatedAvatars
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 py-24 px-6 flex items-center justify-center">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <Users className="w-16 h-16 text-violet-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Join the community forum</h1>
          <p className="text-slate-600">Create a free account to post, reply, and connect with others.</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg border">
          <div className="space-y-6">
            <div>
              <label className="block font-bold mb-3 text-slate-900">I am a...</label>
              <div className="grid grid-cols-2 gap-4">
                {['learner', 'parent'].map(role => (
                  <button
                    key={role}
                    onClick={() => setFormData({ ...formData, role })}
                    className={`p-4 rounded-xl font-semibold transition-all border-2 ${
                      formData.role === role
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-violet-300'
                    }`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {formData.role === 'learner' && (
              <div>
                <label className="block font-bold mb-3 text-slate-900">Learner's age</label>
                <select
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  className="w-full p-4 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                >
                  <option value={4}>3-5</option>
                  <option value={7}>6-8</option>
                  <option value={10}>9-12</option>
                </select>
              </div>
            )}

            <input
              type="text"
              placeholder="Create a username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full p-4 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
            />

            <input
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-4 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
            />

            <div>
              <h4 className="font-bold mb-3 text-slate-900">Choose your hero avatar</h4>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={avatarPrompt}
                  onChange={e => setAvatarPrompt(e.target.value)}
                  placeholder="Describe your avatar (e.g. brave robot, magical cat)"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300"
                  disabled={generatingAvatar}
                />
                <button
                  type="button"
                  onClick={handleGenerateAvatar}
                  disabled={generatingAvatar || !avatarPrompt.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {generatingAvatar ? 'Generating...' : 'Generate AI Avatar'}
                </button>
              </div>
              {avatarError && <div className="text-red-500 text-sm mb-2">{avatarError}</div>}
              {/* Avatar Preview */}
              {formData.avatar && (
                <div className="flex justify-center mb-4">
                  <img
                    src={formData.avatar}
                    alt="Avatar Preview"
                    className="w-24 h-24 rounded-full border-4 border-violet-200 shadow-lg"
                  />
                </div>
              )}
              <div className="grid grid-cols-6 gap-3">
                {avatars.map(avatar => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar })}
                    className={`w-16 h-16 rounded-full transition-all ${
                      formData.avatar === avatar
                        ? 'ring-4 ring-violet-500 scale-110'
                        : 'hover:scale-105'
                    }`}
                  >
                    <img src={avatar} alt="Avatar" className="w-full h-full rounded-full" />
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-violet-600 text-white font-bold py-4 rounded-full hover:bg-violet-700 transition-all transform hover:scale-105"
            >
              Create free account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumRegistrationPage;