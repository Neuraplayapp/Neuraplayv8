# Netlify Deployment Guide for NeuraPlay AI Platform

## 🚀 Quick Deployment

### Option 1: Using the Deployment Script
```powershell
# Run the deployment script
.\deploy-to-netlify.ps1
```

### Option 2: Manual Deployment
```bash
# 1. Build the project
npm run build

# 2. Deploy to Netlify
netlify deploy --prod --dir=dist
```

## 🔧 Environment Variables Setup

### Required Environment Variables
You must set these in your Netlify dashboard under **Site settings > Environment variables**:

1. **together_token** - Your Together AI API token
2. **hf_token** - Your Hugging Face API token  
3. **elven_labs_api_key** - Your ElevenLabs API key

### How to Set Environment Variables
1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings > Environment variables**
4. Add each variable with its corresponding value
5. Redeploy your site

## 🏗️ Project Structure for Netlify

```
neuraplay-ai-platform/
├── netlify/
│   └── functions/
│       ├── api.cjs          # Main API function
│       ├── contact.cjs      # Contact form handler
│       └── ...
├── netlify.toml            # Netlify configuration
├── dist/                   # Built files (created by npm run build)
└── src/                    # Source code
```

## 🔍 Troubleshooting

### Issue: API calls returning redirects
**Solution**: The AI assistant now has robust fallback mechanisms:
- Tries multiple API endpoints
- Falls back to browser TTS for voice
- Provides fallback responses when API is unavailable

### Issue: Functions not working
**Check**:
1. Environment variables are set correctly
2. Functions are in the correct location (`netlify/functions/`)
3. `netlify.toml` is configured properly

### Issue: Build fails
**Check**:
1. All dependencies are installed: `npm install`
2. Node.js version is compatible
3. No TypeScript errors: `npm run build`

## 📋 Pre-Deployment Checklist

- [ ] Environment variables are set in Netlify dashboard
- [ ] All dependencies are installed (`npm install`)
- [ ] Project builds successfully (`npm run build`)
- [ ] Netlify CLI is installed and logged in
- [ ] Functions are in the correct location

## 🎯 Post-Deployment Verification

1. **Test the AI Assistant**:
   - Open your deployed site
   - Click the AI assistant button
   - Try sending a message
   - Check browser console for API logs

2. **Test Voice Features**:
   - Try the voice button in the AI assistant
   - Should fall back to browser TTS if API fails

3. **Test Image Generation**:
   - Ask the AI to generate an image
   - Should work or gracefully fail

## 🔧 Development vs Production

### Development
- Uses Vite dev server
- Functions may not work locally
- Use `netlify dev` for local function testing

### Production (Netlify)
- Functions work properly
- Environment variables are available
- Optimized build with proper routing

## 📞 Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify environment variables are set correctly
3. Check Netlify function logs in the dashboard
4. Ensure the build process completes successfully

## 🚀 Advanced Configuration

### Custom Domain
1. Go to Netlify dashboard
2. Site settings > Domain management
3. Add your custom domain

### Function Timeout
Functions have a 10-second timeout by default. For longer operations, consider:
- Breaking down complex operations
- Using background jobs
- Implementing progress indicators

### CORS Configuration
The functions are configured to allow all origins (`*`). For production, consider restricting this to your domain.

## 📊 Monitoring

Monitor your deployment:
- Netlify dashboard > Functions tab
- Check function logs for errors
- Monitor API usage and costs
- Set up alerts for function failures 