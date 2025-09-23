// ================================
// 4. src/components/Navigation.jsx
// ================================

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, Trophy, User, LogOut, Shield, Play, Settings, Activity } from 'lucide-react';
import logoImage from '../assets/logo.png'; // Adjust the path as necessary

const Navigation = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const adminLinks = [
    { path: '/admin/tournaments', label: 'Manage Tournaments', icon: Trophy },
    { path: '/admin/create-tournament', label: 'Create Tournament', icon: Play },
  ];

  const playerLinks = [
    { path: '/player/tournaments', label: 'All Tournaments', icon: Trophy },
    { path: '/player/ongoing', label: 'Play Live', icon: Play },
    { path: '/player/history', label: 'My History', icon: Activity },
  ];

  const NavLink = ({ to, children, icon: Icon, onClick }) => (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
        isActive(to)
          ? 'bg-primary-100 text-primary-700'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {Icon && <Icon size={18} />}
      <span>{children}</span>
    </Link>
  );

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img src={logoImage} alt="Logo" className="h-8 w-8" />
              <span className="text-xl font-bold text-gray-900">Quiz Tournament</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                {/* Role-based navigation */}
                {user?.role === 'ADMIN' && adminLinks.map(link => (
                  <NavLink key={link.path} to={link.path} icon={link.icon}>
                    {link.label}
                  </NavLink>
                ))}
                
                {user?.role === 'PLAYER' && playerLinks.map(link => (
                  <NavLink key={link.path} to={link.path} icon={link.icon}>
                    {link.label}
                  </NavLink>
                ))}

                {/* User dropdown */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    <User size={18} />
                    <span>{user?.username}</span>
                    {user?.role === 'ADMIN' && <Shield size={14} className="text-amber-500" />}
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <Settings size={16} />
                        <span>Profile Settings</span>
                      </Link>
                      <Link
                        to="/auth-diagnostics"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <Activity size={16} />
                        <span>Connection Status</span>
                      </Link>
                      <Link
                        to="/diagnostics"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <Settings size={16} />
                        <span>API Diagnostics</span>
                      </Link>
                      <div className="border-t border-gray-100"></div>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                {/* User info */}
                <div className="px-3 py-2 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <User size={20} />
                    <span className="font-medium">{user?.username}</span>
                    {user?.role === 'ADMIN' && <Shield size={16} className="text-amber-500" />}
                  </div>
                  <div className="text-sm text-gray-500">{user?.role}</div>
                </div>

                {/* Role-based navigation */}
                {user?.role === 'ADMIN' && adminLinks.map(link => (
                  <NavLink 
                    key={link.path} 
                    to={link.path} 
                    icon={link.icon}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                ))}
                
                {user?.role === 'PLAYER' && playerLinks.map(link => (
                  <NavLink 
                    key={link.path} 
                    to={link.path} 
                    icon={link.icon}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                ))}

                {/* Profile and settings */}
                <div className="border-t border-gray-200 pt-2">
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  >
                    <Settings size={18} />
                    <span>Profile Settings</span>
                  </Link>
                  <Link
                    to="/auth-diagnostics"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  >
                    <Activity size={18} />
                    <span>Connection Status</span>
                  </Link>
                  <Link
                    to="/diagnostics"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  >
                    <Settings size={18} />
                    <span>API Diagnostics</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full text-left px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;