# Quick Deploy Script for NeuraPlay
Write-Host "🚀 Quick Deploy to Netlify" -ForegroundColor Green

# Step 1: Install dependencies (if needed)
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Step 2: Build the project
Write-Host "🔨 Building project..." -ForegroundColor Yellow
npm run build

# Step 3: Check if build was successful
if (Test-Path "dist") {
    Write-Host "✅ Build successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Step 4: Deploy to Netlify
Write-Host "🚀 Deploying to Netlify..." -ForegroundColor Yellow
Write-Host "Note: This will deploy to your existing Netlify project" -ForegroundColor Cyan

# Deploy using the existing project
netlify deploy --prod --dir=dist

Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host "Your site should be live at the URL shown above." -ForegroundColor Cyan 