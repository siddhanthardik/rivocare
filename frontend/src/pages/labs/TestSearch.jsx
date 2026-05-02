import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Microscope, Clock, ShieldCheck, FileText, ChevronRight, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { LAB_DEPARTMENTS } from '@/constants/departments';

export default function TestSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (user?.role === 'patient') {
      navigate('/dashboard/patient/labs/book');
    }
  }, [user, navigate]);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');

  const categories = ['All', ...LAB_DEPARTMENTS.map(d => d.label)];

  // Dummy data for visual presentation
  const searchResults = [
    { id: 1, name: 'Complete Blood Count (CBC)', department: 'pathology', parameters: 24, tat: '12 Hours', price: 399, originalPrice: 600, lab: 'Apollo Diagnostics' },
    { id: 2, name: 'Comprehensive Full Body Checkup', department: 'pathology', parameters: 64, tat: '24 Hours', price: 1499, originalPrice: 2999, lab: 'SRL Diagnostics' },
    { id: 3, name: 'Advanced Diabetes Profile', department: 'pathology', parameters: 42, tat: '24 Hours', price: 999, originalPrice: 1999, lab: 'Dr. Lal PathLabs' },
    { id: 4, name: 'Thyroid Profile Total (T3, T4, TSH)', department: 'pathology', parameters: 3, tat: '12 Hours', price: 499, originalPrice: 800, lab: 'Thyrocare' },
    { id: 5, name: 'Lipid Profile', department: 'pathology', parameters: 8, tat: '12 Hours', price: 599, originalPrice: 900, lab: 'Apollo Diagnostics' },
    { id: 6, name: 'HbA1c', department: 'pathology', parameters: 1, tat: '12 Hours', price: 399, originalPrice: 600, lab: 'SRL Diagnostics' },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (query) params.q = query;
    if (activeCategory !== 'All') {
      const deptKey = LAB_DEPARTMENTS.find(d => d.label === activeCategory)?.key;
      if (deptKey) params.department = deptKey;
    }
    setSearchParams(params);
  };

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    const params = {};
    if (query) params.q = query;
    if (cat !== 'All') {
      const deptKey = LAB_DEPARTMENTS.find(d => d.label === cat)?.key;
      if (deptKey) params.department = deptKey;
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setQuery('');
    setActiveCategory('All');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* ── TOP SEARCH HEADER ── */}
      <div className="bg-white border-b border-slate-200 sticky top-20 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for tests, packages, or health profiles..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
              />
              {query && (
                <button type="button" onClick={clearFilters} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-200/50 p-1 rounded-full">
                  <X size={16} />
                </button>
              )}
            </div>
            <Button type="submit" className="py-4 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 whitespace-nowrap text-lg">
              Search Tests
            </Button>
          </form>

          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 mt-6 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm transition-all border ${
                  activeCategory === cat 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR FILTERS (Desktop) */}
        <div className="hidden lg:block w-72 shrink-0 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200">
            <div className="flex items-center gap-2 mb-6 text-slate-900 font-black text-lg">
              <Filter size={20} className="text-blue-600" /> Filters
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-slate-900 mb-3">Price Range</h4>
                <div className="space-y-2">
                  {['Under ₹500', '₹500 - ₹1000', '₹1000 - ₹3000', 'Above ₹3000'].map((range, i) => (
                    <label key={i} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{range}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-3">Accreditations</h4>
                <div className="space-y-2">
                  {['NABL Accredited', 'CAP Accredited', 'ISO Certified'].map((cert, i) => (
                    <label key={i} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                      <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{cert}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex flex-col items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <FileText size={24} className="text-blue-600" />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-lg mb-1">Prescription Upload</h4>
              <p className="text-sm text-slate-600 font-medium mb-4">Upload your prescription and we will build your cart automatically.</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl">
                Upload Now
              </Button>
            </div>
          </div>
        </div>

        {/* RESULTS GRID */}
        <div className="flex-1">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-black text-slate-900">
              {query ? `Search results for "${query}"` : 'Recommended Tests & Packages'}
              <span className="text-slate-500 text-base font-medium ml-2">({searchResults.length} found)</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Sort by:</span>
              <select className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-500">
                <option>Relevance</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {searchResults.map((test) => (
              <div key={test.id} className="bg-white rounded-[2rem] border border-slate-200 p-6 flex flex-col hover:border-blue-500 hover:shadow-xl hover:shadow-blue-900/5 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <span className="bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-md">
                    {LAB_DEPARTMENTS.find(d => d.key === test.department)?.label || test.department}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                    <ShieldCheck size={14} /> NABL
                  </div>
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-3 leading-tight line-clamp-2">{test.name}</h3>
                
                <p className="text-sm font-bold text-slate-500 mb-6 flex items-center gap-1">
                  By <span className="text-slate-900">{test.lab}</span>
                </p>

                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    <Microscope size={16} className="text-blue-500" /> {test.parameters} Parameters
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    <Clock size={16} className="text-indigo-500" /> {test.tat}
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-end gap-2 mb-0.5">
                      <span className="text-2xl font-black text-slate-900">₹{test.price}</span>
                      <span className="text-sm font-bold text-slate-400 line-through mb-1">₹{test.originalPrice}</span>
                    </div>
                    <p className="text-xs font-bold text-green-600">{Math.round(((test.originalPrice - test.price) / test.originalPrice) * 100)}% OFF</p>
                  </div>
                  <Button className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border-none font-black px-6 py-3 rounded-xl transition-colors">
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 flex justify-center">
            <Button variant="secondary" className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-bold px-8 py-3 rounded-2xl">
              Load More Tests
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

