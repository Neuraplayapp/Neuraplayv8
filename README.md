# Neuraplay v8 - Interactive Learning Platform

Neuraplay v8 is a comprehensive interactive learning platform featuring AI-powered educational games, cognitive training modules, and personalized learning experiences. The main enhancement in v8 is the **Advanced AI Integration** with enhanced streaming conversation capabilities and improved multi-service architecture.

## Key Difference in v8: Advanced AI Integration

The primary enhancement in Neuraplay v8 is the **Advanced AI Integration** functionality, which includes:
- Enhanced streaming conversation system with ElevenLabs WebSocket integration
- Improved AI assistant with real-time voice conversations
- Advanced bridge service architecture for persistent connections
- Multi-language support with AssemblyAI transcription
- Sophisticated AI agent context management

## Features
- AI-Powered Games
- Cognitive Training
- Interactive Learning
- Responsive Design
- Netlify Integration
- Enhanced AI Agent
- **Advanced AI Integration** (New in v8)
- Real-time Voice Conversations
- Multi-language Transcription
- Streaming Conversation System

## Technology Stack
- React 18 + TypeScript
- Tailwind CSS
- Vite
- Netlify
- OpenAI APIs
- ElevenLabs
- AssemblyAI
- Together AI
- Ably (Real-time messaging)
- Fly.io (Bridge service)

## Architecture Overview

### Complete Service Integration

Neuraplay uses a sophisticated multi-service architecture that enables real-time voice conversations and AI interactions:

```
Frontend (Netlify) ↔ Ably ↔ Bridge Service (Fly.io) ↔ ElevenLabs API
                   ↕
            Netlify Functions
            ↕
    AssemblyAI | Together AI | ElevenLabs TTS
```

### 1. Speech-to-Text Flow (AssemblyAI)
```
User speaks → Browser records audio → Convert to base64 → 
Netlify Function (assemblyai-transcribe.cjs) → AssemblyAI API → 
Returns transcribed text
```
- **API Key**: `Assemblyai_api_key` (set in Netlify)
- **Purpose**: Convert voice to text for all voice inputs

### 2. AI Response Flow (Together AI)
```
User types/speaks → Text processed → 
Netlify Function (api.cjs) → Together AI API → 
Returns AI-generated response
```
- **API Key**: `together_token` (set in Netlify)
- **Purpose**: Generate intelligent responses using LLM

### 3. Text-to-Speech Flow (ElevenLabs)
```
AI generates text → Netlify Function (elevenlabs-tts.cjs) → 
ElevenLabs API → Returns audio → Browser plays audio
```
- **API Key**: `elven_labs_api_key` (set in Netlify)
- **Purpose**: Convert AI responses to natural speech

### 4. Real-time Conversation Mode

This is the most sophisticated part of the architecture:

```
Frontend → Ably (Real-time messaging) → 
Bridge Service (Fly.io) → ElevenLabs WebSocket
```

**Why the Bridge Service?**
- Netlify Functions are **stateless** (they can't maintain WebSocket connections)
- ElevenLabs conversation API requires persistent WebSocket connection
- Solution: Deploy a **stateful Node.js server** on Fly.io

**Flow**:
1. User clicks conversation mode (Plasma Ball)
2. Frontend gets Ably auth token from Netlify function
3. Frontend connects to Ably channel
4. Bridge service (on Fly.io) also connects to same Ably channel
5. Bridge service maintains WebSocket connection to ElevenLabs
6. Messages flow: Frontend ↔ Ably ↔ Bridge ↔ ElevenLabs

### Environment Variables Configuration

**Netlify** (for serverless functions):
- `Assemblyai_api_key` - AssemblyAI transcription
- `together_token` - Together AI for LLM
- `elven_labs_api_key` - ElevenLabs TTS
- `ABLY_API` - Ably authentication

**Fly.io Bridge Service**:
- `ABLY_API` - Same Ably key for messaging
- `ELEVENLABS_API_KEY` - ElevenLabs WebSocket API

### User Interface Features

- **Plasma Ball Conversation Mode**: Interactive purple plasma ball that serves as the conversation mode toggle
- **Voice Recording**: Single-click recording for speech-to-text
- **Multi-language Support**: Support for 8 languages including English, Russian, Arabic, Swedish, Kazakh, Uzbek, and Tajik
- **Real-time Audio Streaming**: Bidirectional voice conversations with AI

## Quick Start
1. npm install
2. npm run dev
3. npm run build
4. npm run deploy

## Games
- Fuzzling
- Counting Adventure
- Memory Sequence
- The Cube
- Crossroad Fun
- Starbloom Adventure
- Mountain Climber

## AI Assistant Access
Access the advanced AI assistant through the interactive interface or use the real-time conversation mode via the plasma ball component.

## Deployment Architecture

### Frontend (Netlify)
- React application with Vite build
- Serverless functions for API integration
- Environment variables for API keys
- Auto-deployment from Git

### Bridge Service (Fly.io)
- Node.js server for WebSocket management
- Handles real-time conversation connections
- Manages multiple concurrent users
- Deployed separately from frontend

### Real-time Communication (Ably)
- Pub/Sub messaging between frontend and bridge
- Secure token-based authentication
- Handles connection management and failover

This architecture enables seamless voice conversations while working within the constraints of serverless platforms, providing a robust and scalable solution for AI-powered educational interactions.

Last Updated: $(Get-Date -Format 'yyyy-MM-dd')
Version: 8.0
