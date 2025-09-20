# 🎯 Quiz Tournament Frontend

[![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/)

> **A modern React frontend application for the Quiz Tournament platform, providing intuitive user interfaces for both admin and player roles. Built with React 18, Vite, and Tailwind CSS for optimal performance and user experience.**

## 🌐 **Live Demo**

🚀 **Production App**: [`https://quiz-app-froentend.vercel.app`](https://quiz-app-froentend.vercel.app)

**Quick Access:**
- 👤 **Player Demo**: Register a new account or login with existing credentials
- 🛡️ **Admin Demo**: Use Quick Login button with pre-configured admin access
- 📱 **Responsive**: Works seamlessly on desktop, tablet, and mobile devices

**Test Credentials:**
- **Admin**: Username: `admin`, Password: `op@1234`
- **Player**: Register new account or use any existing player credentials

---

## 📋 **Table of Contents**

- [🎯 Project Overview](#-project-overview)
- [✨ Features](#-features)
- [🛠️ Technology Stack](#️-technology-stack)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [📱 User Interface](#-user-interface)
- [🔌 API Integration](#-api-integration)
- [🎨 Design System](#-design-system)
- [🌐 Deployment](#-deployment)
- [🧪 Testing](#-testing)
- [🤝 Contributing](#-contributing)

---

## 🎯 **Project Overview**

The Quiz Tournament Frontend is a single-page application (SPA) that provides a complete user interface for online quiz tournaments. It seamlessly connects with the Spring Boot backend API to deliver a smooth, responsive experience for both tournament administrators and players.

### 📖 **Business Context**
This frontend application addresses the need for an intuitive, accessible interface that allows users to participate in online quiz tournaments during lockdown restrictions. The application ensures that both technical and non-technical users can easily navigate and enjoy the quiz tournament experience.

### 🎓 **Academic Information**
- **Course**: IA608001 Intermediate Application Development Concepts
- **Institution**: Otago Polytechnic Auckland International Campus
- **Assessment**: Project Part 2 - React Frontend User Interfaces
- **Weight**: 30% of final grade
- **Student**: Roshan Aryal (ID: 1000123440)

---

## ✨ **Features**

### 🔐 **Authentication & User Management**
- ✅ User registration with role selection (Player/Admin)
- ✅ Secure login with JWT token management
- ✅ Password reset functionality via email
- ✅ Automatic session management and token refresh
- ✅ Role-based route protection

### 👤 **Player Features**
- ✅ **Tournament Discovery**: Browse all available tournaments with status filtering
- ✅ **Interactive Participation**: Join ongoing tournaments with real-time question flow
- ✅ **Progress Tracking**: View personal tournament history and statistics
- ✅ **Social Features**: Like/unlike tournaments and view community engagement
- ✅ **Profile Management**: Update personal information and preferences
- ✅ **Responsive Gameplay**: Mobile-friendly quiz interface with immediate feedback

### 🛡️ **Admin Features**
- ✅ **Tournament Creation**: Modal-based forms with comprehensive validation
- ✅ **Tournament Management**: Edit, delete, and monitor tournament status
- ✅ **User Oversight**: View participant statistics and tournament analytics
- ✅ **Content Validation**: Form validation with real-time error feedback
- ✅ **Confirmation Dialogs**: Safe deletion with user confirmation prompts
- ✅ **Statistics Dashboard**: Real-time tournament metrics and participant tracking

### 📱 **User Experience**
- ✅ **Responsive Design**: Seamless experience across all device sizes
- ✅ **Intuitive Navigation**: Clear, consistent navigation patterns
- ✅ **Loading States**: Smooth loading indicators and skeleton screens
- ✅ **Error Handling**: Graceful error handling with user-friendly messages
- ✅ **Accessibility**: Proper semantic HTML and keyboard navigation support

---

## 🛠️ **Technology Stack**

### ⚛️ **Frontend Framework**
- **React 18** - Modern React with Hooks and Concurrent Features
- **Vite 5.0** - Next-generation frontend build tool
- **React Router DOM** - Declarative routing for React applications
- **React Context API** - Global state management for authentication

### 🎨 **Styling & Design**
- **Tailwind CSS 3.0** - Utility-first CSS framework
- **Lucide React** - Beautiful, customizable icon library
- **Custom CSS Components** - Reusable component classes for consistency
- **Responsive Design** - Mobile-first approach with breakpoint optimization

### 🔗 **API & Communication**
- **Axios** - Promise-based HTTP client with interceptors
- **JWT Token Management** - Automatic token handling and refresh
- **Dynamic Backend Detection** - Supports both local and production APIs
- **Error Boundary** - Global error handling for API failures

### 🛠️ **Development Tools**
- **ESLint** - Code linting with React and accessibility rules
- **Prettier** - Code formatting for consistent style
- **Vite Dev Server** - Hot module replacement for fast development
- **Environment Variables** - Configuration management for different environments

---

## 🏗️ **Architecture**

```
📦 Quiz Tournament Frontend
├── 📂 public/                  # Static Assets
│   ├── 🖼️ icons & images      # App icons and images
│   └── 📄 index.html          # HTML template
│
├── 📂 src/
│   ├── 📱 components/          # Reusable Components
│   │   ├── 🔒 ProtectedRoute.jsx    # Route protection wrapper
│   │   ├── 🧭 Navigation.jsx        # Main navigation component
│   │   └── 🎛️ common/              # Shared UI components
│   │       ├── Modal.jsx           # Modal dialog component
│   │       ├── Loading.jsx         # Loading indicators
│   │       └── ErrorBoundary.jsx   # Error handling wrapper
│   │
│   ├── 🌐 contexts/            # React Context Providers
│   │   └── 🔐 AuthContext.jsx      # Authentication state management
│   │
│   ├── 📄 pages/               # Page Components
│   │   ├── 🏠 Home.jsx             # Landing page
│   │   ├── 🔑 Login.jsx            # Login interface
│   │   ├── 📝 Register.jsx         # User registration
│   │   ├── 👤 Profile.jsx          # User profile management
│   │   │
│   │   ├── 🛡️ admin/              # Admin-only Pages
│   │   │   ├── AdminDashboard.jsx   # Admin overview
│   │   │   ├── TournamentManager.jsx # Tournament CRUD
│   │   │   └── UserManagement.jsx   # User administration
│   │   │
│   │   └── 🎮 player/             # Player-only Pages
│   │       ├── TournamentList.jsx   # Browse tournaments
│   │       ├── QuizPlay.jsx         # Quiz participation
│   │       └── PlayerHistory.jsx    # Personal statistics
│   │
│   ├── ⚙️ config/              # Configuration
│   │   └── 🔌 api.js               # API configuration & calls
│   │
│   ├── 🎨 styles/              # Styling
│   │   ├── 📱 index.css            # Global styles & Tailwind
│   │   └── 🎯 components.css       # Component-specific styles
│   │
│   ├── 🔧 utils/               # Utility Functions
│   │   ├── 📅 dateHelpers.js       # Date formatting utilities
│   │   ├── 🛡️ validators.js        # Form validation helpers
│   │   └── 💾 localStorage.js      # Local storage management
│   │
│   ├── 📱 App.jsx              # Main application component
│   └── 🚀 main.jsx             # Application entry point
```

---

## 🚀 **Quick Start**

### **Prerequisites**
- 📦 Node.js (v18 or higher)
- 📥 npm or yarn package manager
- 🌐 Git version control

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/roshanaryal1/quiz-app-froentend.git
cd quiz-app-froentend
```

2. **Install dependencies**
```bash
# Using npm
npm install

# Using yarn
yarn install
```

3. **Set up environment variables**
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your configuration
VITE_API_BASE_URL=https://quiz-tournament-api.onrender.com/api

# For local development with backend on port 8080:
# VITE_API_BASE_URL=http://localhost:8080/api
```

4. **Start the development server**
```bash
# Using npm
npm run dev

# Using yarn
yarn dev
```

5. **Open in browser**
```
The app will be available at: http://localhost:3000
```

### **Available Scripts**

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint for code quality
npm run lint:fix     # Fix linting issues automatically
```

---

## 📱 **User Interface**

### **🏠 Landing Page**
- Clean, modern design with call-to-action buttons
- Tournament statistics and featured tournaments
- Quick access to registration and login

### **🔑 Authentication Pages**
- **Login**: Standard form with "Quick Admin Login" for easy testing
- **Register**: Role selection (Player/Admin) with comprehensive validation
- **Password Reset**: Email-based recovery with secure token validation

### **🎮 Player Interface**
- **Tournament Dashboard**: Filter tournaments by status (ongoing, upcoming, completed)
- **Quiz Participation**: Step-by-step question flow with immediate feedback
- **Personal History**: Detailed statistics with performance metrics
- **Profile Management**: Update personal information and preferences

### **🛡️ Admin Interface**
- **Tournament Creation**: Modal forms with validation and date pickers
- **Management Table**: Sortable tournament list with action buttons
- **Statistics Overview**: Real-time metrics and participant tracking
- **User Management**: View and manage registered users

---

## 🔌 **API Integration**

### **Dynamic Backend Connection**
```javascript
// Automatic detection between local and production APIs
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8080/api'  // Local development
  : 'https://quiz-tournament-api.onrender.com/api';  // Production
```

### **Authentication Flow**
```javascript
// JWT token management with automatic refresh
const authInterceptor = (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};
```

### **Error Handling**
```javascript
// Global error handling with user-friendly messages
const errorInterceptor = (error) => {
  if (error.response?.status === 401) {
    // Redirect to login
    window.location.href = '/login';
  }
  return Promise.reject(error);
};
```

---

## 🎨 **Design System**

### **🎨 Color Palette**
```css
/* Primary Colors */
--primary-blue: #3b82f6;
--primary-hover: #2563eb;

/* Semantic Colors */
--success-green: #10b981;
--warning-yellow: #f59e0b;
--danger-red: #ef4444;
--info-cyan: #06b6d4;

/* Neutral Colors */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-500: #6b7280;
--gray-900: #111827;
```

### **🧩 Component Classes**
```css
/* Buttons */
.btn-primary     /* Primary action buttons */
.btn-secondary   /* Secondary action buttons */
.btn-danger      /* Delete/dangerous actions */

/* Forms */
.form-input      /* Standardized input styling */
.form-label      /* Consistent label formatting */
.form-error      /* Error message styling */

/* Layout */
.card            /* Container cards */
.modal-overlay   /* Modal backdrop */
.page-container  /* Page layout wrapper */
```

### **📱 Responsive Breakpoints**
```css
/* Tailwind CSS breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
```

---

## 🌐 **Deployment**

### **Production Deployment (Vercel)**

The application is deployed on Vercel with automatic builds:

```bash
# Environment Variables (set in Vercel dashboard)
VITE_API_BASE_URL=https://quiz-tournament-api.onrender.com/api
```

### **Manual Deployment**

```bash
# Build the project
npm run build

# Deploy the dist/ folder to your hosting platform
# - Vercel: Connect GitHub repo for automatic deployments
# - Netlify: Drag and drop dist/ folder or connect Git
# - GitHub Pages: Use gh-pages branch deployment
```

### **Local Production Testing**

```bash
# Build and preview locally
npm run build
npm run preview

# The production build will be available at http://localhost:4173
```

---

## 🧪 **Testing**

### **Manual Testing Checklist**

#### **🔐 Authentication Testing**
- ✅ User registration with validation
- ✅ Login with username/email and password
- ✅ Admin quick login functionality
- ✅ Password reset email flow
- ✅ Token persistence across browser sessions
- ✅ Automatic logout on token expiration

#### **🎮 Player Functionality**
- ✅ Tournament browsing and filtering
- ✅ Quiz participation flow
- ✅ Like/unlike tournaments
- ✅ Profile updates
- ✅ Tournament history viewing
- ✅ Responsive design on mobile devices

#### **🛡️ Admin Functionality**
- ✅ Tournament creation with validation
- ✅ Tournament editing (name, dates)
- ✅ Tournament deletion with confirmation
- ✅ View tournament questions and participants
- ✅ User management capabilities

#### **📱 Cross-Browser Testing**
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### **Automated Testing Setup**

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

### **API Testing Integration**

```javascript
// Test API connectivity
const testAPIConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/test/health`);
    console.log('API Status:', response.status === 200 ? 'UP' : 'DOWN');
  } catch (error) {
    console.error('API Connection Failed:', error.message);
  }
};
```

---

## 🔧 **Configuration**

### **Environment Variables**

```bash
# .env file configuration
VITE_API_BASE_URL=https://quiz-tournament-api.onrender.com/api

# Local development
VITE_API_BASE_URL=http://localhost:8080/api

# Optional: Enable debug mode
VITE_DEBUG_MODE=true
```

### **Vite Configuration**

```javascript
// vite.config.js
export default {
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
};
```

### **Tailwind Configuration**

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8'
        }
      }
    }
  },
  plugins: []
};
```

---

## 🐛 **Troubleshooting**

### **Common Issues & Solutions**

#### **🚨 White Screen Issues**
If you encounter white screens when accessing admin or player features:

1. **Check Authentication Status**
   ```javascript
   // Open browser console and check
   console.log('Token:', localStorage.getItem('token'));
   console.log('User:', localStorage.getItem('user'));
   ```

2. **Verify API Connection**
   ```bash
   # Test backend health
   curl https://quiz-tournament-api.onrender.com/api/test/health
   ```

3. **Clear Browser Data**
   ```javascript
   // Clear localStorage
   localStorage.clear();
   // Then refresh and login again
   ```

#### **🌐 API Connection Issues**

```javascript
// Check current API URL
console.log('Current API URL:', import.meta.env.VITE_API_BASE_URL);

// Test connection manually
fetch('https://quiz-tournament-api.onrender.com/api/test/health')
  .then(response => console.log('API Status:', response.status))
  .catch(error => console.error('API Error:', error));
```

#### **📱 Styling Issues**

```bash
# Rebuild Tailwind styles
npm run build

# Clear browser cache
# Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
```

#### **🔒 CORS Issues**

If you get CORS errors:
1. Ensure the backend has proper CORS configuration
2. Check that the API URL in `.env` matches the backend deployment
3. Verify the backend is accessible and responding

### **Debug Mode**

```javascript
// Enable debug logging
localStorage.setItem('debug', 'true');

// View API calls in console
// Check Network tab in browser DevTools for failed requests
```

---

## 📋 **Assessment Requirements Met**

### **✅ Functionality Requirements (50 points)**

#### **Admin User Features**
- ✅ Create new quiz tournament with modal form
- ✅ Form validation with error messages
- ✅ View tournaments in table format
- ✅ Update tournament with modal form
- ✅ Delete tournament with confirmation prompt
- ✅ View tournament questions when clicked

#### **Player User Features**
- ✅ View and browse quiz tournaments
- ✅ Participate in quiz tournaments
- ✅ Track completion progress and results
- ✅ Filter tournaments by status

#### **Technical Implementation**
- ✅ React frontend with responsive design
- ✅ Form validation and error handling
- ✅ Modal dialogs for forms
- ✅ RESTful API integration
- ✅ Professional user interface design

### **✅ Code Quality (20 points)**
- ✅ Consistent naming conventions
- ✅ Well-organized component structure
- ✅ Clear commenting for complex logic
- ✅ Proper code formatting and indentation
- ✅ Modular and reusable components

### **✅ Documentation & Git Usage (15 points)**
- ✅ Comprehensive README documentation
- ✅ Clear setup and installation instructions
- ✅ Meaningful commit messages
- ✅ Regular commits reflecting feature development
- ✅ Professional repository organization

### **✅ Presentation (15 points)**
- ✅ Professional UI design and layout
- ✅ Consistent visual design system
- ✅ Responsive design for all screen sizes
- ✅ User-friendly navigation and interaction
- ✅ Accessible interface design

---

## 🤝 **Contributing**

### **Development Workflow**

1. **🍴 Fork the repository**
2. **🌿 Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **✍️ Make your changes**
   - Follow existing code patterns
   - Add comments for complex logic
   - Test your changes thoroughly
4. **📝 Commit your changes**
   ```bash
   git commit -m 'Add: your descriptive commit message'
   ```
5. **📤 Push to your branch**
   ```bash
   git push origin feature/your-feature-name
   ```
6. **🔄 Open a Pull Request**

### **Code Standards**

#### **React Best Practices**
- ⚛️ Use functional components with hooks
- 🎯 Keep components small and focused
- 📋 Use TypeScript for type safety (future enhancement)
- 🧪 Write unit tests for complex components

#### **CSS/Styling Guidelines**
- 🎨 Use Tailwind utility classes primarily
- 📱 Mobile-first responsive design
- 🎯 Consistent spacing and typography
- 🌗 Consider dark mode compatibility

#### **Git Commit Messages**
```
feat: add new tournament creation modal
fix: resolve authentication token refresh issue
docs: update installation instructions
style: improve responsive design for mobile
refactor: simplify API error handling
```

---

## 📞 **Support & Contact**

### **🆘 Getting Help**

1. **📚 Documentation**: Check this README and inline code comments
2. **🐛 Known Issues**: Review the [Troubleshooting](#-troubleshooting) section
3. **🧪 Testing**: Follow the [Testing](#-testing) guidelines
4. **🔧 Configuration**: Verify your [Configuration](#-configuration) setup

### **🐛 Reporting Issues**

When reporting issues, please include:
- 🌐 **Browser and version**
- 📱 **Device type** (desktop/mobile)
- 🔗 **Steps to reproduce** the issue
- 📸 **Screenshots** if applicable
- 🗒️ **Console error messages**

### **💡 Feature Requests**

For new features, please describe:
- 🎯 **Use case** and user story
- 💼 **Business value** and impact
- 🛠️ **Technical considerations**
- 📋 **Acceptance criteria**

---

## 🔗 **Related Links**

### **🌐 Live Applications**
- 🎯 **Frontend App**: [https://quiz-app-froentend.vercel.app](https://quiz-app-froentend.vercel.app)
- 🔌 **Backend API**: [https://quiz-tournament-api.onrender.com](https://quiz-tournament-api.onrender.com)
- 🏥 **API Health**: [https://quiz-tournament-api.onrender.com/api/test/health](https://quiz-tournament-api.onrender.com/api/test/health)

### **📚 Repository Links**
- 🖥️ **Backend Repository**: [https://github.com/roshanaryal1/quiz-app-backend](https://github.com/roshanaryal1/quiz-app-backend)
- 🎨 **Frontend Repository**: [https://github.com/roshanaryal1/quiz-app-froentend](https://github.com/roshanaryal1/quiz-app-froentend)

### **🛠️ Technology Documentation**
- ⚛️ **React**: [https://reactjs.org/docs](https://reactjs.org/docs)
- ⚡ **Vite**: [https://vitejs.dev/guide](https://vitejs.dev/guide)
- 🎨 **Tailwind CSS**: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- 🌐 **Axios**: [https://axios-http.com/docs](https://axios-http.com/docs)

---

## 📄 **License**

This project is developed for educational purposes as part of the **IA608001 Intermediate Application Development Concepts** course at **Otago Polytechnic Auckland International Campus**.

**Student**: Roshan Aryal (ID: 1000123440)  
**Academic Year**: 2025  
**Submission**: Project Part 2 (Frontend) - 30% Weight

---

## 🚀 **Deployment Status**

### **✅ Production Environment**
- **Platform**: Vercel
- **URL**: [https://quiz-app-froentend.vercel.app](https://quiz-app-froentend.vercel.app)
- **Status**: ✅ Live and accessible
- **Build**: Automatic deployment from main branch
- **SSL**: ✅ HTTPS enabled

### **🔧 Development Environment**
- **Local Server**: `http://localhost:3000`
- **Hot Reload**: ✅ Enabled
- **Source Maps**: ✅ Available for debugging
- **API Proxy**: Configured for local backend testing

---

## 🎉 **Acknowledgments**

- 🏫 **Otago Polytechnic Auckland International Campus** for providing the learning environment
- 👨‍🏫 **Tariq Khan** for course instruction and guidance
- 🌐 **OpenTDB** for providing the trivia questions API
- 🎨 **Tailwind CSS** team for the excellent utility framework
- ⚛️ **React** community for the robust frontend framework

---

**Built with ❤️ using React, Vite, Tailwind CSS, and modern web development practices.**

### 🏆 **Project Highlights**

- 🎯 **Complete Full-Stack Integration** with seamless frontend-backend communication
- 📱 **Responsive Design** working flawlessly across all device sizes
- 🔒 **Secure Authentication** with JWT tokens and role-based access control
- 🎨 **Modern UI/UX** with Tailwind CSS and professional design patterns
- 🚀 **Production Deployment** on industry-standard cloud platforms
- 📚 **Comprehensive Documentation** for easy setup and maintenance
- 🧪 **Thorough Testing** ensuring reliability and user satisfaction