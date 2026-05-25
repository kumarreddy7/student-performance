import { useState, useEffect } from 'react';
import { 
  Building2, Users, CalendarDays, Plus, 
  Search, GitBranch, Trash2, CheckCircle2 
} from 'lucide-react';
import { 
  Dialog, DialogTitle, DialogContent, 
  DialogActions, Button, TextField 
} from '@mui/material';

interface BranchInfo {
  id: string;
  name: string;
  code: string;
  hodName: string;
  totalStudents: number;
  totalFaculty: number;
  upcomingEvents: string[];
}

const DEFAULT_BRANCHES: BranchInfo[] = [
  { id: '1', name: 'Computer Science', code: 'CSE', hodName: 'Dr. Alan Turing', totalStudents: 450, totalFaculty: 42, upcomingEvents: ['Hackathon 2024', 'Tech Symposium'] },
  { id: '2', name: 'Electronics Engineering', code: 'ECE', hodName: 'Dr. Ada Lovelace', totalStudents: 320, totalFaculty: 28, upcomingEvents: ['Circuit Design Workshop'] },
  { id: '3', name: 'Mechanical Engineering', code: 'MECH', hodName: 'Dr. Henry Ford', totalStudents: 280, totalFaculty: 25, upcomingEvents: ['Auto Expo Visit', 'CAD Seminar'] },
  { id: '4', name: 'Civil Engineering', code: 'CE', hodName: 'Dr. John Smeaton', totalStudents: 150, totalFaculty: 18, upcomingEvents: ['Bridge Design Contest'] },
];

export default function BranchManagement() {
  const [branches, setBranches] = useState<BranchInfo[]>(() => {
    const saved = localStorage.getItem('app_branches');
    return saved ? JSON.parse(saved) : DEFAULT_BRANCHES;
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newHodName, setNewHodName] = useState('');

  useEffect(() => {
    localStorage.setItem('app_branches', JSON.stringify(branches));
  }, [branches]);

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName || !newBranchCode) return;
    
    const newBranch: BranchInfo = {
      id: Date.now().toString(),
      name: newBranchName,
      code: newBranchCode,
      hodName: newHodName || 'Unassigned',
      totalStudents: 0,
      totalFaculty: 0,
      upcomingEvents: []
    };
    
    setBranches([...branches, newBranch]);
    setIsAddDialogOpen(false);
    setNewBranchName('');
    setNewBranchCode('');
    setNewHodName('');
  };

  const handleDeleteBranch = (id: string) => {
    if (confirm('Are you sure you want to delete this branch?')) {
      setBranches(branches.filter(b => b.id !== id));
    }
  };

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <GitBranch className="h-7 w-7 text-purple-600" />
            Branch Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            Manage institutional branches, HOD assignments, and branch events.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <Button
            variant="contained"
            onClick={() => setIsAddDialogOpen(true)}
            startIcon={<Plus className="h-4 w-4" />}
            className="!rounded-xl !capitalize !px-4 !py-2.5 !bg-purple-600 hover:!bg-purple-700 !shadow-none font-bold"
          >
            Add New Branch
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search branches by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 rounded-xl pl-9 pr-3 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-700 shadow-sm"
          />
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBranches.map(branch => (
          <div key={branch.id} className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl border border-purple-100">
                  {branch.code}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{branch.name}</h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Active Branch
                  </p>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteBranch(branch.id)}
                className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-gray-400" /> Head of Dept
                </span>
                <span className="text-sm font-bold text-gray-900">{branch.hodName}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex flex-col items-center justify-center text-center">
                  <Users className="h-5 w-5 text-indigo-500 mb-1" />
                  <span className="text-2xl font-black text-indigo-950">{branch.totalStudents}</span>
                  <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">Students</span>
                </div>
                <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100/50 flex flex-col items-center justify-center text-center">
                  <Users className="h-5 w-5 text-purple-500 mb-1" />
                  <span className="text-2xl font-black text-purple-950">{branch.totalFaculty}</span>
                  <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wider">Faculty</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-2">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <CalendarDays className="h-4 w-4 text-purple-400" /> Branch Events
                </h4>
                {branch.upcomingEvents.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No upcoming events scheduled.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {branch.upcomingEvents.map((evt, i) => (
                      <li key={i} className="text-xs font-medium text-gray-700 bg-white border border-gray-100 shadow-sm px-2.5 py-1.5 rounded-lg flex items-center before:content-[''] before:h-1.5 before:w-1.5 before:bg-purple-500 before:rounded-full before:mr-2">
                        {evt}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredBranches.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400">
            <GitBranch className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="font-bold text-gray-600">No branches found</p>
          </div>
        )}
      </div>

      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} maxWidth="xs" fullWidth slotProps={{ paper: { className: '!rounded-3xl !p-2' } }}>
        <DialogTitle className="!font-bold !text-xl">Add New Branch</DialogTitle>
        <form onSubmit={handleAddBranch}>
          <DialogContent className="!space-y-4">
            <TextField
              label="Branch Name"
              fullWidth
              required
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              slotProps={{ input: { className: '!rounded-xl' } }}
            />
            <TextField
              label="Branch Code (e.g. CSE)"
              fullWidth
              required
              value={newBranchCode}
              onChange={(e) => setNewBranchCode(e.target.value)}
              slotProps={{ input: { className: '!rounded-xl' } }}
            />
            <TextField
              label="HOD Name (Optional)"
              fullWidth
              value={newHodName}
              onChange={(e) => setNewHodName(e.target.value)}
              slotProps={{ input: { className: '!rounded-xl' } }}
            />
          </DialogContent>
          <DialogActions className="!px-6 !pb-4">
            <Button onClick={() => setIsAddDialogOpen(false)} className="!text-gray-500 !rounded-xl !capitalize">Cancel</Button>
            <Button type="submit" variant="contained" className="!bg-purple-600 !text-white !rounded-xl !capitalize !shadow-none font-bold">Add Branch</Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}
