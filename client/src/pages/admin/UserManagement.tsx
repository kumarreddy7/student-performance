import { useEffect, useState, useMemo } from 'react';
import api from '../../lib/axios';
import { useAuthStore } from '../../features/auth/authStore';
import { 
  Users, Mail, UserCheck, 
  BookOpen, Calendar, ChevronRight, Plus,
  Search, RefreshCw, Layers, KeyRound, Trash2, ShieldAlert, AlertTriangle,
  Crown, Shield
} from 'lucide-react';
import { 
  CircularProgress, Dialog, DialogTitle, DialogContent, 
  DialogActions, Button, TextField, FormControl, InputLabel, 
  Select, MenuItem
} from '@mui/material';

interface UserAccount {
  id: number;
  username: string;
  email: string;
  role: 'student' | 'teacher' | 'counselor' | 'admin' | 'principal' | 'hod';
  branch?: string;
  subjects?: string;
  isHod?: boolean;
}

// Highly premium simulated profiles for teachers to meet the requirement
const SIMULATED_TEACHER_PROFILES: Record<string, {
  department: string;
  subjects: string[];
  office: string;
  joiningDate: string;
  qualification: string;
  status: 'Active' | 'On Leave';
}> = {
  varsha: {
    department: 'Computer Science & Engineering',
    subjects: ['Software Engineering', 'System Architectures', 'Web Development'],
    office: 'Block A, Room 304',
    joiningDate: '2022-08-15',
    qualification: 'M.Tech in CS, Ph.D. (Pursuing)',
    status: 'Active'
  },
  admin: {
    department: 'Administration',
    subjects: ['Institution Operations', 'Quality Assurance'],
    office: 'Main Building, Room 101',
    joiningDate: '2021-01-10',
    qualification: 'MBA in Education Management',
    status: 'Active'
  }
};

const DEFAULT_TEACHER_PROFILE = {
  department: 'Academic Faculty',
  subjects: ['General Subject Instructor', 'Class Coordinator'],
  office: 'Faculty Block B, Room 202',
  joiningDate: '2024-01-15',
  qualification: 'Master of Science / Education',
  status: 'Active' as const
};

