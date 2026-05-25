import { useEffect, useState } from 'react';
import { useStudentStore } from '../../features/students/studentStore';
import { Search, Trophy, FileDown, ArrowUpDown, RefreshCw, Star } from 'lucide-react';
import { CircularProgress } from '@mui/material';
import { useAuthStore } from '../../features/auth/authStore';
import { normalizeRole } from '../../lib/roles';
import { getTeacherClassAssignment } from '../../lib/roleSecurity';
import api from '../../lib/axios';

type SortKey = 'rank' | 'name' | 'totalMarks' | 'percentage';
type SortOrder = 'asc' | 'desc';

export default function Rankings() {
  const { fetchRankings } = useStudentStore();
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    setLoading(true);
    try {
      const user = useAuthStore.getState().user;
      const role = normalizeRole(user?.role);
      const data = await fetchRankings();
      
      let filtered = data || [];
      if (role === 'teacher') {
        const tc = getTeacherClassAssignment(user?.username);
        filtered = (data || []).filter((r: any) => 
          r.className && r.className.toLowerCase() === tc.className.toLowerCase() &&
          r.branch && r.branch.toLowerCase() === tc.branch.toLowerCase() &&
          r.section && r.section.toLowerCase() === tc.section.toLowerCase()
        );
      } else if (role === 'counselor') {
        const studRes = await api.get('/students');
        const myStudents = (studRes.data || []).filter((s: any) => 
          s.counselorUsername && s.counselorUsername.toLowerCase() === user?.username.toLowerCase() && s.status !== 'Deleted'
        );
        const myStudentRolls = new Set(myStudents.map((s: any) => s.rollNumber.toLowerCase()));
        filtered = (data || []).filter((r: any) => r.rollNumber && myStudentRolls.has(r.rollNumber.toLowerCase()));
      }
      
      setRankings(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Get unique classes and sections for filters
  const classesList = ['All', ...Array.from(new Set(rankings.map(r => r.className).filter(Boolean)))];
  const sectionsList = ['All', ...Array.from(new Set(rankings.map(r => r.section).filter(Boolean)))];

  // Filtering
  const filteredRankings = rankings.filter(item => {
    const matchesSearch = 
      `${item.firstName} ${item.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      (item.rollNumber || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesClass = selectedClass === 'All' || item.className === selectedClass;
    const matchesSection = selectedSection === 'All' || item.section === selectedSection;

    return matchesSearch && matchesClass && matchesSection;
  });

  // Sorting
  const sortedRankings = [...filteredRankings].sort((a, b) => {
    let aVal: any = a[sortKey];
    let bVal: any = b[sortKey];

    if (sortKey === 'name') {
      aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
      bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
    }

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const exportToCsv = () => {
    if (sortedRankings.length === 0) return;
    
    const headers = ['Rank', 'Roll Number', 'Student Name', 'Class', 'Section', 'Total Marks', 'Percentage'];
    const rows = sortedRankings.map(item => [
      item.rank,
      item.rollNumber,
      `${item.firstName} ${item.lastName}`,
      item.className,
      item.section,
      item.totalMarks !== null ? item.totalMarks.toFixed(1) : 'N/A',
      item.percentage !== null ? `${item.percentage.toFixed(1)}%` : 'N/A'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Leaderboard_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Trophy className="h-8 w-8 text-amber-500 animate-pulse" />
            Student Rankings
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Pre-computed academic leaderboard sorting students based on total marks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadRankings}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-white border border-gray-100 shadow-sm text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={exportToCsv}
            disabled={sortedRankings.length === 0}
            className="flex items-center gap-2 py-2.5 px-4 rounded-2xl bg-white border border-gray-100 shadow-sm text-sm font-semibold text-gray-700 hover:text-purple-600 hover:bg-purple-50/50 disabled:opacity-50 transition-colors"
          >
            <FileDown className="h-4.5 w-4.5" />
            Export Leaderboard
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search roll number or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50/50 rounded-2xl pl-11 pr-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm text-gray-700 shadow-inner"
          />
        </div>

        <div className="flex flex-wrap gap-4 items-center w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 font-medium">Class:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-gray-50/50 border border-gray-200 text-gray-700 text-sm rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
            >
              {classesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 font-medium">Section:</span>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-gray-50/50 border border-gray-200 text-gray-700 text-sm rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
            >
              {sectionsList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading && sortedRankings.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <CircularProgress size={30} className="!text-purple-600" />
              <p className="mt-3 text-sm text-gray-500">Recalculating rank standings...</p>
            </div>
          ) : sortedRankings.length === 0 ? (
            <div className="py-20 text-center text-gray-500">
              <div className="flex flex-col items-center">
                <Trophy className="h-12 w-12 text-gray-300 mb-2" />
                <p className="font-semibold text-gray-700">No student records found</p>
                <p className="text-xs text-gray-400 mt-1">Please import Student & Marks CSVs to view standings.</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('rank')}>
                    <div className="flex items-center gap-1">
                      Rank <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll Number</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      Student Name <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer text-right" onClick={() => handleSort('totalMarks')}>
                    <div className="flex items-center gap-1 justify-end">
                      Total Marks <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer text-right" onClick={() => handleSort('percentage')}>
                    <div className="flex items-center gap-1 justify-end">
                      Percentage <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {sortedRankings.map((item) => {
                  const isTop3 = item.rank <= 3;
                  const podiumClasses = [
                    'bg-amber-50 border-amber-200 text-amber-800 shadow-sm shadow-amber-500/10', // 1st
                    'bg-slate-50 border-slate-200 text-slate-800 shadow-sm shadow-slate-500/10',  // 2nd
                    'bg-orange-50 border-orange-200 text-orange-800 shadow-sm shadow-orange-500/10' // 3rd
                  ];
                  const podiumStars = ['text-amber-500', 'text-slate-400', 'text-orange-500'];

                  return (
                    <tr 
                      key={item.studentId} 
                      className={`hover:bg-purple-50/5 transition-colors duration-150 ${isTop3 ? 'font-semibold' : ''}`}
                    >
                      <td className="px-6 py-4">
                        {isTop3 ? (
                          <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs border ${podiumClasses[item.rank - 1]}`}>
                            <Star className={`h-3 w-3 fill-current ${podiumStars[item.rank - 1]}`} />
                            Rank {item.rank}
                          </div>
                        ) : (
                          <span className="text-gray-500 ml-3 font-medium">{item.rank}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">{item.rollNumber}</td>
                      <td className="px-6 py-4 text-gray-900">{item.firstName} {item.lastName}</td>
                      <td className="px-6 py-4 text-gray-600">{item.className}</td>
                      <td className="px-6 py-4 text-gray-600">{item.section}</td>
                      <td className="px-6 py-4 text-right font-semibold text-indigo-600">
                        {item.totalMarks !== null ? item.totalMarks.toFixed(1) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-purple-600">
                        {item.percentage !== null ? `${item.percentage.toFixed(1)}%` : 'N/A'}
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
