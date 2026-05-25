#!/bin/bash

echo "=========================================================="
echo "Stopping all microservices..."
echo "=========================================================="

pkill -f 'spring-boot:run'
pkill -f 'discovery-server'
pkill -f 'api-gateway'
pkill -f 'auth-service'
pkill -f 'student-service'
pkill -f 'analytics-service'
pkill -f 'report-service'

echo "All services terminated successfully."
echo "=========================================================="
