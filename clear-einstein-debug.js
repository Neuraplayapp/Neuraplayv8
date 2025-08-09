// Debug script to completely clear Einstein from localStorage and test system

console.log('🔍 DEBUGGING EINSTEIN BUG');

// 1. Check what's in localStorage
console.log('📋 Current localStorage contents:');
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('conversation') || key.includes('neuraplay'))) {
        const value = localStorage.getItem(key);
        console.log(`${key}:`, value?.substring(0, 200) + '...');
        
        // Check for Einstein specifically
        if (value && value.toLowerCase().includes('einstein')) {
            console.log('🚨 FOUND EINSTEIN IN:', key);
            console.log('Full content:', value);
        }
    }
}

// 2. Clear ALL conversation and AI-related storage
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
        key.includes('conversation') ||
        key.includes('neuraplay') ||
        key.includes('ai_') ||
        key.includes('scribble') ||
        key.includes('tool_results') ||
        key.includes('chat') ||
        key.includes('message')
    )) {
        keysToRemove.push(key);
    }
}

console.log('🗑️ Removing keys:', keysToRemove);
keysToRemove.forEach(key => localStorage.removeItem(key));

// 3. Check if there's anything in sessionStorage
console.log('📋 SessionStorage contents:');
for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key) {
        const value = sessionStorage.getItem(key);
        console.log(`${key}:`, value?.substring(0, 100) + '...');
        
        if (value && value.toLowerCase().includes('einstein')) {
            console.log('🚨 FOUND EINSTEIN IN SESSIONSTORAGE:', key);
            sessionStorage.removeItem(key);
        }
    }
}

console.log('✅ Einstein debugging complete - storage cleared');
