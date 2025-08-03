# Fly.io Environment Setup Guide

## Overview

This guide explains how to set up environment variables in Fly.io for the streaming conversation service that uses ElevenLabs HTTP streaming.

## Required Environment Variables

The bridge service needs the following environment variables:

### 1. Ably API Key
```bash
fly secrets set ABLY_API=your_ably_api_key_here
```

### 2. ElevenLabs API Key
```bash
fly secrets set ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### 3. AssemblyAI API Key
```bash
fly secrets set ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
```

## How to Set Environment Variables

### Option 1: Using Fly CLI (Recommended)

1. **Install Fly CLI** (if not already installed):
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to Fly.io**:
   ```bash
   fly auth login
   ```

3. **Set each environment variable**:
   ```bash
   # Set Ably API key
   fly secrets set ABLY_API=your_ably_api_key_here
   
   # Set ElevenLabs API key
   fly secrets set ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   
   # Set AssemblyAI API key
   fly secrets set ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
   ```

4. **Verify the secrets are set**:
   ```bash
   fly secrets list
   ```

### Option 2: Using Fly.io Dashboard

1. Go to [Fly.io Dashboard](https://fly.io/dashboard)
2. Select your app: `neuraplay-bridge-service`
3. Go to "Secrets" tab
4. Add each environment variable:
   - `ABLY_API`: Your Ably API key
   - `ELEVENLABS_API_KEY`: Your ElevenLabs API key
   - `ASSEMBLYAI_API_KEY`: Your AssemblyAI API key

## Deploy the Updated Service

After setting the environment variables, deploy the updated service:

```bash
cd bridge-service
fly deploy
```

## Verify Deployment

1. **Check the logs**:
   ```bash
   fly logs
   ```

2. **Test the service**:
   ```bash
   curl https://neuraplay-bridge-service.fly.dev/health
   ```

## Frontend Configuration

The frontend also needs the Ably API key. Add this to your Netlify environment variables:

```
VITE_ABLY_API_KEY=your_ably_api_key_here
```

## Benefits of Fly.io vs Netlify

### Fly.io Advantages:
- ✅ **No timeout limits** (Netlify has 26s limit)
- ✅ **WebSocket support** for real-time streaming
- ✅ **Better performance** for streaming audio
- ✅ **Lower latency** for continuous conversations
- ✅ **More control** over the server environment

### Netlify Limitations:
- ❌ **26-second timeout** for serverless functions
- ❌ **No WebSocket support** in serverless functions
- ❌ **Higher latency** for streaming conversations
- ❌ **Limited control** over server environment

## Migration Strategy

1. **Keep Netlify** for static hosting and basic functions
2. **Use Fly.io** for streaming conversation service
3. **Gradually migrate** other real-time features to Fly.io

## Troubleshooting

### Common Issues:

1. **"Missing ABLY_API" error**:
   - Ensure you've set the ABLY_API secret correctly
   - Check with `fly secrets list`

2. **ElevenLabs API errors**:
   - Verify your ElevenLabs API key is valid
   - Check the API key has the correct permissions

3. **AssemblyAI transcription errors**:
   - Ensure your AssemblyAI API key is valid
   - Check your account has sufficient credits

4. **Connection timeouts**:
   - Fly.io should handle long-running connections better than Netlify
   - Check the logs for any errors

### Debug Commands:

```bash
# View logs
fly logs

# Check secrets
fly secrets list

# Restart the service
fly apps restart neuraplay-bridge-service

# Check service status
fly status
```

## Next Steps

1. Set up the environment variables in Fly.io
2. Deploy the updated bridge service
3. Update the frontend to use the Fly.io bridge service
4. Test the streaming conversation functionality
5. Monitor performance and logs

The Fly.io deployment will provide much better performance for streaming conversations compared to Netlify's timeout limitations. 