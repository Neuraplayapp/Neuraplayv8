# NeuraPlay Bridge Service

A stateful bridge service that maintains persistent WebSocket connections between the NeuraPlay frontend and ElevenLabs API via Ably real-time messaging.

## Architecture

```
Frontend (Netlify) ↔ Ably ↔ Bridge Service (Fly.io) ↔ ElevenLabs API
```

## Features

- ✅ **Persistent WebSocket connections** to ElevenLabs
- ✅ **Real-time messaging** via Ably
- ✅ **Multiple concurrent conversations**
- ✅ **Graceful error handling and cleanup**
- ✅ **Health monitoring endpoints**
- ✅ **Stateful conversation management**

## Environment Variables

Create a `.env` file with:

```env
# Port (optional, defaults to 3001)
PORT=3001

# Ably API Key for real-time communication
ABLY_API=your_ably_api_key_here

# ElevenLabs API Key for voice chat (use either name)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
# OR (legacy compatibility)
elven_labs_api_key=your_elevenlabs_api_key_here

# Node environment
NODE_ENV=production
```

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## Deployment

### Fly.io (Recommended)

1. Install Fly.io CLI: `powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"`
2. Navigate to this directory: `cd bridge-service`
3. Login to Fly.io: `fly auth login`
4. Launch the app: `fly launch --no-deploy`
5. Set environment variables:
   ```bash
   fly secrets set ABLY_API=your_ably_api_key
   fly secrets set ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ```
6. Deploy: `fly deploy`

### Render

1. Create new Web Service on Render
2. Connect your GitHub repository  
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables
6. Deploy

### Environment Variables for Deployment

**For Fly.io:**
```bash
fly secrets set ABLY_API=your_ably_api_key
fly secrets set ELEVENLABS_API_KEY=your_elevenlabs_api_key
# PORT is automatically set by Fly.io
```

**For Render:**
- `ABLY_API`: Your Ably API key
- `ELEVENLABS_API_KEY`: Your ElevenLabs API key  
- `PORT`: Usually set automatically by hosting platform

## API Endpoints

### Health Check
```
GET /health
```

### Start Conversation
```
POST /conversation/start
Content-Type: application/json

{
  "conversationId": "optional-custom-id"
}
```

### End Conversation
```
DELETE /conversation/:conversationId
```

## Ably Channel Events

### From Frontend to Bridge
- `init_conversation` - Initialize ElevenLabs connection
- `user_message` - Send text message to AI
- `user_audio` - Send audio chunk to AI
- `end_conversation` - Close conversation

### From Bridge to Frontend  
- `status` - Connection status updates
- `ai_response` - AI responses from ElevenLabs
- `error` - Error notifications

## Monitoring

The service provides several monitoring endpoints:

- `/` - Service status and active conversation count
- `/health` - Detailed health information including memory usage

## Scaling

This service can handle multiple concurrent conversations by:

- Creating separate WebSocket connections for each conversation
- Using Ably channels to isolate conversation streams
- Tracking active conversations in memory
- Proper cleanup on connection termination

## Troubleshooting

1. **Connection Issues**: Check that environment variables are set correctly
2. **Audio Problems**: Verify ElevenLabs API key has proper permissions
3. **Real-time Issues**: Ensure Ably API key is valid and has sufficient quota 