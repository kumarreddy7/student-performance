import { useEffect, useRef, useState, useMemo } from 'react';
import { useStudentStore } from '../../features/students/studentStore';
import { useAuthStore } from '../../features/auth/authStore';
import { Upload, Plus, Users as UsersIcon, ChevronRight, Search, ChevronLeft, User, Mail, BarChart3, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell 
} from 'recharts';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

export default function Students() {
  const navigate = useNavigate();
  const { fetchStudentsPaged, uploadCsv, createStudent, searchQuery, setSearchQuery, isLoading } = useStudentStore();
  const user = useAuthStore((state) => state.user);
  const isAuthorized = user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'counselor';
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  // Tab view state
  const [activeTab, setActiveTab] = useState<'directory' | 'assignments'>('directory');
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);


  // Pagination & Server-side filtering state
  const [pagedStudents, setPagedStudents] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Add Student Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [rollNumber, setRollNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [branch, setBranch] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState('Active');
  const [counselors, setCounselors] = useState<any[]>([]);
  const [counselorUsername, setCounselorUsername] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCounselorsList = async () => {
    try {
      const response = await api.get('/auth/counselors');
      // Deduplicate counselors by username
      const uniqueCounselors = (response.data || []).filter(
        (c: any, index: number, self: any[]) =>
          self.findIndex((t: any) => t.username === c.username) === index
      );
      setCounselors(uniqueCounselors);
    } catch (err) {
      console.error('Failed to fetch counselors list', err);
    }
  };

  const fetchAllStudentsList = async () => {
    try {
      setLoadingAll(true);
      const response = await api.get('/students');
      // Deduplicate students by rollNumber
      const uniqueStudents = (response.data || []).filter(
        (s: any, index: number, self: any[]) =>
          self.findIndex((t: any) => t.rollNumber === s.rollNumber) === index
      );
      setAllStudents(uniqueStudents);
    } catch (err) {
      console.error('Failed to fetch all students list', err);
    } finally {
      setLoadingAll(false);
    }
  };

  const fetchAllAppointmentsList = async () => {
    try {
      setLoadingAppointments(true);
      const response = await api.get('/students/counseling/appointments/all');
      // Deduplicate appointments by id
      const uniqueAppointments = (response.data || []).filter(
        (a: any, index: number, self: any[]) =>
          self.findIndex((t: any) => t.id === a.id) === index
      );
      setAppointments(uniqueAppointments);
    } catch (err) {
      console.error('Failed to fetch all appointments list', err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchCounselorsList();
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (activeTab === 'assignments') {
      fetchAllStudentsList();
      fetchCounselorsList();
      if (user?.role === 'admin' || user?.role === 'teacher') {
        fetchAllAppointmentsList();
      }
    }
  }, [activeTab, user]);

  // Performance optimizations using useMemo to eliminate lags
  const chartData = useMemo(() => {
    return counselors.map(c => {
      const assigned = allStudents.filter(s => s.counselorUsername === c.username && s.status !== 'Deleted');
      return {
        name: c.username,
        students: assigned.length
      };
    });
  }, [counselors, allStudents]);

  const unassignedStudents = useMemo(() => {
    return allStudents.filter(s => !s.counselorUsername && s.status !== 'Deleted');
  }, [allStudents]);


  const loadPagedStudents = async () => {
    try {
      const data = await fetchStudentsPaged(currentPage, pageSize, searchQuery);
      if (data) {
        setPagedStudents(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err) {
      console.error("Failed to load paged students", err);
    }
  };

  useEffect(() => {
    // Reset to page 0 when search query changes
    setCurrentPage(0);
  }, [searchQuery]);

  useEffect(() => {
    loadPagedStudents();
  }, [currentPage, pageSize, searchQuery]);

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber || !firstName || !lastName || !email || !className || !section || !branch) {
      setSubmitError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await createStudent({
        rollNumber,
        firstName,
        lastName,
        email,
        className,
        section,
        branch,
        phoneNumber,
        status,
        enrollmentDate,
        counselorUsername
      });
      setIsAddDialogOpen(false);
      
      // Reset form fields
      setRollNumber('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setClassName('');
      setSection('');
      setBranch('');
      setPhoneNumber('');
      setCounselorUsername('');
      setStatus('Active');
      setEnrollmentDate(new Date().toISOString().split('T')[0]);
      setMessage('Student added successfully!');
      
      loadPagedStudents();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to add student.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage('');
    try {
      await uploadCsv(file);
      setMessage('CSV imported successfully!');
      loadPagedStudents();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'CSV upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-xl shadow-sm ${message.toLowerCase().includes('success') ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-red-50 border border-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-purple-600" />
            Students Directory
          </h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            Search, paginate, and manage student profiles.
          </p>
        </div>
        
        {isAuthorized && (
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".csv,.xlsx"
            />
            <Button
              variant="outlined"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              startIcon={<Upload className="h-4 w-4" />}
              className="!rounded-xl !capitalize !px-4 !py-2.5 !border-gray-200 !text-gray-700 hover:!bg-gray-50"
            >
              {uploading ? 'Importing...' : 'Import CSV/Excel'}
            </Button>
            <Button
              variant="contained"
              onClick={() => setIsAddDialogOpen(true)}
              startIcon={<Plus className="h-4 w-4" />}
              className="!rounded-xl !capitalize !px-4 !py-2.5 !bg-purple-600 hover:!bg-purple-700 !shadow-none"
            >
              Add Student
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      {isAuthorized && (
        <div className="flex border-b border-gray-150 gap-2 mb-6">
          <button
            onClick={() => setActiveTab('directory')}
            className={`pb-2.5 px-4 font-bold text-sm border-b-2 transition-all capitalize ${
              activeTab === 'directory'
                ? 'border-purple-600 text-purple-650'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Students Directory
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`pb-2.5 px-4 font-bold text-sm border-b-2 transition-all capitalize ${
              activeTab === 'assignments'
                ? 'border-purple-600 text-purple-650'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Counselor Assignments
          </button>
        </div>
      )}

      {activeTab === 'assignments' ? (
        // Counselor Assignments Tab
        loadingAll ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-14 text-center flex flex-col items-center justify-center shadow-sm">
            <CircularProgress size={28} className="!text-purple-600" />
            <p className="mt-3 text-sm text-gray-500 font-medium">Loading counselor rosters...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Admin Graph View */}
            {user?.role === 'admin' && (
              <div className="bg-white shadow-sm rounded-3xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 text-base mb-1 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Allocation Distribution
                </h3>
                <p className="text-xs text-gray-400 font-medium mb-6">Visual overview of student assignment counts per counselor.</p>
                <div className="h-[250px] w-full min-w-0">
                  {chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400 text-xs font-medium">
                      No counselor data to represent.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.85} />
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.85} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#9ca3af" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false}
                          className="capitalize font-semibold"
                        />
                        <YAxis 
                          stroke="#9ca3af" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false}
                          allowDecimals={false}
                          className="font-semibold"
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            borderRadius: '16px', 
                            border: '1px solid #f3f4f6', 
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                            fontSize: '11px',
                            fontWeight: '600'
                          }} 
                          cursor={{ fill: '#f9fafb' }}
                        />
                        <Bar dataKey="students" radius={[8, 8, 0, 0]}>
                          {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill="url(#barGradient)" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            {/* CLASSIC ROSTER CARDS VIEW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Unassigned Students Card */}
              <div className="bg-white shadow-sm rounded-3xl border border-dashed border-purple-200 overflow-hidden flex flex-col hover:shadow-md hover:border-purple-300 transition-all duration-200">
                <div className="bg-purple-50/50 px-6 py-5 border-b border-purple-100/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-xl text-purple-650">
                      <UsersIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Unassigned Students</h3>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Allocation Required</p>
                    </div>
                  </div>
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    {unassignedStudents.length} Left
                  </span>
                </div>
                <div className="p-6 flex-1 flex flex-col min-h-[200px]">
                  {unassignedStudents.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 py-10">
                      <Plus className="h-8 w-8 text-green-450 mb-2 rotate-45" />
                      <p className="font-bold text-gray-700 text-xs">All Assignment Complete</p>
                      <p className="text-[10px] text-gray-400 mt-1">Every active student has an advisor.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {unassignedStudents.map((student) => (
                        <div
                          key={student.id}
                          onClick={() => navigate(`/students/${student.id}`)}
                          className="flex items-center justify-between p-3 bg-gray-50/60 hover:bg-purple-50/40 border border-gray-100 hover:border-purple-100 rounded-2xl cursor-pointer transition-all duration-150 group"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-gray-900 group-hover:text-purple-650 truncate">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Roll: {student.rollNumber} • {student.className}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-purple-500 transition-colors" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Counselor Cards */}
              {[...counselors]
                .sort((a, b) => {
                  if (a.username === user?.username) return -1;
                  if (b.username === user?.username) return 1;
                  return a.username.localeCompare(b.username);
                })
                .map((counselor) => {
                  const assigned = allStudents.filter(s => s.counselorUsername === counselor.username && s.status !== 'Deleted');
                  const isSelf = counselor.username === user?.username;
                  return (
                    <div 
                      key={counselor.id} 
                      className={`bg-white shadow-sm rounded-3xl overflow-hidden flex flex-col hover:shadow-md transition-all duration-200 ${
                        isSelf ? 'border-2 border-purple-500 shadow-purple-100/30' : 'border border-gray-100'
                      }`}
                    >
                      <div className={`px-6 py-5 border-b flex items-center justify-between ${
                        isSelf ? 'bg-purple-50/30 border-purple-100' : 'bg-gray-50/50 border-gray-100'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${isSelf ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-650'}`}>
                            <User className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm capitalize flex items-center gap-1.5 truncate">
                              {counselor.username}
                              {isSelf && (
                                <span className="bg-purple-100 text-purple-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                                  My Roster
                                </span>
                              )}
                            </h3>
                            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-400 font-medium">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[130px]">{counselor.email}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                          isSelf ? 'bg-purple-100 text-purple-700' : 'bg-indigo-50 text-indigo-700 border border-indigo-100/50'
                        }`}>
                          {assigned.length} Active
                        </span>
                      </div>
                      <div className="p-6 flex-1 flex flex-col min-h-[200px]">
                        {assigned.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 py-10">
                            <UsersIcon className="h-8 w-8 text-gray-300 mb-2" />
                            <p className="font-bold text-gray-700 text-xs">No allocations yet</p>
                            <p className="text-[10px] text-gray-400 mt-1">Assign students on their profile page.</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {assigned.map((student) => (
                              <div
                                key={student.id}
                                onClick={() => navigate(`/students/${student.id}`)}
                                className="flex items-center justify-between p-3 bg-gray-50/60 hover:bg-purple-50/40 border border-gray-100 hover:border-purple-100 rounded-2xl cursor-pointer transition-all duration-150 group"
                              >
                                <div className="min-w-0">
                                  <p className="font-bold text-xs text-gray-900 group-hover:text-purple-650 truncate">
                                    {student.firstName} {student.lastName}
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Roll: {student.rollNumber} • {student.className}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-purple-500 transition-colors" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Global Counseling Sessions Log (Admin/Teacher only) */}
            {(user?.role === 'admin' || user?.role === 'teacher') && (
              <div className="bg-white shadow-sm rounded-3xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 text-base mb-1 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Counseling Sessions Log
                </h3>
                <p className="text-xs text-gray-400 font-medium mb-6">Roster of all booked appointments and historic host decisions.</p>
                {loadingAppointments ? (
                  <div className="text-center py-10 flex flex-col items-center justify-center">
                    <CircularProgress size={24} className="!text-purple-600" />
                    <p className="mt-2 text-xs text-gray-500 font-semibold">Retrieving session records...</p>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs font-semibold">
                    No session appointments have been booked yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-inner">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Time Slot</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Student</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Counselor</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Details</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100 text-xs font-medium text-gray-700">
                        {appointments.map((app) => (
                          <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-gray-900 font-bold">{app.date}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-purple-700 font-semibold">{app.timeSlot}</td>
                            <td className="px-4 py-3 whitespace-nowrap capitalize font-semibold">{app.studentName}</td>
                            <td className="px-4 py-3 whitespace-nowrap capitalize text-gray-500">{app.counselorUsername}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border tracking-wider ${
                                app.status === 'ACCEPTED'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : app.status === 'PENDING'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {app.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 max-w-[200px] truncate text-gray-400 italic">
                              {app.status === 'REJECTED' && app.rejectionReason 
                                ? `Reason: ${app.rejectionReason}`
                                : app.status === 'ACCEPTED' 
                                ? 'Confirmed counseling hour'
                                : 'Pending host validation'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      ) : (
        // Students Directory View
        <>
          {/* Server Search bar (Always Visible) */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search roll, name, class, section..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-xl pl-11 pr-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm text-gray-700 shadow-sm placeholder-gray-400"
            />
          </div>

          {/* Mobile view */}
          <div className="block sm:hidden space-y-4">
            {isLoading ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center flex flex-col items-center justify-center shadow-sm">
                <CircularProgress size={24} className="!text-purple-600" />
                <p className="mt-2 text-sm text-gray-500">Loading student list...</p>
              </div>
            ) : pagedStudents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500 shadow-sm">
                <div className="flex flex-col items-center">
                  <UsersIcon className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="font-semibold text-gray-700">No students matched</p>
                  <p className="text-xs text-gray-400 mt-1">Try another filter keyword.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {pagedStudents.map((student) => (
                  <div 
                    key={student.id} 
                    onClick={() => navigate(`/students/${student.id}`)}
                    className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm active:bg-gray-50 flex items-center justify-between transition-all duration-200 cursor-pointer hover:shadow-md"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-650 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate text-sm">
                          {student.firstName} {student.lastName}
                        </h3>
                        <div className="flex flex-col gap-0.5 mt-1 text-xs text-gray-500">
                          <span>Roll: {student.rollNumber}</span>
                          <span>Class: {student.className} - {student.section} - {student.branch || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop/Tablet Table View */}
          <div className="hidden sm:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <TableContainer component={Paper} elevation={0} className="!rounded-3xl !overflow-x-auto">
              <Table sx={{ minWidth: 650 }} aria-label="students table">
                <TableHead className="bg-gray-50/50 border-b border-gray-100">
                  <TableRow>
                    <TableCell className="!font-bold !text-gray-500 !text-[11px] !uppercase !tracking-wider">Roll No</TableCell>
                    <TableCell className="!font-bold !text-gray-500 !text-[11px] !uppercase !tracking-wider">Name</TableCell>
                    <TableCell className="!font-bold !text-gray-500 !text-[11px] !uppercase !tracking-wider">Class / Sec / Branch</TableCell>
                    <TableCell className="!font-bold !text-gray-500 !text-[11px] !uppercase !tracking-wider">Email Address</TableCell>
                    <TableCell className="!font-bold !text-gray-500 !text-[11px] !uppercase !tracking-wider">Phone</TableCell>
                    <TableCell className="!font-bold !text-gray-500 !text-[11px] !uppercase !tracking-wider">Status</TableCell>
                    <TableCell align="right" className="!font-bold !text-gray-500 !text-[11px] !uppercase !tracking-wider">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" className="!py-14">
                        <CircularProgress size={26} className="!text-purple-600" />
                        <p className="mt-2.5 text-xs text-gray-500 font-medium">Querying database records...</p>
                      </TableCell>
                    </TableRow>
                  ) : pagedStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" className="!py-14 text-gray-500">
                        <div className="flex flex-col items-center">
                          <UsersIcon className="h-10 w-10 text-gray-300 mb-2" />
                          <p className="font-bold text-gray-700 text-sm">No students registered yet</p>
                          <p className="text-xs text-gray-400 mt-1">Imports CSV or manually add a record to get started.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedStudents.map((student) => (
                      <TableRow 
                        key={student.id} 
                        hover
                        onClick={() => navigate(`/students/${student.id}`)}
                        className="cursor-pointer transition-colors hover:bg-gray-50/50"
                      >
                        <TableCell className="!font-bold !text-gray-800">{student.rollNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-650 flex items-center justify-center font-bold text-xs">
                              {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                            </div>
                            <span className="font-bold text-gray-900">
                              {student.firstName} {student.lastName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="!text-gray-600 font-medium">{student.className} - {student.section} - {student.branch || 'N/A'}</TableCell>
                        <TableCell className="!text-gray-500">{student.email}</TableCell>
                        <TableCell className="!text-gray-500">{student.phoneNumber || 'N/A'}</TableCell>
                        <TableCell>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize tracking-wide
                            ${student.status === 'Active' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                            {student.status}
                          </span>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" className="!text-gray-450">
                            <ChevronRight className="h-4.5 w-4.5 hover:text-purple-650 transition-colors" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination Toolbar */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-500">
                <div>
                  Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} students
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(0);
                      }}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-purple-300"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                      disabled={currentPage === 0}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-3">Page {currentPage + 1} of {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
                      disabled={currentPage >= totalPages - 1}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Student Dialog Modal */}
      <Dialog 
        open={isAddDialogOpen} 
        onClose={() => setIsAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            className: '!rounded-3xl !p-3'
          }
        }}
      >
        <DialogTitle className="!font-bold !text-xl !pb-2">Register Student Profile</DialogTitle>
        <form onSubmit={handleAddStudentSubmit}>
          <DialogContent className="!space-y-4 !pt-0">
            {submitError && (
              <div className="p-3 text-sm text-red-650 bg-red-50 border border-red-100 rounded-xl">
                {submitError}
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Roll Number"
                variant="outlined"
                fullWidth
                required
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="!mt-2"
                slotProps={{
                  input: {
                    className: '!rounded-xl'
                  }
                }}
              />
              <TextField
                label="Phone Number"
                variant="outlined"
                fullWidth
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="!mt-2"
                slotProps={{
                  input: {
                    className: '!rounded-xl'
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="First Name"
                variant="outlined"
                fullWidth
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                slotProps={{
                  input: {
                    className: '!rounded-xl'
                  }
                }}
              />
              <TextField
                label="Last Name"
                variant="outlined"
                fullWidth
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                slotProps={{
                  input: {
                    className: '!rounded-xl'
                  }
                }}
              />
            </div>

            <TextField
              label="Email Address"
              type="email"
              variant="outlined"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              slotProps={{
                input: {
                  className: '!rounded-xl'
                }
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextField
                label="Class Name"
                variant="outlined"
                fullWidth
                required
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. 10th Grade"
                slotProps={{
                  input: {
                    className: '!rounded-xl'
                  }
                }}
              />
              <TextField
                label="Section"
                variant="outlined"
                fullWidth
                required
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. A"
                slotProps={{
                  input: {
                    className: '!rounded-xl'
                  }
                }}
              />
              <TextField
                label="Branch"
                variant="outlined"
                fullWidth
                required
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. CSE"
                slotProps={{
                  input: {
                    className: '!rounded-xl'
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Enrollment Date"
                type="date"
                variant="outlined"
                fullWidth
                required
                value={enrollmentDate}
                onChange={(e) => setEnrollmentDate(e.target.value)}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                  input: {
                    className: '!rounded-xl'
                  }
                }}
              />

              <FormControl fullWidth>
                <InputLabel id="student-status-label">Status</InputLabel>
                <Select
                  labelId="student-status-label"
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value)}
                  sx={{ borderRadius: '12px' }}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </div>

            <FormControl fullWidth className="!mt-2">
              <InputLabel id="student-counselor-label">Assigned Counselor</InputLabel>
              <Select
                labelId="student-counselor-label"
                value={counselorUsername}
                label="Assigned Counselor"
                onChange={(e) => setCounselorUsername(e.target.value)}
                sx={{ borderRadius: '12px' }}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {counselors.map((c) => (
                  <MenuItem key={c.id} value={c.username}>
                    {c.username} ({c.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
              {submitting ? 'Registering...' : 'Register Student'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}
