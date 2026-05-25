import React, { useEffect, useRef, useState } from 'react';
import { useStudentStore } from '../../features/students/studentStore';
import { UploadCloud, FileSpreadsheet, Download, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { CircularProgress } from '@mui/material';
import api from '../../lib/axios';

export default function CSVManagement() {
  const { uploadCsv, uploadMarksCsv, fetchCsvLogs } = useStudentStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  // Student CSV upload state
  const studentFileRef = useRef<HTMLInputElement>(null);
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [studentValStatus, setStudentValStatus] = useState<{ status: 'idle' | 'validating' | 'valid' | 'invalid'; error?: string }>({ status: 'idle' });
  const [studentUploading, setStudentUploading] = useState(false);

  // Marks CSV upload state
  const marksFileRef = useRef<HTMLInputElement>(null);
  const [marksFile, setMarksFile] = useState<File | null>(null);
  const [marksValStatus, setMarksValStatus] = useState<{ status: 'idle' | 'validating' | 'valid' | 'invalid'; error?: string }>({ status: 'idle' });
  const [marksUploading, setMarksUploading] = useState(false);

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await fetchCsvLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleStudentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      setStudentValStatus({ status: 'invalid', error: 'File must have a .csv or .xlsx extension.' });
      setStudentFile(null);
      return;
    }

    setStudentFile(file);
    if (file.name.endsWith('.xlsx')) {
      setStudentValStatus({ status: 'valid' });
      return;
    }

    setStudentValStatus({ status: 'validating' });
    
    // Read headers to validate structure
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const firstLine = text.split('\n')[0];
      const headers = firstLine.split(',').map(h => h.trim().toLowerCase());
      
      const hasEmail = headers.some(h => h.includes('email'));
      
      if (!hasEmail) {
        setStudentValStatus({ 
          status: 'invalid', 
          error: "Required column 'Email' not found in CSV headers." 
        });
      } else {
        setStudentValStatus({ status: 'valid' });
      }
    };
    reader.onerror = () => {
      setStudentValStatus({ status: 'invalid', error: 'Failed to read file.' });
    };
    reader.readAsText(file);
  };

  const handleMarksFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      setMarksValStatus({ status: 'invalid', error: 'File must have a .csv or .xlsx extension.' });
      setMarksFile(null);
      return;
    }

    setMarksFile(file);
    if (file.name.endsWith('.xlsx')) {
      setMarksValStatus({ status: 'valid' });
      return;
    }

    setMarksValStatus({ status: 'validating' });

    // Read headers to validate structure
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const firstLine = text.split('\n')[0];
      const headers = firstLine.split(',').map(h => h.trim().toLowerCase());
      
      const hasRoll = headers.some(h => h.includes('roll'));
      const hasSubject = headers.some(h => h.includes('subject'));
      const hasMarks = headers.some(h => h.includes('mark') || h.includes('score'));

      if (!hasRoll || !hasSubject || !hasMarks) {
        setMarksValStatus({
          status: 'invalid',
          error: "Required columns ('Roll Number', 'Subject', 'Marks') not found in CSV headers."
        });
      } else {
        setMarksValStatus({ status: 'valid' });
      }
    };
    reader.onerror = () => {
      setMarksValStatus({ status: 'invalid', error: 'Failed to read file.' });
    };
    reader.readAsText(file);
  };

  const uploadStudents = async () => {
    if (!studentFile) return;
    setStudentUploading(true);
    setMessage(null);
    try {
      await uploadCsv(studentFile);
      setMessage({ text: 'Students CSV processed successfully.', type: 'success' });
      setStudentFile(null);
      setStudentValStatus({ status: 'idle' });
      if (studentFileRef.current) studentFileRef.current.value = '';
      loadLogs();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Failed to import Students CSV.', type: 'error' });
    } finally {
      setStudentUploading(false);
    }
  };

  const uploadMarks = async () => {
    if (!marksFile) return;
    setMarksUploading(true);
    setMessage(null);
    try {
      await uploadMarksCsv(marksFile);
      setMessage({ text: 'Academic Marks CSV processed successfully.', type: 'success' });
      setMarksFile(null);
      setMarksValStatus({ status: 'idle' });
      if (marksFileRef.current) marksFileRef.current.value = '';
      loadLogs();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Failed to import Marks CSV.', type: 'error' });
    } finally {
      setMarksUploading(false);
    }
  };

  const downloadFile = async (id: number, fileName: string) => {
    try {
      const response = await api.get(`/csv/files/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download file', error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          CSV Management Module
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Upload and review student directories and academic marks CSV logs.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 border shadow-sm transition-all duration-300 ${
          message.type === 'success' 
            ? 'bg-emerald-50/60 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50/60 border-rose-100 text-rose-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Upload Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Students Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 text-purple-600 p-2.5 rounded-2xl">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Student Roster CSV</h3>
                <p className="text-xs text-gray-500">Imports or updates student profiles</p>
              </div>
            </div>

            <div 
              onClick={() => studentFileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 hover:border-purple-400 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-purple-50/10 flex flex-col items-center justify-center min-h-[140px]"
            >
              <input 
                type="file" 
                ref={studentFileRef} 
                onChange={handleStudentFileChange} 
                className="hidden" 
                accept=".csv,.xlsx"
              />
              <UploadCloud className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">
                {studentFile ? studentFile.name : 'Select student roster file (CSV or Excel)'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Accepts: rollNumber, name, email, class, section, phone</p>
            </div>

            {/* Validation Feedback */}
            {studentValStatus.status === 'validating' && (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                <CircularProgress size={16} className="!text-amber-500" />
                <span>Running structure validation checks...</span>
              </div>
            )}

            {studentValStatus.status === 'valid' && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>CSV structure validated successfully! Ready to import.</span>
              </div>
            )}

            {studentValStatus.status === 'invalid' && (
              <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                <span>{studentValStatus.error}</span>
              </div>
            )}
          </div>

          <button
            onClick={uploadStudents}
            disabled={studentValStatus.status !== 'valid' || studentUploading}
            className="w-full mt-6 py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/10 transition-all duration-200"
          >
            {studentUploading ? 'Importing Student Records...' : 'Import Students'}
          </button>
        </div>

        {/* Upload Marks Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-2xl">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Academic Marks CSV</h3>
                <p className="text-xs text-gray-500">Imports and calculates subject rankings</p>
              </div>
            </div>

            <div 
              onClick={() => marksFileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-indigo-50/10 flex flex-col items-center justify-center min-h-[140px]"
            >
              <input 
                type="file" 
                ref={marksFileRef} 
                onChange={handleMarksFileChange} 
                className="hidden" 
                accept=".csv,.xlsx"
              />
              <UploadCloud className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">
                {marksFile ? marksFile.name : 'Select academic marks file (CSV or Excel)'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Required columns: Roll Number, Subject, Marks</p>
            </div>

            {/* Validation Feedback */}
            {marksValStatus.status === 'validating' && (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                <CircularProgress size={16} className="!text-amber-500" />
                <span>Running structure validation checks...</span>
              </div>
            )}

            {marksValStatus.status === 'valid' && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>CSV structure validated successfully! Ready to import.</span>
              </div>
            )}

            {marksValStatus.status === 'invalid' && (
              <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                <span>{marksValStatus.error}</span>
              </div>
            )}
          </div>

          <button
            onClick={uploadMarks}
            disabled={marksValStatus.status !== 'valid' || marksUploading}
            className="w-full mt-6 py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/10 transition-all duration-200"
          >
            {marksUploading ? 'Importing Academic Marks...' : 'Import Marks'}
          </button>
        </div>
      </div>

      {/* CSV Upload History Log */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">CSV Upload History</h2>
            <p className="text-xs text-gray-500">Track and download historical CSV uploads</p>
          </div>
          <button 
            onClick={loadLogs} 
            disabled={loadingLogs}
            className="p-2 rounded-xl text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loadingLogs ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          {loadingLogs && logs.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <CircularProgress size={24} className="!text-purple-600" />
              <p className="mt-2 text-sm text-gray-500">Fetching history logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              No files uploaded yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">File Name</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Uploaded By</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Upload Date</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{log.fileName}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        log.fileType === 'STUDENT'
                          ? 'bg-purple-50 border-purple-100 text-purple-700'
                          : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                      }`}>
                        {log.fileType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{log.uploadedBy}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(log.uploadDate).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                      <button
                        onClick={() => downloadFile(log.id, log.fileName)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-purple-650 hover:bg-purple-50 transition-colors"
                        title="Download CSV"
                      >
                        <Download className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
