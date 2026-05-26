$RootPath = $PSScriptRoot
if (-not $RootPath) {
    $RootPath = (Get-Item -Path ".\").FullName
}

Write-Host "Starting Eureka Discovery Server..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/k `"`"$RootPath\mvnw.cmd`" -f `"$RootPath\discovery-server\pom.xml`" spring-boot:run`"" -WorkingDirectory "$RootPath\discovery-server"
Start-Sleep -Seconds 15

Write-Host "Starting API Gateway..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/k `"`"$RootPath\mvnw.cmd`" -f `"$RootPath\api-gateway\pom.xml`" spring-boot:run`"" -WorkingDirectory "$RootPath\api-gateway"
Start-Sleep -Seconds 10

Write-Host "Starting Auth Service..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/k `"`"$RootPath\mvnw.cmd`" -f `"$RootPath\auth-service\pom.xml`" spring-boot:run`"" -WorkingDirectory "$RootPath\auth-service"
Start-Sleep -Seconds 5

Write-Host "Starting Student Service..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/k `"`"$RootPath\mvnw.cmd`" -f `"$RootPath\student-service\pom.xml`" spring-boot:run`"" -WorkingDirectory "$RootPath\student-service"
Start-Sleep -Seconds 5

Write-Host "Starting Analytics Service..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/k `"`"$RootPath\mvnw.cmd`" -f `"$RootPath\analytics-service\pom.xml`" spring-boot:run`"" -WorkingDirectory "$RootPath\analytics-service"
Start-Sleep -Seconds 5

Write-Host "Starting Report Service..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/k `"`"$RootPath\mvnw.cmd`" -f `"$RootPath\report-service\pom.xml`" spring-boot:run`"" -WorkingDirectory "$RootPath\report-service"

Write-Host "All backend services started in new windows."
