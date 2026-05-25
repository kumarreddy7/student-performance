Write-Host "Starting Eureka Discovery Server..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/k e:\final-year-project\mvnw.cmd -f e:\final-year-project\discovery-server\pom.xml spring-boot:run" -WorkingDirectory "e:\final-year-project\discovery-server"
Start-Sleep -Seconds 15

Write-Host "Starting API Gateway..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/k e:\final-year-project\mvnw.cmd -f e:\final-year-project\api-gateway\pom.xml spring-boot:run" -WorkingDirectory "e:\final-year-project\api-gateway"
Start-Sleep -Seconds 10

Write-Host "Starting Auth Service..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/k e:\final-year-project\mvnw.cmd -f e:\final-year-project\auth-service\pom.xml spring-boot:run" -WorkingDirectory "e:\final-year-project\auth-service"
Start-Sleep -Seconds 5

Write-Host "Starting Student Service..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/k e:\final-year-project\mvnw.cmd -f e:\final-year-project\student-service\pom.xml spring-boot:run" -WorkingDirectory "e:\final-year-project\student-service"
Start-Sleep -Seconds 5

Write-Host "Starting Analytics Service..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/k e:\final-year-project\mvnw.cmd -f e:\final-year-project\analytics-service\pom.xml spring-boot:run" -WorkingDirectory "e:\final-year-project\analytics-service"
Start-Sleep -Seconds 5

Write-Host "Starting Report Service..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/k e:\final-year-project\mvnw.cmd -f e:\final-year-project\report-service\pom.xml spring-boot:run" -WorkingDirectory "e:\final-year-project\report-service"

Write-Host "All backend services started in new windows."
