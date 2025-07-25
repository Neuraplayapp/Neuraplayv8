import React, { useState, useLayoutEffect, useRef, useMemo } from 'react';
import { useUser } from '../contexts/UserContext';
import { gsap } from 'gsap';
import { Gamepad2, BarChart, Users, Star, Brain, Sparkles, Trophy, Target, FileText, CheckSquare, TrendingUp, Award, Zap, Crown, Target as TargetIcon, Brain as BrainIcon, Heart, Activity } from 'lucide-react';
import TaskManager from '../components/TaskManager';
import HorizontalFilmstrip from '../components/HorizontalFilmstrip';
import { Link } from 'react-router-dom';
// Import your other components like GameModal and ALL your game components
// import StackerGame from '../components/games/StackerGame';

const PlaygroundPage: React.FC = () => {
    const { user } = useUser();
    const [mainView, setMainView] = useState('play');
    const [playCategory, setPlayCategory] = useState('All');
    const [isTaskManagerOpen, setIsTaskManagerOpen] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const games = useMemo(() => [
        { id: 'memory-sequence', title: 'Memory Galaxy', category: 'Memory', icon: <Star />, color: 'from-blue-500 to-cyan-500' },
        { id: 'starbloom-adventure', title: 'Starbloom Forest', category: 'Memory', icon: <Brain />, color: 'from-green-500 to-teal-500' },
        { id: 'inhibition', title: 'Stop & Go Adventure', category: 'Focus', icon: <Target />, color: 'from-emerald-500 to-green-500' },
        { id: 'berry-blaster', title: 'Berry Blaster', category: 'Focus', icon: <Gamepad2 />, color: 'from-indigo-500 to-blue-500' },
        // { id: 'stacker-game', title: 'Block Stacker', category: 'Focus', icon: <Target />, color: 'from-red-500 to-orange-500' },
        { id: 'pattern-matching', title: 'Pattern Detective', category: 'Logic', icon: <Brain />, color: 'from-purple-500 to-violet-500' },
        { id: 'counting-adventure', title: 'Number Quest', category: 'Logic', icon: <Trophy />, color: 'from-orange-500 to-amber-500' },
        { id: 'fuzzling-advanced', title: "Fuzzling's Playpen", category: 'Logic', icon: <Sparkles />, color: 'from-pink-500 to-rose-500' },
        { id: 'letter-hunt', title: 'Letter Safari', category: 'Language', icon: <FileText />, color: 'from-fuchsia-500 to-pink-500' },
        { id: 'ai-story-creator', title: 'AI Story Creator', category: 'Creativity', icon: <Sparkles />, color: 'from-sky-500 to-indigo-500' },
        { id: 'happy-builder', title: 'Happy Builder', category: 'Creativity', icon: <Trophy />, color: 'from-yellow-500 to-lime-500' },
    ], []);

    const gameCategories = useMemo(() => ['All', ...Array.from(new Set(games.map(g => g.category)))], [games]);
    const filteredGames = useMemo(() => playCategory === 'All' ? games : games.filter(g => g.category === playCategory), [games, playCategory]);

    useLayoutEffect(() => {
        if (contentRef.current) {
            gsap.fromTo(contentRef.current, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.1 });
        }
    }, [mainView, playCategory]);

    if (!user) return <div className="min-h-screen flex items-center justify-center text-white">Please log in.</div>;

    const glassPanelStyle = "bg-black/20 border border-white/10 backdrop-blur-md";

    const renderGameGrid = () => (
        <>
            <h2 className="text-3xl font-bold text-slate-100 mb-6">Category: {playCategory}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredGames.map(game => (
                    <div key={game.id} className={`${glassPanelStyle} rounded-2xl overflow-hidden cursor-pointer group`}>
                        <div className={`h-36 bg-gradient-to-br ${game.color} flex items-center justify-center text-white text-5xl transition-transform duration-300 group-hover:scale-110`}>{game.icon}</div>
                        <div className="p-5"><h3 className="font-bold text-lg text-white">{game.title}</h3></div>
                    </div>
                ))}
            </div>
        </>
    );

    const renderTaskManager = () => (
        <div className="w-full h-full">
            <TaskManager onClose={() => setIsTaskManagerOpen(false)} />
        </div>
    );

    const renderFilmstrip = () => (
        <div className="w-full">
            <HorizontalFilmstrip className="h-[80vh]" height="h-[80vh]" />
        </div>
    );

    const renderProfile = () => (
        <div className="space-y-6">
            {/* User Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className={`${glassPanelStyle} p-4 rounded-xl text-center`}>
                    <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                        <Crown className="w-6 h-6 text-black" />
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">{user.profile.rank}</div>
                    <div className="text-sm text-slate-400">Current Rank</div>
                </div>
                <div className={`${glassPanelStyle} p-4 rounded-xl text-center`}>
                    <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                        <Zap className="w-6 h-6 text-black" />
                    </div>
                    <div className="text-2xl font-bold text-blue-400">{user.profile.xp}</div>
                    <div className="text-sm text-slate-400">Experience Points</div>
                </div>
                <div className={`${glassPanelStyle} p-4 rounded-xl text-center`}>
                    <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <Star className="w-6 h-6 text-black" />
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">{user.profile.stars}</div>
                    <div className="text-sm text-slate-400">Stars Earned</div>
                </div>
                <div className={`${glassPanelStyle} p-4 rounded-xl text-center`}>
                    <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                        <Gamepad2 className="w-6 h-6 text-black" />
                    </div>
                    <div className="text-2xl font-bold text-green-400">{Object.keys(user.profile.gameProgress).length}</div>
                    <div className="text-sm text-slate-400">Games Played</div>
                </div>
            </div>

            {/* AI Assessment Tool */}
            <div className={`${glassPanelStyle} p-6 rounded-2xl`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                        <BrainIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">AI Learning Assessment</h3>
                        <p className="text-slate-400">Get personalized insights about your learning progress</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link 
                        to="/ai-report" 
                        className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl hover:from-purple-500/30 hover:to-pink-500/30 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <FileText className="w-6 h-6 text-purple-400 group-hover:text-purple-300" />
                            <div>
                                <h4 className="font-semibold text-white">Generate AI Report</h4>
                                <p className="text-sm text-slate-400">Comprehensive learning analysis</p>
                            </div>
                        </div>
                    </Link>
                    <div className="p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-xl">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-6 h-6 text-blue-400" />
                            <div>
                                <h4 className="font-semibold text-white">Progress Analytics</h4>
                                <p className="text-sm text-slate-400">Real-time performance tracking</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Game Progress Grid */}
            <div className={`${glassPanelStyle} p-6 rounded-2xl`}>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-violet-400" />
                    Game Progress & Assessment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {games.map(game => {
                        const progress = user.profile.gameProgress[game.id] || { level: 0, stars: 0, bestScore: 0, timesPlayed: 0 };
                        return (
                            <div key={game.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-8 h-8 bg-gradient-to-br ${game.color} rounded-lg flex items-center justify-center`}>
                                        {game.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white">{game.title}</h4>
                                        <p className="text-xs text-slate-400">{game.category}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-center">
                                        <div className="text-yellow-400 font-bold">{progress.level}</div>
                                        <div className="text-slate-400">Level</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-yellow-400 font-bold">{progress.stars}</div>
                                        <div className="text-slate-400">Stars</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-blue-400 font-bold">{progress.bestScore}</div>
                                        <div className="text-slate-400">Best Score</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-green-400 font-bold">{progress.timesPlayed}</div>
                                        <div className="text-slate-400">Plays</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Cognitive Skills Assessment */}
            <div className={`${glassPanelStyle} p-6 rounded-2xl`}>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <TargetIcon className="w-5 h-5 text-green-400" />
                    Cognitive Skills Assessment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                            <Brain className="w-5 h-5 text-green-400" />
                            <h4 className="font-semibold text-white">Memory Skills</h4>
                        </div>
                        <p className="text-sm text-slate-400 mb-3">Based on Memory Galaxy & Starbloom Forest performance</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white/10 rounded-full h-2">
                                <div className="bg-green-400 h-2 rounded-full" style={{ width: `${Math.min((user.profile.gameProgress['memory-sequence']?.level || 0) * 20, 100)}%` }}></div>
                            </div>
                            <span className="text-xs text-green-400 font-bold">
                                {Math.min((user.profile.gameProgress['memory-sequence']?.level || 0) * 20, 100)}%
                            </span>
                        </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                            <Target className="w-5 h-5 text-blue-400" />
                            <h4 className="font-semibold text-white">Focus & Control</h4>
                        </div>
                        <p className="text-sm text-slate-400 mb-3">Based on Stop & Go Adventure performance</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white/10 rounded-full h-2">
                                <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${Math.min((user.profile.gameProgress['inhibition']?.level || 0) * 20, 100)}%` }}></div>
                            </div>
                            <span className="text-xs text-blue-400 font-bold">
                                {Math.min((user.profile.gameProgress['inhibition']?.level || 0) * 20, 100)}%
                            </span>
                        </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                            <Brain className="w-5 h-5 text-purple-400" />
                            <h4 className="font-semibold text-white">Logic & Patterns</h4>
                        </div>
                        <p className="text-sm text-slate-400 mb-3">Based on Pattern Detective performance</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white/10 rounded-full h-2">
                                <div className="bg-purple-400 h-2 rounded-full" style={{ width: `${Math.min((user.profile.gameProgress['pattern-matching']?.level || 0) * 20, 100)}%` }}></div>
                            </div>
                            <span className="text-xs text-purple-400 font-bold">
                                {Math.min((user.profile.gameProgress['pattern-matching']?.level || 0) * 20, 100)}%
                            </span>
                        </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-400/30 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                            <Trophy className="w-5 h-5 text-orange-400" />
                            <h4 className="font-semibold text-white">Numerical Skills</h4>
                        </div>
                        <p className="text-sm text-slate-400 mb-3">Based on Number Quest performance</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white/10 rounded-full h-2">
                                <div className="bg-orange-400 h-2 rounded-full" style={{ width: `${Math.min((user.profile.gameProgress['counting-adventure']?.level || 0) * 20, 100)}%` }}></div>
                            </div>
                            <span className="text-xs text-orange-400 font-bold">
                                {Math.min((user.profile.gameProgress['counting-adventure']?.level || 0) * 20, 100)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen text-slate-200 pt-24 pb-12">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white">The Playground</h1>
                    <p className="text-xl text-violet-300 mt-2">Your learning adventure starts here, {user.username}.</p>
                </div>
                <div className="flex flex-col lg:flex-row gap-8">
                    <aside className="lg:w-64 flex-shrink-0">
                        <div className="sticky top-24">
                            <nav className={`${glassPanelStyle} p-4 rounded-2xl space-y-1`}>
                                {gameCategories.map(cat => (
                                    <button key={cat} onClick={() => setPlayCategory(cat)} className={`w-full text-left p-3 rounded-lg font-semibold transition-all ${playCategory === cat ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-slate-300'}`}>{cat}</button>
                                ))}
                            </nav>
                        </div>
                    </aside>
                    <main className="flex-1">
                        <div className={`${glassPanelStyle} p-2 flex items-center mb-6 rounded-xl`}>
                            {['play', 'profile', 'social', 'tasks', 'filmstrip'].map(view => (
                                <button key={view} onClick={() => setMainView(view)} className={`flex-1 py-2 rounded-lg font-bold capitalize transition-colors flex items-center justify-center gap-2 ${mainView === view ? 'bg-white/20 text-white' : 'text-violet-300 hover:text-white'}`}>
                                    {view === 'play' && <Gamepad2 size={18}/>}
                                    {view === 'profile' && <BarChart size={18}/>}
                                    {view === 'social' && <Users size={18}/>}
                                    {view === 'tasks' && <CheckSquare size={18}/>}
                                    {view === 'filmstrip' && <Star size={18}/>}
                                    {view}
                                </button>
                            ))}
                        </div>
                        <div ref={contentRef} className={`${glassPanelStyle} p-6 min-h-[500px] rounded-2xl`}>
                            {mainView === 'play' && renderGameGrid()}
                            {mainView === 'profile' && renderProfile()}
                            {mainView === 'social' && <div className="p-4 text-white"><h2 className="text-3xl font-bold">Social & Friends</h2></div>}
                            {mainView === 'tasks' && renderTaskManager()}
                            {mainView === 'filmstrip' && renderFilmstrip()}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default PlaygroundPage;