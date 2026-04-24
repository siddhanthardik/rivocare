import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

const sections = [
  {
    title: '1. Acceptance of these Terms',
    body: [
      'These Terms & Conditions govern your access to and use of the RIVO platform, including our website, mobile experiences, dashboards, booking flows, communications, and related services.',
      'By creating an account, accessing the platform, booking a service, onboarding as a provider, or otherwise using RIVO, you agree to be bound by these Terms. If you do not agree, please do not use the platform.',
    ],
  },
  {
    title: '2. What RIVO does',
    body: [
      'RIVO is a technology platform that helps patients and families discover, request, coordinate, and manage home healthcare services with independent service providers.',
      'Except where expressly stated otherwise, RIVO does not itself provide medical treatment, nursing treatment, physiotherapy, diagnosis, emergency response, or any other regulated healthcare service. Those services, where applicable, are delivered by independent providers who use the platform.',
    ],
  },
  {
    title: '3. Eligibility and account responsibility',
    body: [
      'You must provide accurate, current, and complete information when creating or using an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.',
      'If you are using the platform on behalf of a patient, family member, clinic, caregiver, or organization, you represent that you have authority to do so.',
    ],
  },
  {
    title: '4. Patient responsibilities',
    body: [
      'Patients and family members must provide accurate booking information, including address, pincode, timing, contact details, care requirements, and any important notes relevant to the service request.',
      'You should use the platform responsibly and only request services you genuinely intend to coordinate. Misleading information, fake bookings, unsafe service conditions, or abusive behavior may lead to suspension or removal.',
    ],
  },
  {
    title: '5. Provider responsibilities',
    body: [
      'Providers are responsible for maintaining the qualifications, credentials, training, service quality, licenses, registrations, documentation, and lawful eligibility required for the services they offer.',
      'Providers may be subject to onboarding, KYC, verification, profile review, service-area review, and operational approval requirements before they are visible or active on the platform.',
      'Providers remain responsible for the professional services they perform and for complying with applicable laws, standards, and obligations related to their work.',
    ],
  },
  {
    title: '6. Booking requests, confirmations, and availability',
    body: [
      'A booking request submitted by a patient does not guarantee provider acceptance. A booking is considered confirmed only after a provider accepts it through the platform or RIVO otherwise marks it as confirmed.',
      'Provider availability may change, and RIVO does not guarantee that every request can be fulfilled. Service-area restrictions, pincode availability, provider status, booking conflicts, and operational constraints may affect acceptance.',
    ],
  },
  {
    title: '7. Pricing and payment terms',
    body: [
      'Pricing displayed or estimated through the platform may include base rates, provider pricing, approved price adjustments, and other applicable charges shown in the booking flow or related screens.',
      'Some bookings may require provider confirmation before payment becomes available. If a provider proposes a price update or the platform applies an approved pricing adjustment, patient approval may be required before payment can proceed.',
      'Payments processed through the platform are subject to payment processor terms, verification checks, and fraud controls. RIVO may pause, refuse, or review transactions where necessary for safety, compliance, or operational reasons.',
    ],
  },
  {
    title: '8. Cancellations, rescheduling, and refunds',
    body: [
      'Cancellation or rescheduling outcomes may depend on the booking stage, provider assignment, notice period, service timing, and operational costs already incurred.',
      'Where refunds are applicable, the timing and amount may vary depending on processor timelines, payment status, and the circumstances of the cancellation. RIVO may also maintain records of cancellation behavior to protect platform reliability.',
    ],
  },
  {
    title: '9. Notifications and communications',
    body: [
      'By using the platform, you agree that RIVO may send service-related communications through in-app notifications, email, SMS, WhatsApp, or other supported channels for bookings, confirmations, cancellations, account safety, payments, and other operational updates.',
      'You remain responsible for monitoring important booking and account notifications. Delivery timing may depend on network, device, or third-party service conditions.',
    ],
  },
  {
    title: '10. Platform rules and prohibited conduct',
    body: [
      'You may not misuse the platform, interfere with platform operations, scrape data, reverse engineer protected systems, impersonate another person, submit fraudulent information, harass other users, or attempt to bypass platform payments or booking controls where such controls are required.',
      'RIVO may investigate suspicious, abusive, fraudulent, unsafe, or unlawful activity and may take action including warnings, restrictions, suspension, cancellation of bookings, account removal, or referral to law enforcement where appropriate.',
    ],
  },
  {
    title: '11. Reviews, ratings, and platform moderation',
    body: [
      'The platform may allow reviews, ratings, flags, or performance indicators. You agree that such tools may be used to help maintain trust, service quality, fraud prevention, and operational oversight.',
      'RIVO may remove, moderate, or restrict content or accounts where necessary to enforce platform standards, investigate disputes, or reduce risk.',
    ],
  },
  {
    title: '12. Privacy and data use',
    body: [
      'Your use of the platform is also governed by our Privacy Policy. Please review it carefully to understand how RIVO collects, uses, stores, and shares information.',
    ],
  },
  {
    title: '13. Intellectual property',
    body: [
      'The RIVO brand, platform design, software, workflows, content, trademarks, logos, and related materials are owned by RIVO or its licensors and are protected by applicable intellectual property laws.',
      'You may not copy, distribute, reuse, sell, or exploit platform content or systems except as permitted by law or with prior written permission.',
    ],
  },
  {
    title: '14. Disclaimers',
    body: [
      'The platform is provided on an “as is” and “as available” basis. While we work to make the service reliable and safe, we do not guarantee uninterrupted availability, error-free operation, or suitability for every medical, personal, or operational need.',
      'RIVO is not an emergency response service. If you are facing a medical emergency, contact local emergency services or a qualified emergency provider immediately.',
    ],
  },
  {
    title: '15. Limitation of liability',
    body: [
      'To the maximum extent permitted by law, RIVO will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for loss of profits, business, goodwill, data, or opportunities arising from or related to platform use.',
      'Where liability cannot be excluded, RIVO’s aggregate liability will be limited to the amount paid to RIVO in connection with the relevant booking or service, if any, to the extent permitted by law.',
    ],
  },
  {
    title: '16. Suspension and termination',
    body: [
      'RIVO may suspend, restrict, or terminate access to the platform where we reasonably believe it is necessary for safety, fraud prevention, legal compliance, operational protection, or enforcement of these Terms.',
      'You may stop using the platform at any time, but obligations that by nature should survive termination, including payment, recordkeeping, and legal obligations, will continue to apply.',
    ],
  },
  {
    title: '17. Changes to these Terms',
    body: [
      'We may update these Terms from time to time to reflect product changes, legal requirements, operational needs, or business improvements. Updated versions will be posted on this page with a revised effective date.',
      'Your continued use of the platform after an update becomes effective constitutes acceptance of the revised Terms.',
    ],
  },
  {
    title: '18. Governing law and contact',
    body: [
      'These Terms are governed by the applicable laws of India, without prejudice to any mandatory consumer protections that may apply.',
      'For legal notices, account concerns, or policy-related questions, contact us at care@rivocare.in.',
    ],
  },
];

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-8 border-b pb-6 border-slate-100">
          <ShieldCheck className="text-primary-600" size={32} />
          <div>
            <h1 className="text-3xl font-black text-slate-900">Terms &amp; Conditions</h1>
            <p className="mt-2 text-sm text-slate-500">Last updated: April 23, 2026</p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 leading-8">
            These Terms &amp; Conditions explain the rules, responsibilities, and expectations that apply when you use the RIVO platform as a patient, family member, provider, or other user.
          </p>

          {sections.map((section) => (
            <section key={section.title} className="mt-10">
              <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
              <div className="mt-4 space-y-4 text-slate-600 leading-8">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 border-t border-slate-100 pt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/privacy-policy" className="font-semibold text-primary-600 hover:text-primary-700">
            Read Privacy Policy
          </Link>
          <Link to="/contact-us" className="font-semibold text-primary-600 hover:text-primary-700">
            Contact RIVO
          </Link>
        </div>
      </div>
    </div>
  );
}
