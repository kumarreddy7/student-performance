import { create } from 'zustand';
import api from '../../lib/axios';
import { useNotificationStore } from '../notifications/notificationStore';

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  rollNumber: string;
  className: string;
  section: string;
  phoneNumber?: string;
  status: string;
  enrollmentDate: string;
  userId?: number;
}

interface StudentState {
  students: Student[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  fetchStudents: () => Promise<void>;
  fetchStudentsPaged: (page: number, size: number, search: string) => Promise<any>;
  createStudent: (student: any) => Promise<void>;
  updateStudent: (id: number, student: any) => Promise<void>;
  deleteStudent: (id: number) => Promise<void>;
  uploadCsv: (file: File) => Promise<void>;
  uploadMarksCsv: (file: File) => Promise<void>;
  fetchCsvLogs: () => Promise<any[]>;
  deleteCsv: (id: number) => Promise<void>;
  fetchRankings: () => Promise<any[]>;
  fetchMyPerformance: () => Promise<any>;
  fetchDashboardSummary: (branch?: string, sections?: string[]) => Promise<any>;
  fetchAttendance: (date: string) => Promise<any[]>;
  saveAttendance: (date: string, records: any[]) => Promise<void>;
  fetchAttendanceStats: (date: string) => Promise<any>;
}

export const useStudentStore = create<StudentState>((set) => ({
  students: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchStudents: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/students');
      set({ students: response.data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch students', 
        isLoading: false 
      });
    }
  },

  fetchStudentsPaged: async (page, size, search) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/students/page?page=${page}&size=${size}&search=${encodeURIComponent(search)}`);
      set({ isLoading: false });
      return response.data;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch paged students', 
        isLoading: false 
      });
      throw error;
    }
  },

  createStudent: async (student) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/students', student);
      useNotificationStore.getState().addNotification(`New student registered: ${student.firstName} ${student.lastName}.`);
      // Refresh
      const response = await api.get('/students');
      set({ students: response.data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to create student', 
        isLoading: false 
      });
      throw error;
    }
  },

  updateStudent: async (id, student) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/students/${id}`, student);
      useNotificationStore.getState().addNotification(`Student profile updated: ${student.firstName} ${student.lastName}.`);
      // Refresh
      const response = await api.get('/students');
      set({ students: response.data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to update student', 
        isLoading: false 
      });
      throw error;
    }
  },

  deleteStudent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/students/${id}`);
      useNotificationStore.getState().addNotification('Student record deleted successfully (soft-delete).');
      // Refresh
      const response = await api.get('/students');
      set({ students: response.data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to delete student', 
        isLoading: false 
      });
      throw error;
    }
  },

  uploadCsv: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/csv/upload/students', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      useNotificationStore.getState().addNotification(`CSV Import Complete: ${response.data.message || 'Successfully processed student records.'}`);
      // Refresh
      const res = await api.get('/students');
      set({ students: res.data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to upload CSV', 
        isLoading: false 
      });
      throw error;
    }
  },

  uploadMarksCsv: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/csv/upload/marks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      useNotificationStore.getState().addNotification(`Marks CSV Import Complete: ${response.data.message || 'Successfully processed academic marks.'}`);
      set({ isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to upload Marks CSV', 
        isLoading: false 
      });
      throw error;
    }
  },

  fetchCsvLogs: async () => {
    try {
      const response = await api.get('/csv/files');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  deleteCsv: async (id) => {
    try {
      await api.delete(`/csv/files/${id}`);
      useNotificationStore.getState().addNotification('CSV file log removed successfully.');
    } catch (error: any) {
      throw error;
    }
  },

  fetchRankings: async () => {
    try {
      const response = await api.get('/students/rankings');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  fetchMyPerformance: async () => {
    try {
      const response = await api.get('/students/my-performance');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  fetchDashboardSummary: async (branch?: string, sections?: string[]) => {
    try {
      let url = '/students/dashboard-summary';
      const params: string[] = [];
      if (branch && branch !== 'All' && branch.trim() !== '') {
        params.push(`branch=${encodeURIComponent(branch)}`);
      }
      if (sections && sections.length > 0 && !sections.includes('All')) {
        params.push(`sections=${sections.map(s => encodeURIComponent(s)).join(',')}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  fetchAttendance: async (date) => {
    try {
      const response = await api.get(`/students/attendance?date=${date}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  saveAttendance: async (date, records) => {
    try {
      await api.post(`/students/attendance?date=${date}`, records);
      useNotificationStore.getState().addNotification('Attendance saved successfully.');
    } catch (error: any) {
      throw error;
    }
  },

  fetchAttendanceStats: async (date) => {
    try {
      const response = await api.get(`/students/attendance/stats?date=${date}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
}));
