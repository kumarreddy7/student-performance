import { useEffect, useState, useMemo } from 'react';
import { useStudentStore } from '../../features/students/studentStore';
import api from '../../lib/axios';
import { 
  Calendar, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Save, 
  TrendingUp, 
  Users,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';
import { 
  CircularProgress, 
  Button,
  Tooltip
} from '@mui/material';

interface AttendanceRecord {
  studentId: number;
  firstName: string;
  lastName: string;
  email: string;
  rollNumber: string;
  className: string;
  section: string;
  branch: string;
  status: 'PRESENT' | 'ABSENT' | null;
  markedBy?: string | null;
}

interface AttendanceStats {
  dayPresent: number;
  dayTotal: number;
  dayPercentage: number;
  monthPresent: number;
  monthTotal: number;
  monthPercentage: number;
}

export default function Attendance() {
  const { fetchAttendance, saveAttendance, fetchAttendanceStats } = useStudentStore();
  
  // Set default date to today's date in local time zone (YYYY-MM-DD)
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState<string>(getTodayDateString());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [originalRecords, setOriginalRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedBranch, setSelectedBranch] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

  // Load data for a specific date
  const loadData = async (targetDate: string) => {
    setLoading(true);
    setMessage({ text: '', type: null });
    try {
      const [fetchedRecords, fetchedStats] = await Promise.all([
        fetchAttendance(targetDate),
        fetchAttendanceStats(targetDate)
      ]);
      
      const formattedRecords = fetchedRecords.map((r: any) => ({
        studentId: r.studentId,
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        rollNumber: r.rollNumber || '',
        className: r.className || '',
        section: r.section || '',
        branch: r.branch || '',
        status: r.status === 'PRESENT' || r.status === 'ABSENT' ? r.status : null,
        markedBy: r.markedBy || null
      }));

      setRecords(formattedRecords);
      setOriginalRecords(JSON.parse(JSON.stringify(formattedRecords)));
      setStats(fetchedStats);
    } catch (err: any) {
      console.error('Error fetching attendance data:', err);
      setMessage({ 
        text: err.response?.data?.message || 'Failed to load attendance records. Please try again.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const res = await api.get('/students/counseling/current-time');
        if (res.data?.date) {
          setDate(res.data.date);
        }
      } catch (err) {
        console.error("Failed to fetch real-time server date", err);
      }
    };
    fetchServerTime();
  }, []);

  useEffect(() => {
    loadData(date);
  }, [date]);

  // Handle individual attendance status change
  const handleStatusChange = (studentId: number, status: 'PRESENT' | 'ABSENT') => {
    setRecords(prev => prev.map(rec => 
      rec.studentId === studentId 
        ? { ...rec, status: rec.status === status ? null : status } // Toggle if clicked same, or update
        : rec
    ));
  };

  // Bulk actions
  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    // Note: apply bulk marking to currently filtered list only for convenience, or all records
    // Let's mark only the filtered records so counselors/teachers can bulk mark a specific class/section!
    const filteredIds = new Set(filteredRecords.map(r => r.studentId));
    setRecords(prev => prev.map(rec => 
      filteredIds.has(rec.studentId) ? { ...rec, status } : rec
    ));
  };

  const handleReset = () => {
    setRecords(JSON.parse(JSON.stringify(originalRecords)));
  };

  // Check if any change has been made
  const hasChanges = useMemo(() => {
    return JSON.stringify(records.map(r => ({ studentId: r.studentId, status: r.status }))) !== 
           JSON.stringify(originalRecords.map(r => ({ studentId: r.studentId, status: r.status })));
  }, [records, originalRecords]);

  // Compute who marked this attendance
  const markedByInfo = useMemo(() => {
    const rec = records.find(r => r.markedBy);
    return rec ? rec.markedBy : null;
  }, [records]);

  // Compute live local statistics for direct user feedback before saving
  const liveStats = useMemo(() => {
    const total = records.length;
    const marked = records.filter(r => r.status !== null).length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const percentage = total > 0 ? (present / total) * 100 : 0;
    
    return {
      total,
      marked,
      present,
      percentage
    };
  }, [records]);

  // Save Attendance to Backend
  const handleSave = async () => {
    if (records.length === 0) return;
    
    setSaving(true);
    setMessage({ text: '', type: null });
    
    const payload = records.map(r => ({
      studentId: r.studentId,
      status: r.status
    }));

    try {
      await saveAttendance(date, payload);
      setMessage({ text: 'Attendance record saved and stats updated successfully.', type: 'success' });
      
      const updatedStats = await fetchAttendanceStats(date);
      setStats(updatedStats);
      setOriginalRecords(JSON.parse(JSON.stringify(records)));
    } catch (err: any) {
      console.error('Error saving attendance records:', err);
      setMessage({ 
        text: err.response?.data?.message || 'Failed to save attendance records. Please try again.', 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  // Compute unique classes & sections dynamically from records
  const classes = useMemo(() => {
    const clsSet = new Set<string>();
    records.forEach(r => {
      if (r.className) clsSet.add(r.className);
    });
    return ['All', ...Array.from(clsSet)];
  }, [records]);

  const sections = useMemo(() => {
    const secSet = new Set<string>();
    records.forEach(r => {
      if (r.section) secSet.add(r.section);
    });
    return ['All', ...Array.from(secSet)];
  }, [records]);

  const branches = useMemo(() => {
    const brSet = new Set<string>();
    records.forEach(r => {
      if (r.branch) brSet.add(r.branch);
    });
    return ['All', ...Array.from(brSet)];
  }, [records]);

  // Filter students by search query, class filter, and section filter
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const q = searchQuery.toLowerCase();
      const matchSearch = searchQuery ? (
        (rec.firstName || '').toLowerCase().includes(q) ||
        (rec.lastName || '').toLowerCase().includes(q) ||
        (rec.email || '').toLowerCase().includes(q) ||
        (rec.rollNumber || '').toLowerCase().includes(q)
      ) : true;
      
      const matchClass = selectedClass === 'All' || rec.className === selectedClass;
      const matchSection = selectedSection === 'All' || rec.section === selectedSection;
      const matchBranch = selectedBranch === 'All' || rec.branch === selectedBranch;
      
      let matchStatus = true;
      if (selectedStatus === 'PRESENT') {
        matchStatus = rec.status === 'PRESENT';
      } else if (selectedStatus === 'ABSENT') {
        matchStatus = rec.status === 'ABSENT';
      } else if (selectedStatus === 'UNMARKED') {
        matchStatus = rec.status === null;
      }
      
      return matchSearch && matchClass && matchSection && matchBranch && matchStatus;
    });
  }, [records, searchQuery, selectedClass, selectedSection, selectedBranch, selectedStatus]);

  return (
    <div className="space-y-6">
      {/* Toast Alert Banner */}
      {message.text && (
        <div className={`p-4 rounded-xl shadow-sm border transition-all duration-300 flex items-start gap-3 animate-fade-in ${
          message.type === 'success' 
            ? 'bg-emerald-50/80 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50/80 border-rose-100 text-rose-800'
        }`}>
          {message.type === 'success' ? (
            <Check className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-semibold text-sm">{message.type === 'success' ? 'Success' : 'Error'}</p>
            <p className="text-xs opacity-90 mt-0.5">{message.text}</p>
          </div>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex flex-wrap items-center gap-2">
            <Calendar className="h-7 w-7 text-purple-600" />
            Attendance Tracking
            {markedByInfo && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-105 text-purple-700 border border-purple-200">
                Marked by: {markedByInfo}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            Select a date, mark student attendance states, and view dynamic stats.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-all self-start md:self-center">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Date:</span>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={getTodayDateString()}
            className="border-none bg-transparent text-sm font-bold text-gray-800 focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Statistics Analytics Dashboard Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Daily Stats Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-950 pointer-events-none group-hover:scale-110 transition-transform duration-300">
            <CheckCircle2 className="h-32 w-32" />
          </div>
          <div className="flex items-start justify-between">
            <div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
                Daily Summary
              </span>
              <h2 className="text-4xl font-extrabold text-gray-900 mt-3 tracking-tight">
                {liveStats.percentage.toFixed(1)}%
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-medium">Daily Attendance Rate</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600 font-bold">
              <span>Present Count: {liveStats.present} / {liveStats.total}</span>
              <span>{liveStats.marked} of {liveStats.total} Marked</span>
            </div>
            
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${liveStats.percentage}%` }}
              />
            </div>
            
            {hasChanges && (
              <span className="inline-block text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-semibold animate-pulse mt-1">
                * Unsaved changes (Stats calculated locally)
              </span>
            )}
          </div>
        </div>

        {/* Monthly Stats Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-purple-950 pointer-events-none group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="h-32 w-32" />
          </div>
          <div className="flex items-start justify-between">
            <div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-purple-50 text-purple-700 border border-purple-100">
                Monthly Summary
              </span>
              <h2 className="text-4xl font-extrabold text-gray-900 mt-3 tracking-tight">
                {stats ? `${stats.monthPercentage.toFixed(1)}%` : '0.0%'}
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-medium">Monthly Cumulative Rate</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600 font-bold">
              <span>Monthly Present: {stats ? stats.monthPresent : 0}</span>
              <span>Total Active Days: {stats ? stats.monthTotal : 0}</span>
            </div>
            
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${stats ? stats.monthPercentage : 0}%` }}
              />
            </div>
            
            <p className="text-[10px] text-gray-400 mt-1">
              Stats based on all saved records for the month of {new Date(date).toLocaleString('default', { month: 'long', year: 'numeric' })}.
            </p>
          </div>
        </div>

      </div>

      {/* Main Student Attendance List Table Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* Table Toolbar Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Left: Search bar & Filters */}
          <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search name, roll, or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white rounded-xl pl-10 pr-4 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-700 shadow-sm placeholder-gray-400 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Class:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer border-none p-0"
                >
                  {classes.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Section:</span>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer border-none p-0"
                >
                  {sections.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Branch:</span>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer border-none p-0"
                >
                  {branches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer border-none p-0"
                >
                  <option value="All">All Statuses</option>
                  <option value="PRESENT">Present Only</option>
                  <option value="ABSENT">Absent Only</option>
                  <option value="UNMARKED">Unmarked Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bulk Actions Button Controllers */}
          <div className="flex items-center flex-wrap gap-2">
            <Tooltip title="Mark all filtered students present" arrow>
              <Button 
                onClick={() => handleMarkAll('PRESENT')}
                size="small"
                variant="outlined"
                startIcon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                className="!text-gray-700 !border-gray-200 !rounded-lg !capitalize !px-3 hover:!bg-emerald-50 hover:!border-emerald-200"
              >
                Mark Filtered Present
              </Button>
            </Tooltip>
            
            <Tooltip title="Mark all filtered students absent" arrow>
              <Button 
                onClick={() => handleMarkAll('ABSENT')}
                size="small"
                variant="outlined"
                startIcon={<XCircle className="h-3.5 w-3.5 text-rose-600" />}
                className="!text-gray-700 !border-gray-200 !rounded-lg !capitalize !px-3 hover:!bg-rose-50 hover:!border-rose-200"
              >
                Mark Filtered Absent
              </Button>
            </Tooltip>

            {hasChanges && (
              <Button 
                onClick={handleReset}
                size="small"
                variant="text"
                className="!text-amber-600 hover:!bg-amber-50 !rounded-lg !capitalize !px-2.5 font-bold"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Attendance Content List / Table */}
        {loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <CircularProgress size={32} className="!text-purple-600 mb-3" />
            <p className="text-sm font-semibold text-gray-500">Loading student attendance roster...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-gray-900">No students registered</h3>
            <p className="text-xs text-gray-400 mt-1">Please register students first from the Students Management tab.</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-gray-500 border-t border-gray-100">
            <Search className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="font-semibold text-gray-700">No matching students found</p>
            <p className="text-xs text-gray-400 mt-1">Try refining your search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-450 uppercase tracking-wider bg-gray-50/30">
                  <th className="px-6 py-4">Roll No</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Class / Sec / Branch</th>
                  <th className="px-6 py-4 hidden md:table-cell">Email</th>
                  <th className="px-6 py-4 text-center">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRecords.map((record) => (
                  <tr 
                    key={record.studentId}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Roll Number */}
                    <td className="px-6 py-4 font-bold text-gray-900 text-sm">
                      {record.rollNumber}
                    </td>

                    {/* Student Identity Cell */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {record.firstName?.charAt(0)}{record.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-none mb-1">
                            {record.firstName} {record.lastName}
                          </p>
                          <p className="text-[11px] text-gray-400 font-medium md:hidden">{record.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Class & Section */}
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                      {record.className} - {record.section} - {record.branch || 'N/A'}
                    </td>

                    {/* Email Column (hidden on mobile) */}
                    <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                      {record.email}
                    </td>

                    {/* Pill Buttons Toggle Selector */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 max-w-[240px] mx-auto">
                        
                        {/* Present Button Toggle */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(record.studentId, 'PRESENT')}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border text-xs font-bold transition-all duration-200 hover:-translate-y-[1px] hover:shadow-sm ${
                            record.status === 'PRESENT'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm shadow-emerald-50 scale-102 font-extrabold'
                              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <CheckCircle2 className={`h-3.5 w-3.5 ${record.status === 'PRESENT' ? 'text-emerald-600' : 'text-gray-400'}`} />
                          Present
                        </button>

                        {/* Absent Button Toggle */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(record.studentId, 'ABSENT')}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border text-xs font-bold transition-all duration-200 hover:-translate-y-[1px] hover:shadow-sm ${
                            record.status === 'ABSENT'
                              ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm shadow-rose-50 scale-102 font-extrabold'
                              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <XCircle className={`h-3.5 w-3.5 ${record.status === 'ABSENT' ? 'text-rose-600' : 'text-gray-400'}`} />
                          Absent
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer save operations bar */}
        <div className="p-4 sm:p-5 border-t border-gray-100 flex items-center justify-end bg-gray-50/30">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving || records.length === 0}
            variant="contained"
            startIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            className={`!rounded-xl !capitalize !px-5 !py-2.5 !shadow-none ${
              !hasChanges 
                ? '!bg-gray-100 !text-gray-400' 
                : '!bg-purple-600 hover:!bg-purple-700 !text-white'
            }`}
          >
            {saving ? 'Saving Records...' : 'Save Attendance'}
          </Button>
        </div>

      </div>
    </div>
  );
}
