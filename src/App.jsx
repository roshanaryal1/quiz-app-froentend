import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Admin Pages
import AdminTournaments from './pages/admin/AdminTournaments';
import CreateTournament from './pages/admin/CreateTournament';
import EditTournament from './pages/admin/EditTournament';

// Player Pages
import PlayerTournaments from './pages/player/PlayerTournaments';
import TournamentPlay from './pages/player/TournamentPlay';
import PlayerHistory from './pages/player/PlayerHistory';
import OngoingTournaments from './pages/player/OngoingTournaments';
import TournamentResults from './pages/player/TournamentResults';

// Diagnostic Pages - ONLY IN DEVELOPMENT
let AuthDiagnostics, Diagnostics;
if (import.meta.env.DEV) {
  AuthDiagnostics = React.lazy(() => import('./pages/AuthDiagnostics'));
  Diagnostics = React.lazy(() => import('./pages/Diagnostics'));
}

// Error Pages
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

// Debug component for development only
const DebugInfo = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (import.meta.env.PROD) return null;
  
  return (
    <div className="fixed bottom-0 right-0 bg-black text-white text-xs p-2 z-50 max-w-xs">
      <div>Token: {token ? 'Present' : 'Missing'}</div>
      <div>User: {user ? JSON.parse(user).username : 'None'}</div>
      <div>Role: {user ? JSON.parse(user).role : 'None'}</div>
      <div>URL: {window.location.pathname}</div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* DIAGNOSTIC ROUTES - DEVELOPMENT ONLY */}
              {import.meta.env.DEV && (
                <React.Suspense fallback={<div>Loading...</div>}>
                  <Route path="/auth-diagnostics" element={<AuthDiagnostics />} />
                  <Route path="/diagnostics" element={<Diagnostics />} />
                </React.Suspense>
              )}
              
              {/* Protected routes */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin routes */}
              <Route 
                path="/admin/tournaments" 
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminTournaments />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/create-tournament" 
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <CreateTournament />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/edit-tournament/:id" 
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <EditTournament />
                  </ProtectedRoute>
                } 
              />
              
              {/* Player routes */}
              <Route 
                path="/player/tournaments" 
                element={
                  <ProtectedRoute requiredRole="PLAYER">
                    <PlayerTournaments />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/player/ongoing" 
                element={
                  <ProtectedRoute requiredRole="PLAYER">
                    <OngoingTournaments />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/player/tournaments/:id" 
                element={
                  <ProtectedRoute requiredRole="PLAYER">
                    <TournamentPlay />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/player/tournaments/:id/results" 
                element={
                  <ProtectedRoute requiredRole="PLAYER">
                    <TournamentResults />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/player/history" 
                element={
                  <ProtectedRoute requiredRole="PLAYER">
                    <PlayerHistory />
                  </ProtectedRoute>
                } 
              />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            <DebugInfo />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
