import React, { useState, useLayoutEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { Link } from 'react-router-dom';
import { FileText, Loader2, ArrowLeft, Star, Trophy, Target, Brain, Zap, Crown, TrendingUp, Activity, Award, Sparkles } from 'lucide-react';
import { gsap } from 'gsap';

const AIReportPage: React.FC = () => {
  const { user } = useUser();
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  const glassPanelStyle = "bg-black/20 border border-white/10 backdrop-blur-md";

  useLayoutEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current, 
        { autoAlpha: 0, y: 20 }, 
        { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.1 }
      );
    }
  }, []);

  const generateReport = async () => {
    if (!user) return;

    setLoading(true);
    setError('');
    setReport('');

    try {
      // Prepare performance data
      const performanceData = {
        username: user.username,
        age: user.age,
        rank: user.profile.rank,
        totalXP: user.profile.xp,
        totalStars: user.profile.stars,
        gamesPlayed: Object.keys(user.profile.gameProgress).length,
        gameProgress: user.profile.gameProgress
      };

      const prompt = `As an educational psychologist, analyze this child's learning performance data and create a comprehensive, positive report highlighting their cognitive development, strengths, and achievements. Focus on growth mindset and encouragement.

Child Profile:
- Name: ${performanceData.username}
- Age: ${performanceData.age || 'Not specified'}
- Current Rank: ${performanceData.rank}
- Total Experience Points: ${performanceData.totalXP}
- Stars Earned: ${performanceData.totalStars}
- Games Completed: ${performanceData.gamesPlayed}

Game Performance Details:
${JSON.stringify(performanceData.gameProgress, null, 2)}

Please provide a warm, encouraging report that:
1. Celebrates specific achievements and progress
2. Identifies cognitive strengths demonstrated
3. Suggests areas for continued growth
4. Provides positive reinforcement for parents
5. Uses child-friendly language that could be shared with the learner

Keep the tone professional yet warm, focusing on the child's unique learning journey and potential.`;

      const response = await fetch('/.netlify/functions/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_type: 'summarization',
          input_data: prompt
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Extract the generated text from the response
      let generatedReport = '';
      console.log('AI Report result:', result);
      
      if (result[0] && result[0].generated_text) {
        generatedReport = result[0].generated_text.replace(prompt, '').trim();
      } else if (result[0] && result[0].summary_text) {
        generatedReport = result[0].summary_text;
      } else if (typeof result === 'string') {
        generatedReport = result;
      } else if (result && result.generated_text) {
        generatedReport = result.generated_text.replace(prompt, '').trim();
      } else if (result && result.summary_text) {
        generatedReport = result.summary_text;
      } else if (result && result.error) {
        throw new Error(result.error);
      } else {
        console.log('Fallback report - result:', result);
        generatedReport = 'Report generated successfully! Your child is making excellent progress in their learning journey.';
      }

      setReport(generatedReport);
    } catch (error) {
      console.error('Error generating report:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen text-slate-200 pt-24 pb-12">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className={`${glassPanelStyle} p-12 rounded-2xl`}>
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">Access Required</h2>
              <p className="text-xl text-slate-300 mb-8">
                Please register to access your personalized AI learning report.
              </p>
              <Link 
                to="/registration" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-8 py-4 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-200 pt-24 pb-12">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/playground" 
            className="p-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </Link>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">AI Learning Report</h1>
            <p className="text-xl text-violet-300 mt-2">Personalized insights for {user.username}</p>
          </div>
        </div>

        <div ref={contentRef} className="space-y-8">
          {/* User Overview */}
          <div className={`${glassPanelStyle} p-8 rounded-2xl`}>
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                <img 
                  src={user.profile.avatar} 
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">{user.username}</h2>
                <p className="text-yellow-400 font-semibold text-lg">{user.profile.rank}</p>
                <p className="text-slate-400">Age: {user.age || 'Not specified'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-400/30 rounded-xl">
                <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-400">{user.profile.stars}</div>
                <div className="text-sm text-slate-400">Stars Earned</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-xl">
                <Zap className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-400">{user.profile.xp}</div>
                <div className="text-sm text-slate-400">Experience Points</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl">
                <Trophy className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-400">{Object.keys(user.profile.gameProgress).length}</div>
                <div className="text-sm text-slate-400">Games Played</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl">
                <Crown className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-400">{user.profile.rank}</div>
                <div className="text-sm text-slate-400">Current Rank</div>
              </div>
            </div>
          </div>

          {/* Generate Report Section */}
          <div className={`${glassPanelStyle} p-8 rounded-2xl`}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">Generate AI Learning Report</h3>
              <p className="text-slate-300 text-lg">
                Get personalized insights about {user.username}'s learning progress, strengths, and development areas.
              </p>
            </div>

            {!report && !loading && (
              <div className="text-center">
                <button
                  onClick={generateReport}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-8 py-4 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-3 mx-auto"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate AI Report
                </button>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Analyzing learning data...</h3>
                <p className="text-slate-400">This may take a few moments</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-6 mb-6">
                <div className="text-red-300 font-semibold mb-2">Error Generating Report</div>
                <p className="text-red-200">{error}</p>
                <button
                  onClick={generateReport}
                  className="mt-4 bg-red-600 text-white font-bold px-6 py-2 rounded-full hover:bg-red-700 transition-all"
                >
                  Try Again
                </button>
              </div>
            )}

            {report && (
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold text-white">Your Personalized Learning Report</h4>
                </div>
                <div className="prose prose-lg max-w-none">
                  <div className="text-slate-200 leading-relaxed whitespace-pre-wrap text-lg">
                    {report}
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-purple-400/30 flex flex-wrap gap-4">
                  <button
                    onClick={generateReport}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-6 py-3 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate New Report
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="bg-slate-600 text-white font-bold px-6 py-3 rounded-full hover:bg-slate-700 transition-all flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Print Report
                  </button>
                  <Link
                    to="/playground"
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold px-6 py-3 rounded-full hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center gap-2"
                  >
                    <Activity className="w-4 h-4" />
                    Back to Playground
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Cognitive Skills Overview */}
          <div className={`${glassPanelStyle} p-8 rounded-2xl`}>
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-green-400" />
              Cognitive Skills Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="w-6 h-6 text-green-400" />
                  <h4 className="font-semibold text-white">Memory Skills</h4>
                </div>
                <p className="text-slate-300 mb-4">Based on Memory Galaxy & Starbloom Forest performance</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white/10 rounded-full h-3">
                    <div className="bg-green-400 h-3 rounded-full" style={{ width: `${Math.min((user.profile.gameProgress['memory-sequence']?.level || 0) * 20, 100)}%` }}></div>
                  </div>
                  <span className="text-sm text-green-400 font-bold">
                    {Math.min((user.profile.gameProgress['memory-sequence']?.level || 0) * 20, 100)}%
                  </span>
                </div>
              </div>
              <div className="p-6 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-blue-400" />
                  <h4 className="font-semibold text-white">Focus & Control</h4>
                </div>
                <p className="text-slate-300 mb-4">Based on Stop & Go Adventure performance</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white/10 rounded-full h-3">
                    <div className="bg-blue-400 h-3 rounded-full" style={{ width: `${Math.min((user.profile.gameProgress['inhibition']?.level || 0) * 20, 100)}%` }}></div>
                  </div>
                  <span className="text-sm text-blue-400 font-bold">
                    {Math.min((user.profile.gameProgress['inhibition']?.level || 0) * 20, 100)}%
                  </span>
                </div>
              </div>
              <div className="p-6 bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-6 h-6 text-purple-400" />
                  <h4 className="font-semibold text-white">Logic & Patterns</h4>
                </div>
                <p className="text-slate-300 mb-4">Based on Pattern Detective performance</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white/10 rounded-full h-3">
                    <div className="bg-purple-400 h-3 rounded-full" style={{ width: `${Math.min((user.profile.gameProgress['pattern-matching']?.level || 0) * 20, 100)}%` }}></div>
                  </div>
                  <span className="text-sm text-purple-400 font-bold">
                    {Math.min((user.profile.gameProgress['pattern-matching']?.level || 0) * 20, 100)}%
                  </span>
                </div>
              </div>
              <div className="p-6 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-400/30 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="w-6 h-6 text-orange-400" />
                  <h4 className="font-semibold text-white">Numerical Skills</h4>
                </div>
                <p className="text-slate-300 mb-4">Based on Number Quest performance</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white/10 rounded-full h-3">
                    <div className="bg-orange-400 h-3 rounded-full" style={{ width: `${Math.min((user.profile.gameProgress['counting-adventure']?.level || 0) * 20, 100)}%` }}></div>
                  </div>
                  <span className="text-sm text-orange-400 font-bold">
                    {Math.min((user.profile.gameProgress['counting-adventure']?.level || 0) * 20, 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIReportPage;