# Backend Switching Testing Guide

## 🚀 Quick Start

Your React frontend now automatically handles switching between local and deployed backends:

- **Development**: Uses `http://localhost:8080/api` (if available)
- **Production**: Uses `https://quiz-tournament-api.onrender.com/api`
- **Manual Override**: Via environment variables

## 📋 Testing Scenarios

### 1. **Test Automatic Development Mode**

```bash
# Start development server
npm run dev

# Check console for:
# "🌐 API Configuration: Using http://localhost:8080/api"
# OR
# "⚠️ Local backend unavailable, trying deployed..."
```

**Expected Behavior:**
- If local backend (8080) is running → Uses local
- If local backend is down → Falls back to deployed
- Backend switcher UI appears in bottom-right corner

### 2. **Test Production Build**

```bash
# Create production build
npm run build

# Serve production build
npm run preview

# Should always use deployed backend
```

**Expected Behavior:**
- Always uses `https://quiz-tournament-api.onrender.com/api`
- No backend switcher UI visible
- Console shows: "🚀 Production mode: Using deployed backend..."

### 3. **Test Manual Override**

```bash
# Force local backend
./switch-backend.sh local
npm run dev

# Force deployed backend
./switch-backend.sh deployed
npm run dev

# Reset to auto-detection
./switch-backend.sh auto
npm run dev
```

### 4. **Test Backend Health & Switching**

```bash
# Start with local backend running
npm run dev

# Stop local backend (simulate failure)
# Make API call → Should auto-switch to deployed

# Restart local backend
# Click "Switch" button → Should find local backend
```

## 🔧 Configuration Files

### `.env.development` (Auto-loaded in dev)
```env
# Development settings
VITE_APP_ENV=development
VITE_DEBUG_MODE=true
VITE_LOCAL_API_HOST=localhost
VITE_LOCAL_API_PORT=8080
VITE_API_LOGGING=true
```

### `.env.production` (Auto-loaded in prod)
```env
# Production settings
VITE_API_BASE_URL=https://quiz-tournament-api.onrender.com/api
VITE_APP_ENV=production
VITE_DEBUG_MODE=false
VITE_API_LOGGING=false
VITE_CACHE_ENABLED=true
```

### `.env` (Manual override)
```env
# Force specific backend (overrides auto-detection)
VITE_API_BASE_URL=http://localhost:8080/api
# OR
VITE_API_BASE_URL=https://quiz-tournament-api.onrender.com/api
```

## 🎛️ UI Backend Switcher

**Location**: Bottom-right corner (development only)

**Features**:
- Shows current backend (Local/Deployed)
- Real-time health status (🟢/🔴)
- One-click backend switching
- Displays full URL on hover

**Usage**:
- Green icon = Backend healthy
- Red icon = Backend unhealthy
- Yellow spinning = Checking health
- Click "Switch" to try alternative backend

## 🧪 API Testing Commands

### Test Local Backend Health
```bash
curl http://localhost:8080/api/test/health
```

### Test Deployed Backend Health
```bash
curl https://quiz-tournament-api.onrender.com/api/test/health
```

### Test Tournament Endpoints
```bash
# Local
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/tournaments

# Deployed
curl -H "Authorization: Bearer YOUR_TOKEN" https://quiz-tournament-api.onrender.com/api/tournaments
```

## 🛠️ Troubleshooting

### Problem: Always uses deployed backend in development

**Solution**:
```bash
# Check if manual override is set
./switch-backend.sh status

# Reset to auto-detection
./switch-backend.sh auto
```

### Problem: Backend switcher not visible

**Check**:
- Running in development mode (`npm run dev`)
- Not in production build (`npm run build`)
- Component imported in App.jsx

### Problem: Health check fails

**Check**:
1. Backend server is running
2. Correct port (8080 for local)
3. CORS configured on backend
4. Health endpoint exists (`/api/test/health`)

### Problem: Authentication fails after backend switch

**Solution**:
- Backend switching preserves authentication
- If issues persist, re-login
- Check token expiration

## 📊 Environment Priority

1. **Manual Override** (`.env` file with `VITE_API_BASE_URL`)
2. **Development Mode** (uses localhost:8080)
3. **Production Mode** (uses deployed URL)
4. **Fallback** (deployed URL)

## 🔄 Automatic Retry Logic

The system automatically:
- Retries failed requests with alternative backend
- Switches backends on 500/503 errors
- Preserves authentication tokens
- Clears cache when switching
- Logs all switching activities

## 🎯 Testing Checklist

- [ ] Development mode uses local backend (if available)
- [ ] Development mode falls back to deployed (if local down)
- [ ] Production mode always uses deployed
- [ ] Manual override works (environment variables)
- [ ] Backend switcher UI appears in development
- [ ] Health status updates correctly
- [ ] One-click switching works
- [ ] Authentication preserved during switches
- [ ] Tournament API works on both backends
- [ ] Error handling triggers backend switching
- [ ] Cache clears on backend switch

## 📝 Notes

- Local backend must run on port 8080
- Health endpoint required: `/api/test/health`
- CORS must be configured for localhost:3000
- JWT tokens work with both backends
- QuizTournament entity uses @JsonIgnoreProperties and EAGER fetching
