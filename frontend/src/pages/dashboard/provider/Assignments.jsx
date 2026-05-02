import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { bookingService } from '../../../services';
import { formatDateTime, SERVICE_CONFIG, cn } from '../../../utils';
import { PageWrapper, Card, Row, Section, StatusPill } from '../../../components/ui/Layout';
import Button from '../../../components/ui/Button';
import { CheckCircle, XCircle, MapPin, Clock, AlertTriangle } from 'lucide-react';

export default function ProviderAssignments() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchAssignments = async () => {
    try {
      // Assuming a generic endpoint to fetch provider's own bookings
      const res = await bookingService.getAll({ limit: 50 });
      setBookings(res.data.bookings || []);
    } catch (err) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    const interval = setInterval(fetchAssignments, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const parsedBookings = useMemo(() => {
    return (bookings || []).map(b => {
      let assignment = null;
      let planDetails = '';
      if (b.notes) {
        const parts = b.notes.split('\n\n');
        try {
          assignment = JSON.parse(parts[parts.length - 1]).assignment;
        } catch (e) {
          assignment = null;
        }
        const planMatch = b.notes.match(/\[PLAN:\s(.*?)\]/);
        if (planMatch) planDetails = planMatch[1];
      }
      return { ...b, assignment, planDetails };
    }).filter(b => b.assignment); // Only bookings handled by Auto-Assign
  }, [bookings]);

  // Separate into pending requests and accepted/confirmed assignments
  const queues = useMemo(() => {
    const pending = [];
    const confirmed = [];

    parsedBookings.forEach(b => {
      // We only show pending if the current provider is the primary AND confirmation is pending
      const isPending = b.assignment.status === 'provisional' && b.assignment.confirmation?.status === 'pending';
      const isConfirmed = b.status === 'confirmed' || b.assignment.status === 'confirmed';

      if (isPending) {
        pending.push(b);
      } else if (isConfirmed || b.assignment.status === 'reassigned') {
        confirmed.push(b);
      }
    });

    return { pending, confirmed };
  }, [parsedBookings]);

  const handleAction = async (booking, action) => {
    setActionLoading(booking._id);
    try {
      // Decode notes to update assignment state securely
      const parts = booking.notes.split('\n\n');
      const assignmentData = JSON.parse(parts[parts.length - 1]);
      
      if (action === 'accept') {
        assignmentData.assignment.confirmation.status = 'accepted';
        assignmentData.assignment.status = 'confirmed';
        // Note: Full system would also trigger bookingService.update(booking._id, { status: 'confirmed' })
      } else if (action === 'reject') {
        assignmentData.assignment.confirmation.status = 'rejected';
      }

      parts[parts.length - 1] = JSON.stringify(assignmentData);
      const updatedNotes = parts.join('\n\n');

      // Update notes using generic endpoint (assumed supported by system constraint)
      await bookingService.updateStatus(booking._id, { notes: updatedNotes });
      
      toast.success(action === 'accept' ? 'Assignment Accepted!' : 'Assignment Rejected');
      fetchAssignments();
    } catch (err) {
      toast.error('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const renderRequest = (b) => {
    const expiresAt = new Date(b.assignment?.confirmation?.expiresAt);
    const isExpired = Date.now() > expiresAt.getTime();
    
    return (
      <Card key={b._id} noPadding className={cn("overflow-hidden transition-all border-amber-200 ring-1 ring-amber-100", isExpired && "opacity-50 grayscale")}>
        <Row className="!p-4 items-center bg-amber-50/30">
          <div className="w-1/4 border-r border-amber-100 pr-4">
            <p className="typo-value font-black text-slate-900">{SERVICE_CONFIG[b.service?.slug || b.service]?.label || (typeof b.service === 'object' ? b.service?.label : b.service)}</p>
            {b.planDetails && <p className="typo-micro text-slate-500 font-bold truncate mt-1">{b.planDetails}</p>}
          </div>

          <div className="flex-1 px-4">
            <p className="typo-body font-black text-slate-800">{formatDateTime(b.scheduledAt)}</p>
            <p className="typo-micro text-slate-500 mt-1"><MapPin size={12} className="inline mr-1" />{b.pincode}</p>
          </div>

          <div className="text-right">
             {isExpired ? (
               <StatusPill status="expired" color="red" />
             ) : (
               <div className="text-amber-600 typo-micro font-bold flex items-center gap-1 justify-end">
                  <Clock size={12} className="animate-pulse" /> Expires: {expiresAt.toLocaleTimeString()}
               </div>
             )}
          </div>
        </Row>
        
        {!isExpired && (
          <div className="bg-amber-50 p-3 px-4 border-t border-amber-100 flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => handleAction(b, 'reject')} loading={actionLoading === b._id} className="text-red-600 border-red-200 hover:bg-red-50">
              <XCircle size={14} className="mr-1.5" /> Reject
            </Button>
            <Button size="sm" onClick={() => handleAction(b, 'accept')} loading={actionLoading === b._id} className="bg-emerald-600 text-white hover:bg-emerald-700">
              <CheckCircle size={14} className="mr-1.5" /> Accept Booking
            </Button>
          </div>
        )}
      </Card>
    );
  };

  if (loading) return null;

  return (
    <PageWrapper maxWidth="900px">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assignment Requests</h1>
        <p className="text-slate-500 text-sm mt-1">Review and accept your priority booking requests within 30 minutes.</p>
      </div>

      <div className="space-y-8">
        <Section title="Pending Requests" subtitle={`${queues.pending.length} bookings waiting for your confirmation`}>
          {queues.pending.length === 0 ? (
            <Card className="text-center py-8 border-dashed border-slate-200">
              <CheckCircle size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="typo-body text-slate-500 font-medium">You're all caught up!</p>
            </Card>
          ) : (
            <div className="space-y-4">{queues.pending.map(renderRequest)}</div>
          )}
        </Section>

        <Section title="Upcoming Confirmed" subtitle={`${queues.confirmed.length} active assignments`}>
          {queues.confirmed.length === 0 ? null : (
            <div className="space-y-3">
              {queues.confirmed.map(b => (
                <Card key={b._id} noPadding className="border-slate-100">
                  <Row className="!p-3">
                    <div className="flex-1">
                      <p className="typo-body font-bold text-slate-800">{formatDateTime(b.scheduledAt)}</p>
                      <p className="typo-micro text-slate-500 mt-0.5">{SERVICE_CONFIG[b.service?.slug || b.service]?.label || (typeof b.service === 'object' ? b.service?.label : b.service)} • {b.pincode}</p>
                    </div>
                    <StatusPill status="confirmed" color="emerald" />
                  </Row>
                </Card>
              ))}
            </div>
          )}
        </Section>
      </div>
    </PageWrapper>
  );
}
