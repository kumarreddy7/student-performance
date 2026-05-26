#!/bin/bash
echo "🛑 Stopping all microservices and frontend client ports..."
for port in 8761 8080 8081 8082 8083 8084 5173
do
  pid=$(lsof -t -i:$port)
  if [ ! -z "$pid" ]; then
    echo "Killing process on port $port (PID: $pid)"
    kill -9 $pid
  fi
done
echo "✅ All services stopped successfully."
