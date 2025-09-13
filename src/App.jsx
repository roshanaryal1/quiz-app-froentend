import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';

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

// Error Pages
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <Router>
      <AuthProvider>
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
            
            {/* Protected routes - Any authenticated user */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin-only routes */}
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
            
            {/* Player-only routes */}
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
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App