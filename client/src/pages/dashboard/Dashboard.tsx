import { useEffect, useState } from 'react';
import { useAuthStore } from '../../features/auth/authStore';
import { useStudentStore } from '../../features/students/studentStore';
import { useReportStore } from '../../features/reports/reportStore';
import { StudentMarksChart, TopPerformersChart } from '../../components/PerformanceBarChart';
import { 
  Users, GraduationCap, Calendar, FileSpreadsheet, Award, AlertTriangle, 
  TrendingUp, ArrowRight, UserCheck, RefreshCw, FileText, UserCircle 
} from 'lucide-react';
import { CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { normalizeRole } from '../../lib/roles';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { fetchDashboardSummary, fetchMyPerformance, fetchCsvLogs } = useStudentStore();
  const { isGenerating, downloadWatchlistPdf, downloadWatchlistExcel } = useReportStore();

  const [staffData, setStaffData] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [csvLogs, setCsvLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = normalizeRole(user?.role);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (role === 'student') {
        const data = await fetchMyPerformance();
        setStudentData(data);
      } else {
        const data = await fetchDashboardSummary();
        setStaffData(data);
        if (role === 'teacher' || role === 'admin') {
          const logs = await fetchCsvLogs();
          setCsvLogs(Array.isArray(logs) ? logs.slice(0, 5) : []);
        }
      }
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 403) {
        setError('You do not have permission to view this dashboard.');
      } else if (status === 404) {
        setError(msg || 'No student profile linked to your account yet.');
      } else {
        setError(msg || 'Failed to load dashboard metrics.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <CircularProgress size={32} className="!text-purple-600" />
        <p className="mt-3 text-sm text-gray-500 font-medium">Assembling your workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl text-center space-y-4 max-w-md mx-auto mt-12 shadow-sm">
        <p className="text-sm font-semibold text-rose-700">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (role === 'student' && !studentData) {
    return (
      <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl text-center max-w-md mx-auto mt-12">
        <p className="text-sm font-semibold text-amber-800">No performance data available for your account yet.</p>
      </div>
    );
  }

  // --- STUDENT DASHBOARD VIEW ---
  if (role === 'student' && studentData) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Student Dashboard</h1>
            <p className="mt-2 text-sm text-gray-500">
              Welcome back, <span className="font-semibold text-purple-600">{user?.username}</span>. Here is your academic and attendance tracker.
            </p>
          </div>
          <button
            onClick={loadData}
            className="p-2.5 rounded-2xl bg-white border border-gray-100 shadow-sm text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            onClick={() => navigate('/my-rank')} 
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 flex items-center justify-between group"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Class Rank</span>
              <h2 className="text-3xl font-black text-gray-900 group-hover:text-purple-600 transition-colors">
                {studentData.rank ? `#${studentData.rank}` : 'Unranked'}
              </h2>
              <p className="text-xs text-gray-400">View masked leaderboard</p>
            </div>
            <div className="bg-amber-100 text-amber-600 p-3.5 rounded-2xl">
              <Award className="h-6 w-6" />
            </div>
          </div>

          <div 
            onClick={() => navigate('/my-performance')} 
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 flex items-center justify-between group"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Average Score</span>
              <h2 className="text-3xl font-black text-gray-900 group-hover:text-purple-600 transition-colors">
                {studentData.percentage ? `${studentData.percentage.toFixed(1)}%` : '0.0%'}
              </h2>
              <p className="text-xs text-gray-400">GPA performance</p>
            </div>
            <div className="bg-purple-100 text-purple-600 p-3.5 rounded-2xl">
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Attendance Rate</span>
              <h2 className={`text-3xl font-black ${studentData.attendanceRate < 75.0 ? 'text-rose-600' : 'text-gray-900'}`}>
                {studentData.attendanceRate ? `${studentData.attendanceRate.toFixed(1)}%` : '100%'}
              </h2>
              <p className="text-xs text-gray-400">Target is above 75%</p>
            </div>
            <div className={`p-3.5 rounded-2xl ${studentData.attendanceRate < 75.0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <Calendar className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Marks</span>
              <h2 className="text-3xl font-black text-gray-900">
                {studentData.totalMarks ? studentData.totalMarks.toFixed(1) : '0.0'}
              </h2>
              <p className="text-xs text-gray-400">Sum of subject scores</p>
            </div>
            <div className="bg-indigo-100 text-indigo-600 p-3.5 rounded-2xl">
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Charts & Ratios */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <h2 className="font-bold text-gray-900 text-lg">Academic Performance breakdown</h2>
            </div>
            <div className="h-72 w-full">
              {!studentData.marks?.length ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  No marks recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <StudentMarksChart data={studentData.marks} />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900 text-lg">Attendance Metrics</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Attendance Rate</span>
                  <span className="text-gray-900 font-bold">{studentData.attendanceRate?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${studentData.attendanceRate < 75.0 ? 'bg-rose-500' : 'bg-purple-600'}`} 
                    style={{ width: `${studentData.attendanceRate || 100}%` }} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-center">
                  <span className="block text-2xl font-black text-emerald-600">{studentData.presentDays}</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-700">Present</span>
                </div>
                <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 text-center">
                  <span className="block text-2xl font-black text-rose-600">{studentData.absentDays}</span>
                  <span className="text-[10px] uppercase font-bold text-rose-700">Absent</span>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
              studentData.attendanceRate < 75.0 
                ? 'bg-rose-50 border-rose-100 text-rose-800'
                : 'bg-emerald-50 border-emerald-100 text-emerald-800'
            }`}>
              {studentData.attendanceRate < 75.0 
                ? 'Warning: Your attendance rate is currently below the required 75% minimum.'
                : 'Excellent: Your attendance rate is fully compliant with school regulations.'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- STAFF DASHBOARDS (ADMIN, TEACHER, COUNSELOR) ---
  const totalStudents = staffData?.totalStudents ?? 0;
  const totalTeachers = staffData?.totalTeachers ?? 0;
  const totalCounselors = staffData?.totalCounselors ?? 0;
  const totalCsv = staffData?.totalCsvUploads ?? staffData?.totalCsv ?? 0;
  const overallAttendanceRate = staffData?.overallAttendanceRate ?? 100;
  const topPerformers = Array.isArray(staffData?.topPerformers) ? staffData.topPerformers : [];
  const studentsAtRisk = Array.isArray(staffData?.studentsAtRisk) ? staffData.studentsAtRisk : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight capitalize">{role} Dashboard</h1>
          <p className="mt-2 text-sm text-gray-500">
            Welcome back, <span className="font-semibold text-purple-600">{user?.username}</span>. Here are the core statistics for student performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {role === 'admin' && (
            <div className="flex items-center gap-2">
              <button
                onClick={downloadWatchlistPdf}
                disabled={isGenerating}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-xs font-bold rounded-xl text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-all duration-200"
              >
                <FileText className="mr-1.5 h-4 w-4" /> PDF Watchlist
              </button>
              <button
                onClick={downloadWatchlistExcel}
                disabled={isGenerating}
                className="inline-flex items-center justify-center px-4 py-2 border border-purple-200 shadow-sm text-xs font-bold rounded-xl text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-50 transition-all duration-200"
              >
                <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Excel Watchlist
              </button>
            </div>
          )}
          <button
            onClick={loadData}
            className="p-2.5 rounded-2xl bg-white border border-gray-100 shadow-sm text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* ADMIN & TEACHER: KPI Grids */}
      {role === 'admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Students</span>
              <h2 className="text-3xl font-black text-gray-900">{totalStudents || 0}</h2>
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">Active profiles</p>
            </div>
            <div className="bg-blue-100 text-blue-600 p-3.5 rounded-2xl">
              <Users className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Faculty Teachers</span>
              <h2 className="text-3xl font-black text-gray-900">{totalTeachers || 0}</h2>
              <p className="text-xs text-gray-400">Class instructors</p>
            </div>
            <div className="bg-purple-100 text-purple-600 p-3.5 rounded-2xl">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Counselors</span>
              <h2 className="text-3xl font-black text-gray-900">{totalCounselors || 0}</h2>
              <p className="text-xs text-gray-400">Academic support staff</p>
            </div>
            <div className="bg-indigo-100 text-indigo-600 p-3.5 rounded-2xl">
              <UserCircle className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">CSV Uploads</span>
              <h2 className="text-3xl font-black text-gray-900">{totalCsv || 0}</h2>
              <p className="text-xs text-gray-400">Logs and sheet uploads</p>
            </div>
            <div className="bg-amber-100 text-amber-600 p-3.5 rounded-2xl">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
          </div>
        </div>
      )}

      {role === 'teacher' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Students</span>
              <h2 className="text-3xl font-black text-gray-900">{totalStudents || 0}</h2>
              <p className="text-xs text-gray-400">Registered records</p>
            </div>
            <div className="bg-blue-100 text-blue-600 p-3.5 rounded-2xl">
              <Users className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Overall Attendance</span>
              <h2 className="text-3xl font-black text-gray-900">{overallAttendanceRate?.toFixed(1) || 100}%</h2>
              <p className="text-xs text-gray-400">Present class average</p>
            </div>
            <div className="bg-purple-100 text-purple-600 p-3.5 rounded-2xl">
              <Calendar className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">CSV Sheets processed</span>
              <h2 className="text-3xl font-black text-gray-900">{totalCsv || 0}</h2>
              <p className="text-xs text-gray-400">Student & mark files</p>
            </div>
            <div className="bg-amber-100 text-amber-600 p-3.5 rounded-2xl">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
          </div>
        </div>
      )}

      {/* COUNSELOR Dashboard: Focus heavily on students at risk */}
      {role === 'counselor' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Students Under Watch</span>
              <h2 className="text-3xl font-black text-gray-900">{totalStudents || 0}</h2>
              <p className="text-xs text-gray-400">Total profiles</p>
            </div>
            <div className="bg-blue-100 text-blue-600 p-3.5 rounded-2xl">
              <Users className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Flagged At-Risk</span>
              <h2 className="text-3xl font-black text-rose-600">{studentsAtRisk.length}</h2>
              <p className="text-xs text-rose-500 font-semibold">Attendance rate &lt; 75%</p>
            </div>
            <div className="bg-rose-100 text-rose-600 p-3.5 rounded-2xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">General Attendance Rate</span>
              <h2 className="text-3xl font-black text-gray-900">{overallAttendanceRate?.toFixed(1) || 100}%</h2>
              <p className="text-xs text-gray-400">Average present rate</p>
            </div>
            <div className="bg-purple-100 text-purple-600 p-3.5 rounded-2xl">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle area: Performers list & charts */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Chart: Top performers visualization */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Academic Ranks (Top Performers)
              </h2>
            </div>

            <div className="h-72">
              {topPerformers.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  No academic ranks calculated. Upload Marks CSV first.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <TopPerformersChart data={topPerformers} />
                </div>
              )}
            </div>
          </div>

          {/* At Risk Students List (Detailed list in Counselor view, short list elsewhere) */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
              <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
                Attendance Watchlist (At Risk)
              </h2>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 border border-rose-100 text-rose-600">
                Attendance &lt; 75%
              </span>
            </div>

            <div className="overflow-x-auto">
              {studentsAtRisk.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  Excellent: No students flagged under the attendance warning threshold!
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll</th>
                      <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Attendance Rate</th>
                      <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {studentsAtRisk.map((s: any) => (
                      <tr key={s.studentId} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-700">{s.rollNumber}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{s.firstName} {s.lastName}</td>
                        <td className="px-6 py-4 text-right font-bold text-rose-600">{s.attendanceRate?.toFixed(1)}%</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => navigate(`/students/${s.studentId}`)}
                            className="inline-flex items-center justify-center p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Open Profile"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Area: Top Performers & Recent CSV upload details */}
        <div className="space-y-6">
          
          {/* Top Performers Table Card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-amber-500" />
              Leaderboard Standings
            </h2>

            <div className="space-y-4">
              {topPerformers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No leaderboard records.</p>
              ) : (
                topPerformers.map((performer: any, idx: number) => (
                  <div 
                    key={performer.studentId ?? performer.id ?? idx}
                    onClick={() => navigate(`/students/${performer.studentId ?? performer.id}`)}
                    className="flex items-center justify-between p-3.5 bg-gray-50/50 hover:bg-purple-50/30 border border-gray-100 hover:border-purple-100 rounded-2xl cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black
                        ${idx === 0 ? 'bg-amber-100 text-amber-700' :
                          idx === 1 ? 'bg-slate-200 text-slate-700' :
                          idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                        {performer.rank}
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-gray-400">{performer.rollNumber}</span>
                        <span className="text-sm font-bold text-gray-900">{performer.firstName} {performer.lastName}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-extrabold text-purple-600">{performer.percentage?.toFixed(1)}%</span>
                      <span className="text-[10px] text-gray-400 font-medium">{performer.totalMarks} pts</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Teacher/Admin: Recent CSV uploads logs */}
          {(role === 'admin' || role === 'teacher') && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-4">
                <FileSpreadsheet className="h-5 w-5 text-purple-600" />
                Recent CSV Logs
              </h2>

              <div className="space-y-3.5">
                {csvLogs.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No uploads registered yet.</p>
                ) : (
                  csvLogs.map((log: any) => (
                    <div key={log.id} className="p-3 bg-gray-50/30 border border-gray-100 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-gray-800 block truncate max-w-[150px]" title={log.fileName}>
                          {log.fileName}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          {new Date(log.uploadDate).toLocaleString()}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border
                        ${log.fileType === 'MARKS' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                        {log.fileType}
                      </span>
                    </div>
                  ))
                )}

                <button 
                  onClick={() => navigate('/csv-management')}
                  className="w-full flex items-center justify-center gap-1.5 py-2 mt-2 border border-purple-200 rounded-xl text-xs font-bold text-purple-700 hover:bg-purple-50/50 transition-colors"
                >
                  Manage Imports <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
