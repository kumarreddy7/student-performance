import { create } from 'zustand';
import api from '../../lib/axios';

export interface PerformanceRecord {
  id: string;
  studentId: number;
  semester: string;
  gpa: number;
  attendancePercentage: number;
  behaviorScore: number;
  riskScore: number;
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
}

export interface DashboardSummary {
  totalRecords: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  records: PerformanceRecord[];
}

interface AnalyticsState {
  summary: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
  fetchDashboardSummary: () => Promise<void>;
  generateRiskScore: (data: any) => Promise<PerformanceRecord | null>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  summary: null,
  isLoading: false,
  error: null,
  fetchDashboardSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/analytics/dashboard/summary');
      set({ summary: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  generateRiskScore: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/analytics/calculate', data);
      set({ isLoading: false });
      return response.data;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  }
}));
