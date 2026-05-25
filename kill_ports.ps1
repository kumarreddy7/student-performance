$ports = @(5173, 8080, 8761, 8081, 8082, 8083, 8084, 8085, 3306, 5432)
foreach ($p in $ports) {
    $c = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    if ($c) {
        foreach ($conn in $c) {
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}
Write-Host "Killed all specified ports."
