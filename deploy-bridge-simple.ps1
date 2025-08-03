Write-Host "Deploying Bridge Service..." -ForegroundColor Green

# Navigate to bridge service directory
Set-Location "C:\Users\sammy\neuraplay-ai-platform\bridge-service"

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow

# Deploy using flyctl
Write-Host "Starting deployment..." -ForegroundColor Blue
try {
    & "C:\Users\sammy\.fly\bin\flyctl.exe" deploy
    Write-Host "Deployment completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Deployment failed: $_" -ForegroundColor Red
    exit 1
}

# Check status
Write-Host "Checking service status..." -ForegroundColor Blue
& "C:\Users\sammy\.fly\bin\flyctl.exe" status -a neuraplay-bridge-service

# Start machines if needed
Write-Host "Ensuring machines are started..." -ForegroundColor Blue
& "C:\Users\sammy\.fly\bin\flyctl.exe" machine start 28735da0347098
& "C:\Users\sammy\.fly\bin\flyctl.exe" machine start d8d372fe049268

Write-Host "Bridge service deployment complete!" -ForegroundColor Green
Write-Host "You can now test conversation mode at https://neuraplay.org" -ForegroundColor Cyan 