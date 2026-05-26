import { useEffect, useState } from 'react';
import { useAuthStore } from '../../features/auth/authStore';
import { useStudentStore } from '../../features/students/studentStore';
import { User, Mail, Shield, ShieldAlert, IdCard, Phone, School, Bookmark } from 'lucide-react';
import { CircularProgress } from '@mui/material';

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const { fetchMyPerformance } = useStudentStore();
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role?.toLowerCase() === 'student') {
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <User className="h-8 w-8 text-purple-600" />
          My Profile
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Manage your personal details, credentials, and associated roles.
        </p>
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
      {user?.role?.toLowerCase() === 'student' && (
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
    </div>
  );
}
