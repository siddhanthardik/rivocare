import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Activity, Clock, ShieldCheck, HeartPulse, FileText, ChevronRight, Stethoscope, Droplet, Microscope } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { LAB_DEPARTMENTS } from '@/constants/departments';

export default function LabsHome() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'patient') {
      navigate('/dashboard/patient/labs/book');
    }
  }, [user, navigate]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/labs/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const categories = [
    { name: 'Pathology', key: 'pathology', icon: <Droplet size={24} />, color: 'bg-red-50 text-red-600' },
    { name: 'Radiology', key: 'radiology', icon: <Activity size={24} />, color: 'bg-blue-50 text-blue-600' },
    { name: 'Cardiology', key: 'cardiology', icon: <HeartPulse size={24} />, color: 'bg-emerald-50 text-emerald-600' },
    { name: 'Microbiology', key: 'microbiology', icon: <Microscope size={24} />, color: 'bg-purple-50 text-purple-600' },
  ];

  const popularPackages = [
    { title: 'Comprehensive Full Body Checkup', tests: 64, originalPrice: 2999, price: 1499, tag: 'Most Popular' },
    { title: 'Advanced Diabetes Care', tests: 42, originalPrice: 1999, price: 999 },
    { title: 'Women\'s Wellness Profile', tests: 55, originalPrice: 3499, price: 1999 },
    { title: 'Senior Citizen Checkup', tests: 70, originalPrice: 4999, price: 2499 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-bold mb-8 border border-blue-100 shadow-sm animate-fade-in">
            <ShieldCheck size={18} className="text-blue-500" />
            NABL Accredited Partner Labs
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
            Premium Diagnostics, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Delivered to Your Doorstep.
            </span>
          </h1>
          
          <p className="text-lg text-slate-600 mb-10 max-w-2xl font-medium">
            Book highly reliable lab tests and comprehensive health packages from top accredited labs. Get free home sample collection and quick digital reports.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="w-full max-w-3xl relative shadow-2xl shadow-blue-900/5 rounded-full group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-16 pr-40 py-5 bg-white border-2 border-transparent focus:border-blue-500 rounded-full text-lg text-slate-900 placeholder:text-slate-400 transition-all outline-none"
              placeholder="Search for 'CBC', 'Lipid Profile', 'Full Body Checkup'..."
            />
            <div className="absolute inset-y-2 right-2 flex items-center">
              <Button type="submit" className="h-full rounded-full px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/20">
                Search
              </Button>
            </div>
          </form>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-sm font-semibold text-slate-500">
            <span>Popular:</span>
            {['HbA1c', 'Thyroid Profile', 'Vitamin D', 'CBC'].map(test => (
              <button key={test} onClick={() => setSearchQuery(test)} className="px-3 py-1 bg-white border border-slate-200 rounded-full hover:border-blue-500 hover:text-blue-600 transition-colors">
                {test}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: <Clock size={32} />, title: "Free Home Collection", desc: "Our trained phlebotomists collect samples from your home safely and securely.", color: "text-blue-600", bg: "bg-blue-50" },
              { icon: <ShieldCheck size={32} />, title: "Certified Partner Labs", desc: "We partner exclusively with NABL, CAP, and ISO certified diagnostic centers.", color: "text-emerald-600", bg: "bg-emerald-50" },
              { icon: <FileText size={32} />, title: "Digital Smart Reports", desc: "Get accurate, easy-to-understand diagnostic reports delivered directly to your app.", color: "text-indigo-600", bg: "bg-indigo-50" },
            ].map((feature, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-8 rounded-[2rem] bg-slate-50 border border-slate-100 hover:-translate-y-1 transition-transform">
                <div className={`w-20 h-20 rounded-full ${feature.bg} ${feature.color} flex items-center justify-center mb-6 shadow-sm`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOP CATEGORIES ── */}
      <section className="py-20 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Browse by Category</h2>
              <p className="text-slate-500 font-medium">Find specific tests tailored to your health needs.</p>
            </div>
            <Link to="/labs/search" className="hidden sm:flex items-center gap-2 font-bold text-blue-600 hover:text-blue-700">
              View All <ChevronRight size={18} />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat, idx) => (
              <Link to={`/labs/search?category=${encodeURIComponent(cat.key)}`} key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-900/5 transition-all group flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-2xl ${cat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {cat.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── POPULAR PACKAGES ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Popular Health Packages</h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">Proactive health tracking with our comprehensive, discounted test packages.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {popularPackages.map((pkg, idx) => (
              <div key={idx} className="relative bg-white rounded-[2rem] border border-slate-200 p-6 flex flex-col hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/10 transition-all group">
                {pkg.tag && (
                  <div className="absolute -top-4 left-6 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-black uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg">
                    {pkg.tag}
                  </div>
                )}
                
                <div className="mb-6 mt-4">
                  <h3 className="text-xl font-black text-slate-900 mb-2 line-clamp-2">{pkg.title}</h3>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
                    <Microscope size={16} className="text-blue-600" /> {pkg.tests} Parameters Included
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-100">
                  <div className="flex items-end gap-3 mb-6">
                    <span className="text-3xl font-black text-slate-900">₹{pkg.price}</span>
                    <span className="text-lg font-bold text-slate-400 line-through mb-1">₹{pkg.originalPrice}</span>
                    <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded mb-1 ml-auto">
                      {Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)}% OFF
                    </span>
                  </div>
                  
                  <Button className="w-full bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border-none font-bold py-3.5 rounded-xl transition-colors">
                    Book Package
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UPLOAD PRESCRIPTION CTA ── */}
      <section className="bg-slate-900 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Have a Prescription?</h2>
            <p className="text-blue-200 text-lg max-w-xl">Don't want to search for individual tests? Upload your doctor's prescription and we will build your cart for you automatically.</p>
          </div>
          <div className="flex-shrink-0">
            <Button className="bg-white text-slate-900 hover:bg-blue-50 border-none font-black px-8 py-4 text-lg rounded-2xl shadow-xl flex items-center gap-2">
              <FileText size={20} className="text-blue-600" /> Upload Prescription
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}

