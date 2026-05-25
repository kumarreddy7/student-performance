import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="relative max-w-md w-full bg-white/70 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl shadow-indigo-500/10 text-center flex flex-col items-center">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-indigo-500/10 rounded-3xl -z-10 blur-xl" />

        <div className="h-20 w-20 rounded-2xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center mb-6 animate-bounce shadow-lg shadow-red-500/5">
          <ShieldAlert className="h-10 w-10" />
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
          Access Denied
        </h1>
        
        <p className="text-gray-500 text-sm mb-8 max-w-sm">
          Sorry, you do not have the required permissions to view this page. If you believe this is an error, please contact your administrator.
        </p>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-2xl shadow-lg shadow-purple-600/10 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
