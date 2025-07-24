import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { Check, Star } from 'lucide-react';

const LICENSE_TEXT = `Copyright (c) 2025 Neuraplay

This Software License Agreement ("Agreement") governs the access and use of Neuraplay ("Software"), an interactive software service developed and owned by [Your Name or Legal Entity], operating under the laws of the Republic of Kazakhstan.

By accessing, downloading, or using the Software, you ("User") agree to be bound by the terms of this Agreement.

1. LICENSE GRANT
Neuraplay grants the User a limited, non-transferable, non-exclusive, revocable license to access and use the Software strictly for personal or internal educational purposes, subject to the terms herein.

2. SUBSCRIPTION AND BILLING
Access to the Software is provided on a recurring subscription basis or through a free access tier ("Community"). Users agree to be billed monthly for paid subscriptions. Neuraplay reserves the right to adjust pricing, features, and access tiers at any time, with prior notice. Free access is granted at the sole discretion of Neuraplay.

3. RESTRICTIONS
The User shall not:

Copy, modify, distribute, sublicense, or resell the Software or its core components;

Reverse engineer, decompile, or disassemble any part of the Software;

Use the Software or its content, including its underlying principles and game structures, to build, train, or enhance competing products, platforms, or AI systems;

Circumvent access controls or share account credentials;

Use the Software in any unlawful manner or to generate content that violates the Prohibited Use policies of Neuraplay or its integrated Third-Party Services.

4. OWNERSHIP AND CONTENT RIGHTS
4.1. Neuraplay Intellectual Property. All rights, title, and interest in and to the Software—including its design, code, branding, game mechanics, and all content provided by Neuraplay (excluding User Content and AI-Generated Content)—are and shall remain the exclusive property of Neuraplay. This includes the brand names Neuraplay™ and Synaptic-AI™.

4.2. User-Generated Content. Users may post content in community forums or on their profiles ("User-Generated Content"). By posting such content, the User grants Neuraplay a worldwide, non-exclusive, royalty-free, perpetual license to use, reproduce, display, distribute, and prepare derivative works of the User-Generated Content in connection with operating and promoting the Software.

4.3. AI-Generated Content. The Software may allow the User to generate content, such as stories or videos, using integrated artificial intelligence tools ("AI-Generated Content"). Subject to this Agreement and the terms of any applicable Third-Party Service, the User owns the rights to the specific AI-Generated Content they create.

5. THIRD-PARTY SERVICES
The Software integrates features from third-party service providers, including but not limited to AI models for video generation (e.g., Google's Veo) and Text-to-Speech (TTS) services. The User's use of these features is subject to the terms and policies of those third-party providers. Neuraplay is not responsible or liable for the availability, accuracy, or content of these Third-Party Services.

6. EXPERT REVIEW AND DISCLAIMERS
The Software's content is informed by professionals in neuropsychology and clinical psychology. However, it is provided for educational and entertainment purposes only.

The Software is not a substitute for medical advice, diagnosis, or treatment.

AI-Generated Content is produced by automated systems and has not been reviewed by experts. Neuraplay does not guarantee its accuracy, appropriateness, or safety. Use is at the User’s own risk.

7. NO WARRANTIES
The Software is provided "AS IS" and "AS AVAILABLE," without warranties of any kind, express or implied. Neuraplay expressly disclaims all warranties, including but not limited to fitness for a particular purpose, merchantability, non-infringement, and any warranties regarding the reliability, content, or availability of the Software or its integrated Third-Party Services.

8. LIMITATION OF LIABILITY
Under no circumstances shall Neuraplay or its affiliates be liable for any indirect, incidental, special, or consequential damages, including but not limited to loss of data, revenue, or use, arising from or related to the use of the Software or any content generated therein.

9. TERMINATION
Neuraplay may suspend or terminate User access at any time if terms of this Agreement are violated. Upon termination, the User must immediately cease all use of the Software.

10. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of the Republic of Kazakhstan. Any disputes shall be subject to the exclusive jurisdiction of the courts of Kazakhstan.

11. CONTACT
For licensing, support, or legal inquiries, contact:
Neuraplay
[Your Website or Email Address]
`;

