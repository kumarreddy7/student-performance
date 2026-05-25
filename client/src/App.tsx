import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './features/auth/authStore';
import { normalizeRole } from './lib/roles';
import ErrorBoundary from './components/ErrorBoundary';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Students from './pages/students/Students';
import StudentProfile from './pages/students/StudentProfile';
import Attendance from './pages/students/Attendance';
import CSVManagement from './pages/students/CSVManagement';
import Rankings from './pages/students/Rankings';
import MyRank from './pages/students/MyRank';
import MyPerformance from './pages/students/MyPerformance';
import AccessDenied from './pages/auth/AccessDenied';
import Profile from './pages/students/Profile';
import Reports from './pages/students/Reports';
import UserManagement from './pages/admin/UserManagement';
import CounselingSlots from './pages/students/CounselingSlots';
import CounselorTree from './pages/students/CounselorTree';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const RoleProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const user = useAuthStore((state) => state.user);
  const userRole = normalizeRole(user?.role);
  
  if (!user || !allowedRoles.includes(userRole)) {
    return <Navigate to="/access-denied" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected Routes */}
        <Route element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ErrorBoundary title="Dashboard failed to load"><Dashboard /></ErrorBoundary>} />
          <Route path="/students" element={
            <RoleProtectedRoute allowedRoles={['admin', 'teacher', 'counselor']}>
              <Students />
            </RoleProtectedRoute>
          } />
          <Route path="/students/:id" element={
            <RoleProtectedRoute allowedRoles={['admin', 'teacher', 'counselor']}>
              <StudentProfile />
            </RoleProtectedRoute>
          } />
          <Route path="/attendance" element={
            <RoleProtectedRoute allowedRoles={['admin', 'teacher', 'counselor']}>
              <Attendance />
            </RoleProtectedRoute>
          } />
          <Route path="/csv-management" element={
            <RoleProtectedRoute allowedRoles={['admin', 'teacher', 'counselor']}>
              <CSVManagement />
            </RoleProtectedRoute>
          } />
          <Route path="/rankings" element={
            <RoleProtectedRoute allowedRoles={['admin', 'teacher', 'counselor']}>
              <Rankings />
            </RoleProtectedRoute>
          } />
          <Route path="/my-rank" element={
            <RoleProtectedRoute allowedRoles={['student']}>
              <MyRank />
            </RoleProtectedRoute>
          } />
          <Route path="/my-performance" element={
            <RoleProtectedRoute allowedRoles={['student']}>
              <MyPerformance />
            </RoleProtectedRoute>
          } />
          <Route path="/reports" element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <Reports />
            </RoleProtectedRoute>
          } />
          <Route path="/user-management" element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </RoleProtectedRoute>
          } />
          <Route path="/counseling" element={
            <RoleProtectedRoute allowedRoles={['student', 'counselor', 'admin', 'teacher']}>
              <CounselingSlots />
            </RoleProtectedRoute>
          } />
          <Route path="/counselor-tree" element={
            <RoleProtectedRoute allowedRoles={['student', 'counselor', 'admin', 'teacher']}>
              <CounselorTree />
            </RoleProtectedRoute>
          } />
          <Route path="/profile" element={<Profile />} />
          <Route path="/access-denied" element={<AccessDenied />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
