#!/usr/bin/env bash
set -e

echo "============================================================"
echo "♻️  KABADIWALA CONNECT — SIH 2026 FULL-STACK PLATFORM"
echo "============================================================"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# 1. Setup ML Microservice if venv exists
if [ -d "apps/ml-service/venv" ]; then
  echo "🚀 Starting ML Microservice on port 8000..."
  ./apps/ml-service/venv/bin/python3 apps/ml-service/main.py > /tmp/ml-service.log 2>&1 &
  ML_PID=$!
  echo "   ML Service PID: $ML_PID"
fi

# 2. Setup Database & Backend
echo "📦 Setting up database schema and seed..."
cd apps/api
npm run seed

echo "🚀 Starting Express Backend on port 5000..."
npm run dev > /tmp/api-service.log 2>&1 &
API_PID=$!
echo "   API Service PID: $API_PID"

# 3. Frontend
echo "🚀 Starting Vite React Frontend on port 3000..."
cd ../web
npm run dev -- --host 0.0.0.0 --port 3000 > /tmp/web-service.log 2>&1 &
WEB_PID=$!
echo "   Web Service PID: $WEB_PID"

echo "============================================================"
echo "🎉 All services launched successfully!"
echo "👉 Frontend: http://localhost:3000"
echo "👉 Backend:  http://localhost:5000"
echo "👉 ML API:   http://localhost:8000/docs"
echo "============================================================"
echo "Press Ctrl+C to stop all services."

trap "kill $ML_PID $API_PID $WEB_PID 2>/dev/null || true; exit 0" INT TERM
wait
