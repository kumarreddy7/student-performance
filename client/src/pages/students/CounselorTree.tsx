import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../../features/auth/authStore';
import { useStudentStore } from '../../features/students/studentStore';
import api from '../../lib/axios';
import { normalizeRole } from '../../lib/roles';
import { 
  Network, Users, User, Mail, ChevronRight, ChevronDown, Search, 
  BookOpen, HelpCircle, ArrowRight, Sparkles
} from 'lucide-react';
import { CircularProgress, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface StudentData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  rollNumber: string;
  className: string;
  section: string;
  branch: string;
  counselorUsername?: string;
  status: string;
}

interface CounselorData {
  id: number;
  username: string;
  email: string;
}

export default function CounselorTree() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { fetchMyPerformance } = useStudentStore();
  const role = normalizeRole(user?.role);

  const [loading, setLoading] = useState(true);
  const [counselors, setCounselors] = useState<CounselorData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [studentSelfProfile, setStudentSelfProfile] = useState<any>(null);
  const [studentPeers, setStudentPeers] = useState<StudentData[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCounselors, setExpandedCounselors] = useState<Record<string, boolean>>({});
  const [expandedBatches, setExpandedBatches] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      if (role === 'admin' || role === 'teacher') {
        // Admins/Teachers: Fetch all counselors and all students
        const [counsRes, studRes] = await Promise.all([
          api.get('/auth/counselors'),
          api.get('/students')
        ]);
        
        // Deduplicate counselors
        const uniqueCounselors = (counsRes.data || []).filter(
          (c: any, idx: number, self: any[]) =>
            self.findIndex((t: any) => t.username === c.username) === idx
        );
        
        setCounselors(uniqueCounselors);
        setStudents((studRes.data || []).filter((s: any) => s.status !== 'Deleted'));
      } else if (role === 'counselor') {
        // Counselors: Fetch only their students
        const res = await api.get('/students');
        setStudents((res.data || []).filter((s: any) => s.status !== 'Deleted'));
      } else if (role === 'student') {
        // Students: Fetch self profile and peers
        const [perfRes, peersRes] = await Promise.all([
          fetchMyPerformance(),
          api.get('/students/my-batch-peers')
        ]);
        
        setStudentSelfProfile(perfRes?.studentDTO || null);
        setStudentPeers((peersRes.data || []).filter((s: any) => s.status !== 'Deleted'));
      }
    } catch (err) {
      console.error("Failed to load Counselor Tree Data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  // Toggle nodes
  const toggleCounselorNode = (username: string) => {
    setExpandedCounselors(prev => ({ ...prev, [username]: !prev[username] }));
  };

  const toggleBatchNode = (key: string) => {
    setExpandedBatches(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Dynamic search auto-expansion
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const q = searchQuery.toLowerCase();
      
      if (role === 'admin' || role === 'teacher') {
        const matchingCounselors: Record<string, boolean> = {};
        const matchingBatches: Record<string, boolean> = {};
        
        students.forEach(s => {
          const match = 
            s.firstName.toLowerCase().includes(q) ||
            s.lastName.toLowerCase().includes(q) ||
            s.rollNumber.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q);
            
          if (match) {
            if (s.counselorUsername) {
              matchingCounselors[s.counselorUsername] = true;
              const batchKey = `${s.className} - ${s.branch} - Sec ${s.section}`;
              matchingBatches[`${s.counselorUsername}-${batchKey}`] = true;
            } else {
              matchingCounselors['unassigned'] = true;
            }
          }
        });
        
        setExpandedCounselors(matchingCounselors);
        setExpandedBatches(matchingBatches);
      } else if (role === 'counselor') {
        const matchingBatches: Record<string, boolean> = {};
        students.forEach(s => {
          const match = 
            s.firstName.toLowerCase().includes(q) ||
            s.lastName.toLowerCase().includes(q) ||
            s.rollNumber.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q);
            
          if (match) {
            const batchKey = `${s.className} - ${s.branch} - Sec ${s.section}`;
            matchingBatches[batchKey] = true;
          }
        });
        setExpandedBatches(matchingBatches);
      }
    }
  }, [searchQuery, students, role]);

  // Groupings for Admin Tree Graph
  const adminTreeData = useMemo(() => {
    if (role !== 'admin' && role !== 'teacher') return [];

    const q = searchQuery.toLowerCase();
    const filteredStudents = students.filter(s => {
      if (!searchQuery) return true;
      return (
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    });

    return counselors.map(c => {
      const assigned = filteredStudents.filter(s => s.counselorUsername && s.counselorUsername.toLowerCase() === c.username.toLowerCase());
      
      const batchesMap: Record<string, StudentData[]> = {};
      assigned.forEach(s => {
        const batchKey = `${s.className || 'Unknown Class'} - ${s.branch || 'General'} - Sec ${s.section || 'A'}`;
        if (!batchesMap[batchKey]) batchesMap[batchKey] = [];
        batchesMap[batchKey].push(s);
      });

      const batches = Object.keys(batchesMap).map(batchKey => ({
        batchKey,
        students: batchesMap[batchKey]
      }));

      return {
        counselor: c,
        batches,
        totalStudents: assigned.length
      };
    });
  }, [counselors, students, searchQuery, role]);

  const unassignedStudents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return students.filter(s => 
      !s.counselorUsername && 
      (searchQuery ? (
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q)
      ) : true)
    );
  }, [students, searchQuery]);

  // Groupings for Counselor Tree Graph
  const counselorTreeData = useMemo(() => {
    if (role !== 'counselor') return [];

    const q = searchQuery.toLowerCase();
    const filteredStudents = students.filter(s => {
      if (!searchQuery) return true;
      return (
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q)
      );
    });

    const batchesMap: Record<string, StudentData[]> = {};
    filteredStudents.forEach(s => {
      const batchKey = `${s.className || 'Unknown Class'} - ${s.branch || 'General'} - Sec ${s.section || 'A'}`;
      if (!batchesMap[batchKey]) batchesMap[batchKey] = [];
      batchesMap[batchKey].push(s);
    });

    return Object.keys(batchesMap).map(batchKey => ({
      batchKey,
      students: batchesMap[batchKey]
    }));
  }, [students, searchQuery, role]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <CircularProgress size={32} className="!text-purple-600 mb-3" />
        <p className="text-sm text-gray-500 font-semibold">Compiling Counseling Roster Hierarchy...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          <Network className="h-8 w-8 text-purple-600" />
          Counselor Tree Map
        </h1>
        <p className="mt-2 text-sm text-gray-500 font-medium">
          Visualize counselor allocations and student batch hierarchies in an interactive network view.
        </p>
      </div>

      {/* Search Bar (Admins & Counselors only) */}
      {role !== 'student' && (
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search students in tree map..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white rounded-2xl pl-11 pr-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-semibold text-gray-700 shadow-sm transition-all"
          />
        </div>
      )}

      {/* Tree Visualization Card Container */}
      <div className="bg-gray-50/30 border border-gray-150 p-6 sm:p-10 rounded-[2.5rem] shadow-inner relative overflow-hidden">
        
        {/* --- 1. ROOT CENTRAL NODE --- */}
        <div className="flex flex-col items-center mb-12 relative">
          <div className="bg-purple-900 text-white border border-purple-800 shadow-lg px-8 py-4 rounded-[2rem] text-center max-w-md relative z-10 hover:scale-102 transition-transform duration-200">
            <div className="bg-purple-800 p-2.5 rounded-2xl text-purple-300 w-fit mx-auto mb-2">
              <Network className="h-6 w-6" />
            </div>
            <h4 className="font-extrabold text-xs tracking-widest uppercase">
              {role === 'admin' || role === 'teacher' ? 'Academic Institution Roster' :
               role === 'counselor' ? `Counseling Desk — ${user?.username}` :
               'Assigned Counseling Path'}
            </h4>
            <p className="text-[9px] text-purple-200 mt-1 uppercase tracking-widest font-black flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3" /> Central Allocation Tree <Sparkles className="h-3 w-3" />
            </p>
          </div>
          {/* Main descending connector line */}
          <div className="h-12 w-0.5 bg-purple-200 absolute -bottom-12"></div>
        </div>

        <div className="space-y-6 max-w-3xl mx-auto relative pl-8 border-l-2 border-purple-200/60">

          {/* ======================================================== */}
          {/* RENDER VIEW 1: ADMIN & TEACHER (FULL ALLOCATION MAP)   */}
          {/* ======================================================== */}
          {(role === 'admin' || role === 'teacher') && (
            <>
              {/* Unassigned Students Node */}
              {unassignedStudents.length > 0 && (
                <div className="relative">
                  <div className="absolute -left-[39px] top-6 h-4 w-4 rounded-full border-4 border-white bg-purple-400 shadow z-10 animate-pulse"></div>
                  <div className="bg-white shadow-sm rounded-3xl p-5 border border-dashed border-purple-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2.5 rounded-xl text-purple-650">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">Unassigned Students</h4>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Allocations Required</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-purple-55 text-purple-700 px-3 py-1 rounded-full text-xs font-black shadow-sm">
                          {unassignedStudents.length} Remaining
                        </span>
                        <Button
                          variant="outlined"
                          onClick={() => toggleCounselorNode('unassigned')}
                          className="!rounded-xl !capitalize !text-xs !font-bold !px-3 !py-1.5 !border-gray-200 !text-gray-700 hover:!bg-gray-50"
                        >
                          {expandedCounselors['unassigned'] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {expandedCounselors['unassigned'] && (
                      <div className="mt-5 pt-4 border-t border-dashed border-gray-100 pl-6 border-l-2 border-purple-100 space-y-2">
                        {unassignedStudents.map((student) => (
                          <div
                            key={student.id}
                            onClick={() => navigate(`/students/${student.id}`)}
                            className="relative flex items-center justify-between p-3.5 bg-gray-50/60 hover:bg-purple-50/30 border border-gray-100 hover:border-purple-100 rounded-2xl cursor-pointer transition-all group"
                          >
                            <div className="absolute -left-[31px] top-5.5 h-2 w-2 rounded-full border border-white bg-purple-400 z-10"></div>
                            <div>
                              <p className="font-bold text-xs text-gray-900 group-hover:text-purple-655 transition-colors">
                                {student.firstName} {student.lastName}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5 font-bold">Roll: {student.rollNumber} • {student.className} - {student.branch}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-purple-600 transition-all group-hover:translate-x-0.5" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Counselors Nodes */}
              {adminTreeData.map(({ counselor, batches, totalStudents }) => {
                const isExpanded = expandedCounselors[counselor.username];
                return (
                  <div key={counselor.id} className="relative">
                    <div className="absolute -left-[39px] top-6 h-4 w-4 rounded-full border-4 border-white bg-indigo-500 shadow z-10"></div>
                    <div className="bg-white shadow-sm rounded-3xl p-5 border border-gray-150 hover:shadow-md transition-shadow">
                      
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm capitalize">{counselor.username}</h4>
                            <p className="text-[10px] text-gray-400 font-semibold flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3" /> {counselor.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-black border border-indigo-100/50 shadow-sm">
                            {totalStudents} Students ({batches.length} {batches.length === 1 ? 'Batch' : 'Batches'})
                          </span>
                          <Button
                            variant="outlined"
                            onClick={() => toggleCounselorNode(counselor.username)}
                            className="!rounded-xl !capitalize !text-xs !font-bold !px-3 !py-1.5 !border-gray-200 !text-gray-700 hover:!bg-gray-50"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* Level 2 Nodes (Batches) */}
                      {isExpanded && (
                        <div className="mt-5 pt-4 border-t border-dashed border-gray-100 pl-6 border-l-2 border-indigo-100 space-y-4">
                          {batches.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">No assigned batches or student records found.</p>
                          ) : (
                            batches.map(({ batchKey, students }) => {
                              const batchExpanded = expandedBatches[`${counselor.username}-${batchKey}`];
                              return (
                                <div key={batchKey} className="relative">
                                  <div className="absolute -left-[31px] top-4.5 h-3 w-3 rounded-full border-2 border-white bg-indigo-500 z-10"></div>
                                  
                                  <div className="flex items-center justify-between bg-indigo-50/10 border border-indigo-100/50 px-4 py-2.5 rounded-2xl">
                                    <div className="min-w-0">
                                      <span className="block text-xs font-black text-indigo-950 truncate">{batchKey}</span>
                                      <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{students.length} Students</span>
                                    </div>
                                    <Button
                                      variant="text"
                                      onClick={() => toggleBatchNode(`${counselor.username}-${batchKey}`)}
                                      className="!text-[10px] !font-black !text-indigo-650 hover:!bg-indigo-50/50 !capitalize !py-1 !px-2.5 !rounded-lg"
                                    >
                                      {batchExpanded ? 'Hide' : 'Expand'}
                                    </Button>
                                  </div>

                                  {/* Level 3 Nodes (Students) */}
                                  {batchExpanded && (
                                    <div className="mt-3 pl-6 border-l-2 border-dashed border-indigo-100 space-y-2">
                                      {students.map(s => (
                                        <div
                                          key={s.id}
                                          onClick={() => navigate(`/students/${s.id}`)}
                                          className="relative flex items-center justify-between p-3 bg-gray-50/60 hover:bg-purple-50/30 border border-gray-100 hover:border-purple-100 rounded-2xl cursor-pointer transition-all group"
                                        >
                                          <div className="absolute -left-[31px] top-5 h-2 w-2 rounded-full border border-white bg-purple-500 z-10"></div>
                                          <div>
                                            <p className="font-bold text-xs text-gray-900 group-hover:text-purple-650 transition-colors">
                                              {s.firstName} {s.lastName}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-bold mt-0.5">Roll: {s.rollNumber}</p>
                                          </div>
                                          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-purple-600 transition-all group-hover:translate-x-0.5" />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ======================================================== */}
          {/* RENDER VIEW 2: COUNSELOR (OWN BATCH HIERARCHIES)        */}
          {/* ======================================================== */}
          {role === 'counselor' && (
            <>
              {counselorTreeData.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl border border-gray-150 text-center text-gray-500">
                  <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="font-bold text-gray-800 text-sm">No student allocations found</p>
                  <p className="text-xs text-gray-450 mt-1">You are not currently assigned as counselor to any active student records.</p>
                </div>
              ) : (
                counselorTreeData.map(({ batchKey, students }) => {
                  const batchExpanded = expandedBatches[batchKey];
                  return (
                    <div key={batchKey} className="relative">
                      <div className="absolute -left-[39px] top-6 h-4 w-4 rounded-full border-4 border-white bg-indigo-500 shadow z-10"></div>
                      <div className="bg-white shadow-sm rounded-3xl p-5 border border-gray-150 hover:shadow-md transition-shadow">
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
                              <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm capitalize">{batchKey}</h4>
                              <p className="text-[10px] text-gray-400 font-semibold mt-0.5 uppercase tracking-wider">{students.length} Allocated Students</p>
                            </div>
                          </div>
                          <Button
                            variant="outlined"
                            onClick={() => toggleBatchNode(batchKey)}
                            className="!rounded-xl !capitalize !text-xs !font-bold !px-3 !py-1.5 !border-gray-200 !text-gray-700 hover:!bg-gray-50"
                          >
                            {batchExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </div>

                        {/* Level 2 Nodes (Students) */}
                        {batchExpanded && (
                          <div className="mt-5 pt-4 border-t border-dashed border-gray-100 pl-6 border-l-2 border-indigo-100 space-y-2">
                            {students.map(s => (
                              <div
                                key={s.id}
                                onClick={() => navigate(`/students/${s.id}`)}
                                className="relative flex items-center justify-between p-3.5 bg-gray-50/60 hover:bg-purple-50/30 border border-gray-100 hover:border-purple-100 rounded-2xl cursor-pointer transition-all group"
                              >
                                <div className="absolute -left-[31px] top-5.5 h-2 w-2 rounded-full border border-white bg-purple-500 z-10"></div>
                                <div>
                                  <p className="font-bold text-xs text-gray-900 group-hover:text-purple-650 transition-colors">
                                    {s.firstName} {s.lastName}
                                  </p>
                                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">Roll: {s.rollNumber} • {s.email}</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-purple-600 transition-all group-hover:translate-x-0.5" />
                              </div>
                            ))}
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* ======================================================== */}
          {/* RENDER VIEW 3: STUDENT (PERSONAL COUNSELING PATH)       */}
          {/* ======================================================== */}
          {role === 'student' && (
            <>
              {!studentSelfProfile?.counselorUsername ? (
                <div className="bg-white p-8 rounded-3xl border border-gray-150 text-center text-gray-500">
                  <HelpCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="font-bold text-gray-800 text-sm">No Counselor Allocated</p>
                  <p className="text-xs text-gray-450 mt-1">Please contact your academic office to get allocated to an advisor counselor desk.</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Counselor Node */}
                  <div className="absolute -left-[39px] top-6 h-4 w-4 rounded-full border-4 border-white bg-indigo-500 shadow z-10"></div>
                  <div className="bg-white shadow-sm rounded-3xl p-5 border border-gray-150 space-y-5">
                    
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                          counselor Desk: <span className="capitalize text-purple-600">{studentSelfProfile.counselorUsername}</span>
                        </h4>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Primary Student Advisor</p>
                      </div>
                    </div>

                    {/* Batch Link Node */}
                    <div className="pl-6 border-l-2 border-indigo-100 space-y-4">
                      <div className="relative">
                        <div className="absolute -left-[31px] top-4.5 h-3 w-3 rounded-full border-2 border-white bg-indigo-500 z-10"></div>
                        <div className="bg-indigo-50/15 border border-indigo-100/50 p-4 rounded-2xl">
                          <span className="block text-xs font-extrabold text-indigo-950">
                            Batch: {studentSelfProfile.className} - {studentSelfProfile.branch} - Sec {studentSelfProfile.section}
                          </span>
                          <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                            {studentPeers.length + 1} Total Batch Roster Members
                          </span>
                        </div>

                        {/* Student Node */}
                        <div className="mt-4 pl-6 border-l-2 border-dashed border-indigo-100">
                          <div className="relative flex items-center justify-between p-4 bg-purple-50/10 hover:bg-purple-50/30 border border-purple-100 hover:border-purple-200 rounded-2xl group transition-all">
                            <div className="absolute -left-[31px] top-5.5 h-2 w-2 rounded-full border border-white bg-purple-600 z-10 animate-pulse"></div>
                            <div>
                              <p className="font-extrabold text-xs text-purple-750">
                                {studentSelfProfile.firstName} {studentSelfProfile.lastName} (Me)
                              </p>
                              <p className="text-[10px] text-gray-400 font-bold mt-0.5">Roll: {studentSelfProfile.rollNumber} • {studentSelfProfile.email}</p>
                            </div>
                            <span className="bg-purple-100 text-purple-750 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md">
                              Active Student
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
