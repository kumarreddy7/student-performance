import { useEffect, useRef, useState } from 'react';
import { useStudentStore } from '../../features/students/studentStore';
import { useAuthStore } from '../../features/auth/authStore';
import { Upload, Plus, Users as UsersIcon, ChevronRight, Search, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

export default function Students() {
  const navigate = useNavigate();
  const { fetchStudentsPaged, uploadCsv, createStudent, searchQuery, setSearchQuery, isLoading } = useStudentStore();
  const { user, anonymize } = useAuthStore();
  const isAuthorized = user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'counselor';
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  // Pagination & Server-side filtering state
  const [pagedStudents, setPagedStudents] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Add Student Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [rollNumber, setRollNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState('Active');
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPagedStudents = async () => {
    try {
      const data = await fetchStudentsPaged(currentPage, pageSize, searchQuery);
      if (data) {
        setPagedStudents(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err) {
      console.error("Failed to load paged students", err);
    }
  };

  useEffect(() => {
    // Reset to page 0 when search query changes
    setCurrentPage(0);
  }, [searchQuery]);

  useEffect(() => {
    loadPagedStudents();
  }, [currentPage, pageSize, searchQuery]);

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber || !firstName || !lastName || !email || !className || !section) {
      setSubmitError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await createStudent({
        rollNumber,
        firstName,
        lastName,
        email,
        className,
        section,
        phoneNumber,
        status,
        enrollmentDate
      });
      setIsAddDialogOpen(false);
      
      // Reset form fields
      setRollNumber('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setClassName('');
      setSection('');
      setPhoneNumber('');
      setStatus('Active');
      setEnrollmentDate(new Date().toISOString().split('T')[0]);
      setMessage('Student added successfully!');
      
      loadPagedStudents();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to add student.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage('');
    try {
      await uploadCsv(file);
      setMessage('CSV imported successfully!');
      loadPagedStudents();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'CSV upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-xl shadow-sm ${message.toLowerCase().includes('success') ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-red-50 border border-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-purple-600" />
            Students Directory
          </h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            Search, paginate, and manage student profiles.
          </p>
        </div>
        
        {isAuthorized && (
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".csv"
            />
            <Button
              variant="outlined"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              startIcon={<Upload className="h-4 w-4" />}
              className="!rounded-xl !capitalize !px-4 !py-2.5 !border-gray-200 !text-gray-700 hover:!bg-gray-50"
            >
              {uploading ? 'Importing...' : 'Import CSV'}
            </Button>
            <Button
              variant="contained"
              onClick={() => setIsAddDialogOpen(true)}
              startIcon={<Plus className="h-4 w-4" />}
              className="!rounded-xl !capitalize !px-4 !py-2.5 !bg-purple-600 hover:!bg-purple-700 !shadow-none"
            >
              Add Student
            </Button>
          </div>
        )}
      </div>

      {/* Server Search bar (Always Visible) */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search roll, name, class, section..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white rounded-xl pl-11 pr-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm text-gray-700 shadow-sm placeholder-gray-400"
        />
      </div>

      {/* Mobile view */}
      <div className="block sm:hidden space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center flex flex-col items-center justify-center shadow-sm">
            <CircularProgress size={24} className="!text-purple-600" />
            <p className="mt-2 text-sm text-gray-500">Loading student list...</p>
          </div>
        ) : pagedStudents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500 shadow-sm">
            <div className="flex flex-col items-center">
              <UsersIcon className="h-10 w-10 text-gray-300 mb-2" />
              <p className="font-semibold text-gray-700">No students matched</p>
              <p className="text-xs text-gray-400 mt-1">Try another filter keyword.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {pagedStudents.map((student) => (
              <div 
                key={student.id} 
                onClick={() => navigate(`/students/${student.id}`)}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm active:bg-gray-50 flex items-center justify-between transition-all duration-200 cursor-pointer hover:shadow-md"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {anonymize ? 'ST' : `${student.firstName?.charAt(0)}${student.lastName?.charAt(0)}`}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate text-sm">
                      {anonymize ? `STUDENT_ST-${student.id}` : `${student.firstName} ${student.lastName}`}
                    </h3>
                    <div className="flex flex-col gap-0.5 mt-1 text-xs text-gray-500">
                      <span>Roll: {anonymize ? `ST-${student.id}` : student.rollNumber}</span>
                      <span>Class: {student.className} - {student.section}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop/Tablet Table View */}
      <div className="hidden sm:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <TableContainer component={Paper} elevation={0} className="!rounded-3xl !overflow-x-auto">
          <Table sx={{ minWidth: 650 }} aria-label="students table">
            <TableHead className="bg-gray-50/50 border-b border-gray-100">
              <TableRow>
                <TableRow>
                  <TableCell className="!font-bold !text-gray-500 !text-[11px] !uppercase !tracking-wider">Roll No</TableCell>
                  <TableCell className="!font-bold !text-gray-500 !text-[11px] !uppercase !tracking-wider">Name</TableCell>
                  <TableCell className="!font-bold !text-gray-500 !text-[11px] !uppercase !tracking-wider">Class / Sec</TableCell>
                  <TableCell className="!font-bold !text-gray-500 !text-[11px] !uppercase !tracking-wider">Email Address</TableCell>
                  <TableCell className="!font-bold !text-gray-500 !text-[11px] !uppercase !tracking-wider">Phone</TableCell>
                  <TableCell className="!font-bold !text-gray-500 !text-[11px] !uppercase !tracking-wider">Status</TableCell>
                  <TableCell align="right" className="!font-bold !text-gray-500 !text-[11px] !uppercase !tracking-wider">Actions</TableCell>
                </TableRow>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" className="!py-14">
                    <CircularProgress size={26} className="!text-purple-600" />
                    <p className="mt-2.5 text-xs text-gray-500 font-medium">Querying database records...</p>
                  </TableCell>
                </TableRow>
              ) : pagedStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" className="!py-14 text-gray-500">
                    <div className="flex flex-col items-center">
                      <UsersIcon className="h-10 w-10 text-gray-300 mb-2" />
                      <p className="font-bold text-gray-700 text-sm">No students registered yet</p>
                      <p className="text-xs text-gray-400 mt-1">Imports CSV or manually add a record to get started.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pagedStudents.map((student) => (
                  <TableRow 
                    key={student.id} 
                    hover
                    onClick={() => navigate(`/students/${student.id}`)}
                    className="cursor-pointer transition-colors hover:bg-gray-50/50"
                  >
                    <TableCell className="!font-bold !text-gray-800">
                      {anonymize ? `ST-${student.id}` : student.rollNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                          {anonymize ? 'ST' : `${student.firstName?.charAt(0)}${student.lastName?.charAt(0)}`}
                        </div>
                        <span className="font-bold text-gray-900">
                          {anonymize ? `STUDENT_ST-${student.id}` : `${student.firstName} ${student.lastName}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="!text-gray-600 font-medium">{student.className} - {student.section}</TableCell>
                    <TableCell className="!text-gray-500">
                      {anonymize ? `student_${student.id}@school.edu` : student.email}
                    </TableCell>
                    <TableCell className="!text-gray-500">
                      {anonymize ? '***-***-****' : (student.phoneNumber || 'N/A')}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize tracking-wide
                        ${student.status === 'Active' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                        {student.status}
                      </span>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" className="!text-gray-450">
                        <ChevronRight className="h-4.5 w-4.5 hover:text-purple-650 transition-colors" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination Toolbar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-500">
            <div>
              Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} students
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(0);
                  }}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-purple-300"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                  disabled={currentPage === 0}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3">Page {currentPage + 1} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Student Dialog Modal */}
      <Dialog 
        open={isAddDialogOpen} 
        onClose={() => setIsAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            className: '!rounded-3xl !p-3'
          }
        }}
      >
        <DialogTitle className="!font-bold !text-xl !pb-2">Register Student Profile</DialogTitle>
        <form onSubmit={handleAddStudentSubmit}>
          <DialogContent className="!space-y-4 !pt-0">
            {submitError && (
              <div className="p-3 text-sm text-red-650 bg-red-50 border border-red-100 rounded-xl">
                {submitError}
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Roll Number"
                variant="outlined"
                fullWidth
                required
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="!mt-2"
                slotProps={{
                  input: {
                    className: '!rounded-xl'
                  }
                }}
              />
              <TextField
                label="Phone Number"
                variant="outlined"
                fullWidth
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="!mt-2"
                slotProps={{
                  input: {
                    className: '!rounded-xl'
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="First Name"
                variant="outlined"
                fullWidth
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                slotProps={{
                  input: {
                    className: '!rounded-xl'
                  }
                }}
              />
              <TextField
                label="Last Name"
                variant="outlined"
                fullWidth
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                slotProps={{
                  input: {
                    className: '!rounded-xl'
                  }
                }}
              />
            </div>

            <TextField
              label="Email Address"
              type="email"
              variant="outlined"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              slotProps={{
                input: {
                  className: '!rounded-xl'
                }
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Class Name"
                variant="outlined"
                fullWidth
                required
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. 10th Grade"
                slotProps={{
                  input: {
                    className: '!rounded-xl'
                  }
                }}
              />
              <TextField
                label="Section"
                variant="outlined"
                fullWidth
                required
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. A"
                slotProps={{
                  input: {
                    className: '!rounded-xl'
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Enrollment Date"
                type="date"
                variant="outlined"
                fullWidth
                required
                value={enrollmentDate}
                onChange={(e) => setEnrollmentDate(e.target.value)}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                  input: {
                    className: '!rounded-xl'
                  }
                }}
              />

              <FormControl fullWidth>
                <InputLabel id="student-status-label">Status</InputLabel>
                <Select
                  labelId="student-status-label"
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value)}
                  sx={{ borderRadius: '12px' }}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </div>
          </DialogContent>
          <DialogActions className="!px-6 !pb-4 !pt-2">
            <Button 
              onClick={() => setIsAddDialogOpen(false)} 
              className="!text-gray-500 !rounded-xl"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              className="!bg-purple-600 hover:!bg-purple-700 !text-white !rounded-xl !px-6"
              disabled={submitting}
            >
              {submitting ? 'Registering...' : 'Register Student'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}
