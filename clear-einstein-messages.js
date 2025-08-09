// Emergency script to clear persistent Einstein messages from localStorage
// Run this in browser console: copy and paste this code

console.log('🧹 Starting Einstein message cleanup...');

// Get conversations from localStorage
const STORAGE_KEY = 'neuraplay_conversations';
try {
  const savedConversations = localStorage.getItem(STORAGE_KEY);
  
  if (savedConversations) {
    const conversations = JSON.parse(savedConversations);
    let totalCleaned = 0;
    
    // Clean each conversation
    Object.keys(conversations).forEach(key => {
      const conversation = conversations[key];
      const originalCount = conversation.messages.length;
      
      // Filter out Einstein messages
      conversation.messages = conversation.messages.filter(msg => {
        const isEinsteinMessage = msg.text.includes('Einstein') && 
                                 (msg.text.includes('wild hair') || 
                                  msg.text.includes('moved to canvas') ||
                                  msg.text.includes('attachment pane') ||
                                  msg.text.includes('chalkboard full of equations'));
        
        if (isEinsteinMessage) {
          console.log('🗑️ Removing Einstein message:', msg.text.substring(0, 100) + '...');
          totalCleaned++;
        }
        
        return !isEinsteinMessage;
      });
      
      const cleanedCount = conversation.messages.length;
      if (originalCount !== cleanedCount) {
        console.log(`✅ Cleaned conversation "${key}": ${originalCount} → ${cleanedCount} messages`);
      }
    });
    
    // Save cleaned conversations back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    
    console.log(`🎉 Cleanup complete! Removed ${totalCleaned} persistent Einstein messages.`);
    console.log('💡 Refresh the page to see the changes take effect.');
    
  } else {
    console.log('📭 No saved conversations found in localStorage.');
  }
  
} catch (error) {
  console.error('❌ Error during cleanup:', error);
}
