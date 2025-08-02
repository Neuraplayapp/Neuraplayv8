# Fly.io Setup Guide for NeuraPlay Bridge Service

## Step 1: Install Fly.io CLI

### Method 1: PowerShell (Try first)
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### Method 2: Manual Download (if Method 1 fails)
1. Go to https://github.com/superfly/flyctl/releases
2. Download the latest Windows release (flyctl_*_Windows_x86_64.zip)
3. Extract to a folder like `C:\flyctl\`
4. Add `C:\flyctl\` to your system PATH:
   - Press Win+R, type `sysdm.cpl`, press Enter
   - Go to "Advanced" tab → "Environment Variables"
   - Under "System Variables", find "Path" and click "Edit"
   - Click "New" and add your flyctl folder path
   - Click OK on all dialogs
   - Restart PowerShell

### Method 3: Chocolatey (if you have it)
```powershell
choco install flyctl
```

### Method 4: Scoop (if you have it)
```powershell
scoop install flyctl
```

## Step 2: Verify Installation
```powershell
fly version
# or
flyctl version
```

## Step 3: Setup Fly.io Account and Deploy

### 3.1 Login to Fly.io
```powershell
fly auth login
```
This will open your browser for authentication.

### 3.2 Navigate to Bridge Service
```powershell
cd bridge-service
```

### 3.3 Initialize Fly.io App
```powershell
fly launch --no-deploy
```
- Choose your app name (e.g., `neuraplay-bridge-service`)
- Select a region (e.g., `ord` for Chicago)
- Say NO to setting up databases
- Say YES to deploy now (or NO if you want to set secrets first)

### 3.4 Set Environment Variables (Secrets)
```powershell
fly secrets set ABLY_API=your_actual_ably_api_key_here
fly secrets set ELEVENLABS_API_KEY=your_actual_elevenlabs_api_key_here
```

### 3.5 Deploy the Application
```powershell
fly deploy
```

## Step 4: Get Your App URL
After deployment, your bridge service will be available at:
```
https://your-app-name.fly.dev
```

## Step 5: Update Frontend Configuration

Add to your Netlify environment variables:
```env
VITE_BRIDGE_SERVICE_URL=https://your-app-name.fly.dev
```

## Useful Fly.io Commands

```powershell
# Check app status
fly status

# View logs
fly logs

# Open app in browser
fly open

# Scale your app
fly scale count 1

# Check secrets
fly secrets list

# Update a secret
fly secrets set KEY=new_value

# SSH into your app
fly ssh console
```

## Troubleshooting

### CLI Installation Issues
- If `fly` command not found, try `flyctl` instead
- Restart PowerShell after installation
- Check PATH environment variable

### Deployment Issues
- Ensure all secrets are set correctly
- Check logs with `fly logs`
- Verify Dockerfile and fly.toml are in bridge-service directory

### Cost Optimization
- Fly.io has a generous free tier
- Apps auto-sleep when not in use
- Set `min_machines_running = 0` in fly.toml for maximum cost savings

## Files Created
- ✅ `bridge-service/Dockerfile` - Container configuration
- ✅ `bridge-service/fly.toml` - Fly.io app configuration  
- ✅ `bridge-service/.dockerignore` - Docker build exclusions

Your bridge service is now ready for Fly.io deployment! 🚀 