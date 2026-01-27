# Mission Lifecycle Monitor - Start Script

Write-Host "Starting Mission Lifecycle Monitor Sequence..." -ForegroundColor Green

# 1. Start Ground Station (Infrastructure)
Write-Host "Step 1: Launching Ground Station (Docker Infrastructure)..." -ForegroundColor Cyan
docker-compose -f ground-station/docker-compose.yaml up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "Ground Station started successfully." -ForegroundColor Green
}
else {
    Write-Error "Failed to start Ground Station. Please ensure Docker Desktop is running." 
}

# Wait for services to effectively start listening (simulated wait)
Write-Host "Waiting 5 seconds for services to warm up..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 2. Start Flight Computer (Backend) with OTel Instrumentation
Write-Host "Step 2: Launching Flight Computer (Backend)..." -ForegroundColor Cyan
try {
    $backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Flight Computer'; node --require ./flight-computer/instrumentation.js flight-computer/app.js" -PassThru
    Write-Host "Flight Computer launched in a new window (PID: $($backendProcess.Id))." -ForegroundColor Green
}
catch {
    Write-Error "Failed to launch Flight Computer."
}

# 3. Start Mission Control (Frontend)
Write-Host "Step 3: Launching Mission Control (Frontend)..." -ForegroundColor Cyan
try {
    $frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd mission-control; npm run dev" -PassThru
    Write-Host "Mission Control launched in a new window (PID: $($frontendProcess.Id))." -ForegroundColor Green
}
catch {
    Write-Error "Failed to launch Mission Control."
}

Write-Host "All systems initiated! Go to http://localhost:3000 to view Mission Control." -ForegroundColor Magenta
Write-Host ""
Write-Host "PRESS ANY KEY TO STOP THE MISSION AND SHUTDOWN DOCKER..." -ForegroundColor Red -BackgroundColor Yellow

# Wait for key press
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "STOPPING Mission and cleaning up..." -ForegroundColor Red

# Stop processes
if ($backendProcess) {
    Write-Host "Stopping Flight Computer (PID: $($backendProcess.Id))..." -ForegroundColor Yellow
    taskkill /F /T /PID $backendProcess.Id | Out-Null
}
if ($frontendProcess) {
    Write-Host "Stopping Mission Control (PID: $($frontendProcess.Id))..." -ForegroundColor Yellow
    taskkill /F /T /PID $frontendProcess.Id | Out-Null
}

# Stop Docker containers
docker-compose -f ground-station/docker-compose.yaml down

Write-Host "Mission terminated. All windows and containers closed." -ForegroundColor Green
