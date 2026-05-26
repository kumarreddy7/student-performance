import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../features/auth/authStore';

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const timeoutRef = useRef<any>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // 15 minutes = 15 * 60 * 1000 milliseconds for FERPA-compliance
    timeoutRef.current = setTimeout(() => {
      logout();
      alert("Session expired due to 15 minutes of inactivity. Please sign in again.");
    }, 15 * 60 * 1000);
  };

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Initialize the idle timer
    resetTimeout();

    const handleActivity = () => {
      resetTimeout();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [logout]);

  return (
    <div className="flex h-screen bg-[#f5f7fb] overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
      <div className="flex flex-col flex-1 overflow-hidden w-full">
        <Navbar handleDrawerToggle={handleDrawerToggle} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#f5f7fb] p-4 sm:p-6 lg:p-8 transition-all duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
