import { useEffect, useState, useMemo, useRef } from 'react';
import { useAuthStore } from '../../features/auth/authStore';
import { useStudentStore } from '../../features/students/studentStore';
import api from '../../lib/axios';
import { normalizeRole } from '../../lib/roles';
import { getTeacherClassAssignment } from '../../lib/roleSecurity';
import { 
  Network, User, Search, 
  BookOpen, HelpCircle, Sparkles, ExternalLink, Grid,
  ZoomIn, ZoomOut, School, ShieldAlert
} from 'lucide-react';
import { CircularProgress } from '@mui/material';
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
  
  // Pan states
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPan = useRef({ x: 0, y: 0 });

  // Floating Inspector Portal State
  const [hoveredNode, setHoveredNode] = useState<{
    id: string;
    type: 'root' | 'unassigned_group' | 'student' | 'counselor' | 'batch';
    title: string;
    data: any;
    x: number;
    y: number;
  } | null>(null);

  // SVG Coordinates mapping
  const treeRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<Record<string, { x: number; y: number }>>({});

  const handleMouseEnter = (e: React.MouseEvent, id: string, type: any, title: string, data: any) => {
    e.stopPropagation();
    setHoveredNode({
      id,
      type,
      title,
      data,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hoveredNode) {
      setHoveredNode(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHoveredNode(null);
  };

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
        
        if (role === 'teacher') {
          const teacherClass = getTeacherClassAssignment(user?.username);
          const allStuds = (studRes.data || []).filter((s: any) => s.status !== 'Deleted');
          const classStudents = allStuds.filter((s: any) => 
            s.className && s.className.toLowerCase() === teacherClass.className.toLowerCase() &&
            s.branch && s.branch.toLowerCase() === teacherClass.branch.toLowerCase() &&
            s.section && s.section.toLowerCase() === teacherClass.section.toLowerCase()
          );
          
          const classCounselorNames = new Set(
            classStudents.map((s: any) => s.counselorUsername?.toLowerCase()).filter(Boolean)
          );
          
          const filteredCounselors = uniqueCounselors.filter((c: any) => 
            classCounselorNames.has(c.username.toLowerCase())
          );
          
          setCounselors(filteredCounselors);
          setStudents(classStudents);

          // Expand counselor folders by default for teachers
          const defaultExpanded: Record<string, boolean> = {};
          filteredCounselors.forEach((c: any) => {
            defaultExpanded[c.username] = true;
          });
          setExpandedCounselors(defaultExpanded);
        } else {
          setCounselors(uniqueCounselors);
          setStudents((studRes.data || []).filter((s: any) => s.status !== 'Deleted'));
        }
      } else if (role === 'counselor') {
        const res = await api.get('/students');
        const myStudents = (res.data || []).filter(
          (s: any) => s.counselorUsername && s.counselorUsername.toLowerCase() === user?.username.toLowerCase() && s.status !== 'Deleted'
        );
        setStudents(myStudents);
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

  // Expand all by default when counselors or students are loaded
  useEffect(() => {
    if (counselors.length > 0) {
      const initialCounselors: Record<string, boolean> = { unassigned: true };
      counselors.forEach(c => {
        initialCounselors[c.username] = true;
      });
      setExpandedCounselors(initialCounselors);
    }
  }, [counselors]);

  useEffect(() => {
    if (students.length > 0) {
      const initialBatches: Record<string, boolean> = { 'unassigned-Unallocated': true };
      students.forEach(s => {
        const batchKey = `${s.className || 'Unknown Class'} - ${s.branch || 'General'} - Sec ${s.section || 'A'}`;
        const counselorPrefix = s.counselorUsername ? `${s.counselorUsername}-` : 'unassigned-';
        initialBatches[`${counselorPrefix}${batchKey}`] = true;
        initialBatches[batchKey] = true;
      });
      setExpandedBatches(initialBatches);
    }
  }, [students]);

  // Zoom handlers
  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.1, 1.4));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.1, 0.6));
  const handleZoomReset = () => {
    setZoomScale(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Drag-to-pan Canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-interactive="true"]')) return;
    setIsPanning(true);
    startPan.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const newX = e.clientX - startPan.current.x;
    const newY = e.clientY - startPan.current.y;
    setPan({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Dynamic search auto-expansion & node highlighting
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const q = searchQuery.toLowerCase();
      
      if (role === 'admin' || role === 'teacher') {
        const matchingCounselors: Record<string, boolean> = { unassigned: true };
        const matchingBatches: Record<string, boolean> = {};
        
        students.forEach(s => {
          const match = 
            s.firstName.toLowerCase().includes(q) ||
            s.lastName.toLowerCase().includes(q) ||
            s.rollNumber.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q);
            
          if (match) {
            const batchKey = `${s.className || 'Unknown Class'} - ${s.branch || 'General'} - Sec ${s.section || 'A'}`;
            if (s.counselorUsername) {
              matchingCounselors[s.counselorUsername] = true;
              matchingBatches[`${s.counselorUsername}-${batchKey}`] = true;
            } else {
              matchingCounselors['unassigned'] = true;
              matchingBatches[`unassigned-Unallocated`] = true;
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
            const batchKey = `${s.className || 'Unknown Class'} - ${s.branch || 'General'} - Sec ${s.section || 'A'}`;
            matchingBatches[batchKey] = true;
          }
        });
        setExpandedBatches(matchingBatches);
      }
    }
  }, [searchQuery, students, role]);

  // Coordinate Recalculator
  const updateCoords = () => {
    if (!treeRef.current) return;
    const treeRect = treeRef.current.getBoundingClientRect();
    const newCoords: Record<string, { x: number; y: number }> = {};
    const elements = treeRef.current.querySelectorAll('[data-node-id]');
    
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const nodeId = el.getAttribute('data-node-id');
      if (nodeId) {
        newCoords[nodeId] = {
          x: (rect.left - treeRect.left + rect.width / 2) / zoomScale,
          y: (rect.top - treeRect.top + rect.height / 2) / zoomScale
        };
      }
    });
    setCoords(newCoords);
  };

  // Run observer to trace resizing
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      updateCoords();
    }, 150);

    const observer = new ResizeObserver(() => {
      updateCoords();
    });

    if (treeRef.current) {
      observer.observe(treeRef.current);
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [loading, expandedCounselors, expandedBatches, counselors, students, zoomScale]);

  // Groupings for Admin & Teacher Tree Graphs
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
        s.rollNumber.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
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
        s.rollNumber.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
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

  // Peer mapping for Student Tree Graph
  const studentBatchMembers = useMemo(() => {
    if (role !== 'student' || !studentSelfProfile) return [];
    
    const members = [
      ...studentPeers.map(p => ({ ...p, isSelf: false })),
      { ...studentSelfProfile, isSelf: true }
    ];
    
    return members.sort((a, b) => a.firstName.localeCompare(b.firstName));
  }, [studentSelfProfile, studentPeers, role]);

  // Gather active connection lines
  const connections = useMemo(() => {
    const list: { from: string; to: string; color: string }[] = [];

    if (role === 'admin' || role === 'teacher') {
      // Connect Root to Counselors
      counselors.forEach((c) => {
        list.push({
          from: 'root',
          to: `counselor-${c.username}`,
          color: '#10b981' // Emerald
        });

        // If counselor is expanded, connect counselor to batches
        if (expandedCounselors[c.username]) {
          const cBatches = adminTreeData.find(x => x.counselor.username === c.username)?.batches || [];
          cBatches.forEach((batch) => {
            const batchId = `batch-${c.username}-${batch.batchKey}`;
            list.push({
              from: `counselor-${c.username}`,
              to: batchId,
              color: '#3b82f6' // Blue
            });

            // If batch is expanded, connect batch to students
            if (expandedBatches[`${c.username}-${batch.batchKey}`]) {
              batch.students.forEach((student) => {
                list.push({
                  from: batchId,
                  to: `student-${student.id}`,
                  color: '#8b5cf6' // Violet
                });
              });
            }
          });
        }
      });

      // Unassigned pools
      if (role === 'admin' && unassignedStudents.length > 0) {
        list.push({
          from: 'root',
          to: 'counselor-unassigned',
          color: '#ef4444' // Rose
        });

        if (expandedCounselors['unassigned']) {
          const batchId = 'batch-unassigned-Unallocated';
          list.push({
            from: 'counselor-unassigned',
            to: batchId,
            color: '#f59e0b' // Amber
          });

          if (expandedBatches['unassigned-Unallocated']) {
            unassignedStudents.forEach((student) => {
              list.push({
                from: batchId,
                to: `student-${student.id}`,
                color: '#f59e0b'
              });
            });
          }
        }
      }
    } else if (role === 'counselor') {
      // Connect Counselor Root to Batches
      counselorTreeData.forEach((batch) => {
        const batchId = `batch-${batch.batchKey}`;
        list.push({
          from: 'counselor-root',
          to: batchId,
          color: '#3b82f6'
        });

        // Connect Batches to Students
        if (expandedBatches[batch.batchKey]) {
          batch.students.forEach((student) => {
            list.push({
              from: batchId,
              to: `student-${student.id}`,
              color: '#8b5cf6'
            });
          });
        }
      });
    } else if (role === 'student' && studentSelfProfile) {
      if (studentSelfProfile.counselorUsername) {
        list.push({
          from: 'counselor-root',
          to: 'batch-root',
          color: '#3b82f6'
        });

        studentBatchMembers.forEach((student) => {
          list.push({
            from: 'batch-root',
            to: `student-${student.id}`,
            color: student.isSelf ? '#f59e0b' : '#8b5cf6'
          });
        });
      }
    }

    return list;
  }, [role, counselors, expandedCounselors, expandedBatches, adminTreeData, unassignedStudents, counselorTreeData, studentSelfProfile, studentBatchMembers]);

  // Boundary-aware inspect portal position
  const getTooltipStyle = () => {
    if (!hoveredNode) return {};
    const tooltipWidth = 260;
    const tooltipHeight = 220; // Estimated max height
    
    let x = hoveredNode.x + 18;
    let y = hoveredNode.y + 18;
    
    if (hoveredNode.x + tooltipWidth > window.innerWidth) {
      x = hoveredNode.x - tooltipWidth - 18;
    }
    
    if (hoveredNode.y + tooltipHeight > window.innerHeight) {
      y = hoveredNode.y - tooltipHeight - 18;
    }
    
    return {
      left: Math.max(12, x),
      top: Math.max(12, y)
    };
  };

  // Check if a line should glow
  const isConnectionActive = (conn: typeof connections[0]) => {
    if (!hoveredNode) return false;
    const hoverType = hoveredNode.type;

    if (hoverType === 'student') {
      const student = hoveredNode.data;
      return (
        conn.to === `student-${student.id}` ||
        (conn.to === `batch-${student.counselorUsername}-${student.className} - ${student.branch} - Sec ${student.section}` && conn.from === `counselor-${student.counselorUsername}`) ||
        (conn.to === `counselor-${student.counselorUsername}` && conn.from === 'root') ||
        // Unassigned route
        (conn.to === `student-${student.id}` && conn.from === 'batch-unassigned-Unallocated') ||
        (conn.to === 'batch-unassigned-Unallocated' && conn.from === 'counselor-unassigned') ||
        (conn.to === 'counselor-unassigned' && conn.from === 'root') ||
        // Counselor view and student view
        conn.to === `batch-${student.className} - ${student.branch} - Sec ${student.section}` ||
        conn.from === 'counselor-root' ||
        conn.from === 'batch-root'
      );
    }

    if (hoverType === 'batch') {
      const batchKey = hoveredNode.title;
      const counselorUsername = hoveredNode.data.counselorUsername;
      const compoundBatchId = `batch-${counselorUsername}-${batchKey}`;
      
      return (
        conn.to === compoundBatchId ||
        conn.to === `batch-${batchKey}` ||
        conn.from === compoundBatchId ||
        conn.from === `batch-${batchKey}` ||
        (conn.to === `counselor-${counselorUsername}` && conn.from === 'root') ||
        (conn.to === 'counselor-unassigned' && conn.from === 'root')
      );
    }

    if (hoverType === 'counselor') {
      const username = hoveredNode.title;
      return (
        conn.to === `counselor-${username}` ||
        conn.from === `counselor-${username}` ||
        conn.to === 'counselor-unassigned' ||
        conn.from === 'counselor-unassigned' ||
        conn.from === 'counselor-root'
      );
    }

    if (hoverType === 'root') {
      return true; // Glow all when Root is hovered
    }

    return false;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <CircularProgress size={36} className="!text-purple-650 mb-4" />
        <p className="text-sm text-gray-500 font-bold tracking-tight">Constructing high-fidelity node organization workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-4 relative">
      <style>{`
        @keyframes figmaDash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .marching-ants-line {
          stroke-dasharray: 6, 4;
          animation: figmaDash 1s linear infinite;
        }
        .active-path-glow {
          filter: drop-shadow(0 0 6px rgba(139, 92, 246, 0.8));
        }
        .grid-dots {
          background-image: radial-gradient(rgba(99, 102, 241, 0.08) 1.5px, transparent 1.5px);
          background-size: 24px 24px;
        }
      `}</style>
      
      {/* Workspace Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Network className="h-8 w-8 text-purple-600 animate-pulse" />
            Counseling Hierarchy Workspace
          </h1>
          <p className="mt-1.5 text-xs text-gray-500 font-semibold tracking-wide uppercase">
            {role === 'admin' ? 'Organization-wide Counselor Tree Flow' : role === 'teacher' ? 'Class Counseling Map' : role === 'counselor' ? 'My Advising Roster' : 'My Counseling Network'}
          </p>
        </div>

        {/* Figma Workspace Toolbar */}
        <div className="flex items-center gap-2 bg-white px-4 py-2 border border-gray-150 rounded-2xl shadow-sm flex-wrap z-30">
          <div className="flex items-center gap-1 border-r border-gray-150 pr-2 mr-2">
            <button 
              onClick={handleZoomOut} 
              className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-purple-600 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-gray-600 min-w-[36px] text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button 
              onClick={handleZoomIn} 
              className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-purple-600 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button 
              onClick={handleZoomReset} 
              className="text-[10px] font-black uppercase text-gray-400 hover:text-purple-600 px-1 ml-1"
              title="Reset Zoom & Pan"
            >
              Reset
            </button>
          </div>

          <button 
            onClick={() => setShowGrid(prev => !prev)} 
            className={`p-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
              showGrid ? 'bg-purple-50 text-purple-700 border border-purple-100/50' : 'bg-transparent text-gray-400 hover:text-gray-650'
            }`}
          >
            <Grid className="h-4 w-4" /> Grid
          </button>
        </div>
      </div>

      {/* Global Filter Bar (only for admins/teachers/counselors) */}
      {role !== 'student' && (
        <div className="relative max-w-md z-20">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search roll, name, email or section in organization network..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white rounded-2xl pl-11 pr-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-semibold text-gray-700 shadow-sm transition-all"
          />
        </div>
      )}

      {/* Figma Infinite Canvas Workspace */}
      <div 
        className={`border border-gray-200 rounded-[2.5rem] shadow-inner relative overflow-hidden min-h-[700px] select-none cursor-grab active:cursor-grabbing ${
          showGrid ? 'bg-slate-50/50 grid-dots' : 'bg-white'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMoveCanvas}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        
        {/* Node Layout Scale and Translate Area */}
        <div 
          ref={treeRef}
          className="absolute origin-top-left transition-transform duration-75 min-w-max p-20 flex flex-col items-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomScale})`
          }}
        >
          {/* BACKGROUND LAYER: LAYERED SVG CONNECTIONS */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }}
          >
            {connections.map((conn, idx) => {
              const start = coords[conn.from];
              const end = coords[conn.to];
              if (!start || !end) return null;

              const active = isConnectionActive(conn);
              
              // Bottom center of parent, top center of child
              const startX = start.x;
              const startY = start.y;
              const endX = end.x;
              const endY = end.y;
              
              // Generate standard smooth Bezier curve for mind map flow
              const midY = (startY + endY) / 2;
              const pathD = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

              return (
                <g key={`${conn.from}-${conn.to}-${idx}`}>
                  {/* Glowing background line for hovered path */}
                  {active && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke={conn.color}
                      strokeWidth={6}
                      strokeLinecap="round"
                      opacity={0.3}
                      className="active-path-glow transition-all duration-300"
                    />
                  )}
                  {/* Core connector line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={active ? conn.color : '#e2e8f0'}
                    strokeWidth={active ? 2.5 : 1.5}
                    strokeLinecap="round"
                    opacity={hoveredNode && !active ? 0.25 : 0.8}
                    className={`transition-all duration-300 ${active ? 'marching-ants-line' : ''}`}
                  />
                </g>
              );
            })}
          </svg>

          {/* FOREGROUND LAYER: REACT TREE NODE CONTENT */}
          
          {/* ========================================== */}
          {/* RENDER VIEW 1: ADMIN & TEACHER VIEW        */}
          {/* ========================================== */}
          {(role === 'admin' || role === 'teacher') && (
            <div className="flex flex-col items-center">
              
              {/* LEVEL 0: ROOT ORGANIZATION */}
              <div className="flex flex-col items-center mb-24 relative z-10">
                <div 
                  data-node-id="root"
                  data-interactive="true"
                  className="group w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 border-2 border-white shadow-md shadow-emerald-500/20 flex items-center justify-center text-white cursor-pointer transition-transform hover:scale-110 duration-200"
                  onMouseEnter={(e) => handleMouseEnter(e, 'root', 'root', 'Academic Organization Hub', {
                    studentsCount: students.length,
                    counselorsCount: counselors.length,
                    unassignedCount: unassignedStudents.length
                  })}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <School className="w-5 h-5" />
                </div>
                {/* Clean minimalist text tag */}
                <div className="text-[10px] font-black mt-2 text-slate-800 tracking-tight bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg shadow-sm whitespace-nowrap">
                  Institution Root
                </div>
              </div>

              {/* LEVEL 1: COUNSELORS + UNASSIGNED */}
              <div className="flex justify-center gap-24">
                
                {/* Active Counselors mapping */}
                {counselors.map((c) => {
                  const isCExpanded = expandedCounselors[c.username];
                  const cData = adminTreeData.find(x => x.counselor.username === c.username);
                  const totalCount = cData?.totalStudents || 0;
                  const cBatches = cData?.batches || [];

                  return (
                    <div key={c.id} className="flex flex-col items-center">
                      <div className="relative flex flex-col items-center mb-24 z-10">
                        
                        {/* Counselor node */}
                        <div 
                          data-node-id={`counselor-${c.username}`}
                          data-interactive="true"
                          className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 border-2 border-white shadow-md shadow-emerald-500/20 flex items-center justify-center text-white cursor-pointer transition-transform hover:scale-110 duration-200"
                          onMouseEnter={(e) => handleMouseEnter(e, `counselor-${c.username}`, 'counselor', c.username, {
                            email: c.email,
                            totalStudents: totalCount,
                            batchesCount: cBatches.length
                          })}
                          onMouseMove={handleMouseMove}
                          onMouseLeave={handleMouseLeave}
                        >
                          <User className="w-5 h-5" />
                        </div>
                        <div className="text-[10px] font-black mt-2 text-slate-800 tracking-tight bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg shadow-sm whitespace-nowrap capitalize">
                          {c.username}
                        </div>

                        {/* Mind-map branch toggle */}
                        <button
                          data-interactive="true"
                          onClick={() => setExpandedCounselors(prev => ({ ...prev, [c.username]: !prev[c.username] }))}
                          className="w-4.5 h-4.5 rounded-full bg-white border border-slate-200 hover:border-purple-300 text-slate-500 hover:text-purple-600 shadow-sm flex items-center justify-center absolute -bottom-3 z-30 cursor-pointer text-[9px] font-black transition-all"
                        >
                          {isCExpanded ? '−' : '+'}
                        </button>
                      </div>

                      {/* LEVEL 2 & 3: BATCHES & STUDENTS */}
                      {isCExpanded && (
                        <div className="flex justify-center gap-12">
                          {cBatches.length === 0 ? (
                            <div className="text-[9px] text-slate-400 font-extrabold bg-slate-100/50 border border-slate-200 rounded-lg p-2 max-w-[120px] text-center">
                              No Batches Alloc
                            </div>
                          ) : (
                            cBatches.map((batch) => {
                              const batchCompoundKey = `${c.username}-${batch.batchKey}`;
                              const isBExpanded = expandedBatches[batchCompoundKey];
                              const batchId = `batch-${c.username}-${batch.batchKey}`;

                              return (
                                <div key={batch.batchKey} className="flex flex-col items-center">
                                  <div className="relative flex flex-col items-center mb-24 z-10">
                                    <div 
                                      data-node-id={batchId}
                                      data-interactive="true"
                                      className="w-9 h-9 rounded-xl bg-blue-500 hover:bg-blue-600 border-2 border-white shadow-md shadow-blue-500/20 flex items-center justify-center text-white cursor-pointer transition-transform hover:scale-110 duration-200"
                                      onMouseEnter={(e) => handleMouseEnter(e, batchId, 'batch', batch.batchKey, {
                                        counselorUsername: c.username,
                                        headcount: batch.students.length
                                      })}
                                      onMouseMove={handleMouseMove}
                                      onMouseLeave={handleMouseLeave}
                                    >
                                      <BookOpen className="w-4.5 h-4.5" />
                                    </div>
                                    <div className="text-[9px] font-black mt-2 text-blue-900 bg-blue-50 border border-blue-150 px-2 py-0.5 rounded-lg shadow-sm whitespace-nowrap">
                                      {batch.batchKey}
                                    </div>

                                    <button
                                      data-interactive="true"
                                      onClick={() => setExpandedBatches(prev => ({ ...prev, [batchCompoundKey]: !prev[batchCompoundKey] }))}
                                      className="w-4 h-4 rounded-full bg-white border border-slate-200 hover:border-purple-300 text-slate-500 hover:text-purple-600 shadow flex items-center justify-center absolute -bottom-2.5 z-30 cursor-pointer text-[8px] font-black transition-all"
                                    >
                                      {isBExpanded ? '−' : '+'}
                                    </button>
                                  </div>

                                  {/* LEVEL 3: STUDENTS */}
                                  {isBExpanded && (
                                    <div className="flex justify-center gap-3">
                                      {batch.students.length === 0 ? (
                                        <div className="text-[8px] text-slate-400 font-extrabold">Empty Batch</div>
                                      ) : (
                                        batch.students.map((student) => {
                                          const studentId = `student-${student.id}`;
                                          return (
                                            <div key={student.id} className="flex flex-col items-center">
                                              <div 
                                                data-node-id={studentId}
                                                data-interactive="true"
                                                onClick={() => navigate(`/students/${student.id}`)}
                                                className="w-8 h-8 rounded-lg bg-purple-500 hover:bg-purple-600 border-2 border-white shadow flex items-center justify-center text-white cursor-pointer transition-all hover:scale-110 duration-200 relative"
                                                onMouseEnter={(e) => handleMouseEnter(e, studentId, 'student', `${student.firstName} ${student.lastName}`, student)}
                                                onMouseMove={handleMouseMove}
                                                onMouseLeave={handleMouseLeave}
                                              >
                                                <span className="text-[9px] font-black uppercase pointer-events-none">
                                                  {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                                </span>
                                              </div>
                                              <div className="text-[8px] font-bold text-slate-500 mt-1 max-w-[48px] truncate">
                                                {student.firstName}
                                              </div>
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Unassigned Student pool branch */}
                {role === 'admin' && unassignedStudents.length > 0 && (
                  <div className="flex flex-col items-center">
                    <div className="relative flex flex-col items-center mb-24 z-10">
                      
                      {/* Unassigned root */}
                      <div 
                        data-node-id="counselor-unassigned"
                        data-interactive="true"
                        className="w-10 h-10 rounded-full bg-rose-500 hover:bg-rose-600 border-2 border-white shadow-md shadow-rose-500/20 flex items-center justify-center text-white cursor-pointer transition-transform hover:scale-110 duration-200"
                        onMouseEnter={(e) => handleMouseEnter(e, 'counselor-unassigned', 'unassigned_group', 'Unallocated Student Pool', {
                          headcount: unassignedStudents.length
                        })}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                      >
                        <ShieldAlert className="w-5 h-5 animate-pulse" />
                      </div>
                      <div className="text-[10px] font-black mt-2 text-rose-950 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-lg shadow-sm whitespace-nowrap">
                        Unassigned Pool
                      </div>

                      <button
                        data-interactive="true"
                        onClick={() => setExpandedCounselors(prev => ({ ...prev, unassigned: !prev.unassigned }))}
                        className="w-4.5 h-4.5 rounded-full bg-white border border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-650 shadow flex items-center justify-center absolute -bottom-3 z-30 cursor-pointer text-[9px] font-black transition-all"
                      >
                        {expandedCounselors['unassigned'] ? '−' : '+'}
                      </button>
                    </div>

                    {/* Unassigned Batch and Members */}
                    {expandedCounselors['unassigned'] && (
                      <div className="flex flex-col items-center">
                        <div className="relative flex flex-col items-center mb-24 z-10">
                          <div 
                            data-node-id="batch-unassigned-Unallocated"
                            data-interactive="true"
                            className="w-9 h-9 rounded-xl bg-rose-500 hover:bg-rose-600 border-2 border-white shadow-md shadow-rose-500/20 flex items-center justify-center text-white cursor-pointer transition-transform hover:scale-110 duration-200"
                            onMouseEnter={(e) => handleMouseEnter(e, 'batch-unassigned-Unallocated', 'batch', 'Unallocated', {
                              counselorUsername: 'None',
                              headcount: unassignedStudents.length
                            })}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                          >
                            <BookOpen className="w-4.5 h-4.5" />
                          </div>
                          <div className="text-[9px] font-black mt-2 text-rose-900 bg-rose-50 border border-rose-150 px-2 py-0.5 rounded-lg shadow-sm whitespace-nowrap">
                            Pending Assign
                          </div>

                          <button
                            data-interactive="true"
                            onClick={() => setExpandedBatches(prev => ({ ...prev, 'unassigned-Unallocated': !prev['unassigned-Unallocated'] }))}
                            className="w-4 h-4 rounded-full bg-white border border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-650 shadow flex items-center justify-center absolute -bottom-2.5 z-30 cursor-pointer text-[8px] font-black transition-all"
                          >
                            {expandedBatches['unassigned-Unallocated'] ? '−' : '+'}
                          </button>
                        </div>

                        {/* Unallocated students row */}
                        {expandedBatches['unassigned-Unallocated'] && (
                          <div className="flex justify-center gap-3">
                            {unassignedStudents.map((student) => {
                              const studentId = `student-${student.id}`;
                              return (
                                <div key={student.id} className="flex flex-col items-center">
                                  <div 
                                    data-node-id={studentId}
                                    data-interactive="true"
                                    onClick={() => navigate(`/students/${student.id}`)}
                                    className="w-8 h-8 rounded-lg bg-purple-500 hover:bg-purple-600 border-2 border-white shadow flex items-center justify-center text-white cursor-pointer transition-all hover:scale-110 duration-200"
                                    onMouseEnter={(e) => handleMouseEnter(e, studentId, 'student', `${student.firstName} ${student.lastName}`, student)}
                                    onMouseMove={handleMouseMove}
                                    onMouseLeave={handleMouseLeave}
                                  >
                                    <span className="text-[9px] font-black uppercase pointer-events-none">
                                      {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                    </span>
                                  </div>
                                  <div className="text-[8px] font-bold text-slate-500 mt-1 max-w-[48px] truncate">
                                    {student.firstName}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}

              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* RENDER VIEW 2: COUNSELOR VIEW              */}
          {/* ========================================== */}
          {role === 'counselor' && (
            <div className="flex flex-col items-center">
              
              {/* LEVEL 1: COUNSELOR ROOT */}
              <div className="flex flex-col items-center mb-24 relative z-10">
                <div 
                  data-node-id="counselor-root"
                  data-interactive="true"
                  className="w-10 h-10 rounded-full bg-emerald-500 border-2 border-white shadow-md shadow-emerald-500/20 flex items-center justify-center text-white"
                  onMouseEnter={(e) => handleMouseEnter(e, 'counselor-root', 'counselor', user?.username || 'Counselor Desk', {
                    email: user?.email,
                    totalStudents: students.length,
                    batchesCount: counselorTreeData.length
                  })}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <User className="w-5 h-5" />
                </div>
                <div className="text-[10px] font-black mt-2 text-slate-800 tracking-tight bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg shadow-sm whitespace-nowrap capitalize">
                  Counselor: {user?.username}
                </div>
              </div>

              {/* LEVEL 2: BATCHES */}
              <div className="flex justify-center gap-16">
                {counselorTreeData.length === 0 ? (
                  <div className="bg-white p-6 rounded-2xl border border-gray-150 text-center max-w-[200px] text-xs text-gray-400 font-bold">
                    No active student counseling allocations
                  </div>
                ) : (
                  counselorTreeData.map((batch) => {
                    const isBExpanded = expandedBatches[batch.batchKey];
                    const batchId = `batch-${batch.batchKey}`;

                    return (
                      <div key={batch.batchKey} className="flex flex-col items-center">
                        <div className="relative flex flex-col items-center mb-24 z-10">
                          <div 
                            data-node-id={batchId}
                            data-interactive="true"
                            className="w-9 h-9 rounded-xl bg-blue-500 hover:bg-blue-600 border-2 border-white shadow flex items-center justify-center text-white cursor-pointer transition-transform hover:scale-110 duration-200"
                            onMouseEnter={(e) => handleMouseEnter(e, batchId, 'batch', batch.batchKey, {
                              counselorUsername: user?.username,
                              headcount: batch.students.length
                            })}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                          >
                            <BookOpen className="w-4.5 h-4.5" />
                          </div>
                          <div className="text-[9px] font-black mt-2 text-blue-900 bg-blue-50 border border-blue-150 px-2 py-0.5 rounded-lg shadow-sm whitespace-nowrap">
                            {batch.batchKey}
                          </div>

                          <button
                            data-interactive="true"
                            onClick={() => setExpandedBatches(prev => ({ ...prev, [batch.batchKey]: !prev[batch.batchKey] }))}
                            className="w-4 h-4 rounded-full bg-white border border-slate-200 hover:border-purple-300 text-slate-500 hover:text-purple-600 shadow flex items-center justify-center absolute -bottom-2.5 z-30 cursor-pointer text-[8px] font-black transition-all"
                          >
                            {isBExpanded ? '−' : '+'}
                          </button>
                        </div>

                        {/* LEVEL 3: STUDENTS */}
                        {isBExpanded && (
                          <div className="flex justify-center gap-3">
                            {batch.students.map((student) => {
                              const studentId = `student-${student.id}`;
                              return (
                                <div key={student.id} className="flex flex-col items-center">
                                  <div 
                                    data-node-id={studentId}
                                    data-interactive="true"
                                    onClick={() => navigate(`/students/${student.id}`)}
                                    className="w-8 h-8 rounded-lg bg-purple-500 hover:bg-purple-600 border-2 border-white shadow flex items-center justify-center text-white cursor-pointer transition-all hover:scale-110 duration-200"
                                    onMouseEnter={(e) => handleMouseEnter(e, studentId, 'student', `${student.firstName} ${student.lastName}`, student)}
                                    onMouseMove={handleMouseMove}
                                    onMouseLeave={handleMouseLeave}
                                  >
                                    <span className="text-[9px] font-black uppercase pointer-events-none">
                                      {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                    </span>
                                  </div>
                                  <div className="text-[8px] font-bold text-slate-500 mt-1 max-w-[48px] truncate">
                                    {student.firstName}
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

            </div>
          )}

          {/* ========================================== */}
          {/* RENDER VIEW 3: STUDENT VIEW                */}
          {/* ========================================== */}
          {role === 'student' && studentSelfProfile && (
            <div className="flex flex-col items-center">
              
              {/* LEVEL 1: ASSIGNED COUNSELOR DESK */}
              <div className="flex flex-col items-center mb-24 relative z-10">
                <div 
                  data-node-id="counselor-root"
                  data-interactive="true"
                  className="w-10 h-10 rounded-full bg-emerald-500 border-2 border-white shadow flex items-center justify-center text-white"
                  onMouseEnter={(e) => handleMouseEnter(e, 'counselor-root', 'counselor', studentSelfProfile.counselorUsername || 'Academic Counselor', {
                    email: 'Primary Academic Advisor',
                    totalStudents: studentPeers.length + 1,
                    batchesCount: 1
                  })}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <User className="w-5 h-5" />
                </div>
                <div className="text-[10px] font-black mt-2 text-slate-800 tracking-tight bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg shadow-sm whitespace-nowrap capitalize">
                  Counselor: {studentSelfProfile.counselorUsername || 'Advisor'}
                </div>
              </div>

              {/* LEVEL 2: STUDENT BATCH */}
              <div className="flex flex-col items-center">
                <div className="relative flex flex-col items-center mb-24 z-10">
                  <div 
                    data-node-id="batch-root"
                    data-interactive="true"
                    className="w-9 h-9 rounded-xl bg-blue-500 border-2 border-white shadow flex items-center justify-center text-white"
                    onMouseEnter={(e) => handleMouseEnter(e, 'batch-root', 'batch', `${studentSelfProfile.className} - ${studentSelfProfile.branch} - Sec ${studentSelfProfile.section}`, {
                      counselorUsername: studentSelfProfile.counselorUsername || 'N/A',
                      headcount: studentPeers.length + 1
                    })}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    <BookOpen className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-[9px] font-black mt-2 text-blue-900 bg-blue-50 border border-blue-150 px-2.5 py-0.5 rounded-lg shadow-sm whitespace-nowrap">
                    Batch: {studentSelfProfile.className} - {studentSelfProfile.branch} (Sec {studentSelfProfile.section})
                  </div>
                </div>

                {/* LEVEL 3: PEERS & SELF MAP */}
                <div className="flex justify-center gap-6">
                  {studentBatchMembers.map((s: any) => {
                    const isSelf = s.isSelf === true;
                    const studentId = `student-${s.id}`;

                    return (
                      <div key={s.id} className="flex flex-col items-center relative">
                        <div 
                          data-node-id={studentId}
                          data-interactive="true"
                          onClick={() => !isSelf && navigate(`/students/${s.id}`)}
                          className={`w-8 h-8 rounded-lg border-2 border-white shadow flex items-center justify-center text-white cursor-pointer transition-all hover:scale-110 duration-200 relative ${
                            isSelf 
                              ? 'bg-amber-500 hover:bg-amber-600 ring-4 ring-amber-400/20 active-path-glow animate-pulse scale-105' 
                              : 'bg-purple-500 hover:bg-purple-600'
                          }`}
                          onMouseEnter={(e) => handleMouseEnter(e, studentId, 'student', `${s.firstName} ${s.lastName}`, s)}
                          onMouseMove={handleMouseMove}
                          onMouseLeave={handleMouseLeave}
                        >
                          <span className="text-[9px] font-black uppercase pointer-events-none">
                            {s.firstName.charAt(0)}{s.lastName.charAt(0)}
                          </span>

                          {/* EXACT ATTACHMENT LABELLING FOR SELF NODE */}
                          {isSelf && (
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none select-none z-30">
                              <span className="text-[8px] font-black text-amber-550 -mt-1">↑</span>
                              <span className="text-[8px] font-black text-amber-800 bg-amber-50 border border-amber-250 px-1.5 py-0.5 rounded shadow-sm uppercase tracking-widest whitespace-nowrap scale-90">
                                You
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className={`text-[8.5px] mt-1 text-center max-w-[50px] truncate ${
                          isSelf ? 'text-amber-800 font-black' : 'text-slate-500 font-bold'
                        }`}>
                          {s.firstName} {isSelf && '(You)'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* Fallback if Student View has no allocated Counselor */}
          {role === 'student' && !studentSelfProfile?.counselorUsername && (
            <div className="bg-white p-8 rounded-3xl border border-gray-150 text-center max-w-sm">
              <HelpCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="font-bold text-gray-800 text-sm">No Counselor Allocated</p>
              <p className="text-xs text-gray-450 mt-1">Please contact your academic office to get allocated to an advisor counselor desk.</p>
            </div>
          )}

        </div>
      </div>

      {/* FIGMA WORKSPACE FLOATING PROPERTIES INSPECT PANEL */}
      {hoveredNode && (
        <div 
          className="fixed bg-slate-950/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-4 text-left pointer-events-none z-[9999] space-y-3 transition-all duration-75 text-white max-w-[280px] w-64 ring-1 ring-white/10"
          style={getTooltipStyle()}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-purple-400" />
              Figma Property Inspector
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-[8px] font-black uppercase text-gray-350 tracking-wider">
              {hoveredNode.type.replace('_', ' ')}
            </span>
          </div>

          {/* Panel Properties depending on Node Type */}
          {hoveredNode.type === 'root' && (
            <div className="text-[11px] font-mono space-y-1.5 text-gray-300">
              <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-500">LAYER_NAME:</span> <span className="font-bold text-emerald-400">INST_ROOT</span></div>
              <div className="flex justify-between"><span className="text-gray-500">COUNSELORS:</span> <span>{hoveredNode.data.counselorsCount} active</span></div>
              <div className="flex justify-between"><span className="text-gray-500">STUDENTS:</span> <span>{hoveredNode.data.studentsCount} active</span></div>
              <div className="flex justify-between"><span className="text-gray-500">UNALLOCATED:</span> <span className={hoveredNode.data.unassignedCount > 0 ? "text-rose-400 font-bold" : "text-gray-300"}>{hoveredNode.data.unassignedCount} students</span></div>
            </div>
          )}

          {hoveredNode.type === 'unassigned_group' && (
            <div className="text-[11px] font-mono space-y-1.5 text-gray-300">
              <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-500">POOL_NAME:</span> <span className="font-bold text-rose-400">UNALLOCATED</span></div>
              <div className="flex justify-between"><span className="text-gray-500">HEADCOUNT:</span> <span>{hoveredNode.data.headcount} remaining</span></div>
              <div className="flex justify-between"><span className="text-gray-500">ACTION:</span> <span className="text-amber-400 animate-pulse font-bold">Assign Required</span></div>
            </div>
          )}

          {hoveredNode.type === 'counselor' && (
            <div className="text-[11px] font-mono space-y-1.5 text-gray-300">
              <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-500">ADVISOR:</span> <span className="capitalize font-bold text-emerald-400">{hoveredNode.title}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">EMAIL:</span> <span className="lowercase truncate max-w-[120px]">{hoveredNode.data.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">BATCH_COUNT:</span> <span>{hoveredNode.data.batchesCount} groups</span></div>
              <div className="flex justify-between"><span className="text-gray-500">HEADCOUNT:</span> <span>{hoveredNode.data.totalStudents} students</span></div>
            </div>
          )}

          {hoveredNode.type === 'batch' && (
            <div className="text-[11px] font-mono space-y-1.5 text-gray-300">
              <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-500">BATCH_ID:</span> <span className="font-bold text-blue-400">{hoveredNode.title}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">ADVISOR:</span> <span className="capitalize text-gray-250">{hoveredNode.data.counselorUsername}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">HEADCOUNT:</span> <span>{hoveredNode.data.headcount} students</span></div>
            </div>
          )}

          {hoveredNode.type === 'student' && (
            <div className="text-[11px] font-mono space-y-1.5 text-gray-300">
              <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-500">STUDENT:</span> <span className="font-sans font-bold text-purple-300">{hoveredNode.title}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">ROLL_NO:</span> <span className="text-gray-200">{hoveredNode.data.rollNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">CLASS:</span> <span>{hoveredNode.data.className}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">BRANCH:</span> <span>{hoveredNode.data.branch || 'General'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">SECTION:</span> <span>Sec {hoveredNode.data.section || 'A'}</span></div>
              <div className="flex justify-between border-t border-white/5 pt-1.5"><span className="text-gray-500">EMAIL:</span> <span className="lowercase truncate max-w-[130px] font-sans text-gray-350">{hoveredNode.data.email}</span></div>
            </div>
          )}

          {/* Call-to-action click notice for students */}
          {hoveredNode.type === 'student' && (
            <div className="text-[9px] font-bold text-center text-purple-400/80 bg-purple-950/40 border border-purple-900/40 rounded-lg py-1 flex items-center justify-center gap-1 mt-2">
              <ExternalLink className="h-3 w-3" /> Click Node to Open Profile
            </div>
          )}
        </div>
      )}
      
    </div>
  );
}
