import { useState, useEffect } from 'react';
import { adminService } from '@/services';
import { AlertCircle, Clock, Globe, User, Terminal, Layout, ChevronDown, ChevronUp } from 'lucide-react';
import { PageLoader } from '@/components/ui/Feedback';
import { format } from 'date-fns';

export default function ErrorLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const response = await adminService.getErrorLogs();
      if (response.success) {
        setLogs(response.data);
      }
    } catch (err) {
      console.error('Failed to load logs', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex items-center justify-between bg-slate-900 p-8 rounded-[2.5rem] text-white">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-400">
            <AlertCircle size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">System Error Logs</h1>
            <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">Frontend Health Monitor</p>
          </div>
        </div>
        <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
          <span className="text-red-400 font-black text-xl">{logs.length}</span>
          <span className="text-slate-400 text-xs font-bold ml-2 uppercase">Recent Crashes</span>
        </div>
      </div>

      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log._id} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div 
              className="p-6 cursor-pointer flex items-center justify-between"
              onClick={() => toggleExpand(log._id)}
            >
              <div className="flex items-center gap-6 flex-1 min-w-0">
                <div className="flex flex-col gap-1 min-w-0">
                  <h3 className="text-slate-900 font-black text-lg truncate pr-4">{log.message}</h3>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-1.5"><Layout size={12} /> {log.route}</span>
                    <span className="flex items-center gap-1.5"><Clock size={12} /> {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {log.user ? (
                   <div className="bg-indigo-50 px-3 py-1.5 rounded-full flex items-center gap-2">
                      <User size={12} className="text-indigo-500" />
                      <span className="text-[10px] font-black text-indigo-600 uppercase">{log.user.email}</span>
                   </div>
                ) : (
                  <div className="bg-slate-50 px-3 py-1.5 rounded-full text-[10px] font-black text-slate-400 uppercase">Guest</div>
                )}
                {expanded[log._id] ? <ChevronUp size={20} className="text-slate-300" /> : <ChevronDown size={20} className="text-slate-300" />}
              </div>
            </div>

            {expanded[log._id] && (
              <div className="px-8 pb-8 pt-2 space-y-6 animate-slide-down">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Globe size={12} /> Browser Context
                    </h4>
                    <div className="bg-slate-50 p-4 rounded-2xl text-[11px] font-medium text-slate-600 font-mono break-all leading-relaxed">
                      {log.browser?.userAgent}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Terminal size={12} /> Component Path
                    </h4>
                    <div className="bg-slate-50 p-4 rounded-2xl text-[11px] font-medium text-slate-600 font-mono overflow-x-auto whitespace-pre">
                      {log.component}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle size={12} /> Stack Trace
                  </h4>
                  <div className="bg-slate-900 p-6 rounded-2xl text-[11px] font-medium text-slate-300 font-mono overflow-x-auto whitespace-pre leading-relaxed shadow-inner">
                    {log.stack}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {logs.length === 0 && (
          <div className="bg-white border-2 border-dashed border-slate-100 rounded-[3rem] py-20 text-center">
             <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} />
             </div>
             <h2 className="text-2xl font-black text-slate-900 mb-2">System Healthy</h2>
             <p className="text-slate-400 font-medium">No frontend crashes reported recently.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const CheckCircle = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
