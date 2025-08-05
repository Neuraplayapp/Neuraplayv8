import { Howl } from 'howler';

export interface ElevenLabsConfig {
    agentId: string;
    voices: {
        english: string;
        russian: string;
        arabic: string;
    };
    models: {
        turbo: string;
        standard: string;
    };
    apiKey: string;
}

export const elevenLabsConfig: ElevenLabsConfig = {
    agentId: 'agent_2201k13zjq5nf9faywz14701hyhb',
    voices: {
        english: '8LVfoRdkh4zgjr8v5ObE',
        russian: 'RUB3PhT3UqHowKru61Ns',
        arabic: 'mRdG9GYEjJmIzqbYTidv'
    },
    models: {
        turbo: 'eleven_turbo_v2_5',
        standard: 'eleven_multilingual_v2'
    },
    apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY || 
             import.meta.env.VITE_ELVEN_LABS_API_KEY ||
             import.meta.env.ELEVENLABS_API_KEY || ''
};

// Check for any ElevenLabs API key at build time
const isElevenLabsConfigured = !!(import.meta.env.VITE_ELEVENLABS_API_KEY || 
                                  import.meta.env.VITE_ELVEN_LABS_API_KEY ||
                                  import.meta.env.ELEVENLABS_API_KEY);

// Log the availability of the key during development for debugging purposes
if (import.meta.env.DEV) {
  console.log('ElevenLabs API key configured:', isElevenLabsConfigured);
  console.log('Checked variables: VITE_ELEVENLABS_API_KEY, VITE_ELVEN_LABS_API_KEY, ELEVENLABS_API_KEY');
}

const audioCache = new Map<string, Howl>();

// Debug: Log available environment variables (development only)
if (import.meta.env.DEV) {
  console.log('Available env vars:', Object.keys(import.meta.env));
  console.log('ElevenLabs API Key available:', isElevenLabsConfigured);
  console.log('⚠️ IMPORTANT: Frontend needs VITE_ELEVENLABS_API_KEY or VITE_ELVEN_LABS_API_KEY in Netlify environment variables');
}

export const getVoiceId = (language: 'english' | 'russian' | 'arabic' = 'english'): string => {
    const voiceId = elevenLabsConfig.voices[language];
    if (import.meta.env.DEV) {
        console.log('🔍 ElevenLabs getVoiceId:', { language, voiceId });
    }
    return voiceId;
};

export const getAgentId = (): string => {
    const agentId = elevenLabsConfig.agentId;
    if (import.meta.env.DEV) {
        console.log('🔍 ElevenLabs getAgentId called');
        console.log('🔍 Agent ID:', agentId);
        console.log('🔍 Agent ID type:', typeof agentId);
        console.log('🔍 Agent ID length:', agentId?.length);
        console.log('🔍 Agent ID valid format:', agentId?.startsWith('agent_'));
    }
    
    // Validate agent ID format
    if (!agentId) {
        console.error('❌ ElevenLabs agent ID is empty or undefined');
        return '';
    }
    
    if (!agentId.startsWith('agent_')) {
        console.error('❌ ElevenLabs agent ID does not have proper format (should start with "agent_")');
        console.error('❌ Current agent ID:', agentId);
    }
    
    return agentId;
};

export const getApiKey = (): string => {
    const apiKey = elevenLabsConfig.apiKey;
    if (import.meta.env.DEV) {
        console.log('🔍 ElevenLabs getApiKey called');
        console.log('🔍 API Key exists:', !!apiKey);
        console.log('🔍 API Key length:', apiKey?.length || 0);
        console.log('🔍 API Key starts with sk-_:', apiKey?.startsWith('sk_'));
        console.log('🔍 Environment variables checked:');
        console.log('  - VITE_ELEVENLABS_API_KEY:', !!import.meta.env.VITE_ELEVENLABS_API_KEY);
        console.log('  - VITE_ELVEN_LABS_API_KEY:', !!import.meta.env.VITE_ELVEN_LABS_API_KEY);
        console.log('  - ELEVENLABS_API_KEY:', !!import.meta.env.ELEVENLABS_API_KEY);
    }
    
    // Validate API key format
    if (!apiKey) {
        console.error('❌ ElevenLabs API key is missing');
        console.error('❌ Please set VITE_ELEVENLABS_API_KEY in your environment variables');
        return '';
    }
    
    if (!apiKey.startsWith('sk_')) {
        console.warn('⚠️ ElevenLabs API key format may be incorrect (should start with "sk_")');
        console.warn('⚠️ Current API key starts with:', apiKey.substring(0, 5) + '...');
    }
    
    return apiKey;
};

export const getModelId = (model: 'turbo' | 'standard' = 'turbo'): string => {
    const modelId = elevenLabsConfig.models[model];
    if (import.meta.env.DEV) {
        console.log('🔍 ElevenLabs getModelId:', { model, modelId });
    }
    return modelId;
}; 