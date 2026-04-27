import { Link } from 'react-router-dom';
import { Phone, Mail, Clock, MessageCircle, ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#1E293B] text-slate-300 pt-16 pb-8 border-t border-slate-800 font-sans">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-6 mb-12">
          
          {/* Column 1: Brand & Socials */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center mb-6">
              <img src="/images/logo-white.png" alt="Rivo Logo" className="h-12" />
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed mb-6 max-w-[200px]">
              Rivo Care is your trusted home healthcare partner bringing hospital-quality care to your doorstep.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#0f52ba] transition-colors text-white">
                <FacebookIcon />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-pink-500 transition-colors text-white">
                <InstagramIcon />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-blue-500 transition-colors text-white">
                <LinkedinIcon />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-500 transition-colors text-white">
                <YoutubeIcon />
              </a>
            </div>
          </div>

          {/* Column 2: Services */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm">Services</h4>
            <ul className="space-y-3">
              <li><Link to="/services/nursing-care" className="text-xs hover:text-blue-400 transition-colors">Home Nursing</Link></li>
              <li><Link to="/services/elder-care" className="text-xs hover:text-blue-400 transition-colors">Elder Care</Link></li>
              <li><Link to="/services/nursing-care" className="text-xs hover:text-blue-400 transition-colors">ICU at Home</Link></li>
              <li><Link to="/services/physiotherapy" className="text-xs hover:text-blue-400 transition-colors">Physiotherapy</Link></li>
              <li><Link to="/services/doctor-at-home" className="text-xs hover:text-blue-400 transition-colors">Doctor Visit</Link></li>
              <li><Link to="/#services" className="text-xs text-blue-400 flex items-center gap-1 hover:text-blue-300 mt-2">View All Services <ArrowRight size={12} /></Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-sm">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/about-us" className="text-xs hover:text-blue-400 transition-colors">About Us</Link></li>
              <li><Link to="/blog" className="text-xs hover:text-blue-400 transition-colors">Blog</Link></li>
              <li><Link to="/contact-us" className="text-xs hover:text-blue-400 transition-colors">Contact Us</Link></li>
              <li><Link to="/contact-us" className="text-xs hover:text-blue-400 transition-colors">Press &amp; Media</Link></li>
              <li><Link to="/refer" className="text-xs hover:text-blue-400 transition-colors font-semibold text-blue-400">Refer & Earn</Link></li>
            </ul>
          </div>

          {/* Column 4: Support */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm">Support</h4>
            <ul className="space-y-3">
              <li><Link to="/contact-us" className="text-xs hover:text-blue-400 transition-colors">Help Center</Link></li>
              <li><Link to="/terms-of-service" className="text-xs hover:text-blue-400 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy-policy" className="text-xs hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="text-xs hover:text-blue-400 transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Column 5: Contact & WhatsApp */}
          <div className="lg:col-span-1 space-y-4">
             <div className="flex items-center gap-3">
               <Phone size={16} className="text-slate-400" />
              <a href="tel:+919910638995" className="text-xs font-bold text-white hover:text-blue-400">+91 99106 38995</a>
             </div>
             <div className="flex items-center gap-3">
               <Mail size={16} className="text-slate-400" />
               <a href="mailto:support@rivocare.com" className="text-xs font-bold text-white hover:text-blue-400">support@rivocare.com</a>
             </div>
             <div className="flex items-center gap-3">
               <Clock size={16} className="text-slate-400" />
               <span className="text-xs font-bold text-white">24/7 Support (All Days)</span>
             </div>

             <div className="pt-4 mt-4 border-t border-slate-800">
                <a href="https://wa.me/919910638995?text=Hello%20Rivo%20Care,%20I%20need%20assistance." target="_blank" rel="noreferrer" className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition group">
                 <div>
                   <p className="text-xs font-bold text-white mb-0.5">Chat on WhatsApp</p>
                   <p className="text-[10px] text-slate-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> We are online!</p>
                 </div>
                 <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                   <MessageCircle size={16} />
                 </div>
               </a>
             </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800 pt-6 text-center">
          <p className="text-[10px] text-slate-500">© 2024 Rivo Care Private Limited. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// Minimal Icons
function FacebookIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>; }
function InstagramIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>; }
function LinkedinIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>; }
function YoutubeIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon fill="white" points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>; }
