import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { usePost } from '../contexts/PostContext';
// ... other imports

const ForumPage: React.FC = () => {
    const { user } = useUser();
    const { posts, channels } = usePost();
    const [selectedChannel, setSelectedChannel] = useState('What I Learned Today');
    const glassPanelStyle = "bg-black/20 border border-white/10 backdrop-blur-md";

    const filteredPosts = posts.filter(post => post.channel === selectedChannel);

    return (
        <div className="min-h-screen text-white pt-24 pb-12">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight">Community Forum</h1>
                    <p className="text-xl text-violet-300 mt-2">Share breakthroughs, ask for advice, and grow together.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <aside className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            {/* ProfileCard would go here, styled as a glass panel */}
                            <div className={`${glassPanelStyle} p-4 rounded-2xl`}>
                                <h3 className="font-bold text-xl mb-4">Channels</h3>
                                <div className="space-y-2">
                                    {channels.map(channel => <button key={channel} onClick={() => setSelectedChannel(channel)} className={`w-full text-left py-3 px-4 rounded-lg font-semibold transition-all ${selectedChannel === channel ? 'bg-white/20' : 'hover:bg-white/10'}`}>{channel}</button>)}
                                </div>
                            </div>
                        </div>
                    </aside>
                    <main className="lg:col-span-3 space-y-6">
                        <div className={`${glassPanelStyle} p-6 rounded-2xl`}>
                            <h2 className="text-2xl font-bold mb-4">Share in <span className="text-violet-300">{selectedChannel}</span></h2>
                            {/* New Post Form UI here... */}
                        </div>
                        <div className="space-y-6">
                            {filteredPosts.map(post => (
                                <div key={post.id} className={`${glassPanelStyle} p-6 rounded-2xl`}>
                                    {/* ... Post content ... */}
                                    <h3 className="font-bold text-xl text-white mb-3">{post.title}</h3>
                                    <p className="text-violet-200">{post.content}</p>
                                </div>
                            ))}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ForumPage;