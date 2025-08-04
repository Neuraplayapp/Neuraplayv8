# Dual Deployment Guide: Netlify + Render

This guide explains how to maintain both Netlify and Render deployments simultaneously with a unified codebase.

## 🏗️ Architecture Overview

### Platform-Specific Features

| Feature | Netlify | Render |
|---------|---------|--------|
| **API Endpoints** | `/.netlify/functions/*` | `/api/*` |
| **WebSocket** | ❌ Not available | ✅ Full support |
| **Server-Side Rendering** | ❌ Static only | ✅ Express server |
| **Environment Variables** | Netlify dashboard | Render dashboard |
| **Build Process** | `npm run build:netlify` | `npm run build:render` |

### Unified API Service

The `AIService` class automatically detects the platform and uses the appropriate endpoints:

```typescript
// Automatically detects platform and uses correct API base
const aiService = new AIService();

// Works on both platforms
await aiService.textToSpeech("Hello world");
await aiService.transcribeAudio(audioData);
```

## 🚀 Deployment Process

### 1. Netlify Deployment

**Build Command:** `npm run build:netlify`
**Publish Directory:** `dist`
**Functions Directory:** `netlify/functions`

**Environment Variables (Netlify Dashboard):**
```
NETLIFY=true
VITE_PLATFORM=netlify
VITE_ABLY_API_KEY=your_ably_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key
VITE_ASSEMBLYAI_API_KEY=your_assemblyai_key
```

### 2. Render Deployment

**Build Command:** `npm install && npm run build:render`
**Start Command:** `npm run start:render`
**Environment:** Node.js

**Environment Variables (Render Dashboard):**
```
RENDER=true
VITE_PLATFORM=render
NODE_ENV=production
VITE_ABLY_API_KEY=your_ably_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key
VITE_ASSEMBLYAI_API_KEY=your_assemblyai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

## 🔧 Platform Detection

The system automatically detects the platform using environment variables:

```javascript
// In post-build.js
const platform = process.env.NETLIFY ? 'netlify' : 
                 process.env.RENDER ? 'render' : 
                 'local';
```

## 📁 File Structure

```
├── netlify/
│   ├── functions/          # Netlify Functions
│   └── netlify.toml       # Netlify config
├── scripts/
│   └── post-build.js      # Platform-specific build logic
├── src/
│   └── services/
│       └── AIService.ts   # Unified API service
├── server-static.js        # Express server for Render
├── render.yaml            # Render config
└── package.json           # Platform-specific scripts
```

## 🔄 Build Process

### Post-Build Script (`scripts/post-build.js`)

1. **Platform Detection:** Determines if building for Netlify or Render
2. **Configuration Generation:** Creates platform-specific config files
3. **File Copying:** Copies necessary files for each platform
4. **Environment Setup:** Sets up environment variables

### Platform-Specific Builds

```json
{
  "scripts": {
    "build:netlify": "tsc && vite build",
    "build:render": "tsc && vite build",
    "start:render": "node server-static.js"
  }
}
```

## 🌐 API Endpoints

### Netlify Functions
- `/.netlify/functions/elevenlabs-tts`
- `/.netlify/functions/assemblyai-transcribe`
- `/.netlify/functions/ably-auth`
- `/.netlify/functions/api`
- `/.netlify/functions/contact`

### Render Express Server
- `/api/elevenlabs-tts`
- `/api/assemblyai-transcribe`
- `/api/ably-auth`
- `/api/api`
- `/api/contact`

## 🔌 WebSocket Support

**Only available on Render** due to Netlify's static hosting limitations.

```typescript
// Check if WebSocket is available
const wsUrl = aiService.getWebSocketUrl();
if (wsUrl) {
  // Connect to WebSocket
  const ws = new WebSocket(wsUrl);
}
```

## 🛠️ Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   - Check both Netlify and Render dashboards
   - Ensure variable names match exactly

2. **API Endpoints Not Working**
   - Verify platform detection is working
   - Check browser console for API base URL

3. **Build Failures**
   - Ensure all dependencies are in `package.json`
   - Check for platform-specific build errors

4. **WebSocket Connection Issues**
   - WebSocket only works on Render
   - Check if platform is correctly detected

### Debug Commands

```bash
# Test local build
npm run build:netlify
npm run build:render

# Test local server
npm run start:render

# Check platform detection
node scripts/post-build.js
```

## 📊 Monitoring

### Netlify
- Function logs in Netlify dashboard
- Build logs in deployment history
- Function execution metrics

### Render
- Application logs in Render dashboard
- WebSocket connection status
- Server performance metrics

## 🔄 Deployment Workflow

1. **Code Changes:** Make changes to your codebase
2. **Local Testing:** Test with `npm run dev`
3. **Build Testing:** Test both build commands locally
4. **Deploy to Netlify:** Push to main branch (auto-deploy)
5. **Deploy to Render:** Push to main branch (auto-deploy)
6. **Verify:** Check both deployments work correctly

## 🎯 Best Practices

1. **Environment Variables:** Keep both platforms in sync
2. **API Testing:** Test all endpoints on both platforms
3. **Error Handling:** Implement platform-specific error handling
4. **Monitoring:** Set up alerts for both platforms
5. **Backup:** Use Render as backup for Netlify functions

## 🚨 Important Notes

- **WebSocket:** Only available on Render
- **Server-Side Features:** Only available on Render
- **Static Assets:** Both platforms serve the same static files
- **API Compatibility:** All APIs work on both platforms
- **Environment Variables:** Must be set on both platforms

## 📞 Support

If you encounter issues:

1. Check the platform detection logs
2. Verify environment variables
3. Test API endpoints individually
4. Check build logs for errors
5. Ensure all dependencies are installed

This unified approach ensures your application works seamlessly on both platforms while maintaining the specific advantages of each. 