import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Gift, Users, Heart, Share2, Copy, CheckCircle, 
  ArrowRight, Star, Wallet, MessageCircle, 
  ShieldCheck, Zap, Award, ChevronDown, ChevronUp,
  MessageSquare, UserPlus, CalendarCheck, Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

export default function ReferralLanding() {
  const { user } = useAuth();
  const [referralLink, setReferralLink] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    if (user) {
      const code = user.referralCode || '';
      setReferralCode(code);
      setReferralLink(`${window.location.origin}/register?ref=${code}`);
    }
  }, [user]);

  const copyToClipboard = () => {
    if (!user) {
      toast.error('Please login to get your referral link');
      return;
    }
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  };

  const shareViaWhatsApp = () => {
    if (!user) {
      toast.error('Please login to share your link');
      return;
    }
    const text = `Hey! Join RIVO Care for professional home healthcare. Use my link to unlock exclusive rewards on your first booking: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const scrollToRefer = () => {
    const el = document.getElementById('refer-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const faqs = [
    {
      q: "How do referrals work?",
      a: "It's simple! Share your unique link with friends or family. When they sign up and complete their first care service with Rivo Care, both you and your friend unlock exciting rewards."
    },
    {
      q: "When are rewards shared?",
      a: "Rewards are processed and shared privately via your wallet after your referred friend successfully completes their first service booking. You'll receive a notification immediately."
    },
    {
      q: "Is there any limit?",
      a: "No! You can refer as many loved ones as you like. The more you spread the care, the more rewards you unlock. There is no upper limit to your earning potential."
    },
    {
      q: "Which services qualify?",
      a: "All professional home care services provided by Rivo Care qualify for the referral program, including nursing care, physiotherapy, elderly care, and more."
    },
    {
      q: "How do I track status?",
      a: "You can track the status of your referrals directly in your dashboard. You'll see when someone signs up using your link and when their first service is completed."
    }
  ];

  const testimonials = [
    {
      name: "Sonia Sharma",
      location: "Vasant Kunj, Delhi",
      text: "Rivo Care has been a blessing for my parents. I referred it to my sister and we are both so happy with the care and support.",
      image: "/images/referral/t1.png"
    },
    {
      name: "Vikram Malhotra",
      location: "Greater Kailash, Delhi",
      text: "The caregivers are professional and kind. I referred my friends and the experience has been amazing for them too!",
      image: "/images/referral/t2.png"
    },
    {
      name: "Anjali Gupta",
      location: "Janakpuri, Delhi",
      text: "It feels good to refer something that truly helps. Rivo Care makes it easy to care for our loved ones.",
      image: "/images/referral/t3.png"
    }
  ];

  return (
    <div className="bg-white min-h-screen font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* WhatsApp Floating Button */}
      <button 
        onClick={shareViaWhatsApp}
        className="fixed bottom-24 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group"
      >
        <MessageCircle size={28} />
      </button>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          {/* Left Side */}
          <div className="flex-1 text-left">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-bold mb-6 tracking-wide uppercase">
              RIVO REFERRAL PROGRAM
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 leading-[1.1] mb-6">
              Care More. <br />
              <span className="text-blue-600">Earn More.</span>
            </h1>
            <p className="text-slate-500 text-lg md:text-xl max-w-lg mb-8 leading-relaxed">
              Refer your loved ones to Rivo Care and get <span className="font-bold text-slate-900 italic">exciting rewards</span> when they book a service. Because care is better when it's shared.
            </p>

            {/* Stepper Visual in Hero */}
            <div className="flex items-center gap-4 mb-10 overflow-x-auto no-scrollbar py-2">
              <div className="flex flex-col items-center min-w-[80px]">
                <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center mb-2 text-blue-600 border border-slate-50">
                  <Gift size={20} />
                </div>
                <p className="text-[10px] font-bold text-slate-800">Refer</p>
                <p className="text-[8px] text-slate-400">your loved ones</p>
              </div>
              <div className="w-8 border-t-2 border-dotted border-slate-200 mt-[-20px]"></div>
              <div className="flex flex-col items-center min-w-[80px]">
                <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center mb-2 text-blue-600 border border-slate-50">
                  <Heart size={20} />
                </div>
                <p className="text-[10px] font-bold text-slate-800">They avail</p>
                <p className="text-[8px] text-slate-400">our services</p>
              </div>
              <div className="w-8 border-t-2 border-dotted border-slate-200 mt-[-20px]"></div>
              <div className="flex flex-col items-center min-w-[80px]">
                <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center mb-2 text-blue-600 border border-slate-50">
                  <Award size={20} />
                </div>
                <p className="text-[10px] font-bold text-slate-800">You earn</p>
                <p className="text-[8px] text-slate-400">exciting rewards</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button onClick={scrollToRefer} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-base font-bold shadow-lg shadow-blue-500/20">
                Refer Now <ArrowRight size={18} className="ml-2" />
              </Button>
              <button onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 rounded-xl border-2 border-slate-200 text-slate-700 font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
                How It Works <Play size={14} className="fill-blue-600 text-blue-600" />
              </button>
            </div>
          </div>

          {/* Right Side - Visual */}
          <div className="flex-1 relative">
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl aspect-[4/3] w-full max-w-[600px] ml-auto">
              <img 
                src="/images/referral/hero.png" 
                alt="Family Care" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent"></div>
            </div>
            
            {/* Overlapping Trust Card */}
            <div className="absolute bottom-[-20px] left-[-20px] md:left-[-40px] bg-white p-6 rounded-[2rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] flex items-center gap-4 max-w-[280px] border border-slate-50">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div className="text-left">
                <h4 className="text-base font-bold text-slate-900 leading-tight">Spread care. <br />Be rewarded.</h4>
                <Heart size={16} className="text-blue-600 mt-1 fill-blue-600" />
              </div>
            </div>

            {/* Circular Badge */}
            <div className="absolute top-[-20px] right-20 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white">
              <Heart size={20} className="fill-white" />
            </div>
            <div className="absolute top-1/2 right-[-20px] w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-xl border-4 border-white rotate-12">
              <Gift size={20} className="fill-white" />
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block px-4 py-1 bg-blue-50 text-blue-600 text-[10px] font-black tracking-widest uppercase rounded-full mb-4">HOW IT WORKS</div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12">Refer in <span className="text-blue-600">3 Simple Steps</span></h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
            {[
              { step: "01", icon: <Users />, title: "Refer", desc: "Share Rivo Care with your friends and family." },
              { step: "02", icon: <CalendarCheck />, title: "They Book", desc: "They book and complete their first service." },
              { step: "03", icon: <Gift />, title: "You Earn", desc: "You get exciting rewards as our thank you!" }
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="bg-slate-50/50 p-10 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-2xl transition-all duration-300">
                  <div className="absolute top-6 left-6 text-xs font-bold text-blue-600 bg-blue-100/50 px-2 py-1 rounded-md">{item.step}</div>
                  <div className="w-16 h-16 bg-white shadow-md rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 border border-slate-50">
                    {item.icon}
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed px-4">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 right-[-20px] translate-x-1/2 -translate-y-1/2 text-blue-200">
                    <ArrowRight size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Refer Rivo Care */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <div className="inline-block px-4 py-1 bg-blue-50 text-blue-600 text-[10px] font-black tracking-widest uppercase rounded-full mb-4">WHY REFER RIVO CARE?</div>
            <h2 className="text-4xl font-bold text-slate-900 mb-6 leading-tight">Care they'll love. <br />Benefits you'll enjoy.</h2>
          </div>
          
          <div className="flex-[1.5] grid sm:grid-cols-2 gap-4">
            {[
              { icon: <ShieldCheck />, title: "Trusted Care", desc: "Refer a brand your loved ones can trust." },
              { icon: <Users />, title: "Helpful for Them", desc: "They get expert care right at home." },
              { icon: <Gift />, title: "Exciting Rewards", desc: "You earn rewards for spreading care." },
              { icon: <Star />, title: "Win-Win", desc: "Good for your loved ones, great for you!" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block px-4 py-1 bg-blue-50 text-blue-600 text-[10px] font-black tracking-widest uppercase rounded-full mb-4">WHAT PEOPLE SAY</div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12">Loved by Families. Recommended by Hearts.</h2>

          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-slate-50/50 p-8 rounded-[2.5rem] text-left border border-slate-100 hover:shadow-xl hover:bg-white transition-all duration-300">
                <MessageSquare className="text-blue-100 mb-6" size={40} />
                <div className="flex gap-1 mb-4 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} className="fill-amber-400" />)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-8">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-white border-t border-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-slate-100 last:border-0">
                <button 
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full py-4 text-left flex items-center justify-between group"
                >
                  <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{faq.q}</span>
                  {activeFaq === i ? <ChevronUp size={20} className="text-blue-600" /> : <ChevronDown size={20} className="text-slate-400" />}
                </button>
                {activeFaq === i && (
                  <div className="pb-6 text-sm text-slate-500 leading-relaxed animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto bg-blue-600 rounded-[2.5rem] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 text-white relative overflow-hidden">
          <div className="absolute top-[-50px] left-[-50px] w-[200px] h-[200px] bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center backdrop-blur-md">
              <Gift size={40} className="text-white" />
            </div>
            <div className="text-left">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Share Care. Spread Happiness.</h2>
              <p className="text-blue-100 text-lg md:text-xl font-medium">Start Referring Today!</p>
            </div>
          </div>
          
          <Button onClick={scrollToRefer} className="bg-white text-blue-600 hover:bg-blue-50 px-10 py-5 rounded-2xl text-lg font-bold h-auto shadow-2xl relative z-10">
            Refer Now <ArrowRight size={20} className="ml-2" />
          </Button>
        </div>
      </section>

      {/* Refer Section - Input Area */}
      <section id="refer-section" className="py-20 px-4 bg-slate-50/50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Your Referral Link</h2>
          <p className="text-slate-500 mb-10">Sign in to get your unique link and start earning.</p>

          {!user ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register"><Button className="w-full sm:w-auto px-10 py-4 font-bold">Register</Button></Link>
              <Link to="/login"><Button variant="outline" className="w-full sm:w-auto px-10 py-4 font-bold">Login</Button></Link>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 max-w-2xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl font-mono text-blue-600 text-sm truncate flex items-center justify-center md:justify-start">
                  {referralLink}
                </div>
                <div className="flex gap-2">
                  <Button onClick={copyToClipboard} className="bg-slate-900 text-white hover:bg-black border-0 px-6 font-bold shrink-0 rounded-xl">
                    Copy
                  </Button>
                  <Button onClick={shareViaWhatsApp} className="bg-[#25D366] hover:bg-[#20bd5a] border-0 text-white px-4 shrink-0 rounded-xl">
                    <MessageCircle size={20} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
      `}} />
    </div>
  );
}
