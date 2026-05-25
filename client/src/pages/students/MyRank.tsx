import { useEffect, useState } from 'react';
import { useStudentStore } from '../../features/students/studentStore';
import { Search, Trophy, Medal, Star, RefreshCw } from 'lucide-react';
import { CircularProgress } from '@mui/material';

export default function MyRank() {
  const { fetchRankings } = useStudentStore();
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    setLoading(true);
    try {
      const data = await fetchRankings();
      setRankings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selfRecord = rankings.find(r => r.isSelf);

  // Filter rankings by search term (only matching unmasked elements or rank)
  const filteredRankings = rankings.filter(item => {
    if (item.isSelf) {
      return `${item.firstName} ${item.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
             item.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
             item.rank.toString().includes(search);
    }
    // If not self, they are masked, so students can search by rank number
    return item.rank.toString().includes(search) || search === '';
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Trophy className="h-8 w-8 text-amber-500" />
            Class Leaderboard
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Compare your rank with peers. Other students' sensitive details are securely masked.
          </p>
        </div>

        <button
          onClick={loadRankings}
          disabled={loading}
          className="p-2.5 rounded-2xl bg-white border border-gray-100 shadow-sm text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
        >
          <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Top Profile Summary Widget */}
      {selfRecord && (
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-purple-600/10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-15">
            <Trophy className="h-40 w-40 text-white" />
          </div>
          
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-amber-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-200">Your Current Standings</span>
            </div>
            <h2 className="text-2xl font-extrabold">{selfRecord.firstName} {selfRecord.lastName}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-purple-100 font-medium">
              <span>Roll: <span className="font-mono text-white">{selfRecord.rollNumber}</span></span>
              <span>•</span>
              <span>Class: <span className="text-white">{selfRecord.className}</span></span>
              <span>•</span>
              <span>Section: <span className="text-white">{selfRecord.section}</span></span>
            </div>
          </div>

          <div className="flex gap-4 text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/15">
              <span className="block text-2xl font-black text-white">#{selfRecord.rank}</span>
              <span className="text-[10px] uppercase font-bold text-purple-200">Rank</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/15">
              <span className="block text-2xl font-black text-white">
                {selfRecord.totalMarks !== null ? selfRecord.totalMarks.toFixed(1) : 'N/A'}
              </span>
              <span className="text-[10px] uppercase font-bold text-purple-200">Total Marks</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/15">
              <span className="block text-2xl font-black text-white">
                {selfRecord.percentage !== null ? `${selfRecord.percentage.toFixed(1)}%` : 'N/A'}
              </span>
              <span className="text-[10px] uppercase font-bold text-purple-200">Percentage</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by rank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50/50 rounded-2xl pl-11 pr-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm text-gray-700 shadow-inner"
          />
        </div>
      </div>

      {/* Masked Leaderboard Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading && filteredRankings.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <CircularProgress size={30} className="!text-purple-600" />
              <p className="mt-3 text-sm text-gray-500">Loading standings...</p>
            </div>
          ) : filteredRankings.length === 0 ? (
            <div className="py-20 text-center text-gray-500">
              <div className="flex flex-col items-center">
                <Trophy className="h-12 w-12 text-gray-300 mb-2" />
                <p className="font-semibold text-gray-700">No standings available</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll Number</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total Marks</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredRankings.map((item) => {
                  const isSelf = item.isSelf;
                  const isTop3 = item.rank <= 3;
                  const podiumClasses = [
                    'bg-amber-50 border-amber-200 text-amber-800',
                    'bg-slate-50 border-slate-200 text-slate-800',
                    'bg-orange-50 border-orange-200 text-orange-800'
                  ];
                  const podiumStars = ['text-amber-500', 'text-slate-400', 'text-orange-500'];

                  return (
                    <tr 
                      key={item.studentId} 
                      className={`transition-colors duration-150 ${
                        isSelf 
                          ? 'bg-purple-50/40 hover:bg-purple-50 font-semibold border-l-4 border-l-purple-600' 
                          : 'hover:bg-gray-50/40'
                      }`}
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
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">
                        {isSelf ? item.rollNumber : '*****'}
                      </td>
                      <td className="px-6 py-4">
                        {isSelf ? (
                          <span className="text-gray-900 flex items-center gap-2">
                            {item.firstName} {item.lastName}
                            <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">You</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">*****</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {isSelf ? item.className : '*****'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {isSelf ? item.section : '*****'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-indigo-600">
                        {isSelf && item.totalMarks !== null ? item.totalMarks.toFixed(1) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-purple-600">
                        {isSelf && item.percentage !== null ? `${item.percentage.toFixed(1)}%` : '—'}
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
