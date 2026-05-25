import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useState } from 'react';

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

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
