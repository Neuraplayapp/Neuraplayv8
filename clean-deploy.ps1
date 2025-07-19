# Clean Deployment Script for Windows - Removes all bolt.new and StackBlitz associations

Write-Host "🧹 Cleaning bolt.new and StackBlitz associations..." -ForegroundColor Green

# Remove bolt directories and files
if (Test-Path ".bolt") { Remove-Item -Recurse -Force ".bolt" }
if (Test-Path ".netlify") { Remove-Item -Recurse -Force ".netlify" }
if (Test-Path "bolt.config.*") { Remove-Item -Force "bolt.config.*" }
if (Test-Path "stackblitz.config.*") { Remove-Item -Force "stackblitz.config.*" }

# Clean build artifacts
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }

# Reinstall dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Build the project
Write-Host "🔨 Building project..." -ForegroundColor Yellow
npm run build

# Deploy to Netlify
Write-Host "🚀 Deploying to Netlify..." -ForegroundColor Yellow
netlify deploy --prod

Write-Host "✅ Clean deployment complete!" -ForegroundColor Green
Write-Host "🎉 All bolt.new and StackBlitz associations removed" -ForegroundColor Green 