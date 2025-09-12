import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, Trophy, User, LogOut, Shield, Play } from 'lucide-react';

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
    { path: '/admin/users', label: 'Users', icon: User },
  ];

  const playerLinks = [
    { path: '/player/tournaments', label: 'Tournaments', icon: Trophy },
    { path: '/player/ongoing', label: 'Play', icon: Play },
    { path: '/player/history', label: 'My History', icon: User },
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
              <Trophy className="h-8 w-8 text-primary-600" />
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
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Profile Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-2">
                          <LogOut size={16} />
                          <span>Logout</span>
                        </div>
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

                {/* Profile and logout */}
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                >
                  Profile Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                >
                  <div className="flex items-center space-x-2">
                    <LogOut size={18} />
                    <span>Logout</span>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;