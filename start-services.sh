#!/bin/bash
mkdir -p logs

echo "🚀 Starting Eureka Discovery Server (Port 8761)..."
nohup ./mvnw -f discovery-server/pom.xml spring-boot:run > logs/discovery-server.log 2>&1 &
sleep 12

echo "🚀 Starting API Gateway (Port 8080)..."
nohup ./mvnw -f api-gateway/pom.xml spring-boot:run > logs/api-gateway.log 2>&1 &
sleep 8

echo "🚀 Starting Auth Service (Port 8081)..."
nohup ./mvnw -f auth-service/pom.xml spring-boot:run > logs/auth-service.log 2>&1 &
sleep 5

echo "🚀 Starting Student Service (Port 8082)..."
nohup ./mvnw -f student-service/pom.xml spring-boot:run > logs/student-service.log 2>&1 &
sleep 5

echo "🚀 Starting Analytics Service (Port 8083)..."
nohup ./mvnw -f analytics-service/pom.xml spring-boot:run > logs/analytics-service.log 2>&1 &
sleep 5

echo "🚀 Starting Report Service (Port 8084)..."
nohup ./mvnw -f report-service/pom.xml spring-boot:run > logs/report-service.log 2>&1 &
sleep 5

echo "🎉 All backend services initialized in the background!"
echo "Check the 'logs/' folder to trace details."
