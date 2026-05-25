import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../../features/auth/authStore';
import { useStudentStore } from '../../features/students/studentStore';
import api from '../../lib/axios';
import { normalizeRole } from '../../lib/roles';
import { 
  Network, Users, User, Mail, ChevronRight, ChevronDown, Search, 
  BookOpen, HelpCircle, Sparkles, ExternalLink, Grid,
  ZoomIn, ZoomOut, Layers, Info
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

  // Figma Workspace States
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      if (role === 'admin' || role === 'teacher') {
        const [counsRes, studRes] = await Promise.all([
          api.get('/auth/counselors'),
          api.get('/students')
        ]);
        
        const uniqueCounselors = (counsRes.data || []).filter(
          (c: any, idx: number, self: any[]) =>
            self.findIndex((t: any) => t.username === c.username) === idx
        );
        
        setCounselors(uniqueCounselors);
        setStudents((studRes.data || []).filter((s: any) => s.status !== 'Deleted'));
      } else if (role === 'counselor') {
        const res = await api.get('/students');
        setStudents((res.data || []).filter((s: any) => s.status !== 'Deleted'));
      } else if (role === 'student') {
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

  // Zoom handlers
  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.1, 1.3));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.1, 0.7));
  const handleZoomReset = () => setZoomScale(1.0);

  // Dynamic search auto-expansion & node highlighting
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const q = searchQuery.toLowerCase();
      
      if (role === 'admin' || role === 'teacher') {
        const matchingCounselors: Record<string, boolean> = {};
        const matchingBatches: Record<string, boolean> = {};
        let firstMatchId: string | null = null;
        
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
              if (!firstMatchId) firstMatchId = `student-${s.id}`;
            } else {
              matchingCounselors['unassigned'] = true;
              if (!firstMatchId) firstMatchId = `student-${s.id}`;
            }
          }
        });
        
        setExpandedCounselors(matchingCounselors);
        setExpandedBatches(matchingBatches);
        if (firstMatchId) setFocusedNodeId(firstMatchId);
      } else if (role === 'counselor') {
        const matchingBatches: Record<string, boolean> = {};
        let firstMatchId: string | null = null;

        students.forEach(s => {
          const match = 
            s.firstName.toLowerCase().includes(q) ||
            s.lastName.toLowerCase().includes(q) ||
            s.rollNumber.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q);
            
          if (match) {
            const batchKey = `${s.className} - ${s.branch} - Sec ${s.section}`;
            matchingBatches[batchKey] = true;
            if (!firstMatchId) firstMatchId = `student-${s.id}`;
          }
        });
        setExpandedBatches(matchingBatches);
        if (firstMatchId) setFocusedNodeId(firstMatchId);
      }
    } else {
      setFocusedNodeId(null);
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
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-4">
      <style>{`
        @keyframes figmaDash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .marching-ants-line {
          stroke-dasharray: 6, 4;
          animation: figmaDash 1.2s linear infinite;
        }
      `}</style>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Network className="h-8 w-8 text-purple-600" />
            Counselor Flow Workspace
          </h1>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            Visualize counselor allocations, batch networks, and student mappings inside a Figma-style workspace.
          </p>
        </div>

        {/* Figma controls */}
        <div className="flex items-center gap-2 bg-white px-4 py-2 border border-gray-150 rounded-2xl shadow-sm flex-wrap">
          <div className="flex items-center gap-1 border-r border-gray-150 pr-2 mr-2">
            <button 
              onClick={handleZoomOut} 
              className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-purple-650 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-gray-600 min-w-[40px] text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button 
              onClick={handleZoomIn} 
              className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-purple-650 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button 
              onClick={handleZoomReset} 
              className="text-[10px] font-black uppercase text-gray-400 hover:text-purple-650 px-1 ml-1"
              title="Reset Zoom"
            >
              Reset
            </button>
          </div>

          <button 
            onClick={() => setShowGrid(prev => !prev)} 
            className={`p-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
              showGrid ? 'bg-purple-50 text-purple-750 border border-purple-100/50' : 'bg-transparent text-gray-400 hover:text-gray-650'
            }`}
          >
            <Grid className="h-4 w-4" /> Grid
          </button>
        </div>
      </div>

      {/* Search Bar (Admins & Counselors only) */}
      {role !== 'student' && (
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search roll, name, class, branch in tree map..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white rounded-2xl pl-11 pr-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-semibold text-gray-700 shadow-sm transition-all"
          />
        </div>
      )}

      {/* Tree Visualization Workspace Canvas Container */}
      <div 
        className={`border border-gray-200 rounded-[2.5rem] shadow-inner relative overflow-hidden min-h-[650px] transition-all duration-300 ${
          showGrid 
            ? 'bg-gray-50/40' 
            : 'bg-white'
        }`}
        style={showGrid ? {
          backgroundImage: 'radial-gradient(rgba(139, 92, 246, 0.12) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px'
        } : undefined}
      >
        {/* Figma Canvas Visual scale wrapper */}
        <div 
          className="p-8 sm:p-14 transition-transform duration-300 origin-top-left"
          style={{ transform: `scale(${zoomScale})` }}
        >
          
          {/* --- 1. ROOT CENTRAL NODE --- */}
          <div className="flex flex-col items-center mb-16 relative">
            <div className="group bg-purple-950 text-white border border-purple-800 shadow-xl px-8 py-5 rounded-[2rem] text-center max-w-sm relative z-20 transition-all duration-300 hover:scale-105 hover:shadow-purple-200/20 cursor-default">
              <div className="bg-purple-900 p-2.5 rounded-2xl text-purple-300 w-fit mx-auto mb-2.5 shadow-inner">
                <Network className="h-6 w-6" />
              </div>
              <h4 className="font-extrabold text-xs tracking-widest uppercase">
                {role === 'admin' || role === 'teacher' ? 'Academic Institution Roster' :
                 role === 'counselor' ? `Counseling Desk — ${user?.username}` :
                 'Assigned Counseling Path'}
              </h4>
              <p className="text-[9px] text-purple-300 mt-1 uppercase tracking-widest font-black flex items-center justify-center gap-1">
                <Sparkles className="h-3 w-3" /> Central Allocation Tree <Sparkles className="h-3 w-3" />
              </p>

              {/* FIGMA WORKSPACE HOVER INSPECTOR BOX */}
              <div className="absolute top-[102%] left-1/2 -translate-x-1/2 w-72 bg-gray-900/95 backdrop-blur-xl border border-gray-700/80 rounded-2xl p-4 text-left shadow-2xl pointer-events-none opacity-0 scale-95 transition-all duration-300 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:scale-105 z-50 space-y-3">
                <div className="flex items-center gap-1.5 border-b border-gray-800 pb-2">
                  <Layers className="h-4 w-4 text-purple-400" />
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Workspace Inspect</span>
                </div>
                <div className="text-gray-300 text-xs font-mono space-y-1">
                  <div className="flex justify-between"><span className="text-gray-500">TYPE:</span> <span>ROOT HUB</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">STUDENTS:</span> <span>{students.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">COUNSELORS:</span> <span>{counselors.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">UNASSIGNED:</span> <span>{unassignedStudents.length}</span></div>
                </div>
                <div className="bg-purple-950/50 border border-purple-900 p-2 rounded-xl text-[9px] text-purple-300 font-semibold flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 flex-shrink-0" /> Hover node maps to see details.
                </div>
              </div>
            </div>
            {/* Main descending connector line */}
            <div className="h-16 w-0.5 bg-purple-200 absolute -bottom-16"></div>
          </div>

          <div className="space-y-8 max-w-4xl mx-auto relative pl-8">
            <div className="absolute left-[7px] top-2 bottom-2 w-[2px] pointer-events-none">
              <svg className="h-full w-full" preserveAspectRatio="none">
                <line 
                  x1="0" y1="0" x2="0" y2="100%" 
                  stroke="#c084fc" 
                  strokeWidth="2" 
                  className="marching-ants-line"
                />
              </svg>
            </div>

            {/* ======================================================== */}
            {/* RENDER VIEW 1: ADMIN & TEACHER (FULL ALLOCATION MAP)   */}
            {/* ======================================================== */}
            {(role === 'admin' || role === 'teacher') && (
              <>
                {/* Unassigned Students Node */}
                {unassignedStudents.length > 0 && (
                  <div className="relative">
                    <div className="absolute -left-[39px] top-7 h-4 w-4 rounded-full border-4 border-white bg-amber-550 shadow z-10 animate-pulse"></div>
                    <div className={`group bg-white rounded-3xl p-5 border transition-all duration-300 relative ${
                      focusedNodeId?.startsWith('student-') && unassignedStudents.some(s => `student-${s.id}` === focusedNodeId)
                        ? 'border-amber-450 ring-2 ring-amber-100 shadow-md'
                        : 'border-dashed border-purple-200 hover:shadow-md'
                    }`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600 border border-amber-100">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">Unassigned Students</h4>
                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Allocations Required</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1 rounded-full text-xs font-black shadow-sm">
                            {unassignedStudents.length} Left
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

                      {/* FIGMA WORKSPACE HOVER INSPECTOR BOX */}
                      <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700/80 rounded-2xl p-5 text-left shadow-2xl pointer-events-none opacity-0 scale-95 transition-all duration-300 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:scale-105 z-50 space-y-3">
                        <div className="flex items-center gap-1.5 border-b border-gray-800 pb-2">
                          <Users className="h-4 w-4 text-amber-400" />
                          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Unassigned Group Inspect</span>
                        </div>
                        <div className="text-gray-300 text-xs font-mono space-y-1">
                          <div className="flex justify-between"><span className="text-gray-500">TYPE:</span> <span>RESERVED NODE</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">HEADCOUNT:</span> <span>{unassignedStudents.length} students</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">REQUIRED:</span> <span>Advisor Allocation</span></div>
                        </div>
                        <div className="bg-amber-950/30 border border-amber-900/50 p-2.5 rounded-xl text-[9px] text-amber-300 font-semibold flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5 flex-shrink-0" /> Click expand to allocate students.
                        </div>
                      </div>

                      {expandedCounselors['unassigned'] && (
                        <div className="mt-5 pt-4 border-t border-dashed border-gray-100 pl-6 space-y-3 relative">
                          <div className="absolute left-[7px] top-4 bottom-4 w-[2px] pointer-events-none">
                            <svg className="h-full w-full" preserveAspectRatio="none">
                              <line 
                                x1="0" y1="0" x2="0" y2="100%" 
                                stroke="#fbbf24" 
                                strokeWidth="2" 
                                className="marching-ants-line"
                              />
                            </svg>
                          </div>
                          {unassignedStudents.map((student) => {
                            const isFocused = `student-${student.id}` === focusedNodeId;
                            return (
                              <div
                                id={`student-${student.id}`}
                                key={student.id}
                                className={`group/student relative flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 ${
                                  isFocused 
                                    ? 'bg-amber-50/70 border border-amber-350 shadow-md scale-102' 
                                    : 'bg-gray-50/60 hover:bg-amber-50/30 border border-gray-100 hover:border-amber-250 cursor-pointer'
                                }`}
                              >
                                <div className="absolute -left-[31px] top-6.5 h-2 w-2 rounded-full border border-white bg-amber-400 z-10"></div>
                                <div>
                                  <p className="font-bold text-xs text-gray-900 group-hover/student:text-amber-700 transition-colors">
                                    {student.firstName} {student.lastName}
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-0.5 font-bold">Roll: {student.rollNumber} • {student.className} - {student.branch}</p>
                                </div>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/students/${student.id}`);
                                  }}
                                  className="!min-w-0 !p-1.5 !rounded-xl !bg-white hover:!bg-purple-55 !border !border-gray-150 hover:!border-purple-200 !text-gray-450 hover:!text-purple-650"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>

                                {/* FIGMA STUDENT INSPECTOR HOVER BOX */}
                                <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700/80 rounded-2xl p-5 text-left shadow-2xl pointer-events-none opacity-0 scale-95 transition-all duration-300 group-hover/student:pointer-events-auto group-hover/student:opacity-100 group-hover/student:scale-105 z-50 space-y-3">
                                  <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                                    <div className="flex items-center gap-1.5">
                                      <User className="h-4 w-4 text-purple-400" />
                                      <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Student Profile</span>
                                    </div>
                                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider">Unassigned</span>
                                  </div>

                                  <div className="text-gray-300 text-xs font-mono space-y-1 bg-black/25 p-3 rounded-xl border border-gray-800/40">
                                    <div className="flex justify-between"><span className="text-gray-500">NAME:</span> <span className="font-sans font-bold">{student.firstName} {student.lastName}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">ROLL NO:</span> <span>{student.rollNumber}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">CLASS:</span> <span>{student.className}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">BRANCH:</span> <span>{student.branch || 'N/A'} - Sec {student.section}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">EMAIL:</span> <span className="lowercase truncate max-w-[150px]">{student.email}</span></div>
                                  </div>

                                  <Button
                                    fullWidth
                                    onClick={() => navigate(`/students/${student.id}`)}
                                    className="!bg-purple-600 hover:!bg-purple-700 !text-white !font-bold !capitalize !py-2 !rounded-xl !text-xs"
                                  >
                                    Open Student Profile
                                  </Button>
                                </div>

                              </div>
                            );
                          })}
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
                      <div className="absolute -left-[39px] top-7 h-4 w-4 rounded-full border-4 border-white bg-indigo-500 shadow z-10"></div>
                      <div className="group bg-white shadow-sm rounded-3xl p-5 border border-gray-150 hover:shadow-md transition-shadow relative">
                        
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-650 border border-indigo-150">
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
                              {totalStudents} Active ({batches.length} {batches.length === 1 ? 'Batch' : 'Batches'})
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

                        {/* FIGMA COUNSELOR INSPECTOR HOVER BOX */}
                        <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700/80 rounded-2xl p-5 text-left shadow-2xl pointer-events-none opacity-0 scale-95 transition-all duration-300 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:scale-105 z-50 space-y-3">
                          <div className="flex items-center gap-1.5 border-b border-gray-800 pb-2.5">
                            <User className="h-4 w-4 text-indigo-400" />
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Counselor Node Inspect</span>
                          </div>
                          <div className="text-gray-300 text-xs font-mono space-y-1 bg-black/25 p-3 rounded-xl border border-gray-800/40">
                            <div className="flex justify-between"><span className="text-gray-500">USERNAME:</span> <span className="capitalize">{counselor.username}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">EMAIL:</span> <span className="lowercase truncate max-w-[150px]">{counselor.email}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">STUDENTS:</span> <span>{totalStudents} assigned</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">BATCHES:</span> <span>{batches.length} batches</span></div>
                          </div>
                          <div className="bg-indigo-950/30 border border-indigo-900/50 p-2.5 rounded-xl text-[9px] text-indigo-300 font-semibold flex items-center gap-1.5">
                            <Info className="h-3.5 w-3.5 flex-shrink-0" /> Click expand to view batches.
                          </div>
                        </div>

                        {/* Level 2 Nodes (Batches) */}
                        {isExpanded && (
                          <div className="mt-5 pt-4 border-t border-dashed border-gray-100 pl-6 space-y-4 relative">
                            <div className="absolute left-[7px] top-4 bottom-4 w-[2px] pointer-events-none">
                              <svg className="h-full w-full" preserveAspectRatio="none">
                                <line 
                                  x1="0" y1="0" x2="0" y2="100%" 
                                  stroke="#818cf8" 
                                  strokeWidth="2" 
                                  className="marching-ants-line"
                                />
                              </svg>
                            </div>
                            {batches.length === 0 ? (
                              <p className="text-xs text-gray-400 italic">No assigned batches or student records found.</p>
                            ) : (
                              batches.map(({ batchKey, students }) => {
                                const batchExpanded = expandedBatches[`${counselor.username}-${batchKey}`];
                                return (
                                  <div key={batchKey} className="relative group/batch">
                                    <div className="absolute -left-[31px] top-5 h-3 w-3 rounded-full border-2 border-white bg-indigo-500 z-10"></div>
                                    
                                    <div className="flex items-center justify-between bg-indigo-50/10 border border-indigo-100/50 px-4 py-2.5 rounded-2xl hover:bg-indigo-50/20 transition-all duration-200">
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

                                    {/* FIGMA BATCH INSPECTOR HOVER BOX */}
                                    <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700/80 rounded-2xl p-5 text-left shadow-2xl pointer-events-none opacity-0 scale-95 transition-all duration-300 group-hover/batch:pointer-events-auto group-hover/batch:opacity-100 group-hover/batch:scale-105 z-50 space-y-3">
                                      <div className="flex items-center gap-1.5 border-b border-gray-800 pb-2.5">
                                        <BookOpen className="h-4 w-4 text-indigo-400" />
                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Batch Inspect</span>
                                      </div>
                                      <div className="text-gray-300 text-xs font-mono space-y-1 bg-black/25 p-3 rounded-xl border border-gray-800/40">
                                        <div className="flex justify-between"><span className="text-gray-500">IDENTIFIER:</span> <span className="font-bold">{batchKey}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">HEADCOUNT:</span> <span>{students.length} students</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">ADVISOR:</span> <span className="capitalize">{counselor.username}</span></div>
                                      </div>
                                    </div>

                                    {/* Level 3 Nodes (Students) */}
                                    {batchExpanded && (
                                      <div className="mt-3 pl-6 space-y-2 relative">
                                        <div className="absolute left-[7px] top-2 bottom-2 w-[2px] pointer-events-none">
                                          <svg className="h-full w-full" preserveAspectRatio="none">
                                            <line 
                                              x1="0" y1="0" x2="0" y2="100%" 
                                              stroke="#a78bfa" 
                                              strokeWidth="2" 
                                              className="marching-ants-line"
                                            />
                                          </svg>
                                        </div>
                                        {students.map(s => {
                                          const isFocused = `student-${s.id}` === focusedNodeId;
                                          return (
                                            <div
                                              id={`student-${s.id}`}
                                              key={s.id}
                                              className={`group/student relative flex items-center justify-between p-3 rounded-2xl transition-all duration-300 ${
                                                isFocused 
                                                  ? 'bg-purple-50 border border-purple-350 shadow-md scale-102' 
                                                  : 'bg-gray-50/60 hover:bg-purple-50/30 border border-gray-100 hover:border-purple-100 cursor-pointer'
                                              }`}
                                            >
                                              <div className="absolute -left-[31px] top-5 h-2 w-2 rounded-full border border-white bg-purple-500 z-10"></div>
                                              <div>
                                                <p className="font-bold text-xs text-gray-900 group-hover/student:text-purple-650 transition-colors">
                                                  {s.firstName} {s.lastName}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-bold mt-0.5">Roll: {s.rollNumber}</p>
                                              </div>
                                              <Button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  navigate(`/students/${s.id}`);
                                                }}
                                                className="!min-w-0 !p-1.5 !rounded-xl !bg-white hover:!bg-purple-55 !border !border-gray-150 hover:!border-purple-200 !text-gray-450 hover:!text-purple-650"
                                              >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                              </Button>

                                              {/* FIGMA STUDENT INSPECTOR HOVER BOX */}
                                              <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700/80 rounded-2xl p-5 text-left shadow-2xl pointer-events-none opacity-0 scale-95 transition-all duration-300 group-hover/student:pointer-events-auto group-hover/student:opacity-100 group-hover/student:scale-105 z-50 space-y-3">
                                                <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                                                  <div className="flex items-center gap-1.5">
                                                    <User className="h-4 w-4 text-purple-400" />
                                                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Student Profile</span>
                                                  </div>
                                                  <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border tracking-wider ${
                                                    s.status === 'Active' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                  }`}>
                                                    {s.status}
                                                  </span>
                                                </div>

                                                <div className="text-gray-300 text-xs font-mono space-y-1 bg-black/25 p-3 rounded-xl border border-gray-800/40">
                                                  <div className="flex justify-between"><span className="text-gray-500">NAME:</span> <span className="font-sans font-bold">{s.firstName} {s.lastName}</span></div>
                                                  <div className="flex justify-between"><span className="text-gray-500">ROLL NO:</span> <span>{s.rollNumber}</span></div>
                                                  <div className="flex justify-between"><span className="text-gray-500">CLASS:</span> <span>{s.className}</span></div>
                                                  <div className="flex justify-between"><span className="text-gray-500">BRANCH:</span> <span>{s.branch || 'N/A'} - Sec {s.section}</span></div>
                                                  <div className="flex justify-between"><span className="text-gray-500">EMAIL:</span> <span className="lowercase truncate max-w-[150px]">{s.email}</span></div>
                                                </div>

                                                <Button
                                                  fullWidth
                                                  onClick={() => navigate(`/students/${s.id}`)}
                                                  className="!bg-purple-600 hover:!bg-purple-700 !text-white !font-bold !capitalize !py-2 !rounded-xl !text-xs"
                                                >
                                                  Open Student Profile
                                                </Button>
                                              </div>

                                            </div>
                                          );
                                        })}
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
                      <div key={batchKey} className="relative group/batch">
                        <div className="absolute -left-[39px] top-7 h-4 w-4 rounded-full border-4 border-white bg-indigo-500 shadow z-10"></div>
                        <div className="bg-white shadow-sm rounded-3xl p-5 border border-gray-150 hover:shadow-md transition-shadow relative">
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-650 border border-indigo-150">
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

                          {/* FIGMA BATCH INSPECTOR HOVER BOX */}
                          <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700/80 rounded-2xl p-5 text-left shadow-2xl pointer-events-none opacity-0 scale-95 transition-all duration-300 group-hover/batch:pointer-events-auto group-hover/batch:opacity-100 group-hover/batch:scale-105 z-50 space-y-3">
                            <div className="flex items-center gap-1.5 border-b border-gray-800 pb-2.5">
                              <BookOpen className="h-4 w-4 text-indigo-400" />
                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Batch Inspect</span>
                            </div>
                            <div className="text-gray-300 text-xs font-mono space-y-1 bg-black/25 p-3 rounded-xl border border-gray-800/40">
                              <div className="flex justify-between"><span className="text-gray-500">IDENTIFIER:</span> <span className="font-bold">{batchKey}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">ALLOCATED:</span> <span>{students.length} students</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">ADVISOR:</span> <span className="capitalize">{user?.username}</span></div>
                            </div>
                          </div>

                          {/* Level 2 Nodes (Students) */}
                          {batchExpanded && (
                            <div className="mt-5 pt-4 border-t border-dashed border-gray-100 pl-6 space-y-2 relative">
                              <div className="absolute left-[7px] top-4 bottom-4 w-[2px] pointer-events-none">
                                <svg className="h-full w-full" preserveAspectRatio="none">
                                  <line 
                                    x1="0" y1="0" x2="0" y2="100%" 
                                    stroke="#818cf8" 
                                    strokeWidth="2" 
                                    className="marching-ants-line"
                                  />
                                </svg>
                              </div>
                              {students.map(s => {
                                const isFocused = `student-${s.id}` === focusedNodeId;
                                return (
                                  <div
                                    id={`student-${s.id}`}
                                    key={s.id}
                                    className={`group/student relative flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 ${
                                      isFocused 
                                        ? 'bg-purple-50 border border-purple-350 shadow-md scale-102' 
                                        : 'bg-gray-50/60 hover:bg-purple-50/30 border border-gray-100 hover:border-purple-100 cursor-pointer'
                                    }`}
                                  >
                                    <div className="absolute -left-[31px] top-6.5 h-2 w-2 rounded-full border border-white bg-purple-500 z-10"></div>
                                    <div>
                                      <p className="font-bold text-xs text-gray-900 group-hover/student:text-purple-655 transition-colors">
                                        {s.firstName} {s.lastName}
                                      </p>
                                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">Roll: {s.rollNumber} • {s.email}</p>
                                    </div>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/students/${s.id}`);
                                      }}
                                      className="!min-w-0 !p-1.5 !rounded-xl !bg-white hover:!bg-purple-55 !border !border-gray-150 hover:!border-purple-200 !text-gray-450 hover:!text-purple-650"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </Button>

                                    {/* FIGMA STUDENT INSPECTOR HOVER BOX */}
                                    <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700/80 rounded-2xl p-5 text-left shadow-2xl pointer-events-none opacity-0 scale-95 transition-all duration-300 group-hover/student:pointer-events-auto group-hover/student:opacity-100 group-hover/student:scale-105 z-50 space-y-3">
                                      <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                                        <div className="flex items-center gap-1.5">
                                          <User className="h-4 w-4 text-purple-400" />
                                          <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Student Profile</span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border tracking-wider ${
                                          s.status === 'Active' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                        }`}>
                                          {s.status}
                                        </span>
                                      </div>

                                      <div className="text-gray-300 text-xs font-mono space-y-1 bg-black/25 p-3 rounded-xl border border-gray-800/40">
                                        <div className="flex justify-between"><span className="text-gray-500">NAME:</span> <span className="font-sans font-bold">{s.firstName} {s.lastName}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">ROLL NO:</span> <span>{s.rollNumber}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">CLASS:</span> <span>{s.className}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">BRANCH:</span> <span>{s.branch || 'N/A'} - Sec {s.section}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">EMAIL:</span> <span className="lowercase truncate max-w-[150px]">{s.email}</span></div>
                                      </div>

                                      <Button
                                        fullWidth
                                        onClick={() => navigate(`/students/${s.id}`)}
                                        className="!bg-purple-600 hover:!bg-purple-700 !text-white !font-bold !capitalize !py-2 !rounded-xl !text-xs"
                                      >
                                        Open Student Profile
                                      </Button>
                                    </div>

                                  </div>
                                );
                              })}
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
                  <div className="relative group/counselor">
                    {/* Counselor Node */}
                    <div className="absolute -left-[39px] top-7 h-4 w-4 rounded-full border-4 border-white bg-indigo-500 shadow z-10"></div>
                    <div className="bg-white shadow-sm rounded-3xl p-5 border border-gray-150 space-y-5 relative">
                      
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-650 border border-indigo-150">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                            Counselor Desk: <span className="capitalize text-purple-600">{studentSelfProfile.counselorUsername}</span>
                          </h4>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Primary Student Advisor</p>
                        </div>
                      </div>

                      {/* FIGMA COUNSELOR INSPECTOR HOVER BOX */}
                      <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700/80 rounded-2xl p-5 text-left shadow-2xl pointer-events-none opacity-0 scale-95 transition-all duration-300 group-hover/counselor:pointer-events-auto group-hover/counselor:opacity-100 group-hover/counselor:scale-105 z-50 space-y-3">
                        <div className="flex items-center gap-1.5 border-b border-gray-800 pb-2.5">
                          <User className="h-4 w-4 text-indigo-400" />
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Advisor Desk Inspect</span>
                        </div>
                        <div className="text-gray-300 text-xs font-mono space-y-1 bg-black/25 p-3 rounded-xl border border-gray-800/40">
                          <div className="flex justify-between"><span className="text-gray-500">ADVISOR NAME:</span> <span className="capitalize font-sans font-bold">{studentSelfProfile.counselorUsername}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">ROLE STRING:</span> <span>counselor</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">PEERS IN BATCH:</span> <span>{studentPeers.length} classmates</span></div>
                        </div>
                      </div>

                      {/* Batch Link Node */}
                      <div className="pl-6 space-y-4 relative">
                        <div className="absolute left-[7px] top-2 bottom-2 w-[2px] pointer-events-none">
                          <svg className="h-full w-full" preserveAspectRatio="none">
                            <line 
                              x1="0" y1="0" x2="0" y2="100%" 
                              stroke="#818cf8" 
                              strokeWidth="2" 
                              className="marching-ants-line"
                            />
                          </svg>
                        </div>
                        <div className="relative group/batch">
                          <div className="absolute -left-[31px] top-5.5 h-3 w-3 rounded-full border-2 border-white bg-indigo-500 z-10"></div>
                          <div className="bg-indigo-50/15 border border-indigo-100/50 p-4 rounded-2xl">
                            <span className="block text-xs font-extrabold text-indigo-950">
                              Batch: {studentSelfProfile.className} - {studentSelfProfile.branch} - Sec {studentSelfProfile.section}
                            </span>
                            <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                              {studentPeers.length + 1} Total Batch Roster Members
                            </span>
                          </div>

                          {/* FIGMA BATCH INSPECTOR HOVER BOX */}
                          <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700/80 rounded-2xl p-5 text-left shadow-2xl pointer-events-none opacity-0 scale-95 transition-all duration-300 group-hover/batch:pointer-events-auto group-hover/batch:opacity-100 group-hover/batch:scale-105 z-50 space-y-3">
                            <div className="flex items-center gap-1.5 border-b border-gray-800 pb-2.5">
                              <BookOpen className="h-4 w-4 text-indigo-400" />
                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">My Batch Inspect</span>
                            </div>
                            <div className="text-gray-300 text-xs font-mono space-y-1 bg-black/25 p-3 rounded-xl border border-gray-800/40">
                              <div className="flex justify-between"><span className="text-gray-500">CLASS:</span> <span>{studentSelfProfile.className}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">BRANCH:</span> <span>{studentSelfProfile.branch}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">SECTION:</span> <span>Sec {studentSelfProfile.section}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">CLASSMATES:</span> <span>{studentPeers.length} peers</span></div>
                            </div>
                          </div>

                          {/* Student Node */}
                          <div className="mt-4 pl-6 space-y-3 relative">
                            <div className="absolute left-[7px] top-2 bottom-2 w-[2px] pointer-events-none">
                              <svg className="h-full w-full" preserveAspectRatio="none">
                                <line 
                                  x1="0" y1="0" x2="0" y2="100%" 
                                  stroke="#c084fc" 
                                  strokeWidth="2" 
                                  className="marching-ants-line"
                                />
                              </svg>
                            </div>
                            <div className="group/student relative flex items-center justify-between p-4 bg-purple-50/10 hover:bg-purple-50/30 border border-purple-100 hover:border-purple-200 rounded-2xl group transition-all cursor-default">
                              <div className="absolute -left-[31px] top-6.5 h-2 w-2 rounded-full border border-white bg-purple-650 z-10 animate-pulse"></div>
                              <div>
                                <p className="font-extrabold text-xs text-purple-750">
                                  {studentSelfProfile.firstName} {studentSelfProfile.lastName} (Me)
                                </p>
                                <p className="text-[10px] text-gray-400 font-bold mt-0.5">Roll: {studentSelfProfile.rollNumber} • {studentSelfProfile.email}</p>
                              </div>
                              <span className="bg-purple-100 text-purple-750 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md">
                                Active Student
                              </span>

                              {/* FIGMA STUDENT INSPECTOR HOVER BOX */}
                              <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700/80 rounded-2xl p-5 text-left shadow-2xl pointer-events-none opacity-0 scale-95 transition-all duration-300 group-hover/student:pointer-events-auto group-hover/student:opacity-100 group-hover/student:scale-105 z-50 space-y-3">
                                <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                                  <div className="flex items-center gap-1.5">
                                    <User className="h-4 w-4 text-purple-400" />
                                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">My Student Details</span>
                                  </div>
                                  <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider">Active</span>
                                </div>

                                <div className="text-gray-300 text-xs font-mono space-y-1 bg-black/25 p-3 rounded-xl border border-gray-800/40">
                                  <div className="flex justify-between"><span className="text-gray-500">NAME:</span> <span className="font-sans font-bold">{studentSelfProfile.firstName} {studentSelfProfile.lastName}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-500">ROLL NO:</span> <span>{studentSelfProfile.rollNumber}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-500">CLASS:</span> <span>{studentSelfProfile.className}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-500">BRANCH:</span> <span>{studentSelfProfile.branch} - Sec {studentSelfProfile.section}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-500">EMAIL:</span> <span className="lowercase truncate max-w-[150px]">{studentSelfProfile.email}</span></div>
                                </div>

                                <Button
                                  fullWidth
                                  onClick={() => navigate(`/profile`)}
                                  className="!bg-purple-600 hover:!bg-purple-700 !text-white !font-bold !capitalize !py-2 !rounded-xl !text-xs"
                                >
                                  Open My Profile Page
                                </Button>
                              </div>

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
    </div>
  );
}