const RegistrationPage: React.FC = () => {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    role: '',
    age: 5,
    username: '',
    email: '',
    avatar: '/assets/placeholder.png',
    agreeToTerms: false
  });
  const [avatarPrompt, setAvatarPrompt] = useState('');
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [generatedAvatars, setGeneratedAvatars] = useState<string[]>([]);
  const [avatarGenerated, setAvatarGenerated] = useState(false);
  const [showLicense, setShowLicense] = useState(false);

  const avatars = [
    ...generatedAvatars
  ];

  const handleStepOne = () => {
    if (!formData.role || !formData.username.trim() || !formData.email.trim() || !formData.agreeToTerms) {
      alert('Please fill out all fields and agree to the terms.');
      return;
    }
    setStep(2);
  };

  const handleComplete = () => {
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
      hasPosted: false,
      friends: [],
      friendRequests: { sent: [], received: [] }
    };
    
    setUser(newUser);
    setStep(3);
    
    setTimeout(() => {
      navigate(formData.role === 'learner' ? '/playground' : '/forum');
    }, 2000);
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
        setAvatarGenerated(true);
      } else {
        setAvatarError('Failed to generate avatar. Please try again.');
      }
    } catch (error) {
      setAvatarError('Error generating avatar. Please try again.');
    } finally {
      setGeneratingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 to-purple-600 text-white py-24 px-6">
      <div className="container mx-auto max-w-2xl">
        {step === 1 && (
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-4">
              The best investment you will ever make is your child
            </h1>
            <p className="text-xl text-violet-200">
              Their education is priceless. Seriously.
            </p>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20">
          {step === 1 && (
            <div>
              <h2 className="text-3xl font-bold mb-8 text-center">Create your account</h2>
              <div className="space-y-6">
                <div>
                  <label className="block font-bold mb-3">I am a...</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['learner', 'parent'].map(role => (
                      <button
                        key={role}
                        onClick={() => setFormData({ ...formData, role })}
                        className={`p-4 rounded-xl font-semibold transition-all ${
                          formData.role === role
                            ? 'bg-white text-violet-600 shadow-lg'
                            : 'bg-white/20 hover:bg-white/30'
                        }`}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.role === 'learner' && (
                  <div>
                    <label className="block font-bold mb-3">Learner's age</label>
                    <select
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                      className="w-full p-4 rounded-xl bg-white/20 border border-white/30 text-white"
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
                  className="w-full p-4 rounded-xl bg-white/20 border border-white/30 placeholder-white/70 text-white"
                />

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-4 rounded-xl bg-white/20 border border-white/30 placeholder-white/70 text-white"
                />

                {/* Move avatar selection UI here */}
                <div>
                  <h4 className="font-bold mb-3">Choose your hero avatar</h4>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={avatarPrompt}
                      onChange={e => setAvatarPrompt(e.target.value)}
                      placeholder="Describe your avatar (e.g. brave robot, magical cat)"
                      className="flex-1 px-3 py-2 rounded-lg border border-white/30 text-black"
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
                  {avatarError && <div className="text-red-200 text-sm mb-2">{avatarError}</div>}
                  {/* Centered avatar preview below the generate bar */}
                  <div className="flex justify-center my-4 min-h-[96px]">
                    {generatingAvatar ? (
                      <div className="w-24 h-24 rounded-full border-4 border-violet-200 shadow-lg flex items-center justify-center bg-white/40 text-violet-700 font-bold text-center">
                        Making avatar...
                      </div>
                    ) : (
                      avatarGenerated && formData.avatar && (
                        <img
                          src={formData.avatar}
                          alt="Avatar Preview"
                          className="w-24 h-24 rounded-full border-4 border-violet-200 shadow-lg"
                        />
                      )
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={formData.agreeToTerms}
                    onChange={e => {
                      if (!formData.agreeToTerms) {
                        setShowLicense(true);
                      } else {
                        setFormData({ ...formData, agreeToTerms: false });
                      }
                    }}
                    className="w-5 h-5 rounded"
                  />
                  <label htmlFor="terms" className="text-sm">
                    I have read and agree to the <button type="button" className="underline text-violet-200 hover:text-violet-400" onClick={() => setShowLicense(true)}>terms of service & license</button>
                  </label>
                </div>
                {showLicense && (
                  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full relative">
                      <button onClick={() => setShowLicense(false)} className="absolute top-4 right-4 text-slate-500 hover:text-violet-600 text-2xl font-bold">&times;</button>
                      <h2 className="text-2xl font-bold mb-4 text-violet-700">Neuraplay License Agreement</h2>
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap max-h-[60vh] overflow-y-auto">{LICENSE_TEXT}</pre>
                      <button onClick={() => {
                        setShowLicense(false);
                        setFormData({ ...formData, agreeToTerms: true });
                      }} className="mt-6 bg-violet-600 text-white font-bold px-6 py-2 rounded-full hover:bg-violet-700 transition-all block mx-auto">Accept & Close</button>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleStepOne}
                  disabled={!formData.agreeToTerms}
                  className="w-full bg-white text-violet-600 font-bold py-4 rounded-full hover:bg-slate-100 transition-all disabled:opacity-50"
                >
                  Next: Address & payment
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-3xl font-bold mb-8 text-center">Billing information</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full name"
                  className="w-full p-4 rounded-xl bg-white/20 border border-white/30 placeholder-white/70 text-white"
                />
                <input
                  type="text"
                  placeholder="Address"
                  className="w-full p-4 rounded-xl bg-white/20 border border-white/30 placeholder-white/70 text-white"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="City"
                    className="w-full p-4 rounded-xl bg-white/20 border border-white/30 placeholder-white/70 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Postal code"
                    className="w-full p-4 rounded-xl bg-white/20 border border-white/30 placeholder-white/70 text-white"
                  />
                </div>
                <div className="bg-white/20 p-6 rounded-xl border border-white/30">
                  <h4 className="font-bold mb-4">Credit card information (Demo)</h4>
                  <input
                    type="text"
                    placeholder="Card number (e.g., 4242 4242 4242 4242)"
                    className="w-full p-4 rounded-xl bg-white/20 border border-white/30 placeholder-white/70 text-white mb-4"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full p-4 rounded-xl bg-white/20 border border-white/30 placeholder-white/70 text-white"
                    />
                    <input
                      type="text"
                      placeholder="CVC"
                      className="w-full p-4 rounded-xl bg-white/20 border border-white/30 placeholder-white/70 text-white"
                    />
                  </div>
                </div>
                <button
                  onClick={handleComplete}
                  className="w-full bg-white text-violet-600 font-bold py-4 rounded-full hover:bg-slate-100 transition-all"
                >
                  Complete purchase ($10)
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-green-400 mb-4">Success!</h2>
              <p className="text-xl">
                Your journey begins now. Welcome to the family!
              </p>
              <div className="flex justify-center mt-6">
                <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;