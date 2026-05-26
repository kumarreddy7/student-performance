import { create } from 'zustand';
import api from '../../lib/axios';

interface ReportState {
  isGenerating: boolean;
  error: string | null;
  downloadWatchlistPdf: () => Promise<void>;
  downloadWatchlistExcel: () => Promise<void>;
}

export const useReportStore = create<ReportState>((set) => ({
  isGenerating: false,
  error: null,

  downloadWatchlistPdf: async () => {
    set({ isGenerating: true, error: null });
    try {
      const response = await api.get('/reports/watchlist/pdf', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'watchlist.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      set({ isGenerating: false });
    } catch (error: any) {
      set({ 
        error: 'Failed to generate PDF report', 
        isGenerating: false 
      });
    }
  },

  downloadWatchlistExcel: async () => {
    set({ isGenerating: true, error: null });
    try {
      const response = await api.get('/reports/watchlist/excel', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'watchlist.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      set({ isGenerating: false });
    } catch (error: any) {
      set({ 
        error: 'Failed to generate Excel report', 
        isGenerating: false 
      });
    }
  }
}));
