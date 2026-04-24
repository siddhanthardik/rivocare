import React from 'react';
import { Link } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';

const sections = [
  {
    title: '1. Scope of this Policy',
    body: [
      'This Privacy Policy explains how RIVO collects, uses, stores, discloses, and protects personal information when you use our website, mobile experiences, booking tools, provider dashboards, support channels, and related services.',
      'This Policy applies to patients, family members, providers, prospective providers, business contacts, and other users who interact with the platform.',
    ],
  },
  {
    title: '2. Information we collect',
    body: [
      'We may collect account information such as your name, email address, phone number, password, address, pincode, and role on the platform.',
      'For bookings and service coordination, we may collect information about requested services, schedule preferences, notes, service addresses, booking history, pricing details, status updates, and payment-related information.',
      'For providers, we may collect onboarding and verification information, including service categories, profile information, availability, KYC documents, banking details, service-area information, professional records, and other compliance materials.',
      'We may also collect device, browser, log, analytics, and communication data needed to operate, secure, and improve the platform.',
    ],
  },
  {
    title: '3. How we use information',
    body: [
      'We use information to create and manage accounts, process bookings, match patients with providers, coordinate service delivery, provide notifications, support payments, and maintain platform operations.',
      'We also use information for fraud detection, trust and safety checks, dispute handling, performance monitoring, compliance, customer support, service improvement, analytics, and lawful business administration.',
      'Where permitted, we may use limited contact details to send service-related updates and operational communications relevant to your use of the platform.',
    ],
  },
  {
    title: '4. When we share information',
    body: [
      'We may share relevant information between patients and confirmed or relevant providers where needed to coordinate a requested service, including contact details, address details, schedule information, and booking-related notes.',
      'We may share information with payment processors, cloud hosting providers, messaging providers, KYC or verification vendors, support vendors, analytics providers, professional advisers, and other service providers acting on our behalf.',
      'We may disclose information when required by law, regulation, legal process, government request, platform safety need, fraud investigation, dispute resolution, or protection of our rights, users, or operations.',
      'We do not sell personal data as part of a consumer data marketplace.',
    ],
  },
  {
    title: '5. Payment and financial information',
    body: [
      'Payments may be processed through third-party payment providers. We may store payment-related metadata, transaction identifiers, payment status, billing amounts, and audit information, but sensitive payment credentials may be handled by specialized processors rather than stored directly by RIVO.',
      'Where required for provider payout or compliance purposes, financial and KYC-related information may be processed and retained in line with applicable legal and operational requirements.',
    ],
  },
  {
    title: '6. Cookies, analytics, and platform diagnostics',
    body: [
      'We may use cookies, similar technologies, and analytics tools to understand usage patterns, improve performance, protect the platform, and remember preferences.',
      'These tools may help us understand page visits, feature usage, device types, referring sources, error patterns, and service reliability.',
    ],
  },
  {
    title: '7. Data retention',
    body: [
      'We retain information for as long as reasonably necessary for platform operations, booking history, payment reconciliation, fraud prevention, legal compliance, dispute resolution, recordkeeping, and enforcement of our agreements.',
      'Different categories of information may be retained for different periods depending on legal obligations, financial requirements, operational needs, or safety considerations.',
    ],
  },
  {
    title: '8. Security',
    body: [
      'RIVO uses administrative, technical, and organizational measures intended to protect personal information against unauthorized access, misuse, disclosure, alteration, and loss.',
      'No digital platform can guarantee absolute security. Users should protect their credentials, use secure devices, and notify us promptly if they suspect unauthorized access or suspicious account activity.',
    ],
  },
  {
    title: '9. Your choices and rights',
    body: [
      'Subject to applicable law, you may have rights to access, correct, update, or request deletion of certain personal information, as well as rights related to consent, communications, or account closure.',
      'Some information may need to be retained despite a deletion request where necessary for legal obligations, fraud prevention, transaction records, dispute handling, or safety-related platform needs.',
    ],
  },
  {
    title: '10. Children and sensitive situations',
    body: [
      'The platform is not intended to be used independently by children without appropriate adult involvement. If services are being coordinated for a child, elder, or dependent patient, the responsible adult should ensure information is provided lawfully and appropriately.',
      'Users should avoid uploading or sharing more sensitive information than is reasonably necessary for the requested service or required compliance process.',
    ],
  },
  {
    title: '11. Cross-border or vendor processing',
    body: [
      'Some service providers or infrastructure used by RIVO may process information in locations outside your immediate jurisdiction. Where this occurs, we take reasonable steps to ensure appropriate protections are in place consistent with applicable legal requirements.',
    ],
  },
  {
    title: '12. Policy updates',
    body: [
      'We may update this Privacy Policy from time to time to reflect product changes, legal developments, security improvements, vendor updates, or operational needs. The latest version will be published on this page with a revised effective date.',
    ],
  },
  {
    title: '13. Contact us about privacy',
    body: [
      'If you have questions, requests, or concerns about this Privacy Policy or how RIVO handles personal information, please contact us at care@rivocare.in.',
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-8 border-b pb-6 border-slate-100">
          <LockKeyhole className="text-primary-600" size={32} />
          <div>
            <h1 className="text-3xl font-black text-slate-900">Privacy Policy</h1>
            <p className="mt-2 text-sm text-slate-500">Last updated: April 23, 2026</p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 leading-8">
            This Privacy Policy describes how RIVO handles personal information across account creation, booking coordination, provider onboarding, payments, communications, and support.
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
          <Link to="/terms-of-service" className="font-semibold text-primary-600 hover:text-primary-700">
            Read Terms &amp; Conditions
          </Link>
          <Link to="/contact-us" className="font-semibold text-primary-600 hover:text-primary-700">
            Contact RIVO
          </Link>
        </div>
      </div>
    </div>
  );
}
