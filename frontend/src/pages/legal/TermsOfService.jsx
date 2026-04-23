import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-8 border-b pb-6 border-slate-100">
          <ShieldCheck className="text-primary-600" size={32} />
          <h1 className="text-3xl font-black text-slate-900">Terms of Service</h1>
        </div>
        
        <div className="prose prose-slate prose-primary max-w-none">
          <p className="text-sm text-slate-500 italic mb-6">Last Updated: April 2026</p>
          
          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="text-slate-600 mb-4 leading-relaxed">
            By registering for and using the RIVO platform ("Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.
          </p>

          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. Description of Service</h2>
          <p className="text-slate-600 mb-4 leading-relaxed">
            RIVO connects independent healthcare providers ("Providers") with individuals seeking home healthcare services ("Patients"). RIVO itself does not provide medical services and acts solely as a technology platform facilitating these connections.
          </p>

          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">3. Provider Obligations</h2>
          <ul className="list-disc pl-5 text-slate-600 mb-4 space-y-2">
            <li>Providers must maintain valid licenses and certifications for the services they offer.</li>
            <li>Providers are independent contractors, not employees of RIVO.</li>
            <li>Providers agree to undergo mandatory Background and KYC checks prior to platform activation.</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">4. Patient Obligations</h2>
          <ul className="list-disc pl-5 text-slate-600 mb-4 space-y-2">
            <li>Patients must provide accurate information regarding their healthcare needs.</li>
            <li>Patients agree to the booking and cancellation policies clearly stated during the checkout process.</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">5. Financial Terms</h2>
          <p className="text-slate-600 mb-4 leading-relaxed">
            RIVO charges a standard 20% platform fee on all transactions processed through the marketplace. Payments are held in escrow until the service is marked as completed by both parties.
          </p>
          
          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
            <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700">
              &larr; Back to Registration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
