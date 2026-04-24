import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Phone, Mail, MessageCircle, MapPin, Facebook, Instagram, Linkedin, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactUs() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success('Message sent! We\'ll get back to you shortly.');
      setForm({ name: '', phone: '', email: '', message: '' });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="bg-white min-h-screen font-sans">

      {/* Breadcrumb */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-slate-500">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <ChevronRight size={14} />
          <span className="text-slate-800 font-medium">Contact Us</span>
        </div>
      </div>

      {/* Header */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Poppins,sans-serif' }}>Contact Us</h1>
        <p className="text-slate-500 text-base">We're here to help and support nursing care at anytime.</p>
      </section>

      {/* Main Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-14 grid lg:grid-cols-2 gap-10">

        {/* Left: Contact Info */}
        <div className="space-y-6">
          {/* Phone */}
          <div className="bg-slate-50 rounded-2xl p-5 flex items-start gap-4 border border-slate-100">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <Phone size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-0.5">Call Us</h3>
              <p className="text-slate-500 text-xs mb-1">24/7 Support</p>
              <a href="tel:+911234567890" className="text-blue-600 font-semibold text-sm">+91 98765 43210</a>
            </div>
          </div>

          {/* Email */}
          <div className="bg-slate-50 rounded-2xl p-5 flex items-start gap-4 border border-slate-100">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <Mail size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-0.5">Email Us</h3>
              <p className="text-slate-500 text-xs mb-1">We reply within 2 hours</p>
              <a href="mailto:info@rivocare.in" className="text-blue-600 font-semibold text-sm">info@rivocare.in</a>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="bg-slate-50 rounded-2xl p-5 flex items-start gap-4 border border-slate-100">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <MessageCircle size={18} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-0.5">WhatsApp Us</h3>
              <p className="text-slate-500 text-xs mb-1">Quick response on WhatsApp</p>
              <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="text-green-600 font-semibold text-sm">+91 98765 43210</a>
            </div>
          </div>

          {/* Office */}
          <div className="bg-slate-50 rounded-2xl p-5 flex items-start gap-4 border border-slate-100">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <MapPin size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-0.5">Our Office</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Rivo Care Private Limited<br />
                Delhi, India, 110001
              </p>
            </div>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-3">Follow Us</h3>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition">
                <Facebook size={16} />
              </a>
              <a href="#" className="w-9 h-9 bg-pink-600 rounded-full flex items-center justify-center text-white hover:bg-pink-700 transition">
                <Instagram size={16} />
              </a>
              <a href="#" className="w-9 h-9 bg-blue-700 rounded-full flex items-center justify-center text-white hover:bg-blue-800 transition">
                <Linkedin size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Right: Contact Form */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Poppins,sans-serif' }}>Send Us a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="Enter phone number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
              <textarea
                rows={4}
                placeholder="Type your message here..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"
            >
              {loading ? 'Sending...' : <><Send size={15} /> Send Message</>}
            </button>
          </form>
        </div>
      </section>

      {/* Map */}
      <section className="max-w-6xl mx-auto px-4 pb-14">
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm h-64">
          <iframe
            title="Rivo Care Office Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d224345.83923192776!2d77.06889754725782!3d28.52758200617607!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd5b347eb62d%3A0x52c2b7494e204dce!2sNew%20Delhi%2C%20Delhi!5e0!3m2!1sen!2sin!4v1677000000000!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-10">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-white text-xl font-bold mb-1" style={{ fontFamily: 'Poppins,sans-serif' }}>Need Immediate Assistance?</h2>
            <p className="text-blue-100 text-sm">Our support team is available 24/7 to help you.</p>
          </div>
          <a
            href="tel:+919876543210"
            className="shrink-0 inline-flex items-center gap-2 bg-white text-blue-600 font-bold px-6 py-3 rounded-lg hover:bg-blue-50 transition text-sm"
          >
            <Phone size={15} /> Call Now
          </a>
        </div>
      </section>

    </div>
  );
}
