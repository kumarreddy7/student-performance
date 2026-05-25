import { useEffect, useState } from 'react';
import { useAuthStore } from '../../features/auth/authStore';
import { normalizeRole } from '../../lib/roles';
import api from '../../lib/axios';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Check, 
  X, 
  AlertCircle, 
  CalendarDays, 
  Ban, 
  CheckCircle2, 
  XCircle,
  History,
  Info
} from 'lucide-react';
import { 
  Button, 
  CircularProgress, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Switch
} from '@mui/material';

export default function CounselingSlots() {
  const user = useAuthStore((state) => state.user);
  const userRole = normalizeRole(user?.role);
  
  // Date selection state (defaults to today in local YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Authoritative Server Date
  const [serverDate, setServerDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const res = await api.get('/students/counseling/current-time');
        setServerDate(res.data.date);
        setSelectedDate(res.data.date);
      } catch (err) {
        console.error('Failed to sync server real-time clock', err);
      }
    };
    fetchServerTime();
  }, []);
  
  // Counselor-specific states
  const [counselorUsername, setCounselorUsername] = useState<string>('');
  const [isOffDay, setIsOffDay] = useState<boolean>(false);
  const [counselorsList, setCounselorsList] = useState<any[]>([]);
  
  // General data loading states
  const [slots, setSlots] = useState<any[]>([]);
  const [appointmentsList, setAppointmentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  
  // Dialogs control
  const [isBookDialogOpen, setIsBookDialogOpen] = useState<boolean>(false);
  const [selectedSlotToBook, setSelectedSlotToBook] = useState<string>('');
  
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState<boolean>(false);
  const [selectedAppToReject, setSelectedAppToReject] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  
  // Global message feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-clear toasts
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load baseline credentials
  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      try {
        if (userRole === 'student') {
          // Fetch student performance to extract assigned counselor
          const response = await api.get('/students/my-performance');
          const profile = response.data?.student || null;
          if (profile?.counselorUsername) {
            setCounselorUsername(profile.counselorUsername);
          }
        } else if (userRole === 'counselor') {
          setCounselorUsername(user?.username || '');
        } else {
          // Admin/Teacher: Fetch counselors list to let them select whose schedule to view
          const response = await api.get('/auth/counselors');
          const uniqueCounselors = (response.data || []).filter(
            (c: any, index: number, self: any[]) =>
              self.findIndex((t: any) => t.username === c.username) === index
          );
          setCounselorsList(uniqueCounselors);
          if (uniqueCounselors.length > 0) {
            setCounselorUsername(uniqueCounselors[0].username);
          }
        }
      } catch (err: any) {
        console.error('Failed to initialize page state', err);
        setToast({ message: 'Failed to synchronize counselor credentials.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, [user, userRole]);

  // Fetch slots & appointments list when date or counselor username changes
  useEffect(() => {
    if (counselorUsername) {
      fetchSlotsAndMetadata();
      fetchAppointmentsList();
    }
  }, [selectedDate, counselorUsername]);

  const fetchSlotsAndMetadata = async () => {
    setSlotsLoading(true);
    try {
      // 1. Fetch Slots
      const slotsResponse = await api.get(`/students/counseling/slots?counselorUsername=${counselorUsername}&date=${selectedDate}`);
      setSlots(slotsResponse.data || []);

      // 2. Fetch Off Day Status
      const offResponse = await api.get(`/students/counseling/off-day?counselorUsername=${counselorUsername}&date=${selectedDate}`);
      setIsOffDay(offResponse.data?.isOff || false);
    } catch (err: any) {
      console.error('Failed to fetch slots or metadata', err);
      setToast({ message: 'Error retrieving slots schedule.', type: 'error' });
    } finally {
      setSlotsLoading(false);
    }
  };

  const fetchAppointmentsList = async () => {
    try {
      if (userRole === 'student') {
        const response = await api.get('/students/counseling/appointments/student');
        setAppointmentsList(response.data || []);
      } else if (userRole === 'counselor') {
        const response = await api.get('/students/counseling/appointments/counselor');
        setAppointmentsList(response.data || []);
      } else if (counselorUsername) {
        // Admins/Teachers fetch the selected counselor's appointments
        const response = await api.get(`/students/counseling/appointments/counselor?counselorUsername=${counselorUsername}`);
        setAppointmentsList(response.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch appointments history', err);
    }
  };

  // Student slot booking execution
  const handleBookSlot = async () => {
    if (!counselorUsername || !selectedSlotToBook) return;
    setActionLoading(true);
    try {
      await api.post(`/students/counseling/book?counselorUsername=${counselorUsername}&date=${selectedDate}&timeSlot=${encodeURIComponent(selectedSlotToBook)}`);
      setToast({ message: `Successfully requested appointment for ${selectedSlotToBook}!`, type: 'success' });
      setIsBookDialogOpen(false);
      fetchSlotsAndMetadata();
      fetchAppointmentsList();
    } catch (err: any) {
      console.error('Failed to book appointment', err);
      setToast({ message: err.response?.data?.message || 'Error processing appointment booking.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Counselor accept appointment
  const handleAcceptAppointment = async (appId: number) => {
    setActionLoading(true);
    try {
      await api.post(`/students/counseling/appointments/${appId}/accept`);
      setToast({ message: 'Appointment approved successfully.', type: 'success' });
      fetchSlotsAndMetadata();
      fetchAppointmentsList();
    } catch (err: any) {
      console.error('Failed to accept appointment', err);
      setToast({ message: err.response?.data?.message || 'Error accepting appointment.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Counselor reject appointment
  const handleRejectAppointmentSubmit = async () => {
    if (selectedAppToReject === null) return;
    setActionLoading(true);
    try {
      await api.post(`/students/counseling/appointments/${selectedAppToReject}/reject`, {
        reason: rejectionReason || 'No reason provided'
      });
      setToast({ message: 'Appointment rejected.', type: 'success' });
      setIsRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedAppToReject(null);
      fetchSlotsAndMetadata();
      fetchAppointmentsList();
    } catch (err: any) {
      console.error('Failed to reject appointment', err);
      setToast({ message: err.response?.data?.message || 'Error rejecting appointment.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Counselor toggle No Counselling Hours (Off-day)
  const handleToggleOffDay = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    // optimistic UI update
    setIsOffDay(isChecked);
    try {
      await api.post(`/students/counseling/off-day?date=${selectedDate}&isOff=${isChecked}`);
      setToast({ 
        message: isChecked 
          ? 'Declared off-duty. All pending appointments on this day have been automatically declined.' 
          : 'Declared on-duty. Slots are now available for scheduling.', 
        type: 'success' 
      });
      fetchSlotsAndMetadata();
      fetchAppointmentsList();
    } catch (err: any) {
      console.error('Failed to toggle off day', err);
      setIsOffDay(!isChecked); // revert
      setToast({ message: err.response?.data?.message || 'Error updating off-duty schedule.', type: 'error' });
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <CircularProgress className="!text-purple-600" />
        <p className="text-sm text-gray-500 font-medium animate-pulse">Synchronizing calendar profiles...</p>
      </div>
    );
  }

  // Warning for students without counselor assigned
  const showMissingCounselorWarning = userRole === 'student' && !counselorUsername;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 transition-all duration-300 animate-slide-in ${
          toast.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-purple-900 to-indigo-950 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent"></div>
        <div className="relative z-10 space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="h-8 w-8 text-purple-400" />
            Counseling Appointment Schedule
          </h1>
          <p className="text-purple-200 text-sm font-medium">
            {userRole === 'student' 
              ? 'Book counsel hours, check slots availability, and track request statuses.'
              : userRole === 'counselor'
              ? 'Manage booked hours, review counseling roster list, and set daily availability.'
              : 'Administrative counselor roster lookup calendar dashboard.'}
          </p>
        </div>

        {/* User Badge Info */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-3">
          <div className="bg-purple-500/30 p-2 rounded-xl">
            <CalendarDays className="h-5 w-5 text-purple-300" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-purple-300 uppercase tracking-widest">Signed Account</span>
            <span className="text-sm font-bold capitalize">{user?.username} ({userRole})</span>
          </div>
        </div>
      </div>

      {showMissingCounselorWarning ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-8 text-center max-w-2xl mx-auto shadow-md">
          <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800">No Counselor Allocated</h3>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            You do not currently have an assigned counselor bound to your academic student profile. 
            Before booking a slot, an Administrator or Teacher must assign a counselor to you in the <strong>Students Directory</strong> form.
          </p>
          <div className="mt-5 text-xs text-gray-400">
            Linked Email Address: {user?.email}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Calendar Picker Panel */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Control Panel Container */}
            <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-3xl p-6 shadow-xl space-y-6">
              <h2 className="text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-purple-600" />
                Schedule Settings
              </h2>

              {/* Counselor selection for Admin / Teacher */}
              {(userRole === 'admin' || userRole === 'teacher') && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Select Counselor
                  </label>
                  <select
                    value={counselorUsername}
                    onChange={(e) => setCounselorUsername(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                  >
                    {counselorsList.map((c) => (
                      <option key={c.id} value={c.username}>
                        {c.username} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Student read-only counselor info */}
              {userRole === 'student' && (
                <div className="bg-purple-50/50 border border-purple-100/50 p-4 rounded-2xl space-y-1">
                  <span className="block text-[10px] font-bold text-purple-500 uppercase tracking-widest">
                    Assigned Counselor
                  </span>
                  <span className="text-base font-bold text-purple-950 capitalize flex items-center gap-1.5">
                    {counselorUsername}
                  </span>
                  <span className="block text-xs text-gray-400">
                    Students can only schedule hours with their dedicated advisor.
                  </span>
                </div>
              )}

              {/* Date Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Select Calendar Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={serverDate} // students cannot book past dates
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
              </div>

              {/* Counselor Off-Duty Declarations */}
              {userRole === 'counselor' && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-red-950">Declare Off-Duty</span>
                      <Switch
                        checked={isOffDay}
                        onChange={handleToggleOffDay}
                        color="error"
                      />
                    </div>
                    <p className="text-xs text-red-700 leading-relaxed font-medium">
                      Activating "Declare Off-Duty" blocks all calendar slots for this day. 
                      Any active pending appointments will be automatically set to rejected under "No counselling hours for today".
                    </p>
                  </div>
                </div>
              )}

              {/* Off-Day Badge for Viewers */}
              {userRole !== 'counselor' && isOffDay && (
                <div className="bg-red-50 border border-red-150 p-4 rounded-2xl flex items-start gap-3">
                  <Ban className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-red-950">Counselor Unavailable</h4>
                    <p className="text-xs text-red-700 mt-0.5 leading-relaxed font-medium">
                      The assigned counselor has declared this date as a non-counseling day. 
                      Slots are disabled and booking is unavailable.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Summary Grid Card */}
            <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="h-4 w-4 text-purple-600" />
                Slot Guidelines
              </h3>
              <ul className="space-y-3 text-xs text-gray-500 font-medium">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                  <span><strong>Available:</strong> Empty slots ready for slot booking.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 flex-shrink-0"></span>
                  <span><strong>Pending:</strong> Student requested, waiting for approval.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  <span><strong>Accepted:</strong> Approved booking. Slot is fully locked.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0"></span>
                  <span><strong>Rejected:</strong> Dismissed requests. Rejection notes visible.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-gray-400 flex-shrink-0"></span>
                  <span><strong>Blocked:</strong> Counselor marked as unavailable.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Slots Roster Daily Grid */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xl space-y-6">
              
              <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Daily Counseling Board
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Selected schedule for: <strong className="text-purple-600">{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                  </p>
                </div>

                {slotsLoading && <CircularProgress size={20} className="!text-purple-600" />}
              </div>

              {slotsLoading && slots.length === 0 ? (
                <div className="flex justify-center items-center py-20">
                  <CircularProgress className="!text-purple-600" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <CalendarIcon className="h-12 w-12 mx-auto text-gray-200 mb-3" />
                  <p className="font-semibold text-gray-700">Unable to query slots</p>
                  <p className="text-xs text-gray-400 mt-1">Please select an assigned counselor to load slots.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {slots.map((slot, index) => {
                    const status = slot.status;
                    const isAvailable = status === 'AVAILABLE';
                    const isPending = status === 'PENDING';
                    const isAccepted = status === 'ACCEPTED';
                    const isRejected = status === 'REJECTED';
                    const isBlocked = status === 'BLOCKED';

                    return (
                      <div 
                        key={index}
                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                          isAvailable 
                            ? 'bg-emerald-50/10 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/20' 
                            : isPending 
                            ? 'bg-amber-50/20 border-amber-200 shadow-sm'
                            : isAccepted 
                            ? 'bg-indigo-50/20 border-indigo-200 font-medium'
                            : isRejected 
                            ? 'bg-red-50/10 border-red-150'
                            : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                      >
                        
                        {/* Slot details */}
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${
                            isAvailable 
                              ? 'bg-emerald-100/50 text-emerald-700' 
                              : isPending 
                              ? 'bg-amber-100/50 text-amber-700'
                              : isAccepted 
                              ? 'bg-indigo-100/50 text-indigo-700'
                              : isRejected 
                              ? 'bg-red-100/50 text-red-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            <Clock className="h-5 w-5" />
                          </div>
                          
                          <div>
                            <span className="block text-sm font-bold text-gray-900">{slot.timeSlot}</span>
                            
                            {/* Subtitle depending on slot state */}
                            {isAvailable && (
                              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 mt-0.5">
                                Available for Booking
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex flex-col text-xs mt-0.5 text-amber-700">
                                <span>Requested by: <strong className="capitalize">{slot.studentName}</strong></span>
                                <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">Awaiting approval</span>
                              </span>
                            )}
                            {isAccepted && (
                              <span className="inline-flex flex-col text-xs mt-0.5 text-indigo-900">
                                <span>Booked for: <strong className="capitalize">{slot.studentName}</strong></span>
                                <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Confirmed hour</span>
                              </span>
                            )}
                            {isRejected && (
                              <div className="text-xs mt-0.5 text-red-800 space-y-0.5">
                                <div>Dismissed: <strong className="capitalize">{slot.studentName}</strong></div>
                                {slot.rejectionReason && (
                                  <div className="text-[10px] text-red-500 bg-red-50 border border-red-100/30 px-2 py-0.5 rounded-lg inline-block">
                                    Reason: {slot.rejectionReason}
                                  </div>
                                )}
                              </div>
                            )}
                            {isBlocked && (
                              <span className="inline-flex items-center text-xs font-semibold text-gray-500 mt-0.5">
                                Blocked: {slot.reason}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Interactive Buttons per Row */}
                        <div className="mt-4 sm:mt-0 w-full sm:w-auto">
                          
                          {/* Student booking action */}
                          {userRole === 'student' && isAvailable && (
                            <Button
                              variant="outlined"
                              color="success"
                              onClick={() => {
                                setSelectedSlotToBook(slot.timeSlot);
                                setIsBookDialogOpen(true);
                              }}
                              className="!rounded-xl !capitalize !text-xs !font-bold !px-4 !py-2 hover:!bg-emerald-50/50"
                            >
                              Book Slot
                            </Button>
                          )}

                          {/* Counselor approval actions */}
                          {userRole === 'counselor' && isPending && (
                            <div className="flex gap-2">
                              <Button
                                variant="contained"
                                color="success"
                                startIcon={<Check className="h-3 w-3" />}
                                onClick={() => handleAcceptAppointment(slot.appointmentId)}
                                className="!bg-emerald-600 hover:!bg-emerald-700 !text-white !rounded-xl !capitalize !text-xs !font-bold !px-3.5 !py-1.5 !shadow-none"
                              >
                                Accept
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                startIcon={<X className="h-3 w-3" />}
                                onClick={() => {
                                  setSelectedAppToReject(slot.appointmentId);
                                  setIsRejectDialogOpen(true);
                                }}
                                className="!rounded-xl !capitalize !text-xs !font-bold !px-3.5 !py-1.5 hover:!bg-red-50/50"
                              >
                                Reject
                              </Button>
                            </div>
                          )}

                          {/* Counselor accepted hour toggle option */}
                          {userRole === 'counselor' && isAccepted && (
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<X className="h-3.5 w-3.5" />}
                              onClick={() => {
                                setSelectedAppToReject(slot.appointmentId);
                                setIsRejectDialogOpen(true);
                              }}
                              className="!rounded-xl !capitalize !text-xs !font-bold !px-4 !py-2 hover:!bg-red-50/50"
                            >
                              Cancel Booking
                            </Button>
                          )}

                          {/* Administrative looker detail display */}
                          {(userRole === 'admin' || userRole === 'teacher') && (
                            <span className={`text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-full border ${
                              isAvailable 
                                ? 'bg-emerald-100/20 text-emerald-700 border-emerald-200' 
                                : isPending 
                                ? 'bg-amber-100/20 text-amber-700 border-amber-200'
                                : isAccepted 
                                ? 'bg-indigo-100/20 text-indigo-700 border-indigo-200'
                                : isRejected
                                ? 'bg-red-100/20 text-red-700 border-red-200'
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}>
                              {status}
                            </span>
                          )}

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Appointments Timeline / History */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xl space-y-6">
              <h2 className="text-lg font-extrabold text-gray-900 border-b border-gray-50 pb-3 flex items-center gap-2">
                <History className="h-5 w-5 text-purple-600" />
                Appointment History Index
              </h2>

              {appointmentsList.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-sm">
                  <Clock className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="font-semibold text-gray-700">No appointments registered</p>
                  <p className="text-xs text-gray-400 mt-1">Calendar history records will display here as they are processed.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-50 shadow-inner">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Hour</th>
                        {userRole === 'student' ? (
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Counselor</th>
                        ) : (
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Student</th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Details</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100 text-xs font-medium text-gray-700">
                      {appointmentsList.map((app) => (
                        <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3.5 whitespace-nowrap text-gray-900 font-bold">
                            {app.date}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-purple-700">
                            {app.timeSlot}
                          </td>
                          {userRole === 'student' ? (
                            <td className="px-4 py-3.5 whitespace-nowrap capitalize font-semibold">
                              {app.counselorUsername}
                            </td>
                          ) : (
                            <td className="px-4 py-3.5 whitespace-nowrap capitalize font-semibold text-gray-900">
                              {app.studentName}
                            </td>
                          )}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              app.status === 'ACCEPTED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : app.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                              {app.status === 'ACCEPTED' ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : app.status === 'PENDING' ? (
                                <Info className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              {app.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 max-w-[150px] truncate text-gray-400 italic">
                            {app.status === 'REJECTED' && app.rejectionReason 
                              ? `Reason: ${app.rejectionReason}`
                              : app.status === 'ACCEPTED' 
                              ? 'Confirmed appointment'
                              : 'Pending host decision'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* Dialog for Booking Confirmation */}
      <Dialog
        open={isBookDialogOpen}
        onClose={() => setIsBookDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            className: '!rounded-3xl !p-2'
          }
        }}
      >
        <DialogTitle className="!font-bold !text-xl !pb-2">Confirm Counseling Hour</DialogTitle>
        <DialogContent className="!space-y-2 !pt-0">
          <p className="text-sm text-gray-600 leading-relaxed">
            Are you sure you want to request a counseling session with counselor <strong>{counselorUsername}</strong> on 
            <strong> {selectedDate}</strong> at <strong>{selectedSlotToBook}</strong>?
          </p>
          <p className="text-xs text-gray-400 mt-2">
            The session request will be sent to the counselor for validation. You will be notified of the decision on this dashboard.
          </p>
        </DialogContent>
        <DialogActions className="!px-6 !pb-4 !pt-2">
          <Button 
            onClick={() => setIsBookDialogOpen(false)} 
            className="!text-gray-500 !rounded-xl !capitalize"
            disabled={actionLoading}
          >
            Go Back
          </Button>
          <Button 
            onClick={handleBookSlot} 
            variant="contained" 
            className="!bg-purple-600 hover:!bg-purple-700 !text-white !rounded-xl !px-6 !capitalize !shadow-none"
            disabled={actionLoading}
          >
            {actionLoading ? 'Booking...' : 'Confirm Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Rejection Reason */}
      <Dialog
        open={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            className: '!rounded-3xl !p-2'
          }
        }}
      >
        <DialogTitle className="!font-bold !text-xl !pb-2">Decline Session Request</DialogTitle>
        <DialogContent className="!space-y-3 !pt-2">
          <p className="text-sm text-gray-600">
            Please enter a short explanation for declining this appointment request. This reason will be visible to the student.
          </p>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason"
            placeholder="e.g. Attending academic conference / Schedule conflict..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            variant="outlined"
            className="bg-gray-50/50"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
        </DialogContent>
        <DialogActions className="!px-6 !pb-4 !pt-2">
          <Button 
            onClick={() => {
              setIsRejectDialogOpen(false);
              setRejectionReason('');
              setSelectedAppToReject(null);
            }} 
            className="!text-gray-500 !rounded-xl !capitalize"
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRejectAppointmentSubmit} 
            variant="contained" 
            color="error"
            className="!bg-red-600 hover:!bg-red-700 !text-white !rounded-xl !px-6 !capitalize !shadow-none"
            disabled={actionLoading}
          >
            {actionLoading ? 'Declining...' : 'Decline Appointment'}
          </Button>
        </DialogActions>
      </Dialog>

    </div>
  );
}
