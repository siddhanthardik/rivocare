import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper, Card, KPIChip, Section } from '../../../components/ui/Layout';
import reconciliationService from '../../../services/reconciliationService';
import { adminService } from '../../../services';
import Button from '../../../components/ui/Button';
import { toast } from 'react-hot-toast';

export default function Reconciliation() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    reconciliationService.getSummary()
      .then(res => setSummary(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageWrapper maxWidth="1200px">
      <Section title="Billing Reconciliation" subtitle="Phase 1: Read-only overview and quick checks">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPIChip label="Total Collected" value={loading ? 'Loading...' : `₹${summary?.totalCollected || 0}`} />
          <KPIChip label="Pending Payments" value={loading ? '...' : summary?.pendingPayments ?? 0} />
          <KPIChip label="Failed Payments" value={loading ? '...' : summary?.failedPayments ?? 0} />
          <KPIChip label="Pending Payouts" value={loading ? '...' : summary?.pendingPayouts ?? 0} />
          <KPIChip label="Webhook Failures" value={loading ? '...' : summary?.webhookFailures ?? 0} />
          <KPIChip label="Unpaid Completed Services" value={loading ? '...' : summary?.unpaidCompleted ?? 0} />
          <KPIChip label="Disputed Bookings" value={loading ? '...' : summary?.disputedBookings ?? 0} />
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <h3 className="typo-title">Payments</h3>
            <p className="typo-micro text-slate-400">View pending and failed payment records.</p>
            <div className="mt-3">
              <Button onClick={() => window.open('/dashboard/admin/reconciliation/payments', '_self')}>Open Payments</Button>
            </div>
          </Card>

          <Card>
            <h3 className="typo-title">Payouts</h3>
            <p className="typo-micro text-slate-400">View provider payouts and statuses.</p>
            <div className="mt-3">
              <Button onClick={() => window.open('/dashboard/admin/reconciliation/payouts', '_self')}>Open Payouts</Button>
            </div>
          </Card>

          <Card>
            <h3 className="typo-title">Disputes</h3>
            <p className="typo-micro text-slate-400">View bookings with patient-reported cash disputes.</p>
            <div className="mt-3 space-y-2">
              <p className="text-2xl font-black text-red-600">{loading ? '...' : summary?.disputedBookings ?? 0}</p>
              <p className="text-xs text-slate-400">Active disputes pending resolution</p>
              <Button onClick={() => navigate('/dashboard/admin/disputes')}>Manage Disputes →</Button>
            </div>
          </Card>

          <Card>
            <h3 className="typo-title">Unpaid Completed</h3>
            <p className="typo-micro text-slate-400">Services completed without payment received.</p>
            <div className="mt-3 space-y-2">
              <p className="text-2xl font-black text-orange-600">{loading ? '...' : summary?.unpaidCompleted ?? 0}</p>
              <p className="text-xs text-slate-400">Require follow-up</p>
              <Button onClick={() => navigate('/dashboard/admin/stuck')}>View Stuck Bookings →</Button>
            </div>
          </Card>
        </div>
      </Section>
    </PageWrapper>
  );
}
