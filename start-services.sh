#!/bin/bash

echo "=========================================================="
echo "Starting Student Performance Predictor Microservices..."
echo "=========================================================="

# 1. Discovery Server
echo "Starting Discovery Server (port 8761)..."
mvn -f discovery-server/pom.xml spring-boot:run > discovery-server.log 2>&1 &
echo "Waiting for Discovery Server to initialize..."
sleep 12

# 2. API Gateway
echo "Starting API Gateway (port 8080)..."
mvn -f api-gateway/pom.xml spring-boot:run > api-gateway.log 2>&1 &
sleep 3

# 3. Auth Service
echo "Starting Auth Service (port 8081)..."
mvn -f auth-service/pom.xml spring-boot:run > auth-service.log 2>&1 &

# 4. Student Service
echo "Starting Student Service (port 8082)..."
mvn -f student-service/pom.xml spring-boot:run > student-service.log 2>&1 &

# 5. Analytics Service
echo "Starting Analytics Service (port 8083)..."
mvn -f analytics-service/pom.xml spring-boot:run > analytics-service.log 2>&1 &

# 6. Report Service
echo "Starting Report Service (port 8084)..."
mvn -f report-service/pom.xml spring-boot:run > report-service.log 2>&1 &

echo "=========================================================="
echo "All microservices started in the background!"
echo "Check logs using: tail -f [service].log"
echo "Eureka Registry: http://localhost:8761"
echo "API Gateway Edge: http://localhost:8080"
echo "=========================================================="
