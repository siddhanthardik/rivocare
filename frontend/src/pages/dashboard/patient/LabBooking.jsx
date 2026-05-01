import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Microscope, Clock, ShieldCheck, 
  ChevronRight, X, User, Plus, MapPin, 
  Calendar as CalendarIcon, CheckCircle2,
  Trash2, ShoppingCart, Info, Home, Briefcase, Wallet,
  Smartphone, CreditCard as CardIcon,
  Users, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { labService } from '@/services';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { cn } from '../../../utils';
import { PageWrapper, Card, Row } from '../../../components/ui/Layout';

const STEPS = [
  { id: 1, title: 'Tests', icon: Microscope },
  { id: 2, title: 'Patient', icon: User },
  { id: 3, title: 'Address', icon: MapPin },
  { id: 4, title: 'Slot', icon: CalendarIcon },
  { id: 5, title: 'Payment', icon: CardIcon },
];

export default function LabBooking() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('rivo_lab_cart');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [familyMembers, setFamilyMembers] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const [bookingData, setBookingData] = useState({
    patient: { type: 'self', name: user?.name, age: '', gender: user?.gender || '' },
    address: {
      type: user?.addressType || 'Home',
      fullAddress: user?.address || '',
      city: user?.city || '',
      pincode: user?.pincode || '',
      locality: user?.locality || ''
    },
    slot: { date: '', time: '' },
    paymentMethod: 'cod',
    repeatReminder: false,
    bookingId: null
  });

  useEffect(() => {
    if (user && !bookingData.patient.name) {
      setBookingData(prev => ({
        ...prev,
        patient: { ...prev.patient, name: user.name, gender: user.gender || '' },
        address: {
          ...prev.address,
          type: user.addressType || 'Home',
          fullAddress: user.address || '',
          city: user.city || '',
          pincode: user.pincode || '',
          locality: user.locality || ''
        }
      }));
    }
  }, [user]);

  const categories = ['All', 'Popular', 'Diabetes', 'Women', 'Senior Citizen', 'Packages'];

  useEffect(() => {
    localStorage.setItem('rivo_lab_cart', JSON.stringify(cart));
  }, [cart]);

  const fetchProfilesAndAddresses = useCallback(async () => {
    try {
      const [membersRes, addressesRes] = await Promise.all([
        labService.getFamilyMembers(),
        labService.getSavedAddresses()
      ]);
      setFamilyMembers(membersRes.data || []);
      setSavedAddresses(addressesRes.data || []);
    } catch (err) {
      console.error('Failed to fetch profiles', err);
    }
  }, []);

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await labService.searchTests({ 
        q: searchQuery, 
        category: activeCategory !== 'All' ? activeCategory : undefined 
      });
      setTests(res.data || []);
    } catch (err) {
      toast.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeCategory]);

  useEffect(() => {
    fetchTests();
    fetchProfilesAndAddresses();
  }, [fetchTests, fetchProfilesAndAddresses]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    try {
      setLoading(true);
      const res = await labService.addFamilyMember(data);
      toast.success('Member added!');
      setShowProfileForm(false);
      fetchProfilesAndAddresses();
      setBookingData(prev => ({ ...prev, patient: { type: 'family', ...res.data } }));
    } catch (err) {
      toast.error('Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    try {
      setLoading(true);
      const res = await labService.addSavedAddress(data);
      toast.success('Address saved!');
      setShowAddressForm(false);
      fetchProfilesAndAddresses();
      setBookingData(prev => ({ ...prev, address: res.data }));
    } catch (err) {
      toast.error('Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (test) => {
    if (cart.find(t => t._id === test._id)) {
      toast.error('Test already in cart');
      return;
    }
    if (cart.length > 0 && cart[0].partner._id !== test.partner._id) {
      toast.error(`One lab per order. Currently: ${cart[0].partner.name}`);
      return;
    }
    setCart([...cart, test]);
    toast.success('Added to cart');
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(t => t._id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);

  const nextStep = () => {
    if (currentStep === 1 && cart.length === 0) {
      toast.error('Select at least one test');
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  /* ── STEP COMPONENTS ── */

  const Step1Tests = () => (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-8 space-y-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search for tests..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all typo-body"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "whitespace-nowrap px-4 py-1.5 rounded-full typo-micro font-bold transition-all border",
                activeCategory === cat 
                  ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                  : "bg-white text-slate-500 border-slate-200 hover:border-blue-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tests.map(test => (
            <Card key={test._id} className="hover:border-blue-200 transition-all flex flex-col justify-between">
              <div className="space-y-1">
                <h3 className="typo-body font-bold text-gray-900 leading-tight">{test.name}</h3>
                <div className="flex flex-wrap gap-1.5">
                  <span className="typo-micro !text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                    {test.parameters?.length || 0} Param
                  </span>
                  <span className="typo-micro !text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                    {test.partner?.name}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                <div className="flex items-baseline gap-1.5">
                  <span className="typo-value !text-[16px] font-black text-slate-900">₹{test.price}</span>
                  {test.discountPrice && <span className="typo-micro line-through text-slate-400">₹{test.discountPrice}</span>}
                </div>
                <button onClick={() => addToCart(test)} className="btn-primary-sm !px-3 !py-1 !text-[11px]">Add</button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4">
        <Card noPadding className="h-fit lg:sticky lg:top-24">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="typo-label !text-gray-900 font-bold flex items-center gap-2">
              <ShoppingCart size={14} className="text-blue-600" /> Cart ({cart.length})
            </h3>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="typo-micro !text-red-500 hover:underline font-bold">Clear</button>
            )}
          </div>
          
          <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
            {cart.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                <ShoppingCart size={32} className="text-slate-300 mb-2" />
                <p className="typo-micro text-slate-500">Cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item._id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="typo-micro font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="typo-micro font-bold text-blue-600">₹{item.price}</p>
                  </div>
                  <button onClick={() => removeFromCart(item._id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-4 bg-slate-900 text-white rounded-b-3xl">
              <div className="flex items-center justify-between mb-4">
                <span className="typo-micro text-slate-400 uppercase font-bold">Total</span>
                <span className="typo-kpi !text-[20px]">₹{totalAmount}</span>
              </div>
              <button 
                onClick={nextStep}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl typo-label !text-white !font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-900/20"
              >
                Continue <ChevronRight size={16} />
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );

  const Step2Patient = () => (
    <div className="max-w-[800px] mx-auto space-y-6">
      <div className="text-center">
        <h2 className="typo-title">Who is this test for?</h2>
        <p className="typo-body">Select or add a patient profile.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button 
          onClick={() => setBookingData({...bookingData, patient: { type: 'self', name: user?.name, age: '', gender: user?.gender }})}
          className={cn(
            "p-3 rounded-2xl border transition-all flex flex-col items-start gap-3 text-left",
            bookingData.patient.type === 'self' ? "bg-blue-50 border-blue-600" : "bg-white border-slate-100"
          )}
        >
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bookingData.patient.type === 'self' ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400")}>
            <User size={20} />
          </div>
          <div>
            <p className="typo-body font-bold text-slate-900">Self (Me)</p>
            <p className="typo-micro text-gray-500">{user?.name}</p>
          </div>
        </button>

        {familyMembers.map(member => (
          <button 
            key={member._id}
            onClick={() => setBookingData({...bookingData, patient: { type: 'family', ...member }})}
            className={cn(
              "p-3 rounded-2xl border transition-all flex flex-col items-start gap-3 text-left",
              bookingData.patient._id === member._id ? "bg-blue-50 border-blue-600" : "bg-white border-slate-100"
            )}
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bookingData.patient._id === member._id ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400")}>
              <Users size={20} />
            </div>
            <div>
              <p className="typo-body font-bold text-slate-900">{member.name}</p>
              <p className="typo-micro text-gray-500">{member.relationship} • {member.age}y</p>
            </div>
          </button>
        ))}

        <button onClick={() => setShowProfileForm(true)} className="p-3 rounded-2xl border border-dashed border-slate-200 bg-white hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2 text-center group">
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-slate-100">
            <Plus size={20} />
          </div>
          <p className="typo-micro font-bold text-slate-900">Add Member</p>
        </button>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <button onClick={prevStep} className="btn-secondary-sm flex-1 !py-2.5">Back</button>
        <button disabled={!bookingData.patient.name} onClick={nextStep} className="btn-primary-sm flex-1 !py-2.5 !bg-blue-600 shadow-md">Select Address</button>
      </div>
    </div>
  );

  const Step3Address = () => (
    <div className="max-w-[800px] mx-auto space-y-6">
      <div className="text-center">
        <h2 className="typo-title">Collection Address</h2>
        <p className="typo-body">Preferred sample collection location.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {savedAddresses.map((addr, idx) => (
          <button 
            key={idx}
            onClick={() => setBookingData({...bookingData, address: addr})}
            className={cn(
              "p-3 rounded-2xl border transition-all flex items-start gap-3 text-left",
              bookingData.address.fullAddress === addr.fullAddress ? "bg-blue-50 border-blue-600" : "bg-white border-slate-100"
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
              {addr.type === 'Home' ? <Home size={16} /> : <Briefcase size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="typo-body font-bold text-slate-900">{addr.type}</p>
              <p className="typo-micro text-gray-500 mt-0.5 line-clamp-1">{addr.fullAddress}</p>
            </div>
          </button>
        ))}

        <button onClick={() => setShowAddressForm(true)} className="p-3 rounded-2xl border border-dashed border-slate-200 bg-white hover:bg-slate-50 transition-all flex items-center gap-3 text-left group">
          <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center">
            <Plus size={16} />
          </div>
          <p className="typo-micro font-bold text-slate-900">Add New Address</p>
        </button>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <button onClick={prevStep} className="btn-secondary-sm flex-1 !py-2.5">Back</button>
        <button disabled={!bookingData.address.fullAddress} onClick={nextStep} className="btn-primary-sm flex-1 !py-2.5 !bg-blue-600 shadow-md">Pick a Slot</button>
      </div>
    </div>
  );

  const Step4Slot = () => {
    const dates = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });
    const slots = ['06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '04:00 PM'];

    return (
      <div className="max-w-[600px] mx-auto space-y-6">
        <div className="text-center">
          <h2 className="typo-title">Select Date & Time</h2>
          <p className="typo-body">Choose a convenient slot.</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {dates.map((date, i) => {
              const isSelected = bookingData.slot.date === date.toISOString().split('T')[0];
              return (
                <button
                  key={i}
                  onClick={() => setBookingData({...bookingData, slot: {...bookingData.slot, date: date.toISOString().split('T')[0]}})}
                  className={cn(
                    "shrink-0 w-20 p-2.5 rounded-xl flex flex-col items-center transition-all border",
                    isSelected ? "bg-blue-600 border-blue-600 text-white shadow-md" : "bg-white border-slate-100 text-slate-500"
                  )}
                >
                  <span className="typo-micro font-bold uppercase opacity-60">
                    {date.toLocaleDateString('en-IN', { weekday: 'short' })}
                  </span>
                  <span className="typo-value !text-[18px] font-black">{date.getDate()}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {slots.map(slot => (
              <button
                key={slot}
                onClick={() => setBookingData({...bookingData, slot: {...bookingData.slot, time: slot}})}
                className={cn(
                  "p-3 rounded-xl typo-micro font-bold transition-all border text-center",
                  bookingData.slot.time === slot ? "bg-slate-900 border-slate-900 text-white shadow-md" : "bg-white border-slate-100 text-slate-600"
                )}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button onClick={prevStep} className="btn-secondary-sm flex-1 !py-2.5">Back</button>
          <button disabled={!bookingData.slot.date || !bookingData.slot.time} onClick={nextStep} className="btn-primary-sm flex-1 !py-2.5 !bg-blue-600 shadow-md">Review & Pay</button>
        </div>
      </div>
    );
  };

  const Step5Payment = () => (
    <div className="max-w-[900px] mx-auto grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-8 space-y-4">
        <Card className="space-y-4">
          <h3 className="typo-body font-bold text-slate-900">Order Summary</h3>
          <div className="space-y-2">
            {cart.map(item => (
              <div key={item._id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                <div className="min-w-0">
                  <p className="typo-micro font-bold text-slate-800 truncate">{item.name}</p>
                  <p className="typo-micro text-slate-400">{item.partner?.name}</p>
                </div>
                <span className="typo-micro font-black text-slate-900 shrink-0">₹{item.price}</span>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
            <span className="typo-body font-bold text-gray-500">Total Payable</span>
            <span className="typo-kpi !text-[20px] text-blue-600">₹{totalAmount}</span>
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="typo-body font-bold text-slate-900">Choose Payment Method</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { id: 'razorpay', label: 'Online Payment', icon: CardIcon },
              { id: 'upi', label: 'UPI Payment', icon: Smartphone },
              { id: 'cod', label: 'Cash at Collection', icon: Wallet, full: true }
            ].map(m => (
              <button 
                key={m.id}
                onClick={() => setBookingData({...bookingData, paymentMethod: m.id})}
                className={cn(
                  "p-3.5 rounded-xl border transition-all flex items-center gap-3",
                  m.full ? "sm:col-span-2" : "",
                  bookingData.paymentMethod === m.id ? "bg-blue-50 border-blue-600 shadow-sm" : "bg-slate-50 border-transparent"
                )}
              >
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
                  <m.icon size={16} />
                </div>
                <span className="typo-micro font-bold text-slate-900">{m.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="col-span-12 lg:col-span-4 space-y-4">
        <Card className="bg-slate-900 text-white space-y-4 border-slate-800">
          <h4 className="typo-micro text-slate-500 font-bold uppercase tracking-widest">Confirmation Details</h4>
          <div className="space-y-4">
            <div className="flex gap-3">
              <User size={16} className="text-slate-500 shrink-0" />
              <div>
                <p className="typo-micro text-slate-500 font-bold uppercase">Patient</p>
                <p className="typo-micro font-bold text-white">{bookingData.patient.name}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <MapPin size={16} className="text-slate-500 shrink-0" />
              <div>
                <p className="typo-micro text-slate-500 font-bold uppercase">Location</p>
                <p className="typo-micro text-slate-300 line-clamp-2 leading-relaxed">{bookingData.address.fullAddress}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CalendarIcon size={16} className="text-slate-500 shrink-0" />
              <div>
                <p className="typo-micro text-slate-500 font-bold uppercase">Schedule</p>
                <p className="typo-micro font-bold text-white">{bookingData.slot.date} @ {bookingData.slot.time}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={async () => {
              try {
                if (!cart.length) return toast.error("Cart is empty");
                setLoading(true);
                const payload = {
                  partnerId: cart[0].partner?._id,
                  testIds: cart.map(t => t._id),
                  totalAmount,
                  scheduledDate: bookingData.slot.date,
                  scheduledTime: bookingData.slot.time,
                  collectionType: 'home',
                  collectionAddress: bookingData.address,
                  paymentMethod: bookingData.paymentMethod,
                  repeatReminder: bookingData.repeatReminder
                };
                const res = await labService.bookTest(payload);
                setCurrentStep(6);
                setBookingData(prev => ({ ...prev, bookingId: res.data?._id }));
                localStorage.removeItem('rivo_lab_cart');
                setCart([]);
                toast.success('Confirmed!');
              } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
              finally { setLoading(false); }
            }}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl typo-label !text-white !font-bold shadow-lg shadow-blue-900/40 mt-2"
          >
            {loading ? 'Confirming...' : 'Place Order Now'}
          </button>
        </Card>
      </div>
    </div>
  );

  const Step6Confirmation = () => (
    <div className="max-w-[600px] mx-auto text-center py-12">
      <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-emerald-100">
        <CheckCircle2 size={40} />
      </div>
      <h2 className="typo-title !text-[28px]">Order Confirmed!</h2>
      <p className="typo-body !text-slate-500 mt-2 mb-10">We've sent a confirmation to your WhatsApp.</p>
      
      <Card className="flex flex-col md:flex-row items-center justify-between gap-6 border-emerald-100 bg-emerald-50/10">
        <div className="text-left">
          <p className="typo-micro !text-gray-400 font-bold uppercase tracking-wider">Order ID</p>
          <p className="typo-value !text-gray-900 font-black tracking-tight">#RIVO-LAB-{bookingData.bookingId?.slice(-6).toUpperCase()}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Link to="/dashboard/patient/labs/orders" className="flex-1">
            <button className="w-full btn-secondary-sm !py-2.5">Track Order</button>
          </Link>
          <Link to="/dashboard/patient" className="flex-1">
            <button className="w-full btn-primary-sm !py-2.5">Home</button>
          </Link>
        </div>
      </Card>
    </div>
  );

  return (
    <PageWrapper maxWidth={currentStep === 1 || currentStep === 5 ? '1200px' : '800px'}>
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {currentStep > 1 && currentStep < 6 && (
            <button onClick={prevStep} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="typo-body font-black text-gray-900 leading-none">Diagnostic Booking</h1>
            <p className="typo-micro text-gray-400 mt-1 font-bold">Step {currentStep} of 5</p>
          </div>
        </div>
      
        {currentStep < 6 && (
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
            {STEPS.map(s => (
              <div 
                key={s.id} 
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                  currentStep === s.id ? "bg-slate-900 text-white shadow-md scale-105" : 
                  currentStep > s.id ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-300"
                )}
              >
                {currentStep > s.id ? <CheckCircle2 size={14} /> : <s.icon size={14} />}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="animate-fade-in min-h-[400px]">
        {currentStep === 1 && <Step1Tests />}
        {currentStep === 2 && <Step2Patient />}
        {currentStep === 3 && <Step3Address />}
        {currentStep === 4 && <Step4Slot />}
        {currentStep === 5 && <Step5Payment />}
        {currentStep === 6 && <Step6Confirmation />}
      </div>

      {/* Forms */}
      <Modal isOpen={showProfileForm} onClose={() => setShowProfileForm(false)} title="Add Family Member">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
             <div className="col-span-2">
               <label className="typo-micro font-bold text-gray-400 uppercase">Full Name</label>
               <input name="name" required className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10" />
             </div>
             <div>
               <label className="typo-micro font-bold text-gray-400 uppercase">Age</label>
               <input name="age" type="number" required className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10" />
             </div>
             <div>
               <label className="typo-micro font-bold text-gray-400 uppercase">Gender</label>
               <select name="gender" required className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10">
                 <option value="Male">Male</option>
                 <option value="Female">Female</option>
                 <option value="Other">Other</option>
               </select>
             </div>
             <div className="col-span-2">
               <label className="typo-micro font-bold text-gray-400 uppercase">Relationship</label>
               <input name="relationship" placeholder="e.g. Mother, Spouse" required className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10" />
             </div>
          </div>
          <Button type="submit" loading={loading} className="w-full !py-3">Add Member</Button>
        </form>
      </Modal>

      <Modal isOpen={showAddressForm} onClose={() => setShowAddressForm(false)} title="Add New Address">
        <form onSubmit={handleAddAddress} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
             <div className="col-span-2">
               <label className="typo-micro font-bold text-gray-400 uppercase">Address Type</label>
               <select name="type" className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10">
                 <option value="Home">Home</option>
                 <option value="Office">Office</option>
                 <option value="Other">Other</option>
               </select>
             </div>
             <div className="col-span-2">
               <label className="typo-micro font-bold text-gray-400 uppercase">Full Address</label>
               <textarea name="fullAddress" required className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10 h-20" />
             </div>
             <div>
               <label className="typo-micro font-bold text-gray-400 uppercase">City</label>
               <input name="city" required className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10" />
             </div>
             <div>
               <label className="typo-micro font-bold text-gray-400 uppercase">Pincode</label>
               <input name="pincode" required className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10" />
             </div>
          </div>
          <Button type="submit" loading={loading} className="w-full !py-3">Save Address</Button>
        </form>
      </Modal>
    </PageWrapper>
  );
}
