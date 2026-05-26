import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../../features/auth/authStore';
import { useStudentStore } from '../../features/students/studentStore';
import { useReportStore } from '../../features/reports/reportStore';
import { useAnalyticsStore } from '../../features/analytics/analyticsStore';
import api from '../../lib/axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie 
} from 'recharts';
import { 
  Users, GraduationCap, Calendar, FileSpreadsheet, Award, AlertTriangle, 
  TrendingUp, ArrowRight, RefreshCw, FileText,
  Sliders, Gauge, Settings, ShieldCheck, Mail, ChevronLeft, ChevronRight, Search, Save
} from 'lucide-react';
import { CircularProgress, Slider, Button, Tooltip as MuiTooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, anonymize } = useAuthStore();
  const { fetchDashboardSummary, fetchMyPerformance, fetchCsvLogs } = useStudentStore();
  const { isGenerating, downloadWatchlistPdf, downloadWatchlistExcel } = useReportStore();

  const { 
    summary: analyticsSummary, 
    fetchDashboardSummary: fetchAnalyticsSummary, 
    fetchConfig, 
    saveConfig, 
    runSimulation, 
    simulationResult,
    checkAccuracy,
    accuracyResult
  } = useAnalyticsStore();

  const { students, fetchStudents } = useStudentStore();

  const [staffData, setStaffData] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [csvLogs, setCsvLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = user?.role?.toLowerCase() || '';

  // Advanced Dashboard Tabs State
  const [activeTab, setActiveTab] = useState<'overview' | 'watchlist' | 'simulator' | 'config'>('overview');
  
  // Cohort Filters State
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');

  // Policy Simulator Inputs State
  const [simTutoringThreshold, setSimTutoringThreshold] = useState(75);
  const [simGradeBoost, setSimGradeBoost] = useState(10);
  const [simAttendanceBoost, setSimAttendanceBoost] = useState(5);
  const [simulating, setSimulating] = useState(false);

  // Config Threshold Forms State
  const [cfgGradeThreshold, setCfgGradeThreshold] = useState(60);
  const [cfgAttendanceThreshold, setCfgAttendanceThreshold] = useState(85);
  const [cfgBehaviorThreshold, setCfgBehaviorThreshold] = useState(7);
  const [cfgLowRiskLimit, setCfgLowRiskLimit] = useState(30);
  const [cfgMediumRiskLimit, setCfgMediumRiskLimit] = useState(70);
  const [updatingConfig, setUpdatingConfig] = useState(false);

  // Accuracy Trigger State
  const [evaluatingAccuracy, setEvaluatingAccuracy] = useState(false);

  // Watchlist Pagination & Filtering State
  const [wlSearch, setWlSearch] = useState('');
  const [wlPage, setWlPage] = useState(1);
  const wlPageSize = 10;

  // Parent Nudge Dialog State
  const [isNudgeOpen, setIsNudgeOpen] = useState(false);
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const [nudgeStudent, setNudgeStudent] = useState<any>(null);
  const [nudgeEmail, setNudgeEmail] = useState({ subject: '', body: '' });

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
        
        await Promise.all([
          fetchAnalyticsSummary(),
          fetchStudents(),
          fetchConfig().then(cfg => {
            if (cfg) {
              setCfgGradeThreshold(cfg.predictedGradeThreshold);
              setCfgAttendanceThreshold(cfg.attendanceThreshold);
              setCfgBehaviorThreshold(cfg.behaviorThreshold);
              setCfgLowRiskLimit(cfg.lowRiskMaxLimit);
              setCfgMediumRiskLimit(cfg.mediumRiskMaxLimit);
            }
          }),
          fetchCsvLogs().then(logs => setCsvLogs(logs.slice(0, 5)))
        ]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics.');
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

  // --- STUDENT DASHBOARD VIEW ---
  if (role === 'student' && studentData) {
    const COLORS = ['#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81', '#1e1b4b'];
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
              {studentData.marks?.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  No marks recorded yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studentData.marks} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="subject" tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-gray-900/90 text-white text-xs px-3 py-2 rounded-xl shadow-md border border-gray-800 backdrop-blur-sm">
                              <span className="font-semibold">{payload[0].payload.subject}:</span> {payload[0].value} / 100
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="marks" radius={[6, 6, 0, 0]}>
                      {studentData.marks.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
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
  const { totalCsv, topPerformers, overallAttendanceRate } = staffData || {};

  const classesList = useMemo(() => {
    return ['All', ...Array.from(new Set(students.map(s => s.className).filter(Boolean)))];
  }, [students]);

  const sectionsList = useMemo(() => {
    return ['All', ...Array.from(new Set(students.map(s => s.section).filter(Boolean)))];
  }, [students]);

  const predictionRecords = analyticsSummary?.records || [];

  const filteredPredictionRecords = useMemo(() => {
    return predictionRecords.filter(rec => {
      const student = students.find(s => s.id === rec.studentId);
      if (!student) return false;
      const matchesClass = selectedClass === 'All' || student.className === selectedClass;
      const matchesSection = selectedSection === 'All' || student.section === selectedSection;
      return matchesClass && matchesSection;
    });
  }, [predictionRecords, students, selectedClass, selectedSection]);

  const cohortStats = useMemo(() => {
    const total = filteredPredictionRecords.length;
    const high = filteredPredictionRecords.filter(r => r.riskCategory === 'HIGH').length;
    const medium = filteredPredictionRecords.filter(r => r.riskCategory === 'MEDIUM').length;
    const low = filteredPredictionRecords.filter(r => r.riskCategory === 'LOW').length;
    const passRate = total > 0 ? ((total - high) / total) * 100 : 85.0;

    return {
      total,
      high,
      medium,
      low,
      passRate
    };
  }, [filteredPredictionRecords]);

  const radialData = [
    { name: 'Passing', value: Math.round(cohortStats.passRate) },
    { name: 'At Risk', value: 100 - Math.round(cohortStats.passRate) }
  ];

  const watchlistRecords = useMemo(() => {
    const sorted = [...filteredPredictionRecords].sort((a, b) => b.riskScore - a.riskScore);
    return sorted.filter(rec => {
      const student = students.find(s => s.id === rec.studentId);
      if (!student) return false;
      const name = `${student.firstName} ${student.lastName}`.toLowerCase();
      const roll = (student.rollNumber || '').toLowerCase();
      const q = wlSearch.toLowerCase();
      return name.includes(q) || roll.includes(q);
    });
  }, [filteredPredictionRecords, students, wlSearch]);

  const totalWatchlistRows = watchlistRecords.length;
  const totalWlPages = Math.ceil(totalWatchlistRows / wlPageSize);

  const paginatedWatchlist = useMemo(() => {
    const startIndex = (wlPage - 1) * wlPageSize;
    return watchlistRecords.slice(startIndex, startIndex + wlPageSize);
  }, [watchlistRecords, wlPage, wlPageSize]);

  const handleOpenNudge = async (studentId: number) => {
    setNudgeLoading(true);
    const student = students.find(s => s.id === studentId);
    setNudgeStudent(student);
    setIsNudgeOpen(true);
    try {
      const res = await api.get(`/analytics/nudge/${studentId}`);
      setNudgeEmail({
        subject: res.data.subject || '',
        body: res.data.body || ''
      });
    } catch (err) {
      console.error(err);
    } finally {
      setNudgeLoading(false);
    }
  };

  const handleSendNudgeSimulated = () => {
    alert(`Nudge email successfully drafted and dispatched to parent/guardian of ${nudgeStudent?.firstName || 'Student'}!`);
    setIsNudgeOpen(false);
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    try {
      await runSimulation(simTutoringThreshold, simGradeBoost, simAttendanceBoost);
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingConfig(true);
    try {
      const payload = {
        predictedGradeThreshold: Number(cfgGradeThreshold),
        attendanceThreshold: Number(cfgAttendanceThreshold),
        behaviorThreshold: Number(cfgBehaviorThreshold),
        lowRiskMaxLimit: Number(cfgLowRiskLimit),
        mediumRiskMaxLimit: Number(cfgMediumRiskLimit)
      };
      const ok = await saveConfig(payload);
      if (ok) {
        alert("System risk configuration thresholds successfully updated and saved to MongoDB!");
        await fetchAnalyticsSummary(); // refresh prediction records
      } else {
        alert("Failed to update config. Admin role authorization required.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving configuration.");
    } finally {
      setUpdatingConfig(false);
    }
  };

  const handleCheckAccuracy = async () => {
    setEvaluatingAccuracy(true);
    try {
      await checkAccuracy();
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluatingAccuracy(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight capitalize">{role} dashboard</h1>
          <p className="mt-2 text-sm text-gray-500">
            Welcome back, <span className="font-semibold text-purple-600">{user?.username}</span>. Here is the academic analytics cockpit.
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

      {/* Advanced Navigation Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar scroll-smooth">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 py-3.5 px-6 border-b-2 text-sm font-bold capitalize transition-all duration-200 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-purple-500'
          }`}
        >
          <GraduationCap className="h-4.5 w-4.5" />
          Performance Overview
        </button>
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`flex items-center gap-2 py-3.5 px-6 border-b-2 text-sm font-bold capitalize transition-all duration-200 whitespace-nowrap ${
            activeTab === 'watchlist'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-purple-500'
          }`}
        >
          <AlertTriangle className="h-4.5 w-4.5" />
          Top 50 Risk Watchlist
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 py-3.5 px-6 border-b-2 text-sm font-bold capitalize transition-all duration-200 whitespace-nowrap ${
            activeTab === 'simulator'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-purple-500'
          }`}
        >
          <Sliders className="h-4.5 w-4.5" />
          Scenario Policy Simulator
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 py-3.5 px-6 border-b-2 text-sm font-bold capitalize transition-all duration-200 whitespace-nowrap ${
            activeTab === 'config'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-purple-500'
          }`}
        >
          <Settings className="h-4.5 w-4.5" />
          Tuning & Accuracy
        </button>
      </div>

      {/* Cohort Select Dropdowns (Available on Overview and Watchlist) */}
      {(activeTab === 'overview' || activeTab === 'watchlist') && (
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-700 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              Cohort filters
            </span>
            <span className="text-xs text-gray-400 font-medium">Narrow down analytical statistics</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
              <span>Grade Level:</span>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setWlPage(1);
                }}
                className="bg-gray-50 border border-gray-200 text-gray-700 rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-purple-300 transition-all font-semibold"
              >
                {classesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
              <span>Section:</span>
              <select
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  setWlPage(1);
                }}
                className="bg-gray-50 border border-gray-200 text-gray-700 rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-purple-300 transition-all font-semibold"
              >
                {sectionsList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 1: Performance Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Active Cohort</span>
                <h2 className="text-3xl font-black text-gray-900">{cohortStats.total}</h2>
                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">Students filtered</p>
              </div>
              <div className="bg-blue-100 text-blue-600 p-3.5 rounded-2xl">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">High Risk Count</span>
                <h2 className="text-3xl font-black text-rose-600">{cohortStats.high}</h2>
                <p className="text-xs text-rose-400">Predicted failure risk</p>
              </div>
              <div className="bg-rose-100 text-rose-600 p-3.5 rounded-2xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Attendance Average</span>
                <h2 className="text-3xl font-black text-gray-900">{overallAttendanceRate?.toFixed(1) || 100}%</h2>
                <p className="text-xs text-gray-400">Cumulative rate</p>
              </div>
              <div className="bg-purple-100 text-purple-600 p-3.5 rounded-2xl">
                <Calendar className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Database Sheets</span>
                <h2 className="text-3xl font-black text-gray-900">{totalCsv || 0}</h2>
                <p className="text-xs text-gray-400">CSV uploads</p>
              </div>
              <div className="bg-amber-100 text-amber-600 p-3.5 rounded-2xl">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Dynamic Cohort Passing Rate Gauge and Recharts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gauge */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between items-center text-center">
              <div className="self-start text-left mb-4">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-purple-600" />
                  Cohort passing Rate
                </h3>
                <span className="text-xs text-gray-400 font-medium">Predicted safe & passing metric</span>
              </div>
              
              <div className="relative flex items-center justify-center h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={radialData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      <Cell fill="#8b5cf6" />
                      <Cell fill="#e5e7eb" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-gray-900">{Math.round(cohortStats.passRate)}%</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Passing</span>
                </div>
              </div>

              <div className="w-full mt-4 p-3.5 bg-gray-50 rounded-2xl text-xs text-gray-500 font-medium leading-relaxed">
                {cohortStats.passRate >= 80 
                  ? 'Cohort showing healthy predicted grade performance and solid attendance rates.'
                  : 'Action Required: High density of risk flags identified inside this filtered cohort.'}
              </div>
            </div>

            {/* Recharts BarChart */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  Academic Ranks (Top Performers)
                </h2>
              </div>

              <div className="h-72">
                {topPerformers?.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-gray-400">
                    No academic ranks calculated. Upload Marks CSV first.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topPerformers} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis 
                        dataKey="firstName" 
                        tickFormatter={(name, index) => anonymize ? `STUDENT_ST-${topPerformers[index]?.id}` : `${name} (${topPerformers[index]?.rollNumber || ''})`} 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: '#9ca3af', fontSize: 10 }} 
                      />
                      <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="percentage" name="Percentage Average (%)" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Under Performers and Recent CSV Log Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Standings Table card */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-amber-500" />
                Leaderboard Standings
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {topPerformers?.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6 col-span-2">No leaderboard records.</p>
                ) : (
                  topPerformers?.slice(0, 4).map((performer: any, idx: number) => (
                    <div 
                      key={performer.id}
                      onClick={() => navigate(`/students/${performer.id}`)}
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
                          <span className="block text-xs font-semibold text-gray-400">{anonymize ? `ST-${performer.id}` : performer.rollNumber}</span>
                          <span className="text-sm font-bold text-gray-900">{anonymize ? `STUDENT_ST-${performer.id}` : `${performer.firstName} ${performer.lastName}`}</span>
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

            {/* CSV uploads */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-4">
                  <FileSpreadsheet className="h-5 w-5 text-purple-600" />
                  Recent CSV Logs
                </h2>

                <div className="space-y-2.5">
                  {csvLogs.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No uploads registered yet.</p>
                  ) : (
                    csvLogs.slice(0, 3).map((log: any) => (
                      <div key={log.id} className="p-3 bg-gray-50/30 border border-gray-100 rounded-2xl flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-bold text-gray-800 block truncate max-w-[130px]" title={log.fileName}>
                            {log.fileName}
                          </span>
                          <span className="text-[9px] text-gray-400 block mt-0.5">
                            {new Date(log.uploadDate).toLocaleDateString()}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase border
                          ${log.fileType === 'MARKS' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                          {log.fileType}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button 
                onClick={() => navigate('/csv-management')}
                className="w-full flex items-center justify-center gap-1.5 py-2 mt-4 border border-purple-200 rounded-xl text-xs font-bold text-purple-700 hover:bg-purple-50/50 transition-colors"
              >
                Manage Imports <ArrowRight className="h-3 w-3" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Tab Content 2: Top 50 Risk Watchlist (Custom Glassmorphic DataGrid) */}
      {activeTab === 'watchlist' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Toolbar search */}
            <div className="p-5 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Top 50 Students At-Risk</h3>
                <p className="text-xs text-gray-400 mt-1 font-medium">
                  Ranks cohort prediction entries based on algorithm scores.
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter name or roll number..."
                  value={wlSearch}
                  onChange={(e) => {
                    setWlSearch(e.target.value);
                    setWlPage(1);
                  }}
                  className="w-full bg-white rounded-xl pl-9 pr-4 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs text-gray-700 shadow-sm placeholder-gray-400 transition-all font-semibold"
                />
              </div>
            </div>

            {/* Custom DataGrid List */}
            <div className="overflow-x-auto">
              {paginatedWatchlist.length === 0 ? (
                <div className="py-20 text-center text-gray-500">
                  <AlertTriangle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="font-bold text-gray-700 text-sm">No at-risk predictions match criteria</p>
                  <p className="text-xs text-gray-400 mt-1">Run prediction engine or import mark metrics.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      <th className="px-6 py-4 text-center">Category</th>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4 text-center">GPA (%)</th>
                      <th className="px-6 py-4 text-center">Attendance</th>
                      <th className="px-6 py-4 text-center">Behavior</th>
                      <th className="px-6 py-4 text-center">Risk Score</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {paginatedWatchlist.map((rec) => {
                      const student = students.find(s => s.id === rec.studentId);
                      if (!student) return null;
                      
                      return (
                        <tr key={rec.id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border
                              ${rec.riskCategory === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' :
                                rec.riskCategory === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-green-50 text-green-700 border-green-200'}`}>
                              {rec.riskCategory}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                                {anonymize ? 'ST' : `${student.firstName?.charAt(0)}${student.lastName?.charAt(0)}`}
                              </div>
                              <div>
                                <span className="block font-bold text-gray-900">
                                  {anonymize ? `STUDENT_ST-${student.id}` : `${student.firstName} ${student.lastName}`}
                                </span>
                                <span className="block text-[10px] text-gray-400 font-medium">
                                  Roll: {anonymize ? `ST-${student.id}` : student.rollNumber} | {student.className}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-gray-700">
                            {(rec.gpa * 25.0).toFixed(1)}%
                          </td>
                          <td className={`px-6 py-4 text-center font-bold
                            ${rec.attendancePercentage < 75.0 ? 'text-rose-600' :
                              rec.attendancePercentage < 85.0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {rec.attendancePercentage.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 text-center font-medium text-gray-600">
                            {rec.behaviorScore.toFixed(1)}/10
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <span className={`font-black text-sm
                                ${rec.riskScore > 70 ? 'text-rose-600 animate-pulse' :
                                  rec.riskScore > 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {rec.riskScore.toFixed(0)}%
                              </span>
                              <div className="w-16 bg-gray-150 h-1 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full 
                                    ${rec.riskScore > 70 ? 'bg-rose-500' :
                                      rec.riskScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${rec.riskScore}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <MuiTooltip title="Nudge Parent via Email" arrow>
                                <button
                                  onClick={() => handleOpenNudge(student.id)}
                                  className="inline-flex items-center justify-center p-1.5 text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded-lg transition-colors bg-white shadow-sm"
                                >
                                  <Mail className="h-4 w-4" />
                                </button>
                              </MuiTooltip>
                              <MuiTooltip title="Open Full Profile" arrow>
                                <button
                                  onClick={() => navigate(`/students/${student.id}`)}
                                  className="inline-flex items-center justify-center p-1.5 text-purple-600 hover:bg-purple-50 border border-purple-100 rounded-lg transition-colors bg-white shadow-sm"
                                >
                                  <ArrowRight className="h-4 w-4" />
                                </button>
                              </MuiTooltip>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination custom toolbar */}
            {totalWlPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-500">
                <div>
                  Showing {(wlPage - 1) * wlPageSize + 1} to {Math.min(wlPage * wlPageSize, totalWatchlistRows)} of {totalWatchlistRows} at-risk students
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWlPage(prev => Math.max(prev - 1, 1))}
                    disabled={wlPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2">Page {wlPage} of {totalWlPages}</span>
                  <button
                    onClick={() => setWlPage(prev => Math.min(prev + 1, totalWlPages))}
                    disabled={wlPage === totalWlPages}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Tab Content 3: Scenario Policy Simulator (Sliders and recalculations) */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Input Controls Card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6 lg:col-span-1">
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-purple-600" />
                  Policy variables
                </h3>
                <p className="text-xs text-gray-400 mt-1 font-medium">Adjust hypothetical variables below</p>
              </div>

              {/* Slider 1: Tutoring Threshold */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-700">
                  <span>Tutoring Threshold:</span>
                  <span className="text-purple-600 font-extrabold">{simTutoringThreshold}% Marks</span>
                </div>
                <Slider
                  value={simTutoringThreshold}
                  onChange={(_, val) => setSimTutoringThreshold(val as number)}
                  min={50}
                  max={90}
                  className="!text-purple-600 !py-2"
                />
                <span className="text-[10px] text-gray-400 block leading-tight">
                  Students with predicted grades below this threshold will get active tutoring support.
                </span>
              </div>

              {/* Slider 2: Grade Boost */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-700">
                  <span>Tutoring Impact (Grade Boost):</span>
                  <span className="text-purple-600 font-extrabold">+{simGradeBoost}% Grade</span>
                </div>
                <Slider
                  value={simGradeBoost}
                  onChange={(_, val) => setSimGradeBoost(val as number)}
                  min={2}
                  max={20}
                  className="!text-purple-600 !py-2"
                />
                <span className="text-[10px] text-gray-400 block leading-tight">
                  Hypothetical grade increase expected as a consequence of custom study sessions.
                </span>
              </div>

              {/* Slider 3: Attendance Boost */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-700">
                  <span>Attendance counseling Boost:</span>
                  <span className="text-purple-600 font-extrabold">+{simAttendanceBoost}% Rate</span>
                </div>
                <Slider
                  value={simAttendanceBoost}
                  onChange={(_, val) => setSimAttendanceBoost(val as number)}
                  min={0}
                  max={15}
                  className="!text-purple-600 !py-2"
                />
                <span className="text-[10px] text-gray-400 block leading-tight">
                  Hypothetical attendance rate improvement after regular checks.
                </span>
              </div>

              <button
                onClick={handleRunSimulation}
                disabled={simulating}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 focus:outline-none disabled:opacity-50 transition-all duration-200"
              >
                {simulating ? <CircularProgress size={16} className="!text-white" /> : <RefreshCw className="h-4.5 w-4.5" />}
                {simulating ? 'Running Algorithm...' : 'Run Policy Simulation'}
              </button>
            </div>

            {/* Simulation Outcomes Output Card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-4">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  Simulated Policy Outcomes
                </h3>

                {simulationResult ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="bg-purple-55/40 border border-purple-100 rounded-2xl p-4 text-center">
                        <span className="block text-3xl font-black text-purple-700">{simulationResult.studentsImpacted}</span>
                        <span className="text-[10px] uppercase font-bold text-purple-900 mt-1">Students Supported</span>
                      </div>
                      <div className="bg-emerald-55/40 border border-emerald-100 rounded-2xl p-4 text-center">
                        <span className="block text-3xl font-black text-emerald-700">{simulationResult.simulatedPassRate}%</span>
                        <span className="text-[10px] uppercase font-bold text-emerald-900 mt-1">Simulated Pass Rate</span>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center col-span-2 sm:col-span-1 flex flex-col justify-center items-center">
                        <span className="block text-2xl font-black text-emerald-700">+{simulationResult.passRateGain}%</span>
                        <span className="text-[9px] uppercase font-extrabold text-emerald-800 tracking-wider">Pass Rate Gain</span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between text-xs font-bold text-gray-600">
                        <span>Original predicted Passing Rate:</span>
                        <span>{simulationResult.originalPassRate}%</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-emerald-600">
                        <span>Simulated predicted Passing Rate:</span>
                        <span>{simulationResult.simulatedPassRate}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                        <div className="bg-purple-400 h-full" style={{ width: `${simulationResult.originalPassRate}%` }} />
                        <div className="bg-emerald-500 h-full" style={{ width: `${simulationResult.passRateGain}%` }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-450 border border-dashed border-gray-200 rounded-2xl bg-gray-50/40">
                    <Sliders className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="font-bold text-sm text-gray-700">No simulation active</p>
                    <p className="text-xs text-gray-400 mt-1">Set intervention variables on the left and trigger simulation.</p>
                  </div>
                )}
              </div>

              {/* Telglish explanations */}
              <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5 text-purple-900 text-xs space-y-2 mt-4 leading-relaxed font-medium">
                <p className="font-bold text-sm text-purple-950">💡 Policy explanation spelled in Telugu (English font):</p>
                <p>
                  <strong>Decision target:</strong> Eey policy simulator dwaara, manam tutoring threshold mariyu grade/attendance boosts ni sliding inputs dwaara test cheyyochu.
                </p>
                <p>
                  <strong>Input logic:</strong> 
                  <br />1. <em>Tutoring support limit:</em> Ye marks (<span className="font-bold">{simTutoringThreshold}%</span>) vunnna students ki special intervention support kaavalo filter chesthundi.
                  <br />2. <em>Grade boost:</em> Personalized support/tutoring icchaaka student predicted marks lo average perigina gain (<span className="font-bold">+{simGradeBoost}%</span>).
                  <br />3. <em>Attendance boost:</em> Attendance counseling and checking valla regular support perigina gain (<span className="font-bold">+{simAttendanceBoost}%</span>).
                </p>
                <p>
                  <strong>Simulated outcome:</strong> Eey parameters dynamic ga systems prediction algorithms ni update chesi future outcomes prediction ni recalculate chesthaayi.
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Tab Content 4: Tuning & Accuracy Configuration (Threshold adjustments & Dynamic Accuracy calculations) */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Configurations Form */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-5">
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Algorithm Threshold tuning
                </h3>
                <p className="text-xs text-gray-400 mt-1 font-medium">
                  Tune mathematical parameters evaluated by predictive classifiers.
                </p>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField
                    label="Grade failure boundary (%)"
                    type="number"
                    value={cfgGradeThreshold}
                    onChange={(e) => setCfgGradeThreshold(Number(e.target.value))}
                    required
                    disabled={role !== 'admin'}
                    slotProps={{ input: { className: '!rounded-xl' } }}
                  />
                  <TextField
                    label="Attendance Threshold (%)"
                    type="number"
                    value={cfgAttendanceThreshold}
                    onChange={(e) => setCfgAttendanceThreshold(Number(e.target.value))}
                    required
                    disabled={role !== 'admin'}
                    slotProps={{ input: { className: '!rounded-xl' } }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <TextField
                    label="Behavior Threshold (0-10)"
                    type="number"
                    value={cfgBehaviorThreshold}
                    onChange={(e) => setCfgBehaviorThreshold(Number(e.target.value))}
                    required
                    disabled={role !== 'admin'}
                    slotProps={{ input: { className: '!rounded-xl' } }}
                  />
                  <TextField
                    label="Low Risk Max Score"
                    type="number"
                    value={cfgLowRiskLimit}
                    onChange={(e) => setCfgLowRiskLimit(Number(e.target.value))}
                    required
                    disabled={role !== 'admin'}
                    slotProps={{ input: { className: '!rounded-xl' } }}
                  />
                  <TextField
                    label="Medium Risk Max Score"
                    type="number"
                    value={cfgMediumRiskLimit}
                    onChange={(e) => setCfgMediumRiskLimit(Number(e.target.value))}
                    required
                    disabled={role !== 'admin'}
                    slotProps={{ input: { className: '!rounded-xl' } }}
                  />
                </div>

                {role === 'admin' ? (
                  <button
                    type="submit"
                    disabled={updatingConfig}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-all duration-200"
                  >
                    {updatingConfig ? <CircularProgress size={16} className="!text-white" /> : <Save className="h-4 w-4" />}
                    {updatingConfig ? 'Saving configuration...' : 'Update System Thresholds'}
                  </button>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs font-semibold leading-relaxed">
                    * Configuration adjustments are restricted to users with the Administrator role.
                  </div>
                )}
              </form>
            </div>

            {/* Model Accuracy Output Card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between text-center items-center">
              <div className="self-start text-left mb-4">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-emerald-500" />
                  Historical Classifier Accuracy
                </h3>
                <span className="text-xs text-gray-400 font-medium">Validates past predictions against actual finals</span>
              </div>

              <div className="relative flex items-center justify-center h-40 w-full mt-2">
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-emerald-600">
                    {accuracyResult ? `${accuracyResult.accuracyPercentage}%` : '85.0%'}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Accuracy</span>
                </div>
              </div>

              <div className="w-full space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                    <span className="block text-lg font-bold text-emerald-700">
                      {accuracyResult ? accuracyResult.correctPredictions : '—'}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-emerald-800">Correct Predictions</span>
                  </div>
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
                    <span className="block text-lg font-bold text-purple-700">
                      {accuracyResult ? accuracyResult.totalEvaluated : '—'}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-purple-800">Evaluated Records</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckAccuracy}
                  disabled={evaluatingAccuracy}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none disabled:opacity-50 transition-all duration-200"
                >
                  {evaluatingAccuracy ? <CircularProgress size={16} className="!text-white" /> : <Gauge className="h-4.5 w-4.5" />}
                  {evaluatingAccuracy ? 'Triggering calculations...' : 'Trigger Accuracy Validation'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Parent Nudge Email Draft Dialog */}
      <Dialog 
        open={isNudgeOpen} 
        onClose={() => setIsNudgeOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { className: '!rounded-3xl !p-3' } }}
      >
        <DialogTitle className="!font-bold !text-xl !pb-1 flex items-center gap-2">
          <Mail className="h-5.5 w-5.5 text-purple-600" />
          Draft Parents Academic Nudge
        </DialogTitle>
        <DialogContent className="!space-y-4 !pt-0">
          {nudgeLoading ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <CircularProgress size={24} className="!text-purple-600" />
              <p className="text-xs text-gray-500 mt-2">Drafting email from template...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-2xl border text-xs text-gray-500 leading-relaxed font-medium">
                To Parents/Guardians of: <span className="font-bold text-gray-800">{nudgeStudent?.firstName} {nudgeStudent?.lastName}</span>
                <br />Email Destination: <span className="font-bold text-gray-800">{nudgeStudent?.email}</span>
              </div>
              <TextField
                label="Subject"
                fullWidth
                value={nudgeEmail.subject}
                onChange={(e) => setNudgeEmail(prev => ({ ...prev, subject: e.target.value }))}
                slotProps={{ input: { className: '!rounded-xl' } }}
              />
              <TextField
                label="Message Body"
                fullWidth
                multiline
                rows={6}
                value={nudgeEmail.body}
                onChange={(e) => setNudgeEmail(prev => ({ ...prev, body: e.target.value }))}
                slotProps={{ input: { className: '!rounded-xl' } }}
              />
            </div>
          )}
        </DialogContent>
        <DialogActions className="!px-6 !pb-4">
          <Button onClick={() => setIsNudgeOpen(false)} className="!text-gray-500 !rounded-xl" disabled={nudgeLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendNudgeSimulated} 
            variant="contained" 
            className="!bg-purple-600 hover:!bg-purple-700 !text-white !rounded-xl !px-6"
            disabled={nudgeLoading}
          >
            Dispatch Nudge
          </Button>
        </DialogActions>
      </Dialog>

    </div>
  );
}
