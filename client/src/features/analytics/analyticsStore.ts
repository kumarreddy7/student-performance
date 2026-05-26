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

export interface RiskConfig {
  id?: string;
  predictedGradeThreshold: number;
  attendanceThreshold: number;
  behaviorThreshold: number;
  lowRiskMaxLimit: number;
  mediumRiskMaxLimit: number;
}

export interface SimulationResult {
  totalStudents: number;
  studentsImpacted: number;
  originalPassRate: number;
  simulatedPassRate: number;
  passRateGain: number;
}

export interface AccuracyResult {
  totalEvaluated: number;
  correctPredictions: number;
  accuracyPercentage: number;
}

interface AnalyticsState {
  summary: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
  config: RiskConfig | null;
  simulationResult: SimulationResult | null;
  accuracyResult: AccuracyResult | null;
  fetchDashboardSummary: () => Promise<void>;
  generateRiskScore: (data: any) => Promise<PerformanceRecord | null>;
  fetchConfig: () => Promise<RiskConfig | null>;
  saveConfig: (config: RiskConfig) => Promise<boolean>;
  runSimulation: (tutoringThreshold: number, gradeBoost: number, attendanceBoost: number) => Promise<SimulationResult | null>;
  checkAccuracy: () => Promise<AccuracyResult | null>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  summary: null,
  isLoading: false,
  error: null,
  config: null,
  simulationResult: null,
  accuracyResult: null,

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
  },

  fetchConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/analytics/config');
      set({ config: response.data, isLoading: false });
      return response.data;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  saveConfig: async (newConfig: RiskConfig) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/analytics/config', newConfig);
      set({ config: response.data, isLoading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  runSimulation: async (tutoringThreshold: number, gradeBoost: number, attendanceBoost: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/analytics/simulate?tutoringThreshold=${tutoringThreshold}&gradeBoost=${gradeBoost}&attendanceBoost=${attendanceBoost}`);
      set({ simulationResult: response.data, isLoading: false });
      return response.data;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  checkAccuracy: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/analytics/accuracy');
      set({ accuracyResult: response.data, isLoading: false });
      return response.data;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  }
}));
