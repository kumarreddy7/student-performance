import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, Calendar, FileSpreadsheet, Trophy, FileText, BarChart3, ShieldCheck, GitBranch } from 'lucide-react';
import { Drawer, useMediaQuery, useTheme } from '@mui/material';
import { useAuthStore } from '../features/auth/authStore';
import { normalizeRole } from '../lib/roles';

interface SidebarProps {
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
}

const DRAWER_WIDTH = 260;

export default function Sidebar({ mobileOpen, handleDrawerToggle }: SidebarProps) {
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const user = useAuthStore((state) => state.user);

  const role = normalizeRole(user?.role);
  const navItems = [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }];

  if (role === 'admin') {
    navItems.push(
      { name: 'Students', path: '/students', icon: Users },
      { name: 'Attendance', path: '/attendance', icon: Calendar },
      { name: 'CSV Management', path: '/csv-management', icon: FileSpreadsheet },
      { name: 'Rankings', path: '/rankings', icon: Trophy },
      { name: 'Reports', path: '/reports', icon: FileText },
      { name: 'User Management', path: '/user-management', icon: ShieldCheck },
      { name: 'Counseling Calendar', path: '/counseling', icon: Calendar },
      { name: 'Counselor Tree Map', path: '/counselor-tree', icon: GitBranch },
    );
  } else if (role === 'teacher' || role === 'counselor') {
    navItems.push(
      { name: 'Students', path: '/students', icon: Users },
      { name: 'Attendance', path: '/attendance', icon: Calendar },
      { name: 'CSV Management', path: '/csv-management', icon: FileSpreadsheet },
      { name: 'Rankings', path: '/rankings', icon: Trophy },
      { name: 'Counseling Calendar', path: '/counseling', icon: Calendar },
      { name: 'Counselor Tree Map', path: '/counselor-tree', icon: GitBranch },
    );
  } else if (role === 'student') {
    navItems.push(
      { name: 'My Rank', path: '/my-rank', icon: Trophy },
      { name: 'My Performance', path: '/my-performance', icon: BarChart3 },
      { name: 'Counseling Calendar', path: '/counseling', icon: Calendar },
      { name: 'Counselor Tree Map', path: '/counselor-tree', icon: GitBranch },
    );
  }

  const drawerContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-50">
        <div className="bg-purple-600 p-2 rounded-lg text-white">
          <Activity className="h-6 w-6" />
        </div>
        <span className="text-xl font-bold text-gray-900 tracking-tight">Predictor</span>
      </div>
      
      <div className="flex-1 px-4 py-6 overflow-y-auto space-y-2">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
          Menu
        </div>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => !isDesktop && handleDrawerToggle()}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ease-in-out ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                <Icon
                  className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-purple-600'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }} // Better open performance on mobile.
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: 'none' },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: 'none', position: 'static' },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
