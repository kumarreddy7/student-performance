import { useReportStore } from '../../features/reports/reportStore';
import { FileText, FileSpreadsheet, Download, ShieldAlert } from 'lucide-react';
import { CircularProgress } from '@mui/material';
import { useAuthStore } from '../../features/auth/authStore';
import { getTeacherClassAssignment } from '../../lib/roleSecurity';
import { normalizeRole } from '../../lib/roles';

export default function Reports() {
  const { isGenerating, downloadWatchlistPdf, downloadWatchlistExcel } = useReportStore();
  const user = useAuthStore((state) => state.user);
  const role = normalizeRole(user?.role);

  const handlePdfDownload = () => {
    if (role === 'teacher') {
      const tc = getTeacherClassAssignment(user?.username);
      downloadWatchlistPdf(tc.branch, [tc.section]);
    } else if (role === 'counselor') {
      downloadWatchlistPdf(undefined, undefined, user?.username);
    } else {
      downloadWatchlistPdf();
    }
  };

  const handleExcelDownload = () => {
    if (role === 'teacher') {
      const tc = getTeacherClassAssignment(user?.username);
      downloadWatchlistExcel(tc.branch, [tc.section]);
    } else if (role === 'counselor') {
      downloadWatchlistExcel(undefined, undefined, user?.username);
    } else {
      downloadWatchlistExcel();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <FileText className="h-8 w-8 text-purple-600" />
          Academic Reports & Analytics
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Generate, compile, and download students' performance logs, at-risk rosters, and full watchlists.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Watchlist Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl w-fit">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">PDF Student Watchlist</h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Download a printable PDF report detailing all students flagged by the system as at-risk due to low attendance (under 75%) or failing grades. Includes risk scores, attendance percentages, and contact details.
              </p>
            </div>
          </div>
          
          <button
            onClick={handlePdfDownload}
            disabled={isGenerating}
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent shadow-sm text-sm font-bold rounded-2xl text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5"
          >
            {isGenerating ? (
              <CircularProgress size={18} className="!text-white mr-2" />
            ) : (
              <Download className="-ml-1 mr-2 h-5 w-5" />
            )}
            {isGenerating ? 'Compiling PDF...' : 'Download PDF Report'}
          </button>
        </div>

        {/* Excel Watchlist Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl w-fit">
              <FileSpreadsheet className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Excel Student Watchlist</h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Download a structured Excel spreadsheet containing full student performance details. Great for offline spreadsheets, custom reports, importing to external management tools, and counselor analysis.
              </p>
            </div>
          </div>
          
          <button
            onClick={handleExcelDownload}
            disabled={isGenerating}
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-purple-200 shadow-sm text-sm font-bold rounded-2xl text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5"
          >
            {isGenerating ? (
              <CircularProgress size={18} className="!text-purple-700 mr-2" />
            ) : (
              <Download className="-ml-1 mr-2 h-5 w-5" />
            )}
            {isGenerating ? 'Generating Excel...' : 'Download Excel Spreadsheet'}
          </button>
        </div>
      </div>

      {/* Admin Information Widget */}
      <div className="bg-purple-50/50 border border-purple-100 rounded-3xl p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="bg-purple-100 text-purple-600 p-3 rounded-2xl">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-purple-900 text-sm">Security & Compliance Notice</h3>
          <p className="text-xs text-purple-700 leading-relaxed">
            These documents contain sensitive student PII (Personally Identifiable Information) and academic grades. 
            Ensure downloaded files are stored securely and only shared with authorized teaching staff and counselors.
          </p>
        </div>
      </div>
    </div>
  );
}
