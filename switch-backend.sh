#!/bin/bash

# Development helper script for switching between local and deployed backends

case "$1" in
  "local")
    echo "🏠 Switching to local backend..."
    echo "VITE_API_BASE_URL=http://localhost:8080/api" > .env
    echo "✅ Configuration updated for local backend (http://localhost:8080/api)"
    echo "💡 Make sure your local backend is running on port 8080"
    ;;
  "deployed")
    echo "☁️ Switching to deployed backend..."
    echo "VITE_API_BASE_URL=https://quiz-tournament-api.onrender.com/api" > .env
    echo "✅ Configuration updated for deployed backend"
    ;;
  "auto")
    echo "🤖 Using auto-detection (removing manual override)..."
    rm -f .env
    echo "✅ Auto-detection enabled - will try local first, then deployed"
    ;;
  "status")
    echo "📊 Current configuration:"
    if [ -f .env ]; then
      echo "Manual override active:"
      cat .env
    else
      echo "Auto-detection mode (no .env file)"
      echo "Will use: local (localhost:8080) if available, else deployed"
    fi
    ;;
  *)
    echo "🔧 Backend Configuration Helper"
    echo ""
    echo "Usage: $0 [local|deployed|auto|status]"
    echo ""
    echo "Commands:"
    echo "  local      - Force use of local backend (localhost:8080)"
    echo "  deployed   - Force use of deployed backend (Render)"
    echo "  auto       - Use auto-detection (try local first)"
    echo "  status     - Show current configuration"
    echo ""
    echo "Example:"
    echo "  $0 local     # Use local backend"
    echo "  $0 deployed  # Use deployed backend"
    echo "  $0 auto      # Auto-detect best backend"
    ;;
esac
