import { createStreamingTranscription, detectVoiceActivity } from '../utils/assemblyAI';

// Robust AI Service with fallbacks and error handling
export class AIService {
  private static instance: AIService;
  private isOnline: boolean = true;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private fallbackResponses: Map<string, string> = new Map();

  private constructor() {
    this.initializeFallbacks();
    this.checkConnectivity();
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private initializeFallbacks() {
    this.fallbackResponses.set('greeting', "Hello! I'm Synapse, your AI learning assistant! 🚀 How can I help you today?");
    this.fallbackResponses.set('error', "I'm having trouble connecting right now, but I'm here to help! Let's try again in a moment! 🌟✨");
    this.fallbackResponses.set('navigation', "I can help you navigate to different pages! Try saying 'go to playground' or 'take me to dashboard'!");
    this.fallbackResponses.set('settings', "I can help you change settings! Try saying 'make it dark mode' or 'increase font size'!");
    this.fallbackResponses.set('accessibility', "I can help with accessibility! Try saying 'I am colorblind' or 'make high contrast'!");
  }

  private async checkConnectivity(): Promise<void> {
    try {
      const response = await fetch('/.netlify/functions/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_type: 'test', input_data: 'ping' })
      });
      this.isOnline = response.ok;
    } catch (error) {
      this.isOnline = false;
      console.warn('AI Service: Offline mode activated');
    }
  }

  async sendMessage(message: string, context?: any): Promise<string> {
    try {
      // First, analyze if this is a command
      const command = this.analyzeCommand(message);
      
      if (command.type !== 'chat') {
        return await this.executeCommand(command);
      }

      // Try API call with retry logic
      if (this.isOnline) {
        try {
          const response = await this.makeAPICall(message, context);
          this.retryCount = 0; // Reset retry count on success
          return response;
        } catch (error) {
          this.retryCount++;
          if (this.retryCount >= this.maxRetries) {
            this.isOnline = false;
            return this.getFallbackResponse('error');
          }
          // Retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, this.retryCount) * 1000));
          return await this.sendMessage(message, context);
        }
      }

      return this.getFallbackResponse('greeting');
    } catch (error) {
      console.error('AIService error:', error);
      return this.getFallbackResponse('error');
    }
  }

  private async makeAPICall(message: string, context?: any): Promise<string> {
    const response = await fetch('/.netlify/functions/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_type: 'chat',
        input_data: {
          messages: [
            { role: 'system', content: this.getSystemPrompt(context) },
            { role: 'user', content: message }
          ]
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const result = await response.json();
    return this.parseAPIResponse(result);
  }

  private parseAPIResponse(result: any): string {
    if (Array.isArray(result) && result.length > 0) {
      return result[0].generated_text || result[0].summary_text || this.getFallbackResponse('greeting');
    }
    if (typeof result === 'string') {
      return result;
    }
    if (result?.generated_text) {
      return result.generated_text;
    }
    return this.getFallbackResponse('greeting');
  }

  private getSystemPrompt(context?: any): string {
    return `You are Synapse, a friendly AI teacher for children. You are very knowledgeable about accessibility and can help with:
- Color blindness (protanopia, deuteranopia, tritanopia)
- Visual impairments and contrast needs
- Text spacing and font size preferences
- Motion sensitivity and animation preferences
- Screen reader support
- Keyboard navigation

When users mention accessibility needs, you should:
1. Acknowledge their needs with empathy
2. Offer specific solutions and settings changes
3. Maintain context across multiple messages
4. Use child-friendly language while being informative
5. Suggest relevant settings changes they can make

Always be supportive and helpful with accessibility requests!`;
  }

  private getFallbackResponse(type: string): string {
    return this.fallbackResponses.get(type) || this.fallbackResponses.get('error')!;
  }

  private analyzeCommand(text: string): { type: 'navigation' | 'settings' | 'chat' | 'info' | 'agent' | 'game', action?: any } {
    const lowerText = text.toLowerCase();
    
    // Navigation commands
    const navigationKeywords = ['go to', 'take me to', 'navigate to', 'open', 'get', 'list', 'show', 'search', 'bring', 'go', 'take me', 'remove', 'edit', 'visit', 'access'];
    
    if (navigationKeywords.some(keyword => lowerText.includes(keyword))) {
      return { type: 'navigation', action: { path: this.detectPageFromText(lowerText) } };
    }

    // Settings commands
    const settingsKeywords = ['settings', 'theme', 'font', 'color', 'contrast', 'motion', 'sound', 'notifications'];
    if (settingsKeywords.some(keyword => lowerText.includes(keyword))) {
      return { type: 'settings', action: { setting: this.detectSettingFromText(lowerText), value: this.detectValueFromText(lowerText) } };
    }

    return { type: 'chat' };
  }

  private detectPageFromText(text: string): string {
    const pageMappings = {
      'home': '/',
      'playground': '/playground',
      'dashboard': '/dashboard',
      'forum': '/forum',
      'profile': '/profile',
      'about': '/about',
      'sign in': '/signin',
      'register': '/registration'
    };

    for (const [keyword, path] of Object.entries(pageMappings)) {
      if (text.includes(keyword)) {
        return path;
      }
    }
    return '/';
  }

  private detectSettingFromText(text: string): string {
    const settingMappings = {
      'theme': 'theme',
      'font': 'fontSize',
      'color': 'colorBlindMode',
      'contrast': 'highContrast',
      'motion': 'reducedMotion',
      'sound': 'sound',
      'notifications': 'notifications'
    };

    for (const [keyword, setting] of Object.entries(settingMappings)) {
      if (text.includes(keyword)) {
        return setting;
      }
    }
    return 'theme';
  }

  private detectValueFromText(text: string): string {
    if (text.includes('dark')) return 'dark';
    if (text.includes('light')) return 'light';
    if (text.includes('large')) return 'large';
    if (text.includes('small')) return 'small';
    if (text.includes('enabled') || text.includes('on')) return 'enabled';
    if (text.includes('disabled') || text.includes('off')) return 'disabled';
    return 'auto';
  }

  private async executeCommand(command: { type: string, action?: any }): Promise<string> {
    switch (command.type) {
      case 'navigation':
        return `🚀 Taking you to ${command.action.path}! ✨`;
      case 'settings':
        return `⚙️ Setting "${command.action.setting}" changed to "${command.action.value}"! 🎨`;
      default:
        return this.getFallbackResponse('greeting');
    }
  }

  // Voice integration methods
  async startVoiceTranscription(onTranscript: (text: string) => void, onError: (error: string) => void) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const transcription = createStreamingTranscription(
        (result) => {
          if (result.isFinal) {
            onTranscript(result.text);
          }
        },
        (error) => {
          onError(error.message);
        }
      );
      return { stream, transcription };
    } catch (error) {
      onError('Failed to access microphone');
      throw error;
    }
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.checkConnectivity();
      return this.isOnline;
    } catch (error) {
      return false;
    }
  }
} 