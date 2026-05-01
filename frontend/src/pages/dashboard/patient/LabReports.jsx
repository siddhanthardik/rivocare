import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
   FileText, Download, Search, 
   Share2, Lock, ArrowRight
} from 'lucide-react';
import { labService, paymentService } from '@/services';
import Button from '../../../components/ui/Button';
import { PageLoader } from '../../../components/ui/Feedback';
import { toast } from 'react-hot-toast';
import { cn } from '../../../utils';
import { formatCurrency, formatDateCompact } from '../../../utils/format';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper, Card, Row, Section, KPIChip, StatusPill } from '../../../components/ui/Layout';

export default function LabReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [paymentPendingModal, setPaymentPendingModal] = useState({ isOpen: false, report: null });
  const navigate = useNavigate();

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await labService.getMyOrders();
      const completedWithReports = (data || []).filter(order => 
        (order.status === 'completed' || order.status === 'report_uploaded') && (order.reportUrl || order.isReportLocked)
      );
      setReports(completedWithReports);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleShare = (report) => {
    if (navigator.share) {
      navigator.share({
        title: `Lab Report - ${report.tests.map(t => t.name).join(', ')}`,
        text: 'Sharing my digital lab report from Rivo Care.',
        url: report.reportUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(report.reportUrl);
      toast.success('Report link copied to clipboard!');
    }
  };

  const handlePayToUnlock = async (report) => {
    try {
      const { data } = await paymentService.createLabOrder(report._id);
      const options = {
        key: data.keyId,
        amount: data.order.amount,
        currency: 'INR',
        name: 'Rivo Labs',
        description: 'Report Unlock Payment',
        order_id: data.order.id,
        handler: async function (response) {
          try {
            await paymentService.verifyLabPayment(response);
            toast.success('Payment successful! Report Unlocked.');
            fetchReports();
          } catch (err) { toast.error('Payment verification failed'); }
        },
        theme: { color: '#4f46e5' },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function () { toast.error('Payment failed or cancelled.'); });
      rzp.open();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not initiate payment'); }
  };

  const handleView = (report) => {
    if (report.isReportLocked) {
      setPaymentPendingModal({ isOpen: true, report });
      return;
    }
    if (!report.reportUrl) {
      toast.error('Report unavailable. Contact support.');
      return;
    }
    window.open(report.reportUrl, '_blank');
  };

  const handleDownload = (report) => {
    if (report.isReportLocked) {
      setPaymentPendingModal({ isOpen: true, report });
      return;
    }
    if (!report.reportUrl) {
      toast.error('Report unavailable. Contact support.');
      return;
    }
    try {
      setDownloadingId(report._id);
      let downloadUrl = report.reportUrl;
      if (downloadUrl.includes('cloudinary.com') && downloadUrl.includes('/upload/')) {
        if (!downloadUrl.includes('fl_attachment')) {
            downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
        }
      }
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      const safeName = report.tests?.map(t => t.name).join('-').replace(/[^a-zA-Z0-9-]/g, '-');
      link.download = `Rivo-Lab-Report-${safeName || report._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Report download started!');
    } catch (error) {
      toast.error('Failed to download report.');
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

  const filteredReports = reports.filter(r => 
    r.tests.some(t => t.name.toLowerCase().includes(search.toLowerCase())) ||
    r._id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <PageLoader />;

  return (
    <PageWrapper>
      {/* ── Page Header ────────────────────────────────── */}
      <Section 
        title="Diagnostic Reports" 
        subtitle="Your digital health record"
        action={
          <div className="w-full md:w-64 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search reports..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-100 rounded-xl typo-body focus:ring-2 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
            />
          </div>
        }
      />

      {/* ── Reports List ────────────────────────────────── */}
      <Card noPadding className="divide-y divide-gray-50 overflow-hidden">
        {reports.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center space-y-3">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
              <FileText size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="typo-value font-black text-slate-900">No reports yet</h3>
              <p className="typo-micro">Your digital reports will appear here once verified.</p>
            </div>
            <button onClick={() => navigate('/dashboard/patient/labs/orders')} className="btn-primary-sm !px-6 !py-2.5">
              Track Orders
            </button>
          </div>
        ) : (
          filteredReports.map((report) => (
            <Row key={report._id} className="p-3">
              <div className="min-w-0">
                <p className="typo-value !text-gray-900 truncate">
                  {report.tests.map(t => t.name).join(', ')}
                </p>
                <p className="typo-micro font-bold text-slate-400 uppercase tracking-tighter">
                  {formatDateCompact(report.createdAt)} • {report.partner?.name || 'Verified Lab'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleView(report)} className="btn-secondary-sm !px-4 !py-2">View</button>
                <button 
                  onClick={() => handleDownload(report)}
                  disabled={downloadingId === report._id}
                  className="btn-icon !w-9 !h-9"
                >
                  {downloadingId === report._id ? (
                    <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                </button>
                <button onClick={() => handleShare(report)} className="btn-icon !w-9 !h-9">
                  <Share2 size={14} />
                </button>
              </div>
            </Row>
          ))
        )}
      </Card>

      {/* ── Clinical Disclaimer ─────────────────────────── */}
      <Card className="bg-blue-50/30 border-blue-100/50 flex items-center gap-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm shrink-0 border border-blue-100">
          <FileText size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="typo-micro font-black text-slate-900 uppercase tracking-widest">Authenticated Results</h4>
          <p className="typo-micro text-gray-500 mt-0.5 leading-tight font-bold">
            Reports are digitally signed by NABL-accredited partners and verified for clinical accuracy.
          </p>
        </div>
      </Card>

      {/* ── Modals ──────────────────────────────────────── */}
      <AnimatePresence>
        {paymentPendingModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPaymentPendingModal({ isOpen: false, report: null })} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
              <div className="bg-slate-900 p-8 text-center text-white">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <Lock size={32} className="text-white" />
                </div>
                <h2 className="typo-title !text-white mb-1">Payment Pending</h2>
                <p className="typo-micro text-slate-400 font-bold uppercase tracking-widest">Complete transaction to view report</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-100">
                   <span className="typo-label font-black text-gray-400 uppercase tracking-widest">Amount Due</span>
                   <span className="typo-kpi !text-[24px] text-gray-900">{formatCurrency(paymentPendingModal.report?.totalAmount)}</span>
                </div>
                <div className="space-y-2">
                  <button onClick={() => { handlePayToUnlock(paymentPendingModal.report); setPaymentPendingModal({ isOpen: false, report: null }); }} className="w-full btn-primary-sm !py-3.5 !bg-blue-600 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                    Pay & Unlock Report <ArrowRight size={14} />
                  </button>
                  <button onClick={() => setPaymentPendingModal({ isOpen: false, report: null })} className="w-full py-2.5 typo-micro font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
