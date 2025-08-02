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

// Debug: Log available environment variables
console.log('Available env vars:', Object.keys(import.meta.env));
console.log('ElevenLabs API Key available:', isElevenLabsConfigured);
console.log('⚠️ IMPORTANT: Frontend needs VITE_ELEVENLABS_API_KEY or VITE_ELVEN_LABS_API_KEY in Netlify environment variables');

export const getVoiceId = (language: 'english' | 'russian' | 'arabic' = 'english'): string => {
    return elevenLabsConfig.voices[language];
};

export const getAgentId = (): string => {
    return elevenLabsConfig.agentId;
};

export const getApiKey = (): string => {
    return elevenLabsConfig.apiKey;
};

export const getModelId = (model: 'turbo' | 'standard' = 'turbo'): string => {
    return elevenLabsConfig.models[model];
}; 