import React from 'react';
import { Link } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-8 border-b pb-6 border-slate-100">
          <LockKeyhole className="text-primary-600" size={32} />
          <h1 className="text-3xl font-black text-slate-900">Privacy Policy</h1>
        </div>
        
        <div className="prose prose-slate prose-primary max-w-none">
          <p className="text-sm text-slate-500 italic mb-6">Last Updated: April 2026</p>
          
          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Data Collection</h2>
          <p className="text-slate-600 mb-4 leading-relaxed">
            RIVO collects personal information during registration, including but not limited to: names, email addresses, phone numbers, and physical addresses (pincodes). For Providers, we legally collect KYC materials such as Government Identity Documents and Medical Certifications.
          </p>

          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. Use of Information</h2>
          <p className="text-slate-600 mb-4 leading-relaxed">
            Your information is primarily used to connect Patients with Providers. We also use your information to:
          </p>
          <ul className="list-disc pl-5 text-slate-600 mb-4 space-y-2">
            <li>Process transactions and administer wallet balances.</li>
            <li>Enforce platform safety, conduct background checks, and prevent fraud.</li>
            <li>Send critical transactional notifications via Email and SMS.</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">3. Data Sharing and Security</h2>
          <p className="text-slate-600 mb-4 leading-relaxed">
            We employ industry-standard encryption to protect your data in transit and at rest. We do NOT sell your personal data. We only share necessary details (such as your address or phone number) with a confirmed Provider when a booking is actually accepted.
          </p>

          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">4. Your Rights</h2>
          <p className="text-slate-600 mb-4 leading-relaxed">
            You reserve the right to request deletion of your RIVO account and associated data. Please contact support to initiate a full data purge, subject to our legal data retention requirements for financial transactions.
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