export default function UserManagement() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'teachers' | 'counselors' | 'hod'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  // Extract all unique branches from users to populate dropdown filter
  const uniqueBranches = useMemo(() => {
    const branches = new Set<string>();
    users.forEach(u => {
      if (u.branch) {
        branches.add(u.branch.trim().toUpperCase());
      }
    });
    return Array.from(branches).sort();
  }, [users]);

  // Registration Dialog State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('student');
  const [regBranch, setRegBranch] = useState('');
  const [regSubjects, setRegSubjects] = useState('');
  const [regError, setRegError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [regMessage, setRegMessage] = useState('');

  // Selected Teacher Profile Modal State
  const [selectedTeacher, setSelectedTeacher] = useState<UserAccount | null>(null);

  const currentUser = useAuthStore((state) => state.user);

  // Password Reset Dialog State
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetUsername, setResetUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Delete Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [deleteUsername, setDeleteUsername] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Wipe Database Dialog State
  const [isWipeDialogOpen, setIsWipeDialogOpen] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [wipeError, setWipeError] = useState('');
  const [wipeLoading, setWipeLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/auth/users');
      setUsers(response.data);
    } catch (err: any) {
      console.error('Failed to load registered users', err);
      setError(err.response?.data?.message || 'Failed to load user directory. Please ensure you are logged in as Administrator.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regEmail || !regRole) {
      setRegError('Please complete all required fields.');
      return;
    }
    if ((regRole === 'teacher' || regRole === 'counselor') && !regBranch) {
      setRegError('Branch is required for faculty and counselor roles.');
      return;
    }
    setSubmitting(true);
    setRegError('');
    setRegMessage('');
    try {
      const defaultPwd = regEmail.substring(0, 3) + '#123';
      await api.post('/auth/register', {
        username: regUsername,
        email: regEmail,
        password: defaultPwd,
        role: regRole,
        branch: regBranch || undefined,
        subjects: regSubjects || undefined
      });
      setRegMessage(`User registered successfully! Default password: ${defaultPwd}`);
      setRegUsername('');
      setRegEmail('');
      setRegRole('student');
      setRegBranch('');
      setRegSubjects('');
      setIsAddDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      setRegError(err.response?.data?.message || 'User creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignHod = async (userId: number) => {
    try {
      const res = await api.put(`/auth/users/${userId}/assign-hod`);
      setRegMessage(res.data?.message || 'HOD assigned successfully!');
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign HOD.');
    }
  };

  const handleRemoveHod = async (userId: number) => {
    try {
      const res = await api.put(`/auth/users/${userId}/remove-hod`);
      setRegMessage(res.data?.message || 'HOD designation removed.');
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove HOD.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUserId || !newPassword) {
      setResetError('Please enter a new password.');
      return;
    }
    setResetLoading(true);
    setResetError('');
    try {
      await api.put(`/auth/users/${resetUserId}/reset-password`, { password: newPassword });
      setRegMessage(`Password reset successfully for ${resetUsername}!`);
      setIsResetDialogOpen(false);
      setNewPassword('');
      setResetUserId(null);
      setResetUsername('');
    } catch (err: any) {
      setResetError(err.response?.data?.message || 'Password reset failed.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteUserSubmit = async () => {
    if (!deleteUserId) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.delete(`/auth/users/${deleteUserId}`);
      setRegMessage(`User account ${deleteUsername} deleted successfully.`);
      setIsDeleteDialogOpen(false);
      setDeleteUserId(null);
      setDeleteUsername('');
      fetchUsers();
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleWipeDatabaseSubmit = async () => {
    if (wipeConfirmText !== 'WIPE') {
      setWipeError('Please type WIPE to confirm.');
      return;
    }
    setWipeLoading(true);
    setWipeError('');
    try {
      await api.post('/students/wipe-database');
      await api.post('/analytics/wipe-database');
      setRegMessage('All databases wiped successfully. User accounts remain active.');
      setIsWipeDialogOpen(false);
      setWipeConfirmText('');
      fetchUsers();
    } catch (err: any) {
      setWipeError(err.response?.data?.message || 'Wipe database failed.');
    } finally {
      setWipeLoading(false);
    }
  };

  // Filter users based on tab, branch, and search query
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      let matchTab = activeTab === 'all';
      if (activeTab === 'teachers') matchTab = u.role === 'teacher' || u.role === 'hod';
      if (activeTab === 'counselors') matchTab = u.role === 'counselor';
      if (activeTab === 'hod') matchTab = u.role === 'hod' || u.isHod === true;

      const matchBranch = selectedBranch === 'all' || (u.branch && u.branch.toLowerCase() === selectedBranch.toLowerCase());

      const q = searchQuery.toLowerCase();
      const matchSearch = !searchQuery || (
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        (u.branch || '').toLowerCase().includes(q)
      );
      return matchTab && matchBranch && matchSearch;
    });
  }, [users, activeTab, selectedBranch, searchQuery]);

  // Extract counts
  const teacherCount = useMemo(() => users.filter(u => u.role === 'teacher' || u.role === 'hod').length, [users]);
  const studentCount = useMemo(() => users.filter(u => u.role === 'student').length, [users]);
  const counselorCount = useMemo(() => users.filter(u => u.role === 'counselor').length, [users]);
  const adminCount = useMemo(() => users.filter(u => u.role === 'admin').length, [users]);
  const principalCount = useMemo(() => users.filter(u => u.role === 'principal').length, [users]);
  const hodCount = useMemo(() => users.filter(u => u.isHod === true).length, [users]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <CircularProgress size={32} className="!text-purple-650" />
        <p className="mt-3 text-sm text-gray-500 font-medium">Assembling user directories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl text-center space-y-4 max-w-md mx-auto mt-12 shadow-sm animate-fade-in">
        <p className="text-sm font-semibold text-rose-700">{error}</p>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Alert Banner */}
      {regMessage && (
        <div className="p-4 rounded-xl shadow-sm border bg-emerald-50 border-emerald-100 text-emerald-800 flex items-center gap-3 animate-fade-in">
          <UserCheck className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <span className="text-xs font-bold">{regMessage}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-purple-600" />
            User Account Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            Monitor registered student/faculty login credentials, view teacher profiles, and seed new accounts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <Button
            variant="contained"
            onClick={() => setIsAddDialogOpen(true)}
            startIcon={<Plus className="h-4 w-4" />}
            className="!rounded-xl !capitalize !px-4 !py-2.5 !bg-purple-600 hover:!bg-purple-700 !shadow-none font-bold"
          >
            Add New User
          </Button>
          <button
            onClick={fetchUsers}
            className="p-2.5 rounded-2xl bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-purple-600 hover:bg-purple-55 transition-colors"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Faculty</span>
          <span className="text-3xl font-black text-gray-900 block mt-1">{teacherCount}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Students</span>
          <span className="text-3xl font-black text-gray-900 block mt-1">{studentCount}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Counselors</span>
          <span className="text-3xl font-black text-gray-900 block mt-1">{counselorCount}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">HODs</span>
          <span className="text-3xl font-black text-gray-900 block mt-1">{hodCount}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Principals</span>
          <span className="text-3xl font-black text-gray-900 block mt-1">{principalCount}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Admins</span>
          <span className="text-3xl font-black text-gray-900 block mt-1">{adminCount}</span>
        </div>
      </div>

      {/* Roster Controls */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex gap-1.5 p-1 bg-gray-100/80 rounded-xl w-fit flex-wrap">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'all' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All Accounts
            </button>
            <button
              onClick={() => setActiveTab('teachers')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'teachers' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Faculty
            </button>
            <button
              onClick={() => setActiveTab('counselors')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'counselors' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Counselors
            </button>
            <button
              onClick={() => setActiveTab('hod')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'hod' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              HODs
            </button>
          </div>

          {/* Controls: Branch Filter & Search */}
          <div className="flex items-center gap-2 max-w-md w-full sm:w-auto">
            {/* Branch Filter Select */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-white rounded-xl px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs text-gray-700 shadow-sm font-semibold cursor-pointer"
            >
              <option value="all">All Branches</option>
              {uniqueBranches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search user record..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white rounded-xl pl-9 pr-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs text-gray-700 shadow-sm placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Content Table / Grid */}
        {filteredUsers.length === 0 ? (
          <div className="p-16 text-center text-gray-400 text-sm">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="font-semibold text-gray-700">No users found</p>
            <p className="text-xs mt-1">Try another search keyword or create a new user account.</p>
          </div>
        ) : activeTab === 'all' ? (
          /* ALL USERS LIST TABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-150 text-[10px] font-bold text-gray-450 uppercase tracking-wider bg-gray-50/20">
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">Username</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Branch</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredUsers.map(userAccount => (
                  <tr key={userAccount.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 font-bold text-gray-700">#{userAccount.id}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {userAccount.username?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-gray-900 block">{userAccount.username}</span>
                          {userAccount.isHod && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md uppercase tracking-wider inline-flex items-center gap-0.5">
                              <Crown className="h-2.5 w-2.5" /> HOD
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs">{userAccount.email}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize tracking-wider
                        ${userAccount.role === 'admin' ? 'bg-red-50 border-red-200 text-red-700' :
                          userAccount.role === 'teacher' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                          userAccount.role === 'hod' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                          userAccount.role === 'counselor' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                          userAccount.role === 'principal' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                          'bg-gray-50 border-gray-200 text-gray-700'}`}>
                        {userAccount.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-600 font-medium">
                      {userAccount.branch || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(userAccount.role === 'teacher' || userAccount.role === 'hod') && (
                          <button
                            onClick={() => setSelectedTeacher(userAccount)}
                            className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-purple-650 hover:text-purple-800 mr-1"
                            title="View Profile"
                          >
                            Profile <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* HOD Assign/Remove */}
                        {(userAccount.role === 'teacher') && userAccount.branch && (
                          <button
                            onClick={() => handleAssignHod(userAccount.id)}
                            className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-100/50 hover:border-amber-200 transition-all"
                            title={`Assign as HOD of ${userAccount.branch}`}
                          >
                            <Crown className="h-4 w-4" />
                          </button>
                        )}
                        {(userAccount.role === 'hod' || userAccount.isHod) && (
                          <button
                            onClick={() => handleRemoveHod(userAccount.id)}
                            className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-200 transition-all"
                            title="Remove HOD designation"
                          >
                            <Crown className="h-4 w-4" />
                          </button>
                        )}
                        
                        {/* Reset Password Action */}
                        <button
                          onClick={() => {
                            if (userAccount.role === 'admin') {
                              alert("Cannot reset password for another administrator account.");
                              return;
                            }
                            setResetUserId(userAccount.id);
                            setResetUsername(userAccount.username);
                            setIsResetDialogOpen(true);
                          }}
                          disabled={userAccount.role === 'admin'}
                          className={`p-2 rounded-xl transition-all ${
                            userAccount.role === 'admin'
                              ? 'bg-gray-50 text-gray-300 border border-gray-150 cursor-not-allowed'
                              : 'bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-100/50 hover:border-purple-200'
                          }`}
                          title={userAccount.role === 'admin' ? "Admin passwords cannot be reset here" : "Reset Account Password"}
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>

                        {/* Delete User Action */}
                        <button
                          onClick={() => {
                            if (currentUser?.role !== 'admin') {
                              alert("Only administrators can delete user accounts.");
                              return;
                            }
                            if (userAccount.role === 'admin') {
                              alert("Administrators cannot delete other administrator accounts.");
                              return;
                            }
                            setDeleteUserId(userAccount.id);
                            setDeleteUsername(userAccount.username);
                            setIsDeleteDialogOpen(true);
                          }}
                          disabled={currentUser?.id === userAccount.id || userAccount.role === 'admin' || currentUser?.role !== 'admin'}
                          className={`p-2 rounded-xl border transition-all ${
                            currentUser?.id === userAccount.id || userAccount.role === 'admin' || currentUser?.role !== 'admin'
                              ? 'bg-gray-50 text-gray-300 border-gray-150 cursor-not-allowed'
                              : 'bg-rose-50 border-rose-100/50 hover:border-rose-200 text-rose-600 hover:bg-rose-100'
                          }`}
                          title={
                            currentUser?.role !== 'admin' ? "Only administrators can delete user accounts" :
                            currentUser?.id === userAccount.id ? "Cannot delete yourself" :
                            userAccount.role === 'admin' ? "Cannot delete an administrator account" : "Delete Account Profile"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* FACULTY / TEACHERS DIRECTORY GRID VIEW */
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/10">
            {filteredUsers.map(teacher => {
              const profile = SIMULATED_TEACHER_PROFILES[teacher.username.toLowerCase()] || DEFAULT_TEACHER_PROFILE;
              return (
                <div 
                  key={teacher.id}
                  onClick={() => setSelectedTeacher(teacher)}
                  className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-base flex-shrink-0">
                      {teacher.username?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-gray-900 text-base leading-none">{teacher.username}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-50 text-purple-600 border border-purple-100 uppercase tracking-wider">
                          Faculty
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-gray-450" /> {teacher.email}
                      </p>
                      <p className="text-xs text-purple-600 font-bold flex items-center gap-1 pt-1">
                        <Layers className="h-3.5 w-3.5" /> {profile.department}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 mt-4 pt-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Active Subjects</span>
                      <span className="text-xs font-semibold text-gray-700 truncate max-w-[200px] block">
                        {profile.subjects.join(', ')}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add User Account Dialog Modal */}
      <Dialog 
        open={isAddDialogOpen} 
        onClose={() => setIsAddDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            className: '!rounded-3xl !p-3'
          }
        }}
      >
        <DialogTitle className="!font-bold !text-xl !pb-2">Add New User Account</DialogTitle>
        <form onSubmit={handleRegisterSubmit}>
          <DialogContent className="!space-y-4 !pt-0">
            {regError && (
              <div className="p-3 text-sm text-rose-650 bg-rose-50 border border-rose-100 rounded-xl">
                {regError}
              </div>
            )}

            <FormControl fullWidth>
              <InputLabel id="reg-role-label">System Role</InputLabel>
              <Select
                labelId="reg-role-label"
                value={regRole}
                label="System Role"
                onChange={(e) => {
                  setRegRole(e.target.value);
                  if (!['teacher', 'counselor'].includes(e.target.value)) {
                    setRegBranch('');
                    setRegSubjects('');
                  }
                }}
                sx={{ borderRadius: '12px' }}
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="teacher">Faculty (Teacher)</MenuItem>
                <MenuItem value="counselor">Counselor</MenuItem>
                <MenuItem value="principal">Principal</MenuItem>
                <MenuItem value="admin">Administrator</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Username"
              variant="outlined"
              fullWidth
              required
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
              slotProps={{
                input: {
                  className: '!rounded-xl'
                }
              }}
            />

            <TextField
              label="Email Address"
              type="email"
              variant="outlined"
              fullWidth
              required
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              slotProps={{
                input: {
                  className: '!rounded-xl'
                }
              }}
            />

            {/* Branch field - for Faculty and Counselor only */}
            {(regRole === 'teacher' || regRole === 'counselor') && (
              <TextField
                label="Branch (e.g. CSE, ECE, MECH)"
                variant="outlined"
                fullWidth
                required
                value={regBranch}
                onChange={(e) => setRegBranch(e.target.value)}
                slotProps={{
                  input: {
                    className: '!rounded-xl'
                  }
                }}
              />
            )}

            {/* Subjects field - for Faculty and Counselor only */}
            {(regRole === 'teacher' || regRole === 'counselor') && (
              <TextField
                label="Subjects (comma-separated)"
                variant="outlined"
                fullWidth
                placeholder="e.g. Data Structures, Algorithms, DBMS"
                value={regSubjects}
                onChange={(e) => setRegSubjects(e.target.value)}
                slotProps={{
                  input: {
                    className: '!rounded-xl'
                  }
                }}
              />
            )}

            {/* Default password notice */}
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-500 flex-shrink-0" />
              <span>Default password: <strong>{regEmail ? regEmail.substring(0, 3) + '#123' : '(enter email)'}</strong></span>
            </div>
          </DialogContent>
          <DialogActions className="!px-6 !pb-4 !pt-2">
            <Button 
              onClick={() => setIsAddDialogOpen(false)} 
              className="!text-gray-500 !rounded-xl"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              className="!bg-purple-600 hover:!bg-purple-700 !text-white !rounded-xl !px-6"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Account'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Teacher Profile Card Modal View */}
      <Dialog
        open={selectedTeacher !== null}
        onClose={() => setSelectedTeacher(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            className: '!rounded-3xl !p-2 !overflow-hidden'
          }
        }}
      >
        {selectedTeacher && (() => {
          const profile = SIMULATED_TEACHER_PROFILES[selectedTeacher.username.toLowerCase()] || DEFAULT_TEACHER_PROFILE;
          return (
            <div className="relative">
              {/* Header Gradient */}
              <div className="h-24 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center p-6 text-white">
                <div className="absolute top-4 right-4 bg-white/20 text-white border border-white/20 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                  Teacher Profile
                </div>
              </div>

              {/* Avatar Ring */}
              <div className="absolute top-12 left-6 h-16 w-16 bg-white rounded-2xl p-1 shadow-md border border-gray-100 flex items-center justify-center rotate-2">
                <div className="h-full w-full bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-bold text-lg -rotate-2">
                  {selectedTeacher.username?.substring(0, 2).toUpperCase()}
                </div>
              </div>

              {/* Card Body */}
              <div className="px-6 pt-8 pb-4 space-y-5">
                <div>
                  <h2 className="text-xl font-black text-gray-900 leading-tight">{selectedTeacher.username}</h2>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1 font-semibold">
                    <Mail className="h-3.5 w-3.5 text-gray-450" /> {selectedTeacher.email}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-100 py-4">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Qualification</span>
                    <span className="text-xs font-bold text-gray-800 block truncate" title={profile.qualification}>
                      {profile.qualification}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Joining Date</span>
                    <span className="text-xs font-bold text-gray-850 block">{profile.joiningDate}</span>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="h-4 w-4 text-purple-500" /> Department
                    </p>
                    <p className="text-sm font-bold text-gray-800">{profile.department}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <BookOpen className="h-4 w-4 text-purple-500" /> Specializations & Subjects
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {profile.subjects.map((sub, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-purple-500" /> Faculty Office Location
                    </p>
                    <p className="text-xs font-semibold text-gray-700">{profile.office}</p>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-bold">
                    <span className="text-gray-500">Instructor Status</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border capitalize tracking-wider
                      ${profile.status === 'Active' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                      {profile.status}
                    </span>
                  </div>
                </div>
              </div>

              <DialogActions className="!px-6 !pb-4 !pt-2 border-t border-gray-100">
                <Button 
                  onClick={() => setSelectedTeacher(null)} 
                  variant="contained"
                  className="!bg-purple-600 hover:!bg-purple-700 !text-white !rounded-xl !px-6 !shadow-none !capitalize"
                >
                  Close Profile
                </Button>
              </DialogActions>
            </div>
          );
        })()}
      </Dialog>

      {/* Advanced System Administration Panel */}
      <div className="bg-white rounded-3xl border border-rose-150 shadow-sm overflow-hidden mt-8 animate-fade-in">
        <div className="p-6 bg-rose-50/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1 max-w-2xl">
            <h3 className="text-base font-bold text-rose-950 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-600" />
              Advanced Administrative Utilities
            </h3>
            <p className="text-xs text-rose-700 leading-relaxed font-medium">
              Perform deep database cleanups. Wiping the database deletes all student portfolios, performance logs, marks, ranks, counseling schedules, attendance records, and csv upload history. Wiping does NOT affect user credential logins, so administrator and faculty accounts will remain operational.
            </p>
          </div>
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              setWipeConfirmText('');
              setWipeError('');
              setIsWipeDialogOpen(true);
            }}
            className="!rounded-xl !capitalize !px-5 !py-2.5 !border-rose-200 hover:!bg-rose-50/50 !text-rose-700 !font-bold self-start md:self-center"
          >
            Wipe Entire Database
          </Button>
        </div>
      </div>

      {/* Reset Password Dialog */}
      <Dialog
        open={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            className: '!rounded-3xl !p-3'
          }
        }}
      >
        <DialogTitle className="!font-bold !text-xl !pb-2 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-purple-600" />
          Reset Account Password
        </DialogTitle>
        <form onSubmit={handleResetPasswordSubmit}>
          <DialogContent className="!space-y-4 !pt-0">
            <p className="text-xs text-gray-500 font-medium">
              Enter a new password for user account <strong>{resetUsername}</strong>. This action will re-encode the credentials securely.
            </p>
            {resetError && (
              <div className="p-3 text-xs font-bold text-rose-650 bg-rose-50 border border-rose-100 rounded-xl">
                {resetError}
              </div>
            )}
            <TextField
              label="New Password"
              type="password"
              variant="outlined"
              fullWidth
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="!mt-2"
              slotProps={{
                input: {
                  className: '!rounded-xl'
                }
              }}
            />
          </DialogContent>
          <DialogActions className="!px-6 !pb-4 !pt-2">
            <Button
              onClick={() => {
                setIsResetDialogOpen(false);
                setNewPassword('');
              }}
              className="!text-gray-500 !rounded-xl !capitalize"
              disabled={resetLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              className="!bg-purple-600 hover:!bg-purple-700 !text-white !rounded-xl !px-6 !capitalize !shadow-none font-bold"
              disabled={resetLoading}
            >
              {resetLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            className: '!rounded-3xl !p-3'
          }
        }}
      >
        <DialogTitle className="!font-bold !text-xl !pb-2 flex items-center gap-2 text-rose-605">
          <AlertTriangle className="h-5 w-5 text-rose-600 animate-pulse" />
          Delete User Account
        </DialogTitle>
        <DialogContent className="!space-y-3 !pt-0">
          <p className="text-sm text-gray-600 leading-relaxed">
            Are you sure you want to permanently delete user account <strong>{deleteUsername}</strong>? 
            This will strip their login access. This action is irreversible.
          </p>
          {deleteError && (
            <div className="p-3 text-xs font-bold text-rose-650 bg-rose-50 border border-rose-100 rounded-xl">
              {deleteError}
            </div>
          )}
        </DialogContent>
        <DialogActions className="!px-6 !pb-4 !pt-2">
          <Button
            onClick={() => setIsDeleteDialogOpen(false)}
            className="!text-gray-500 !rounded-xl !capitalize"
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteUserSubmit}
            variant="contained"
            color="error"
            className="!bg-rose-600 hover:!bg-rose-700 !text-white !rounded-xl !px-6 !capitalize !shadow-none font-bold"
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Wipe Database Dialog */}
      <Dialog
        open={isWipeDialogOpen}
        onClose={() => setIsWipeDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            className: '!rounded-3xl !p-3'
          }
        }}
      >
        <DialogTitle className="!font-bold !text-xl !pb-2 flex items-center gap-2 text-rose-700">
          <AlertTriangle className="h-5 w-5 text-rose-600" />
          CRITICAL: Wipe Entire Database
        </DialogTitle>
        <DialogContent className="!space-y-4 !pt-0">
          <p className="text-xs text-rose-700 font-bold bg-rose-50 border border-rose-100 p-3 rounded-xl leading-relaxed animate-pulse">
            WARNING: Wiping deletes all student metrics, logs, marks, ranks, interventions, and counselor meetings. User logins remain intact. This action cannot be undone.
          </p>
          <p className="text-xs text-gray-500 font-medium">
            To proceed, please type <strong className="text-gray-700">"WIPE"</strong> below:
          </p>
          
          {wipeError && (
            <div className="p-3 text-xs font-bold text-rose-650 bg-rose-50 border border-rose-100 rounded-xl">
              {wipeError}
            </div>
          )}
          
          <TextField
            placeholder="Type WIPE here"
            variant="outlined"
            fullWidth
            required
            value={wipeConfirmText}
            onChange={(e) => setWipeConfirmText(e.target.value)}
            className="!mt-2"
            slotProps={{
              input: {
                className: '!rounded-xl'
              }
            }}
          />
        </DialogContent>
        <DialogActions className="!px-6 !pb-4 !pt-2">
          <Button
            onClick={() => setIsWipeDialogOpen(false)}
            className="!text-gray-500 !rounded-xl !capitalize"
            disabled={wipeLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleWipeDatabaseSubmit}
            variant="contained"
            color="error"
            className="!bg-rose-600 hover:!bg-rose-700 !text-white !rounded-xl !px-6 !capitalize !shadow-none font-bold"
            disabled={wipeLoading || wipeConfirmText !== 'WIPE'}
          >
            {wipeLoading ? 'Wiping...' : 'Wipe Database'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
