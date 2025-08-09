// Script to clear server-side caches and debug Einstein issue

const express = require('express');

// Clear server-side caches
function clearServerCaches() {
    console.log('🧹 CLEARING SERVER CACHES');
    
    // Clear require cache (remove all cached modules)
    Object.keys(require.cache).forEach(key => {
        if (key.includes('agent.cjs') || 
            key.includes('imageGeneration.cjs') ||
            key.includes('api.cjs')) {
            console.log('🗑️ Clearing require cache for:', key);
            delete require.cache[key];
        }
    });
    
    // Clear any global variables that might hold Einstein data
    if (global.pendingTranscriptions) {
        console.log('🗑️ Clearing pendingTranscriptions');
        global.pendingTranscriptions.clear();
    }
    
    // Force garbage collection if available
    if (global.gc) {
        console.log('🗑️ Running garbage collection');
        global.gc();
    }
    
    console.log('✅ Server caches cleared');
}

// Test endpoint to clear caches
const router = express.Router();

router.post('/clear-cache', (req, res) => {
    try {
        clearServerCaches();
        res.json({ 
            success: true, 
            message: 'Server caches cleared successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = { clearServerCaches, router };
