import { useEffect, useState } from 'react';
import { useAuthStore } from '../../features/auth/authStore';
import { isRole } from '../../lib/roles';
import { useStudentStore } from '../../features/students/studentStore';
import api from '../../lib/axios';
import { User, Mail, Shield, ShieldAlert, IdCard, Phone, School, Bookmark, Edit3, CheckCircle2 } from 'lucide-react';
import { CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const { fetchMyPerformance } = useStudentStore();
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Profile Edit Dialog States
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editOldPassword, setEditOldPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isRole(user?.role, 'student')) {
      loadStudentProfile();
    }
  }, [user]);

  const loadStudentProfile = async () => {
    setLoading(true);
    try {
      const res = await fetchMyPerformance();
      setStudentDetails(res?.student || null);
    } catch (err) {
      console.error('Failed to load student details for profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = () => {
    setEditEmail(user?.email || '');
    setEditPhone(studentDetails?.phoneNumber || '');
    setEditPassword('');
    setEditOldPassword('');
    setEditConfirmPassword('');
    setEditError('');
    setEditSuccess('');
    setIsEditDialogOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editPassword) {
      if (user?.role !== 'admin' && !editOldPassword) {
        setEditError('Old password is required to change password.');
        return;
      }
      if (user?.role !== 'admin' && editPassword !== editConfirmPassword) {
        setEditError('New passwords do not match.');
        return;
      }
    }
    
    setUpdating(true);
    setEditError('');
    setEditSuccess('');
    try {
      // 1. Update auth service details
      await api.put('/auth/profile', {
        email: editEmail,
        password: editPassword,
        oldPassword: editOldPassword
      });

      // 2. Update student service details if student
      if (isRole(user?.role, 'student')) {
        await api.put('/students/my-profile', {
          email: editEmail,
          phoneNumber: editPhone
        });
      }

      setEditSuccess('Your profile was successfully updated!');
      
      // Update local storage and force reload
      const updatedUser = { ...user, email: editEmail };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setTimeout(() => {
        setIsEditDialogOpen(false);
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <User className="h-8 w-8 text-purple-600" />
            My Profile
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage your personal details, credentials, and associated roles.
          </p>
        </div>
        <Button
          variant="contained"
          onClick={handleOpenEdit}
          startIcon={<Edit3 className="h-4 w-4" />}
          className="!rounded-xl !capitalize !px-4 !py-2.5 !bg-purple-600 hover:!bg-purple-700 !shadow-none font-bold self-start sm:self-center"
        >
          Edit Profile Details
        </Button>
      </div>

      <div className="bg-white shadow-xl rounded-3xl border border-gray-100 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-36 relative">
          <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
          <div className="absolute -bottom-10 left-8">
            <div className="h-20 w-20 bg-white rounded-2xl p-1 shadow-md flex items-center justify-center border border-gray-100 rotate-3">
              <div className="bg-purple-50 text-purple-600 w-full h-full rounded-xl flex items-center justify-center">
                <User className="h-10 w-10" />
              </div>
            </div>
          </div>
        </div>

        {/* User Account Info */}
        <div className="pt-16 pb-8 px-8 space-y-6">
          <div className="border-b border-gray-100 pb-5">
            <h2 className="text-xl font-bold text-gray-900">{user?.username}</h2>
            <p className="text-xs text-gray-400 mt-0.5">System User Identifier: #{user?.id}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                <Mail className="h-5 w-5 text-purple-500 flex-shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</span>
                  <span className="text-sm font-semibold text-gray-800">{user?.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                <Shield className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">System Role</span>
                  <span className="text-sm font-bold text-indigo-600 uppercase tracking-wide">{user?.role}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-purple-50/30 border border-purple-100/50 rounded-2xl">
                <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <ShieldAlert className="h-4 w-4" /> Role Permissions
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Your account is authorized under <strong>{user?.role?.toUpperCase()}</strong> permissions. 
                  This grants you view and interaction access to items listed in the sidebar navigation matching your role.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Profile Binding */}
      {isRole(user?.role, 'student') && (
        <div className="bg-white shadow-xl rounded-3xl border border-gray-100 overflow-hidden p-8 space-y-6">
          <div className="border-b border-gray-100 pb-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <IdCard className="h-5 w-5 text-purple-600" />
              Student Academic Link
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Linked registration details mapped from database by your email address.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <CircularProgress size={28} className="!text-purple-600" />
            </div>
          ) : studentDetails ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                <Bookmark className="h-5 w-5 text-purple-500 mb-1.5" />
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Roll Number</span>
                <span className="text-sm font-bold text-gray-800">{studentDetails.rollNumber}</span>
              </div>

              <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                <School className="h-5 w-5 text-purple-500 mb-1.5" />
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Class</span>
                <span className="text-sm font-bold text-gray-800">{studentDetails.className}</span>
              </div>

              <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                <School className="h-5 w-5 text-purple-500 mb-1.5" />
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Section</span>
                <span className="text-sm font-bold text-gray-800">{studentDetails.section}</span>
              </div>

              <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                <Phone className="h-5 w-5 text-purple-500 mb-1.5" />
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Number</span>
                <span className="text-sm font-bold text-gray-800">{studentDetails.phoneNumber || 'N/A'}</span>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-yellow-50 border border-yellow-100 rounded-2xl text-yellow-800 text-sm">
              We couldn't locate a Student profile matching your user email (<strong>{user?.email}</strong>). 
              Please contact the system administrator to register your student record.
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Dialog Modal */}
      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            className: '!rounded-3xl !p-3'
          }
        }}
      >
        <DialogTitle className="!font-bold !text-xl !pb-2 flex items-center gap-2">
          <Edit3 className="h-5 w-5 text-purple-600" />
          Edit Profile Details
        </DialogTitle>
        <form onSubmit={handleSaveProfile}>
          <DialogContent className="!space-y-4 !pt-0">
            <p className="text-xs text-gray-500 font-medium">
              Update your account details below. Leave the password field blank if you do not wish to modify your password credentials.
            </p>

            {editError && (
              <div className="p-3 text-xs font-bold text-rose-650 bg-rose-50 border border-rose-100 rounded-xl">
                {editError}
              </div>
            )}

            {editSuccess && (
              <div className="p-3 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0" />
                {editSuccess}
              </div>
            )}

            <TextField
              label="Email Address"
              type="email"
              variant="outlined"
              fullWidth
              required
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="!mt-2"
              slotProps={{
                input: {
                  className: '!rounded-xl'
                }
              }}
            />

            {isRole(user?.role, 'student') && (
              <TextField
                label="Phone Number"
                type="text"
                variant="outlined"
                fullWidth
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                slotProps={{
                  input: {
                    className: '!rounded-xl'
                  }
                }}
              />
            )}

            {user?.role !== 'admin' && editPassword && (
              <TextField
                label="Old Password"
                type="password"
                variant="outlined"
                fullWidth
                required
                value={editOldPassword}
                onChange={(e) => setEditOldPassword(e.target.value)}
                slotProps={{
                  input: { className: '!rounded-xl' }
                }}
              />
            )}

            <TextField
              label={user?.role === 'admin' ? "Change Password (Optional)" : "New Password (Optional)"}
              type="password"
              variant="outlined"
              placeholder="Leave blank to keep current"
              fullWidth
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              slotProps={{
                input: {
                  className: '!rounded-xl'
                }
              }}
            />

            {user?.role !== 'admin' && editPassword && (
              <TextField
                label="Confirm New Password"
                type="password"
                variant="outlined"
                fullWidth
                required
                value={editConfirmPassword}
                onChange={(e) => setEditConfirmPassword(e.target.value)}
                slotProps={{
                  input: { className: '!rounded-xl' }
                }}
              />
            )}
          </DialogContent>
          <DialogActions className="!px-6 !pb-4 !pt-2">
            <Button
              onClick={() => setIsEditDialogOpen(false)}
              className="!text-gray-500 !rounded-xl !capitalize"
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              className="!bg-purple-600 hover:!bg-purple-700 !text-white !rounded-xl !px-6 !capitalize !shadow-none font-bold"
              disabled={updating}
            >
              {updating ? 'Saving...' : 'Save Profile'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}
