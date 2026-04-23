$url = "https://backend-air-quality.onrender.com/api/sensor-data/latest"
$lastTimestamp = ""
$count = 0
Write-Host "========================================"
Write-Host " AIR QUALITY SENSOR DATA MONITOR"
Write-Host " Polling every 30s | New data ~5 min"
Write-Host " Press Ctrl+C to stop"
Write-Host "========================================"
Write-Host ""

while ($true) {
    $count++
    $now = Get-Date -Format "HH:mm:ss"
    try {
        $resp = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 15 -ErrorAction Stop
        $ts = $resp.timestamp
        $m = $resp.metrics
        $loc = $resp.location

        if ($ts -ne $lastTimestamp) {
            Write-Host ""
            Write-Host ">>> NEW DATA RECEIVED at $now <<<"  -ForegroundColor Green
            Write-Host "  Timestamp: $ts" -ForegroundColor Yellow
            Write-Host "  Location:  $loc" -ForegroundColor Yellow
            Write-Host "  ---- Metrics ----"
            Write-Host "  PM1.0:  $($m.pm1) ug/m3"
            Write-Host "  PM2.5:  $($m.pm25) ug/m3"
            Write-Host "  PM10:   $($m.pm10) ug/m3"
            Write-Host "  CO:     $($m.co) ppm"
            Write-Host "  CO2:    $($m.co2) ppm"
            Write-Host "  Temp:   $($m.temperature) C"
            Write-Host "  Humid:  $($m.humidity) %"
            Write-Host "  VOC:    $($m.voc_index)"
            Write-Host "  NOx:    $($m.nox_index)"
            Write-Host "  -------------------"
            $lastTimestamp = $ts
        } else {
            Write-Host "[$now] Poll #$count - No change yet (last data: $ts)"
        }
    } catch {
        Write-Host "[$now] Poll #$count - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    Start-Sleep -Seconds 30
}
