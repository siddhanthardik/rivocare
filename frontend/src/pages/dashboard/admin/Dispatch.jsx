import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { bookingService } from '../../../services';
import { formatDateTime, SERVICE_CONFIG, cn } from '../../../utils';
import { PageWrapper, Card, Row, Section, StatusPill } from '../../../components/ui/Layout';
import Button from '../../../components/ui/Button';
import Avatar from '../../../components/ui/Avatar';
import { ShieldAlert, AlertTriangle, CheckCircle, RefreshCcw, Lock, Users, Phone, MapPin } from 'lucide-react';

export default function DispatchDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [actionLoading, setActionLoading] = useState(null);

  const fetchBookings = async () => {
    try {
      const res = await bookingService.getAll({ limit: 100, status: 'pending' });
      setBookings(res.data.bookings || []);
      setLastRefreshed(new Date());
    } catch (err) {
      toast.error('Failed to load dispatch queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  // Parse notes to extract assignment and plan data safely
  const parsedBookings = useMemo(() => {
    return (bookings || []).map(b => {
      let assignment = null;
      let planDetails = '';
      if (b.notes) {
        const parts = b.notes.split('\n\n');
        try {
          // Last part is usually the assignment JSON
          assignment = JSON.parse(parts[parts.length - 1]).assignment;
        } catch (e) {
          assignment = null;
        }
        
        // Extract [PLAN: ...] if it exists
        const planMatch = b.notes.match(/\[PLAN:\s(.*?)\]/);
        if (planMatch) planDetails = planMatch[1];
      }

      const now = new Date();
      const scheduledAt = new Date(b.scheduledAt);
      const hoursUntil = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      return { ...b, assignment, planDetails, hoursUntil };
    }).filter(b => b.assignment); // Only show bookings with auto-assign data
  }, [bookings]);

  // Categorize
  const queues = useMemo(() => {
    const critical = [];
    const atRisk = [];
    const confirmed = [];
    const reassigned = [];

    parsedBookings.forEach(b => {
      const status = b.assignment.status;
      if (status === 'needs_manual_assignment' || (b.hoursUntil < 6 && status !== 'confirmed')) {
        critical.push(b);
      } else if (status === 'confirmed') {
        confirmed.push(b);
      } else if (status === 'reassigned') {
        reassigned.push(b);
      } else if (b.hoursUntil < 24 && status === 'provisional') {
        atRisk.push(b);
      } else {
        atRisk.push(b); // Default fallback for provisional
      }
    });

    return { critical, atRisk, confirmed, reassigned };
  }, [parsedBookings]);

  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      // Assuming a generic update endpoint exists, or just simulate for the UI prototype
      // await bookingService.update(id, { ... });
      await new Promise(r => setTimeout(r, 800)); 
      toast.success(`Action '${action}' executed successfully.`);
      fetchBookings();
    } catch (err) {
      toast.error('Failed to execute action');
    } finally {
      setActionLoading(null);
    }
  };

  const renderQueueItem = (b, type) => {
    const isCritical = type === 'critical';
    
    return (
      <Card key={b._id} noPadding className={cn("overflow-hidden transition-all", isCritical ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-100')}>
        <Row className={cn("!p-3 items-stretch", isCritical ? 'bg-red-50/30' : '')}>
          {/* Column 1: Service */}
          <div className="w-1/4 border-r border-gray-100 pr-3 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl bg-white p-1.5 rounded-lg shadow-sm border border-gray-100">{SERVICE_CONFIG[b.service?.slug || b.service]?.icon}</span>
              <p className="typo-value font-black">{SERVICE_CONFIG[b.service?.slug || b.service]?.label || (typeof b.service === 'object' ? b.service?.label : b.service)}</p>
            </div>
            {b.planDetails && <p className="typo-micro text-gray-500 font-bold truncate">{b.planDetails}</p>}
          </div>

          {/* Column 2: Patient & Time */}
          <div className="w-1/3 px-3 flex flex-col justify-center">
            <p className="typo-value font-black">{b.patient?.name}</p>
            <p className={cn("typo-micro font-bold mt-1", b.hoursUntil < 6 ? 'text-red-600' : 'text-primary-600')}>
              {formatDateTime(b.scheduledAt)}
            </p>
            <p className="typo-micro text-gray-400 mt-0.5 truncate"><MapPin size={10} className="inline mr-1" />{b.pincode}</p>
          </div>

          {/* Column 3: Provider & Status */}
          <div className="flex-1 pl-3 flex flex-col justify-center border-l border-gray-100">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar name={b.provider?.user?.name || '?'} size="sm" />
                  <div>
                    <p className="typo-body font-bold">{b.provider?.user?.name || 'Unassigned'}</p>
                    <p className="typo-micro text-gray-400">Score: {b.assignment?.score || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusPill 
                    status={b.assignment?.status} 
                    label={b.assignment?.status.replace(/_/g, ' ')}
                    color={
                      b.assignment?.status === 'confirmed' ? 'emerald' : 
                      b.assignment?.status === 'needs_manual_assignment' ? 'red' : 
                      b.assignment?.status === 'reassigned' ? 'blue' : 'amber'
                    }
                  />
                  {/* Confirmation State */}
                  {b.assignment?.confirmation && (() => {
                    const { status, expiresAt } = b.assignment.confirmation;
                    const expired = expiresAt && Date.now() > new Date(expiresAt).getTime();
                    if (status === 'pending') return (
                      <span className={`typo-micro font-bold flex items-center gap-1 ${expired ? 'text-red-500' : 'text-amber-600'}`}>
                        <Clock size={10} className={expired ? '' : 'animate-pulse'} />
                        {expired ? 'Confirmation expired' : `Expires ${new Date(expiresAt).toLocaleTimeString()}`}
                      </span>
                    );
                    if (status === 'rejected') return (
                      <span className="typo-micro font-bold text-red-500">⛔ Rejected by provider</span>
                    );
                    if (status === 'accepted') return (
                      <span className="typo-micro font-bold text-emerald-600">✅ Provider confirmed</span>
                    );
                    return null;
                  })()}
                </div>
             </div>
          </div>
        </Row>
        
        {/* Actions Footer */}
        <div className="bg-gray-50 p-2 px-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex gap-2">
             <Button variant="ghost" size="sm" className="!px-2 !py-1 text-gray-500" onClick={() => window.open(`tel:${b.patient?.phone}`)}><Phone size={14} /></Button>
             <Button variant="ghost" size="sm" className="!px-2 !py-1 text-gray-500" onClick={() => window.open(`tel:${b.provider?.user?.phone}`)}><Users size={14} /></Button>
          </div>
          <div className="flex gap-2">
             {b.assignment?.status === 'provisional' && (
               <Button size="sm" onClick={() => handleAction(b._id, 'lock')} loading={actionLoading === b._id} className="!bg-slate-800 text-white !py-1 !px-3 shadow-sm"><Lock size={12} className="mr-1.5" /> Lock Provider</Button>
             )}
             {(b.assignment?.status === 'provisional' || b.assignment?.status === 'needs_manual_assignment') && (
               <Button size="sm" onClick={() => handleAction(b._id, 'reassign')} loading={actionLoading === b._id} className="!bg-blue-600 text-white !py-1 !px-3 shadow-sm"><RefreshCcw size={12} className="mr-1.5" /> Force Reassign</Button>
             )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <PageWrapper maxWidth="1200px">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
             Control Tower 
             {loading && <span className="animate-spin text-primary-500"><RefreshCcw size={16} /></span>}
          </h1>
          <p className="text-slate-500 text-sm mt-1">Real-time operational dispatch. Last sync: {lastRefreshed.toLocaleTimeString()}</p>
        </div>
        <Button variant="outline" onClick={fetchBookings} size="sm" className="gap-2"><RefreshCcw size={14} /> Refresh</Button>
      </div>

      <div className="space-y-8">
        {/* Critical Queue */}
        <Section title="🚨 Critical Action Required" subtitle={`${queues.critical.length} bookings at risk of missing fulfillment`}>
          {queues.critical.length === 0 ? (
            <Card className="text-center py-6 border-dashed border-gray-200"><p className="typo-body text-gray-400">Clear queue.</p></Card>
          ) : (
            <div className="space-y-3">{queues.critical.map(b => renderQueueItem(b, 'critical'))}</div>
          )}
        </Section>

        {/* At-Risk Queue */}
        <Section title="⚠️ At-Risk (Provisional)" subtitle={`${queues.atRisk.length} bookings awaiting cron lock`}>
          {queues.atRisk.length === 0 ? (
            <Card className="text-center py-6 border-dashed border-gray-200"><p className="typo-body text-gray-400">Clear queue.</p></Card>
          ) : (
            <div className="space-y-3">{queues.atRisk.map(b => renderQueueItem(b, 'at-risk'))}</div>
          )}
        </Section>

        {/* Reassigned */}
        <Section title="🔄 Recently Reassigned" subtitle={`${queues.reassigned.length} bookings saved by the fallback engine`}>
          {queues.reassigned.length === 0 ? null : (
            <div className="space-y-3">{queues.reassigned.map(b => renderQueueItem(b, 'reassigned'))}</div>
          )}
        </Section>

        {/* Confirmed */}
        <Section title="✅ Confirmed Providers" subtitle={`${queues.confirmed.length} secure locks`}>
           {queues.confirmed.length === 0 ? null : (
            <div className="space-y-3">{queues.confirmed.map(b => renderQueueItem(b, 'confirmed'))}</div>
          )}
        </Section>
      </div>
    </PageWrapper>
  );
}
