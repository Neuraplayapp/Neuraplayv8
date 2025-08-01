import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain, LogOut } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

const Header: React.FC = () => {
  const { user, setUser } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    setUser(null);
  };

  const handleUserClick = () => {
    if (user) {
      navigate(`/profile/${user.username}`);
    }
  };



  return (
    <>
      <header id="navigation" className="bg-white dark:bg-gray-900 sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 shadow-lg">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-3.6xl font-black tracking-tighter flex items-center gap-2 text-purple-900 dark:text-white drop-shadow-lg">
            <Brain className="w-9.6 h-9.6 text-purple-900 dark:text-white drop-shadow-lg" />
            NEURAPLAY
          </Link>
          
          <div className="hidden md:flex items-center space-x-8 font-semibold text-purple-900 dark:text-white text-lg">
            <Link 
              to="/" 
              className={`hover:text-purple-700 dark:hover:text-purple-300 transition-colors ${isActive('/') ? 'text-purple-700 dark:text-purple-300' : ''}`}
            >
              Home
            </Link>
            <Link 
              to="/playground" 
              className={`hover:text-purple-700 dark:hover:text-purple-300 transition-colors ${isActive('/playground') ? 'text-purple-700 dark:text-purple-300' : ''}`}
            >
              The Playground
            </Link>
            <Link 
              to="/dashboard" 
              className={`hover:text-purple-700 dark:hover:text-purple-300 transition-colors ${isActive('/dashboard') ? 'text-purple-700 dark:text-purple-300' : ''}`}
            >
              Learning Central
            </Link>
            <Link 
              to="/forum" 
              className={`hover:text-purple-700 dark:hover:text-purple-300 transition-colors ${isActive('/forum') ? 'text-purple-700 dark:text-purple-300' : ''}`}
            >
              Forum
            </Link>
            <Link 
              to="/about" 
              className={`hover:text-purple-700 dark:hover:text-purple-300 transition-colors ${isActive('/about') ? 'text-purple-700 dark:text-purple-300' : ''}`}
            >
              About Us
            </Link>
            <Link 
              to="/test" 
              className={`hover:text-purple-700 dark:hover:text-purple-300 transition-colors ${isActive('/test') ? 'text-purple-700 dark:text-purple-300' : ''}`}
            >
              Test
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div 
                  className="flex items-center gap-3 cursor-pointer hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg p-3 transition-all"
                  onClick={handleUserClick}
                >
                  <img 
                    src={user.profile.avatar} 
                    alt={user.username}
                    className="w-10 h-10 rounded-full border-2 border-violet-200 dark:border-gray-600"
                  />
                  <div className="hidden sm:block">
                    <p className="font-semibold text-purple-900 dark:text-white text-lg">{user.username}</p>
                    <p className="text-sm text-purple-700 dark:text-gray-300">{user.profile.rank}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-3 text-purple-900 dark:text-white hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 text-current" />
                </button>
              </div>
            ) : (
              <Link 
                to="/registration" 
                className="bg-gradient-to-r from-purple-500 to-purple-800 text-white font-bold px-6 py-3 rounded-full hover:from-purple-600 hover:to-purple-900 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Begin the Journey
              </Link>
            )}
          </div>
        </nav>
      </header>
    </>
  );
};

export default Header;