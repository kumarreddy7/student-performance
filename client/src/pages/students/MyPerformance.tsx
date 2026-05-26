import { useEffect, useState } from 'react';
import { useStudentStore } from '../../features/students/studentStore';
import { Award, Calendar, BookOpen, GraduationCap, RefreshCw, BarChart3 } from 'lucide-react';
import { CircularProgress } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

export default function MyPerformance() {
  const { fetchMyPerformance } = useStudentStore();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPerformance();
  }, []);

  const loadPerformance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMyPerformance();
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch personal performance data.');
    } finally {
      setLoading(false);
    }
  };

  const getGrade = (marks: number) => {
    if (marks >= 90) return { label: 'A+', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
    if (marks >= 80) return { label: 'A', color: 'text-teal-600 bg-teal-50 border-teal-100' };
    if (marks >= 70) return { label: 'B', color: 'text-blue-600 bg-blue-50 border-blue-100' };
    if (marks >= 60) return { label: 'C', color: 'text-amber-600 bg-amber-50 border-amber-100' };
    if (marks >= 50) return { label: 'D', color: 'text-orange-600 bg-orange-50 border-orange-100' };
    return { label: 'F', color: 'text-rose-600 bg-rose-50 border-rose-100' };
  };

  const COLORS = ['#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81', '#1e1b4b'];

  if (loading && !data) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <CircularProgress size={32} className="!text-purple-600" />
        <p className="mt-3 text-sm text-gray-500 font-medium">Aggregating your academic profiles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl text-center space-y-4 max-w-md mx-auto mt-12 shadow-sm">
        <p className="text-sm font-semibold text-rose-700">{error}</p>
        <button
          onClick={loadPerformance}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-purple-600" />
            My Performance Report
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Real-time track of your academic marks, class ranks, and attendance percentages.
          </p>
        </div>

        <button
          onClick={loadPerformance}
          disabled={loading}
          className="p-2.5 rounded-2xl bg-white border border-gray-100 shadow-sm text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
        >
          <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Rank */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Class Rank</span>
            <h2 className="text-3xl font-black text-gray-900">
              {data.rank ? `#${data.rank}` : 'Unranked'}
            </h2>
            <p className="text-xs text-gray-400">Based on subject totals</p>
          </div>
          <div className="bg-amber-100 text-amber-600 p-3.5 rounded-2xl">
            <Award className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Percentage */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Average Score</span>
            <h2 className="text-3xl font-black text-gray-900">
              {data.percentage ? `${data.percentage.toFixed(1)}%` : '0.0%'}
            </h2>
            <p className="text-xs text-gray-400">Subject percentage</p>
          </div>
          <div className="bg-purple-100 text-purple-600 p-3.5 rounded-2xl">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Attendance Rate */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Attendance Rate</span>
            <h2 className={`text-3xl font-black ${data.attendanceRate < 75.0 ? 'text-rose-600' : 'text-gray-900'}`}>
              {data.attendanceRate ? `${data.attendanceRate.toFixed(1)}%` : '100%'}
            </h2>
            <p className="text-xs text-gray-400">Target is above 75%</p>
          </div>
          <div className={`p-3.5 rounded-2xl ${data.attendanceRate < 75.0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
            <Calendar className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Total Marks */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Marks</span>
            <h2 className="text-3xl font-black text-gray-900">
              {data.totalMarks ? data.totalMarks.toFixed(1) : '0.0'}
            </h2>
            <p className="text-xs text-gray-400">Sum of subject scores</p>
          </div>
          <div className="bg-indigo-100 text-indigo-600 p-3.5 rounded-2xl">
            <GraduationCap className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Grid: Charts & Marks Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            <h2 className="font-bold text-gray-900 text-lg">Subject Performance Breakdown</h2>
          </div>

          <div className="h-72 w-full">
            {data.marks?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                No marks uploaded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.marks} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
                    {data.marks.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Attendance Summary Widget */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900 text-lg">Attendance Ratios</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Total Tracked Days</span>
                <span className="text-gray-900 font-bold">{data.totalAttendanceDays} days</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-purple-600 h-full rounded-full" 
                  style={{ width: `${data.attendanceRate}%` }} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-center">
                <span className="block text-2xl font-black text-emerald-600">{data.presentDays}</span>
                <span className="text-[10px] uppercase font-bold text-emerald-700">Days Present</span>
              </div>
              <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 text-center">
                <span className="block text-2xl font-black text-rose-600">{data.absentDays}</span>
                <span className="text-[10px] uppercase font-bold text-rose-700">Days Absent</span>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border text-xs leading-relaxed mt-6 ${
            data.attendanceRate < 75.0 
              ? 'bg-rose-50 border-rose-100 text-rose-800'
              : 'bg-emerald-50 border-emerald-100 text-emerald-800'
          }`}>
            {data.attendanceRate < 75.0 
              ? "Warning: Your attendance rate is below 75%. Please attend classes regularly to maintain a healthy academic standing."
              : "Excellent: Your attendance rate is above 75%. Keep attending classes regularly!"
            }
          </div>
        </div>
      </div>

      {/* Subject Marks Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50">
          <h2 className="font-bold text-gray-900 text-lg">Grade Book Sheet</h2>
          <p className="text-xs text-gray-500">Subject-wise marks list and academic letter grades</p>
        </div>

        <div className="overflow-x-auto">
          {data.marks?.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              No grades recorded yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Marks / 100</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Letter Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {data.marks.map((m: any, idx: number) => {
                  const grade = getGrade(m.marks);
                  return (
                    <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{m.subject}</td>
                      <td className="px-6 py-4 text-right font-semibold text-indigo-600">{m.marks.toFixed(1)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex justify-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${grade.color}`}>
                          {grade.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
