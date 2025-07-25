import React, { useState, useLayoutEffect, useRef, useMemo } from 'react';
import { useUser } from '../contexts/UserContext';
import { gsap } from 'gsap';
import { Gamepad2, BarChart, Users, Star, Brain, Sparkles, Trophy, Target, FileText, CheckSquare } from 'lucide-react';
import TaskManager from '../components/TaskManager';
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
                            {['play', 'profile', 'social', 'tasks'].map(view => (
                                <button key={view} onClick={() => setMainView(view)} className={`flex-1 py-2 rounded-lg font-bold capitalize transition-colors flex items-center justify-center gap-2 ${mainView === view ? 'bg-white/20 text-white' : 'text-violet-300 hover:text-white'}`}>
                                    {view === 'play' && <Gamepad2 size={18}/>}
                                    {view === 'profile' && <BarChart size={18}/>}
                                    {view === 'social' && <Users size={18}/>}
                                    {view === 'tasks' && <CheckSquare size={18}/>}
                                    {view}
                                </button>
                            ))}
                        </div>
                        <div ref={contentRef} className={`${glassPanelStyle} p-6 min-h-[500px] rounded-2xl`}>
                            {mainView === 'play' && renderGameGrid()}
                            {mainView === 'profile' && <div className="p-4 text-white"><h2 className="text-3xl font-bold">Profile & Progress</h2></div>}
                            {mainView === 'social' && <div className="p-4 text-white"><h2 className="text-3xl font-bold">Social & Friends</h2></div>}
                            {mainView === 'tasks' && renderTaskManager()}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default PlaygroundPage;