#!/usr/bin/env powershell

Write-Host "📊 Checking Bridge Service Status..." -ForegroundColor Green

# Check service status
Write-Host "🔍 Bridge Service Status:" -ForegroundColor Yellow
& "C:\Users\sammy\.fly\bin\flyctl.exe" status -a neuraplay-bridge-service

Write-Host "`n🌐 Health Check:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://neuraplay-bridge-service.fly.dev/health" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Bridge service is healthy and responding!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Bridge service responded with status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Bridge service is not responding: $_" -ForegroundColor Red
}

Write-Host "`n🎤 Test conversation mode at: https://neuraplay.org" -ForegroundColor Cyan 