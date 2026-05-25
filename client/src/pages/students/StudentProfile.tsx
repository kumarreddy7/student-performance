import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAnalyticsStore } from '../../features/analytics/analyticsStore';
import { useStudentStore } from '../../features/students/studentStore';
import { useAuthStore } from '../../features/auth/authStore';
import api from '../../lib/axios';
import { ArrowLeft, User, Calendar, Mail, AlertCircle, Activity, MessageSquare, Clock, Plus, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { generateRiskScore } = useAnalyticsStore();
  const { deleteStudent } = useStudentStore();
  const user = useAuthStore((state) => state.user);
  const isAuthorized = user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'counselor';
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [interventions, setInterventions] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [interventionType, setInterventionType] = useState('Academic Support');
  const [postingNote, setPostingNote] = useState(false);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Counselor allocation states
  const [counselors, setCounselors] = useState<any[]>([]);
  const [selectedCounselor, setSelectedCounselor] = useState<string>('');
  const [updatingCounselor, setUpdatingCounselor] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [isReallocateDialogOpen, setIsReallocateDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/auth/counselors')
        .then(res => {
          const uniqueCounselors = (res.data || []).filter(
            (c: any, index: number, self: any[]) =>
              self.findIndex((t: any) => t.username === c.username) === index
          );
          setCounselors(uniqueCounselors);
        })
        .catch(err => console.error('Failed to fetch counselors list', err));
    }
  }, [user]);

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await deleteStudent(Number(id));
      navigate('/students');
    } catch (err) {
      console.error('Failed to delete student record', err);
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const fetchStudentAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsRes, studentRes] = await Promise.all([
        api.get(`/analytics/student/${id}`),
        api.get(`/students/${id}`)
      ]);
      setData({
        student: studentRes.data,
        history: analyticsRes.data.history
      });
      if (studentRes.data?.counselorUsername) {
        setSelectedCounselor(studentRes.data.counselorUsername);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load student profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchInterventions = async () => {
    try {
      const response = await api.get(`/students/${id}/interventions`);
      setInterventions(response.data);
    } catch (err: any) {
      console.error('Failed to load interventions', err);
    }
  };

  useEffect(() => {
    fetchStudentAnalytics();
    fetchInterventions();
  }, [id]);

  const handleGenerateRisk = async () => {
    setGenerating(true);
    const mockData = {
      studentId: Number(id),
      semester: 'Fall 2024',
      gpa: (Math.random() * 2 + 2).toFixed(2),
      attendancePercentage: (Math.random() * 40 + 60).toFixed(2),
      behaviorScore: (Math.random() * 5 + 5).toFixed(2),
    };
    
    const result = await generateRiskScore(mockData);
    if (result) {
      await fetchStudentAnalytics();
    }
    setGenerating(false);
  };

  const handleAllocateClick = () => {
    if (!data?.student) return;
    if (data.student.counselorUsername && data.student.counselorUsername !== selectedCounselor) {
      setIsReallocateDialogOpen(true);
    } else {
      confirmAllocateCounselor();
    }
  };

  const confirmAllocateCounselor = async () => {
    if (!data?.student) return;
    setUpdatingCounselor(true);
    setToastMsg('');
    setIsReallocateDialogOpen(false);
    try {
      await api.patch(`/students/${id}/counselor?counselorUsername=${encodeURIComponent(selectedCounselor)}`);
      await fetchStudentAnalytics();
      setToastMsg('Counselor allocated successfully!');
    } catch (err: any) {
      console.error('Failed to allocate counselor', err);
      setToastMsg(err.response?.data?.message || 'Failed to allocate counselor.');
    } finally {
      setUpdatingCounselor(false);
    }
  };

  const handlePostIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      setPostingNote(true);
      await api.post(`/students/${id}/interventions`, {
        counselorName: user?.username || 'Admin / Counselor',
        type: interventionType,
        notes: newNote
      });
      setNewNote('');
      await fetchInterventions();
    } catch (err) {
      console.error('Failed to post intervention', err);
    } finally {
      setPostingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress className="!text-purple-600" />
      </div>
    );
  }

  if (error || !data?.student) {
    return (
      <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-600 shadow-sm">
        <p className="font-medium">{error || 'Student not found'}</p>
        <button onClick={() => navigate('/students')} className="mt-2 text-sm text-red-700 hover:text-red-800 underline font-medium">Go Back</button>
      </div>
    );
  }

  const { student, history } = data;
  const latestRecord = history?.length > 0 ? history[history.length - 1] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <button 
            onClick={() => navigate('/students')}
            className="p-2.5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all self-start"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex flex-wrap items-center gap-2 sm:gap-3">
              {student.firstName} {student.lastName}
              {latestRecord && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm
                  ${latestRecord.riskCategory === 'HIGH' ? 'bg-red-100 text-red-700 border border-red-200' : 
                    latestRecord.riskCategory === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 
                    'bg-green-100 text-green-700 border border-green-200'}`}>
                  {latestRecord.riskCategory} RISK
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-gray-500">Student Profile & Analytics View</p>
          </div>
        </div>

        {isAuthorized && (
          <Button
            onClick={() => setIsDeleteDialogOpen(true)}
            variant="contained"
            startIcon={<Trash2 className="h-4 w-4" />}
            className="!bg-red-650 hover:!bg-red-700 !text-white !rounded-xl !px-4 !py-2.5 !shadow-none !capitalize self-start sm:self-center"
          >
            Delete Student
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 h-28 relative">
            <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
          </div>
          <div className="px-6 pb-6 relative">
            <div className="h-20 w-20 bg-white rounded-2xl p-1 absolute -top-10 border border-gray-100 flex items-center justify-center shadow-md rotate-3">
              <User className="h-10 w-10 text-gray-400 -rotate-3" />
            </div>
            <div className="pt-14 space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                  <Mail className="h-4 w-4" /> Email
                </p>
                <p className="text-sm font-medium text-gray-900">{student.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4" /> Enrollment Date
                </p>
                <p className="text-sm font-medium text-gray-900">{student.enrollmentDate}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                  <User className="h-4 w-4" /> Assigned Counselor
                </p>
                <p className="text-sm font-semibold text-purple-700 capitalize">
                  {student.counselorUsername ? student.counselorUsername : 'Unassigned'}
                </p>
              </div>

              {user?.role === 'admin' && (
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Allocate Counselor Advisor
                  </p>
                  <FormControl fullWidth size="small">
                    <Select
                      value={selectedCounselor}
                      onChange={(e) => setSelectedCounselor(e.target.value)}
                      displayEmpty
                      className="rounded-xl bg-gray-50/50"
                      sx={{ borderRadius: '12px', fontSize: '13px' }}
                    >
                      <MenuItem value="" sx={{ fontSize: '13px' }}><em>Unassigned</em></MenuItem>
                      {counselors.map((c) => (
                        <MenuItem key={c.id} value={c.username} sx={{ fontSize: '13px' }}>
                          {c.username} ({c.email})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    onClick={handleAllocateClick}
                    disabled={updatingCounselor}
                    variant="contained"
                    fullWidth
                    className="!bg-purple-600 hover:!bg-purple-700 !text-white !rounded-xl !py-2 !text-xs !font-bold !shadow-none !capitalize"
                  >
                    {updatingCounselor ? 'Allocating...' : 'Allocate Counselor'}
                  </Button>
                  {toastMsg && (
                    <p className={`text-xs text-center font-semibold mt-1 ${toastMsg.includes('successful') ? 'text-green-600' : 'text-red-600'}`}>
                      {toastMsg}
                    </p>
                  )}
                </div>
              )}
              
              <div className="pt-5 border-t border-gray-100">
                <button
                  onClick={handleGenerateRisk}
                  disabled={generating}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5"
                >
                  {generating ? <CircularProgress size={16} className="!text-white" /> : <Activity className="h-4 w-4" />}
                  {generating ? 'Calculating...' : 'Run Prediction Engine'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Chart */}
        <div className="md:col-span-2 bg-white shadow-sm rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <h3 className="text-lg leading-6 font-bold text-gray-900 mb-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-purple-500" />
            Historical Risk Trend
          </h3>
          <div className="h-72">
            {history && history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={history}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="createdAt" tickFormatter={(tick) => new Date(tick).toLocaleDateString()} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dx={-10} />
                  <Tooltip 
                    labelFormatter={(label) => new Date(label).toLocaleString()}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="riskScore" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#7c3aed' }} activeDot={{ r: 6, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <Activity className="h-10 w-10 text-gray-300 mb-2" />
                <p className="font-medium">No historical risk data found</p>
                <p className="mt-1">Run the Prediction Engine to generate a score</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interventions Section */}
      <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden mt-6">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/80 flex items-center gap-3">
          <div className="bg-purple-100 p-1.5 rounded-lg">
            <MessageSquare className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="text-lg leading-6 font-bold text-gray-900">Interventions & Notes</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          
          {/* Post New Note */}
          <div className="p-6 bg-white">
            <h4 className="text-sm font-bold text-gray-900 mb-5 uppercase tracking-wide">Add New Note</h4>
            <form onSubmit={handlePostIntervention} className="space-y-5">
              <FormControl fullWidth size="small">
                <InputLabel id="intervention-type-label">Type</InputLabel>
                <Select
                  labelId="intervention-type-label"
                  value={interventionType}
                  label="Type"
                  onChange={(e) => setInterventionType(e.target.value)}
                  className="rounded-xl bg-gray-50/50"
                  sx={{ borderRadius: '12px' }}
                >
                  <MenuItem value="Academic Support">Academic Support</MenuItem>
                  <MenuItem value="Behavioral Counseling">Behavioral Counseling</MenuItem>
                  <MenuItem value="Attendance Meeting">Attendance Meeting</MenuItem>
                  <MenuItem value="Parent Meeting">Parent Meeting</MenuItem>
                  <MenuItem value="General Note">General Note</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Notes"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter intervention details..."
                required
                variant="outlined"
                className="bg-gray-50/50"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              
              <button
                type="submit"
                disabled={postingNote}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5"
              >
                {postingNote ? <CircularProgress size={16} className="!text-white" /> : <Plus className="h-4 w-4" />}
                {postingNote ? 'Saving...' : 'Save Intervention'}
              </button>
            </form>
          </div>

          {/* Timeline */}
          <div className="p-6 md:col-span-2 bg-gray-50/30">
            <div className="space-y-6">
              {interventions.length > 0 ? (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {interventions.map((intervention, index) => (
                      <li key={intervention.id || index}>
                        <div className="relative pb-8">
                          {index !== interventions.length - 1 ? (
                             <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex items-start space-x-3">
                            <div className="relative">
                              <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center ring-8 ring-white shadow-sm border border-purple-100">
                                <Clock className="h-5 w-5 text-purple-600" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-center mb-2">
                                <p className="text-sm font-medium text-gray-900">
                                  {intervention.counselorName} <span className="text-gray-400 font-normal">added a</span> {intervention.type} <span className="text-gray-400 font-normal">note</span>
                                </p>
                                <div className="text-xs font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-md">
                                  {new Date(intervention.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 leading-relaxed bg-gray-50/50 p-3 rounded-xl border border-gray-50">
                                {intervention.notes}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                  <div className="mx-auto h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <MessageSquare className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">No interventions yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Add a note to start tracking interventions for this student.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Student Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            className: '!rounded-2xl !p-2'
          }
        }}
      >
        <DialogTitle className="!font-bold !text-xl !pb-2">Delete Student Record</DialogTitle>
        <DialogContent className="!space-y-2 !pt-0">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{student.firstName} {student.lastName}</strong>? This action is permanent and cannot be undone.
          </p>
        </DialogContent>
        <DialogActions className="!px-6 !pb-4 !pt-2">
          <Button 
            onClick={() => setIsDeleteDialogOpen(false)} 
            className="!text-gray-500 !rounded-xl"
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            className="!bg-red-600 hover:!bg-red-700 !text-white !rounded-xl !px-6"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Student'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reallocate Counselor Confirmation Dialog */}
      <Dialog
        open={isReallocateDialogOpen}
        onClose={() => setIsReallocateDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            className: '!rounded-2xl !p-2'
          }
        }}
      >
        <DialogTitle className="!font-bold !text-xl !pb-2">Reallocate Counselor</DialogTitle>
        <DialogContent className="!space-y-2 !pt-0">
          <p className="text-sm text-gray-650">
            This student is already allocated to counselor <strong>{student.counselorUsername}</strong>. 
            Are you sure you want to reallocate them to counselor <strong>{selectedCounselor || 'Unassigned'}</strong>?
          </p>
        </DialogContent>
        <DialogActions className="!px-6 !pb-4 !pt-2">
          <Button 
            onClick={() => setIsReallocateDialogOpen(false)} 
            className="!text-gray-500 !rounded-xl"
            disabled={updatingCounselor}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmAllocateCounselor} 
            variant="contained" 
            className="!bg-purple-600 hover:!bg-purple-700 !text-white !rounded-xl !px-6"
            disabled={updatingCounselor}
          >
            {updatingCounselor ? 'Allocating...' : 'Confirm Reallocation'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
