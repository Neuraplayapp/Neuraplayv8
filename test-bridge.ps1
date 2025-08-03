Write-Host "Testing Bridge Service..." -ForegroundColor Green

$urls = @(
    "https://neuraplay-bridge-service.fly.dev/",
    "https://neuraplay-bridge-service.fly.dev/health"
)

foreach ($url in $urls) {
    Write-Host "Testing: $url" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 5
        Write-Host "SUCCESS: $($response.StatusCode) - $($response.Content)" -ForegroundColor Green
    } catch {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "Test complete!" -ForegroundColor Cyan 