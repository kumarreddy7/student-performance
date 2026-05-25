import { create } from 'zustand';
import api from '../../lib/axios';

interface ReportState {
  isGenerating: boolean;
  error: string | null;
  downloadWatchlistPdf: (branch?: string, sections?: string[], counselorUsername?: string) => Promise<void>;
  downloadWatchlistExcel: (branch?: string, sections?: string[], counselorUsername?: string) => Promise<void>;
}

export const useReportStore = create<ReportState>((set) => ({
  isGenerating: false,
  error: null,

  downloadWatchlistPdf: async (branch?, sections?, counselorUsername?) => {
    set({ isGenerating: true, error: null });
    try {
      let url = '/reports/watchlist/pdf';
      const params: string[] = [];
      if (branch && branch !== 'All' && branch.trim() !== '') {
        params.push(`branch=${encodeURIComponent(branch)}`);
      }
      if (sections && sections.length > 0 && !sections.includes('All')) {
        params.push(`sections=${sections.map(s => encodeURIComponent(s)).join(',')}`);
      }
      if (counselorUsername && counselorUsername.trim() !== '') {
        params.push(`counselorUsername=${encodeURIComponent(counselorUsername)}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const response = await api.get(url, {
        responseType: 'blob',
      });
      
      const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = urlBlob;
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

  downloadWatchlistExcel: async (branch?, sections?, counselorUsername?) => {
    set({ isGenerating: true, error: null });
    try {
      let url = '/reports/watchlist/excel';
      const params: string[] = [];
      if (branch && branch !== 'All' && branch.trim() !== '') {
        params.push(`branch=${encodeURIComponent(branch)}`);
      }
      if (sections && sections.length > 0 && !sections.includes('All')) {
        params.push(`sections=${sections.map(s => encodeURIComponent(s)).join(',')}`);
      }
      if (counselorUsername && counselorUsername.trim() !== '') {
        params.push(`counselorUsername=${encodeURIComponent(counselorUsername)}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const response = await api.get(url, {
        responseType: 'blob',
      });
      
      const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = urlBlob;
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
