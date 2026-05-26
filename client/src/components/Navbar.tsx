import { useAuthStore } from '../features/auth/authStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Menu, Search, Eye, EyeOff } from 'lucide-react';
import { IconButton } from '@mui/material';
import { useStudentStore } from '../features/students/studentStore';

interface NavbarProps {
  handleDrawerToggle: () => void;
}

export default function Navbar({ handleDrawerToggle }: NavbarProps) {
  const { user, logout, anonymize, toggleAnonymize } = useAuthStore();
  const { searchQuery, setSearchQuery } = useStudentStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100 shadow-sm transition-all">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <div className="md:hidden">
              <IconButton onClick={handleDrawerToggle} edge="start" color="inherit" aria-label="menu">
                <Menu className="h-6 w-6 text-gray-600" />
              </IconButton>
            </div>
            
            {/* Search Bar */}
            <div className="hidden sm:flex items-center bg-gray-50 rounded-full px-4 py-2 border border-gray-100 focus-within:border-purple-300 focus-within:ring-2 focus-within:ring-purple-100 transition-all w-64 lg:w-96">
              <Search className="h-4 w-4 text-gray-400 mr-2" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Anonymize Mode Toggle Switch */}
            <button
              onClick={toggleAnonymize}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 text-xs font-bold shadow-sm ${
                anonymize 
                  ? 'bg-purple-600 border-purple-500 text-white hover:bg-purple-700' 
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={anonymize ? "Disable Anonymization (FERPA compliance)" : "Enable Anonymization (FERPA compliance)"}
            >
              {anonymize ? (
                <>
                  <EyeOff className="h-4 w-4 animate-pulse" />
                  <span className="hidden md:inline">Anonymized</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span className="hidden md:inline">Anonymize</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-700 leading-tight">{user?.username}</span>
                <span className="text-xs text-gray-500">{user?.role}</span>
              </div>
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-purple-600 to-purple-400 flex items-center justify-center shadow-sm text-white font-semibold text-sm">
                {user?.username?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 ml-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
