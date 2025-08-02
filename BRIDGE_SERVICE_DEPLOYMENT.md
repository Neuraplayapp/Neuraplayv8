# NeuraPlay Bridge Service Deployment Guide

## 🎯 **Solution Overview**

You now have the **correct architecture** for reliable ElevenLabs WebSocket streaming:

```
Frontend (Netlify) ↔ Ably ↔ Bridge Service (Fly.io) ↔ ElevenLabs API
```

## 📁 **What We've Created**

### 1. **Bridge Service** (`bridge-service/`)
- ✅ **Stateful Node.js server** that can maintain persistent connections
- ✅ **Handles multiple concurrent conversations**
- ✅ **Connects to ElevenLabs WebSocket API**
- ✅ **Communicates with frontend via Ably**

### 2. **Frontend Integration** 
- ✅ **Updated AblyConversationService** to work with bridge
- ✅ **Ably authentication via Netlify function**
- ✅ **Real-time messaging between components**

## 🚀 **Deployment Steps**

### Step 1: Deploy Bridge Service

**Option A: Fly.io (Recommended)**
1. Install Fly.io CLI: `powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"`
2. Navigate to bridge-service directory: `cd bridge-service`
3. Login to Fly.io: `fly auth login`
4. Launch the app: `fly launch --no-deploy`
5. Set environment variables:
   - `fly secrets set ABLY_API=your_ably_api_key`
   - `fly secrets set ELEVENLABS_API_KEY=your_elevenlabs_api_key`
6. Deploy: `fly deploy`

**Option B: Render**
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect your GitHub repo
4. Set root directory: `bridge-service`
5. Build command: `npm install`
6. Start command: `npm start`
7. Add environment variables (same as above)

### Step 2: Update Frontend Environment

Add to your Netlify environment variables:
```env
VITE_BRIDGE_SERVICE_URL=https://your-bridge-service.fly.dev
# OR (if using Render)
VITE_BRIDGE_SERVICE_URL=https://your-bridge-service.onrender.com
```

### Step 3: Test the Integration

Use the `AblyConversationTest` component to verify:

```tsx
import { AblyConversationTest } from '../components/AblyConversationTest';

// Add to your dashboard or test page
<AblyConversationTest />
```

## 🔧 **Configuration**

### Bridge Service Environment Variables
```env
PORT=3001                        # Optional, set by hosting platform
ABLY_API=your_ably_api_key      # From Ably dashboard
ELEVENLABS_API_KEY=your_el_key  # From ElevenLabs dashboard
NODE_ENV=production
```

### Frontend Environment Variables (Netlify)
```env
ABLY_API=your_ably_api_key                    # Same as bridge service
VITE_BRIDGE_SERVICE_URL=https://your-service.com  # Bridge service URL
```

## 🎤 **How to Use in Your App**

```tsx
import { AblyConversationService } from '../services/AblyConversationService';
import { getVoiceId, getAgentId } from '../config/elevenlabs';

const service = AblyConversationService.getInstance();

// Initialize
await service.initialize();

// Start conversation
const conversationId = await service.startConversation({
  agentId: getAgentId(),
  voiceId: getVoiceId()
});

// Send messages
await service.sendMessage("Hello AI!");

// Listen for responses
service.on('ai_response', (data) => {
  console.log('AI said:', data);
});

// End conversation
await service.endConversation();
```

## 🔍 **Monitoring**

Bridge service provides health endpoints:
- `GET /health` - Service health and memory usage
- `GET /` - Active conversation count

## ✅ **Benefits of This Architecture**

1. **✅ Persistent Connections**: Bridge service maintains long-running WebSocket connections
2. **✅ Scalable**: Can handle multiple concurrent conversations
3. **✅ Reliable**: Ably handles network issues and reconnections  
4. **✅ Secure**: API keys stay on server-side
5. **✅ Netlify Compatible**: Frontend stays on Netlify, only bridge moves to stateful platform

## 🚨 **Next Steps**

1. **Deploy the bridge service** to Fly.io or Render
2. **Update your environment variables**
3. **Test with AblyConversationTest component**
4. **Replace existing conversation components** with new Ably-based service
5. **Monitor bridge service health** and logs

This architecture will solve your WebSocket connection issues permanently! 🎉 