# 🎯 Quiz Tournament Frontend

A modern React frontend application for the Quiz Tournament platform, built with React 18, Vite, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd quiz-app-frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your API URL
VITE_API_BASE_URL=https://quiz-tournament-api.onrender.com/api
```

4. **Start the development server**
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📁 Project Structure

```
src/
├── components/           # Reusable components
│   ├── common/          # Common UI components
│   ├── Navigation.jsx   # Main navigation
│   └── ProtectedRoute.jsx
├── contexts/            # React contexts
│   └── AuthContext.jsx  # Authentication state
├── pages/               # Page components
│   ├── admin/           # Admin-only pages
│   ├── player/          # Player-only pages
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   └── Profile.jsx
├── config/              # Configuration
│   └── api.js          # API configuration & calls
└── App.jsx             # Main app component
```

## 🔐 Authentication

The app supports two user types:
- **Players**: Can participate in tournaments, like tournaments, view results
- **Admins**: Can create/edit/delete tournaments, manage users

### Default Admin Credentials
- Username: `admin`
- Password: `op@1234`

## 📱 Features

### For Players
- ✅ User registration and login
- ✅ View all tournaments (ongoing, upcoming, completed)
- ✅ Participate in live tournaments
- ✅ Like/unlike tournaments
- ✅ View personal tournament history
- ✅ Update profile information

### For Admins
- ✅ Create new tournaments with validation
- ✅ Edit existing tournaments (name, dates)
- ✅ Delete tournaments with confirmation
- ✅ View tournament statistics and participant scores
- ✅ Manage tournament questions from OpenTDB API

## 🎨 Design System

### Colors
- Primary: Blue (`#3b82f6`)
- Secondary: Gray (`#6b7280`)
- Success: Green (`#10b981`)
- Warning: Yellow (`#f59e0b`)
- Danger: Red (`#ef4444`)

### Components
The app uses a custom design system built on Tailwind CSS with reusable component classes:

- `.btn-primary` - Primary buttons
- `.btn-secondary` - Secondary buttons
- `.btn-danger` - Danger/delete buttons
- `.form-input` - Form inputs
- `.form-label` - Form labels
- `.card` - Card containers
- `.modal-overlay` - Modal backgrounds

## 🔌 API Integration

The frontend connects to your Spring Boot backend API. Key API endpoints:

### Authentication
- `POST /auth/signin` - User login
- `POST /auth/signup/player` - Player registration
- `POST /auth/signup/admin` - Admin registration

### Tournaments
- `GET /tournaments` - Get all tournaments
- `POST /tournaments` - Create tournament (Admin)
- `PUT /tournaments/{id}` - Update tournament (Admin)
- `DELETE /tournaments/{id}` - Delete tournament (Admin)
- `GET /tournaments/{id}/questions` - Get questions
- `POST /tournaments/{id}/participate` - Submit answers (Player)

### Users
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update profile

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Netlify
1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify
3. Set environment variables in Netlify dashboard

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

## 🔧 Configuration

### Environment Variables
```bash
# API Configuration
VITE_API_BASE_URL=https://your-api-domain.com/api

# For local development with backend running on port 8080:
# VITE_API_BASE_URL=http://localhost:8080/api
```

### Tailwind Configuration
The app uses a custom Tailwind configuration with extended colors and component classes. See `tailwind.config.js` for details.

## 📝 Key Features Implementation

### Admin Tournament Management
- **Create Tournament Modal**: Form validation, date validation, category selection
- **Edit Tournament**: In-place editing with validation
- **Delete Confirmation**: Safe deletion with confirmation modal
- **Tournament Statistics**: Real-time participant count, likes, scores

### Player Experience  
- **Tournament Filtering**: Filter by status (ongoing, upcoming, completed)
- **Real-time Status**: Live indicators for ongoing tournaments
- **Responsive Design**: Mobile-friendly interface
- **Quiz Participation**: Step-by-step question flow with immediate feedback

### Authentication & Security
- **JWT Token Management**: Automatic token handling with axios interceptors
- **Role-based Routes**: Protected routes based on user roles
- **Form Validation**: Client-side validation with error messages
- **Password Reset**: Email-based password reset flow

## 🐛 Common Issues & Solutions

### API Connection Issues
```bash
# If you get CORS errors, make sure your backend allows your frontend domain
# Check the backend application.properties for CORS settings
```

### Build Issues
```bash
# Clear node_modules and reinstall if you get dependency issues
rm -rf node_modules package-lock.json
npm install
```

### Styling Issues
```bash
# If Tailwind styles aren't working, rebuild the CSS
npm run build
```

## 📋 TODO / Next Steps

- [ ] Add tournament search functionality
- [ ] Implement real-time notifications
- [ ] Add tournament categories management
- [ ] Implement user achievements system
- [ ] Add tournament analytics dashboard
- [ ] Implement tournament templates
- [ ] Add bulk user management
- [ ] Implement tournament scheduling

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and test thoroughly
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## 📄 License

This project is part of the **IA608001 Intermediate Application Development Concepts** course assessment.

---

## 🎯 Assessment Requirements Met

### Admin User Features ✅
- [x] Create new quiz tournament with validation
- [x] View all tournaments in table format
- [x] Update tournament (name, start date, end date)
- [x] Delete tournament with confirmation prompt
- [x] View tournament questions when clicked

### Player User Features ✅
- [x] View and play quiz tournaments
- [x] Play ongoing tournaments only
- [x] See completion progress and results
- [x] Tournament status filtering (ongoing, upcoming, past, participated)

### Technical Requirements ✅
- [x] React frontend with responsive design
- [x] Form validation with error messages
- [x] Modal dialogs for forms
- [x] RESTful API integration
- [x] JWT authentication
- [x] Git version control with meaningful commits
- [x] Professional documentation

## 🔧 Troubleshooting

### White Screen Issues

If you encounter white screens when clicking "Manage Tournament" (Admin) or "Play Now" (Player), this is usually due to authentication problems:

#### Quick Diagnosis
1. Visit `http://localhost:3000/auth-diagnostics` to check your authentication status
2. Look for these indicators:
   - ✅ **API is healthy** - Server is responding
   - ✅ **Authenticated** - You are logged in
   - ✅ **Token present** - Authentication token exists
   - ✅ **Authentication working** - API accepts your credentials

#### Common Solutions

**If you're not logged in:**
1. Go to the Login page
2. Use these test credentials:
   - **Admin**: username: `admin`, password: `admin123`
   - **Player**: Register a new account or use existing player credentials

**If your session expired:**
- The app will automatically redirect you to login with a message
- Simply log in again to restore access

**If API is not responding:**
- Check your internet connection
- The API might be sleeping (free tier limitation)
- Wait 30 seconds and try again

#### Manual Testing
You can also test API endpoints directly:
```bash
# Test API health
curl https://quiz-tournament-api.onrender.com/api/test/health

# Test categories (no auth required)
curl https://quiz-tournament-api.onrender.com/api/test/categories
```

#### Automated Testing
Run the included test script to verify your setup:
```bash
# In browser console (after app is loaded)
runQuickTest()

# Or run the test file directly
node test-setup.js
```

### Still Having Issues?
1. Clear your browser cache and localStorage
2. Try logging out and logging back in
3. Check the browser console for error messages
4. Visit the diagnostics page for detailed status information

Built with ❤️ using React, Vite, and Tailwind CSS