# Netlify Deployment Quick Start

This guide will help you deploy your Neuraplay AI Platform to Netlify.

## 🚀 Quick Deployment Steps

### 1. Build for Netlify
```bash
npm run build:netlify
```

### 2. Deploy to Netlify

**Option A: Git-based deployment (Recommended)**
1. Push your code to GitHub/GitLab
2. Connect your repository to Netlify
3. Netlify will auto-deploy on every push

**Option B: Manual deployment**
```bash
# Install Netlify CLI if you haven't
npm install -g netlify-cli

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

## ⚙️ Environment Variables

Set these in your Netlify dashboard under **Site settings > Environment variables**:

```
NETLIFY=true
VITE_PLATFORM=netlify
VITE_ABLY_API_KEY=your_ably_key_here
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key_here
VITE_ASSEMBLYAI_API_KEY=your_assemblyai_key_here
```

## 🔧 Build Settings

In your Netlify dashboard, ensure these settings:

- **Build command:** `npm run build:netlify`
- **Publish directory:** `dist`
- **Functions directory:** `netlify/functions`

## 📁 File Structure

After building, your `dist` folder will contain:
- `platform-config.json` - Platform detection config
- `.env` - Environment variables for client-side
- All your static assets and HTML files

## 🧪 Testing Your Deployment

1. **Check platform detection:**
   ```javascript
   // In browser console
   console.log('Platform:', import.meta.env.VITE_PLATFORM);
   console.log('API Base:', import.meta.env.VITE_API_BASE);
   ```

2. **Test API endpoints:**
   - `/.netlify/functions/elevenlabs-tts`
   - `/.netlify/functions/assemblyai-transcribe`
   - `/.netlify/functions/ably-auth`

## 🚨 Important Notes

- **WebSocket:** Not available on Netlify (static hosting limitation)
- **Server-side features:** Use Netlify Functions for API endpoints
- **Environment variables:** Must be prefixed with `VITE_` for client-side access
- **Build process:** Uses `npm run build:netlify` which includes post-build configuration

## 🔍 Troubleshooting

### Build Failures
1. Check that all dependencies are in `package.json`
2. Verify environment variables are set correctly
3. Check Netlify build logs for specific errors

### API Endpoints Not Working
1. Ensure Netlify Functions are properly configured
2. Check that environment variables are set
3. Verify the function files are in `netlify/functions/`

### Platform Detection Issues
1. Check that `NETLIFY=true` is set in environment variables
2. Verify `platform-config.json` is generated in `dist/`
3. Check browser console for platform detection logs

## 📊 Monitoring

- **Function logs:** Available in Netlify dashboard
- **Build logs:** Check deployment history
- **Performance:** Monitor in Netlify analytics

## 🎯 Success Indicators

Your deployment is successful when:
- ✅ Build completes without errors
- ✅ `platform-config.json` shows `"platform": "netlify"`
- ✅ API endpoints return expected responses
- ✅ Environment variables are accessible in browser

## 📞 Support

If you encounter issues:
1. Check the build logs in Netlify dashboard
2. Verify environment variables are set correctly
3. Test API endpoints individually
4. Check browser console for client-side errors

Your Neuraplay AI Platform is now ready for Netlify deployment! 🎉 