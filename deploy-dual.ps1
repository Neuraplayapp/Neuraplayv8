# Dual Deployment Script for Netlify and Render
# This script helps manage deployments to both platforms

param(
    [string]$Platform = "both",
    [switch]$Test,
    [switch]$Clean
)

Write-Host "🚀 Neuraplay Dual Deployment Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Function to run command with error handling
function Invoke-SafeCommand($command, $description) {
    Write-Host "`n📋 $description" -ForegroundColor Yellow
    Write-Host "Running: $command" -ForegroundColor Gray
    
    try {
        Invoke-Expression $command
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $description completed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ $description failed with exit code $LASTEXITCODE" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ $description failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    return $true
}

# Check prerequisites
Write-Host "`n🔍 Checking prerequisites..." -ForegroundColor Blue

if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "❌ npm not found. Please install npm first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green

# Clean if requested
if ($Clean) {
    Write-Host "`n🧹 Cleaning previous builds..." -ForegroundColor Yellow
    if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
    if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
    Write-Host "✅ Clean completed" -ForegroundColor Green
}

# Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Blue
if (-not (Invoke-SafeCommand "npm install" "Installing dependencies")) {
    exit 1
}

# Test builds if requested
if ($Test) {
    Write-Host "`n🧪 Testing builds..." -ForegroundColor Blue
    
    # Test Netlify build
    if (-not (Invoke-SafeCommand "npm run build:netlify" "Testing Netlify build")) {
        Write-Host "❌ Netlify build test failed" -ForegroundColor Red
        exit 1
    }
    
    # Test Render build
    if (-not (Invoke-SafeCommand "npm run build:render" "Testing Render build")) {
        Write-Host "❌ Render build test failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ All build tests passed" -ForegroundColor Green
}

# Deploy based on platform
switch ($Platform.ToLower()) {
    "netlify" {
        Write-Host "`n🌐 Deploying to Netlify..." -ForegroundColor Blue
        
        # Build for Netlify
        if (-not (Invoke-SafeCommand "npm run build:netlify" "Building for Netlify")) {
            exit 1
        }
        
        Write-Host "✅ Netlify build completed" -ForegroundColor Green
        Write-Host "📝 Deploy to Netlify by pushing to your connected Git repository" -ForegroundColor Cyan
        Write-Host "🔗 Or use: netlify deploy --prod --dir=dist" -ForegroundColor Cyan
    }
    
    "render" {
        Write-Host "`n🌐 Deploying to Render..." -ForegroundColor Blue
        
        # Build for Render
        if (-not (Invoke-SafeCommand "npm run build:render" "Building for Render")) {
            exit 1
        }
        
        Write-Host "✅ Render build completed" -ForegroundColor Green
        Write-Host "📝 Deploy to Render by pushing to your connected Git repository" -ForegroundColor Cyan
        Write-Host "🔗 Or use: render deploy" -ForegroundColor Cyan
    }
    
    "both" {
        Write-Host "`n🌐 Deploying to both platforms..." -ForegroundColor Blue
        
        # Build for both platforms
        if (-not (Invoke-SafeCommand "npm run build:netlify" "Building for Netlify")) {
            exit 1
        }
        
        if (-not (Invoke-SafeCommand "npm run build:render" "Building for Render")) {
            exit 1
        }
        
        Write-Host "✅ Both builds completed" -ForegroundColor Green
        Write-Host "📝 Deploy by pushing to your connected Git repositories" -ForegroundColor Cyan
        Write-Host "🔗 Netlify: Will auto-deploy from Git" -ForegroundColor Cyan
        Write-Host "🔗 Render: Will auto-deploy from Git" -ForegroundColor Cyan
    }
    
    default {
        Write-Host "❌ Invalid platform. Use: netlify, render, or both" -ForegroundColor Red
        exit 1
    }
}

# Environment variable check
Write-Host "`n🔧 Environment Variables Check" -ForegroundColor Blue
Write-Host "Make sure these are set in your deployment platforms:" -ForegroundColor Yellow

$envVars = @(
    "VITE_ABLY_API_KEY",
    "VITE_ELEVENLABS_API_KEY", 
    "VITE_ASSEMBLYAI_API_KEY",
    "ELEVENLABS_API_KEY"
)

foreach ($var in $envVars) {
    Write-Host "  - $var" -ForegroundColor Gray
}

Write-Host "`n📋 Platform-specific variables:" -ForegroundColor Yellow
Write-Host "  Netlify: NETLIFY=true, VITE_PLATFORM=netlify" -ForegroundColor Gray
Write-Host "  Render: RENDER=true, VITE_PLATFORM=render" -ForegroundColor Gray

# Final instructions
Write-Host "`n🎉 Deployment script completed!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Push your changes to Git" -ForegroundColor White
Write-Host "2. Check deployment logs in your platform dashboards" -ForegroundColor White
Write-Host "3. Test your deployed applications" -ForegroundColor White
Write-Host "4. Monitor for any issues" -ForegroundColor White

Write-Host "`n📚 For more information, see: DUAL_DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan 