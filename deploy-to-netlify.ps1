# Deploy to Netlify Script
Write-Host "Starting NeuraPlay deployment to Netlify..." -ForegroundColor Green

# Step 1: Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Step 2: Build the project
Write-Host "Building project..." -ForegroundColor Yellow
npm run build

# Step 3: Check if build was successful
if (Test-Path "dist") {
    Write-Host "Build successful! dist folder created." -ForegroundColor Green
} else {
    Write-Host "Build failed! dist folder not found." -ForegroundColor Red
    exit 1
}

# Step 4: Deploy to Netlify
Write-Host "Deploying to Netlify..." -ForegroundColor Yellow
Write-Host "Note: Make sure you have Netlify CLI installed and are logged in." -ForegroundColor Cyan

# Check if Netlify CLI is available
try {
    $netlifyVersion = netlify --version
    Write-Host "Netlify CLI found: $netlifyVersion" -ForegroundColor Green
} catch {
    Write-Host "Netlify CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g netlify-cli" -ForegroundColor Cyan
    exit 1
}

# Deploy using Netlify CLI
Write-Host "Deploying..." -ForegroundColor Yellow
netlify deploy --prod --dir=dist

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Your site should be live at the URL shown above." -ForegroundColor Cyan
Write-Host "Remember to set up environment variables in Netlify dashboard:" -ForegroundColor Yellow
Write-Host "  - together_token" -ForegroundColor Cyan
Write-Host "  - hf_token" -ForegroundColor Cyan
Write-Host "  - elven_labs_api_key" -ForegroundColor Cyan 