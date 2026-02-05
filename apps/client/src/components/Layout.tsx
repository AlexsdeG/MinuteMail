import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Mail, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import { Toaster } from 'react-hot-toast';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="bottom-right" toastOptions={{ duration: 4000 }} />
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-primary hover:text-blue-700 transition-colors">
            <Mail className="h-6 w-6" />
            <span className="text-xl font-bold tracking-tight">10-Min Mail</span>
          </Link>
          
          <nav className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard" className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                  Login
                </Link>
                <Link to="/register" className="text-sm font-medium px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors">
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-slate-50 border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} 10-Min Mail Service. Secure, temporary, fast.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
