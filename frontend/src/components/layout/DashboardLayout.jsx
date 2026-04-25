import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, Search, Bell, MessageSquare, Plus } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

export default function DashboardLayout({ navItems }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar navItems={navItems} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-all active:scale-95">
              <Menu size={24} />
            </button>
          </div>

          {/* Desktop Header Content */}
          <div className="hidden lg:block">
            <h2 className="text-sm font-medium text-slate-400 mb-0.5">Good Morning,</h2>
            <h1 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {user?.name.split(' ')[0]} 👋
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">We’re here to care for you and your loved ones.</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 md:gap-5">
            <div className="hidden md:flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 w-64 group focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-transparent border-none focus:ring-0 text-sm text-slate-700 placeholder:text-slate-400 w-full ml-2"
              />
            </div>

            <div className="flex items-center gap-2">
              <button className="relative p-2.5 rounded-2xl text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all active:scale-95">
                <Bell size={22} />
                <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  2
                </span>
              </button>
              <button className="p-2.5 rounded-2xl text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all active:scale-95">
                <MessageSquare size={22} />
              </button>
            </div>

            <Link to="/dashboard/patient/book">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-blue-500/20 flex items-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0">
                Book a Service <Plus size={18} />
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 max-w-[1600px] w-full mx-auto bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
