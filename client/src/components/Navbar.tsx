import { useAuthStore } from '../features/auth/authStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Menu, Search } from 'lucide-react';
import { IconButton } from '@mui/material';
import { useStudentStore } from '../features/students/studentStore';

interface NavbarProps {
  handleDrawerToggle: () => void;
}

export default function Navbar({ handleDrawerToggle }: NavbarProps) {
  const { user, logout } = useAuthStore();
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

            <div 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-all group"
              title="View Profile"
            >
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-700 leading-tight group-hover:text-purple-600 transition-colors">{user?.username}</span>
                <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
              </div>
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-purple-600 to-purple-400 flex items-center justify-center shadow-sm text-white font-semibold text-sm group-hover:scale-105 transition-all duration-200">
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
