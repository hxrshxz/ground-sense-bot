#!/bin/bash

# Quick stop script

cd backend
echo "🛑 Stopping all services..."
docker compose down
echo "✅ Stopped!"
