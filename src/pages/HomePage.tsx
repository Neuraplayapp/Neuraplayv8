import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FullscreenPopper } from '../components/FullscreenPopper';
import { Brain, Target, Sparkles } from 'lucide-react';
import AIDemoSection from '../components/AIDemoSection';

const HomePage: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const features = [
    {
      id: 0,
      title: "Neuro-psychological teaching methods",
      description: "Every game, story, and challenge is built upon proven neuropsychological principles like CBT, IPT, and Family Therapy, adapted by experts to be engaging and effective for young minds.",
      icon: <Brain className="w-8 h-8 text-violet-600" />
    },
    {
      id: 1,
      title: "Tailor-made for the learner",
      description: "Our Synaptic-AI™ is specifically developed to be adaptive and intuitive, whether teaching mathematics, language, or fostering creative development. Designed with children in mind, it uses positive reinforcement, age-appropriate language, and playful interactions to make learning safe, engaging, and effective for every child.",
      icon: <Target className="w-8 h-8 text-violet-600" />
    },
    {
      id: 2,
      title: "The Montessori approach",
      description: "We embrace the Montessori philosophy of self-directed discovery. Our app provides the tools and the prepared environment; your child leads the way, fostering independence and a true love of learning.",
      icon: <Sparkles className="w-8 h-8 text-violet-600" />
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-8 pb-8 flex items-center justify-center text-center p-6 bg-gradient-to-br from-violet-50 to-purple-50">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-8xl font-black text-slate-900 leading-tight tracking-tighter mb-8 animate-fade-in">
            Your Child is a
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600"> Genius</span>
          </h1>
          <p className="text-xl md:text-2xl max-w-4xl mx-auto text-slate-600 mb-12 animate-fade-in-delay">
            Unlock the potential with scientifically-backed neuropsychological games designed for ages 3-12.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delay-2">
            <Link
              to="/registration"
              className="bg-violet-600 text-white font-bold px-10 py-4 rounded-full hover:bg-violet-700 transition-all duration-300 transform hover:scale-105 shadow-2xl text-lg"
            >
              Start the transformation
            </Link>
            <Link
              to="/playground"
              className="bg-white text-violet-600 font-bold px-10 py-4 rounded-full hover:bg-slate-50 transition-all duration-300 transform hover:scale-105 shadow-lg text-lg border-2 border-violet-200"
            >
              Try the games
            </Link>
          </div>
        </div>
      </section>

      {/* AI Demo Section */}
      <AIDemoSection />

      {/* FullscreenPopper for introvid1 - moved here to be closer to AI Demo Section */}
      <FullscreenPopper videoSrc="/assets/Videos/neuraplayintrovid1.mp4">
        <h2 className="text-5xl font-bold text-main mb-6">
          Expert-Led Methods
        </h2>
        <p className="text-2xl text-slate-600 leading-relaxed">
          Our platform integrates proven neuropsychological principles to make learning both engaging and effective for young minds.
        </p>
      </FullscreenPopper>

      {/* FullscreenPopper for introvid3 */}
      <FullscreenPopper videoSrc="/assets/Videos/Neuraplayintrovid3.mp4">
        <h2 className="text-5xl font-bold text-main mb-6">
          Hear the Science Behind the Fun
        </h2>
        <p className="text-2xl text-slate-600 leading-relaxed">
          Unlock their full potential with proven neuropsychological methods like CBT and developmental science, all integrated into playful games. <b>Click the video to unmute and learn more.</b>
        </p>
      </FullscreenPopper>

      {/* --- SECTIONS MOVED TO BOTTOM AS REQUESTED --- */}

      {/* Value Proposition Section */}
      <section className="bg-white py-24 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight mb-6">
            An investment in their future is priceless
          </h2>
          <p className="text-xl max-w-3xl mx-auto text-slate-500">
            For less than the cost of a single tutor session, you can provide a lifetime of advantage. Our experts have curated decades of science into one revolutionary psychoeducational tool.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-50 py-24 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-8">
                A whole new way to learn
              </h2>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <button
                    key={feature.id}
                    onClick={() => setActiveFeature(index)}
                    className={`w-full p-6 rounded-xl text-left transition-all duration-300 ${
                      activeFeature === index
                        ? 'bg-violet-600 text-white shadow-lg scale-105'
                        : 'bg-white border border-slate-200 hover:border-violet-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {feature.icon}
                      <h3 className="text-lg font-semibold">{feature.title}</h3>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-2xl border min-h-[400px] flex flex-col justify-center">
              <div className="flex items-center gap-4 mb-6">
                {features[activeFeature].icon}
                <h3 className="font-bold text-2xl text-violet-600">
                  {features[activeFeature].title}
                </h3>
              </div>
              <p className="text-slate-600 text-lg leading-relaxed">
                {features[activeFeature].description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-violet-600 to-purple-600 text-white py-24 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-md">
            Ready to unlock your child's potential?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of families who have already discovered the power of neuropsychological learning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/registration"
              className="bg-white text-violet-600 font-bold px-8 py-4 rounded-full hover:bg-slate-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Start Full Journey ($10)
            </Link>
            <Link
              to="/forum-registration"
              className="bg-violet-700 text-white font-bold px-8 py-4 rounded-full hover:bg-violet-800 transition-all duration-300 transform hover:scale-105"
            >
              Join Community (Free)
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;