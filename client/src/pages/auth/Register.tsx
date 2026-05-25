import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/authStore';
import api from '../../lib/axios';
import { 
  Mail, 
  Lock, 
  ChevronRight, 
  IdCard, 
  School, 
  Phone, 
  Sparkles,
  UserCheck
} from 'lucide-react';
import { CircularProgress } from '@mui/material';

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser, login, isLoading: authLoading } = useAuthStore();

  // General user details
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // defaults to student self-registration

  // Student profile details (shown dynamically if role === 'student')
  const [rollNumber, setRollNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [branch, setBranch] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [counselorUsername, setCounselorUsername] = useState('');

  // Auxiliary data and statuses
  const [counselors, setCounselors] = useState<any[]>([]);
  const [counselorsLoading, setCounselorsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch counselors list for students
  useEffect(() => {
    if (role === 'student') {
      const fetchCounselors = async () => {
        setCounselorsLoading(true);
        try {
          const res = await api.get('/auth/counselors');
          const uniqueCounselors = (res.data || []).filter(
            (c: any, index: number, self: any[]) =>
              self.findIndex((t: any) => t.username === c.username) === index
          );
          setCounselors(uniqueCounselors);
        } catch (err) {
          console.error('Failed to fetch counselors roster', err);
        } finally {
          setCounselorsLoading(false);
        }
      };
      fetchCounselors();
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Basic Validations
    if (!email || !password) {
      setFormError('Please fill in email and password.');
      return;
    }

    if (role === 'student' && (!rollNumber || !firstName || !lastName || !className || !section || !branch)) {
      setFormError('Please fill in all mandatory academic profile fields.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Sign up user account in auth-service
      // Students use their email as their username under the hood for clean mapping
      const usernameInput = role === 'student' ? email : email.split('@')[0];
      await registerUser({
        username: usernameInput,
        email,
        password,
        role
      });

      // 2. If registering role is 'student', call student-service to save student profile
      if (role === 'student') {
        // Auto-login to obtain active JWT token session for profile creation
        await login({
          username: email,
          password
        });

        // Hydrate and fetch logged in context
        const userState = useAuthStore.getState().user;
        const userId = userState?.id || null;

        // Post student profile
        await api.post('/students', {
          rollNumber,
          firstName,
          lastName,
          email,
          className,
          section,
          branch,
          phoneNumber,
          counselorUsername,
          userId
        });
      }

      // Successful registration redirect
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Registration failed. Please verify entered credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md py-8 px-6 shadow-xl rounded-3xl border border-gray-150/40 w-full max-w-xl mx-auto space-y-6">
      
      {/* Brand Badge */}
      <div className="flex flex-col items-center text-center space-y-1">
        <div className="bg-purple-100 p-2.5 rounded-2xl text-purple-650 flex items-center justify-center animate-bounce">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Create System Account</h2>
        <p className="text-xs text-gray-500 font-medium">Join our performance predictor and advisor scheduler</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        
        {formError && (
          <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl text-sm font-semibold text-center">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="w-full bg-gray-50/50 pl-11 pr-4 py-2.5 border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm text-gray-700"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50/50 pl-11 pr-4 py-2.5 border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm text-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Role Selector */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">System Role Type</label>
          <div className="relative">
            <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="appearance-none w-full bg-gray-50/50 pl-11 pr-4 py-2.5 border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm text-gray-700"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="counselor">Counselor</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
        </div>

        {/* Student Specific Fields with Dynamic Transitions */}
        {role === 'student' && (
          <div className="border-t border-dashed border-gray-150 pt-5 space-y-4 animate-fade-in">
            <h3 className="text-sm font-extrabold text-purple-900 flex items-center gap-1.5 mb-1">
              <IdCard className="h-4.5 w-4.5" />
              Academic Profile Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full bg-gray-50/50 px-4 py-2.5 border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm text-gray-700"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full bg-gray-50/50 px-4 py-2.5 border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm text-gray-700"
                />
              </div>

              {/* Roll Number */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Roll Number</label>
                <input
                  type="text"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="CS230001"
                  className="w-full bg-gray-50/50 px-4 py-2.5 border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm text-gray-700"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 9999999999"
                    className="w-full bg-gray-50/50 pl-10 pr-4 py-2.5 border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm text-gray-700"
                  />
                </div>
              </div>

              {/* Class Name */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Class Year</label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    required
                    className="appearance-none w-full bg-gray-50/50 pl-10 pr-4 py-2.5 border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm text-gray-700"
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              {/* Section */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Section</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  required
                  className="appearance-none w-full bg-gray-50/50 px-4 py-2.5 border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm text-gray-700"
                >
                  <option value="">Select Section</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              {/* Branch */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Branch</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  required
                  className="appearance-none w-full bg-gray-50/50 px-4 py-2.5 border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm text-gray-700"
                >
                  <option value="">Select Branch</option>
                  <option value="CSE">CSE (Computer Science)</option>
                  <option value="AI&ML">AI & ML</option>
                  <option value="DATA SCIENCE">Data Science</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">Mechanical</option>
                  <option value="CIVIL">Civil</option>
                </select>
              </div>

              {/* Counselor Dropdown */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned Counselor</label>
                {counselorsLoading ? (
                  <div className="flex items-center justify-center py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl">
                    <CircularProgress size={16} className="!text-purple-600 mr-2" />
                    <span className="text-xs text-gray-500 font-semibold">Loading counselors list...</span>
                  </div>
                ) : (
                  <select
                    value={counselorUsername}
                    onChange={(e) => setCounselorUsername(e.target.value)}
                    className="appearance-none w-full bg-gray-50/50 px-4 py-2.5 border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm text-gray-700"
                  >
                    <option value="">None / Unassigned</option>
                    {counselors.map((c) => (
                      <option key={c.id} value={c.username}>
                        {c.username} ({c.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting || authLoading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-purple-650/10 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5"
          >
            {submitting || authLoading ? (
              <>
                <CircularProgress size={16} className="!text-white mr-2" />
                Registering Account...
              </>
            ) : (
              <>
                Sign Up Account
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </button>
        </div>

        <div className="text-center pt-2">
          <span className="text-xs font-semibold text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-600 hover:text-purple-700 font-bold">
              Sign In
            </Link>
          </span>
        </div>

      </form>
    </div>
  );
}
