import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { labService } from '@/services';
import useCheckout from '@/hooks/useCheckout';
import paymentService from '@/services/paymentService';
import { toast } from 'react-hot-toast';

export default function LabCheckout() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);
  const [labIntent, setLabIntent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { open } = useCheckout();

  useEffect(() => {
    const load = async () => {
      if (!orderId) return setLoading(false);
      try {
        const res = await labService.getMyOrders();
        const found = (res.data || []).find(o => o._id === orderId || o.orderId === orderId);
        setOrder(found || null);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load order');
      } finally { setLoading(false); }
    };
    load();
  }, [orderId]);

  useEffect(() => {
    // If no orderId, check for a stored labIntent (prepaid flow)
    if (!orderId) {
      const raw = sessionStorage.getItem('rivo_lab_intent');
      if (raw) {
        try {
          const intent = JSON.parse(raw);
          setLabIntent(intent);
        } catch (e) { console.warn('Invalid lab intent in sessionStorage'); }
      }
      setLoading(false);
    }
  }, [orderId]);

  const handlePay = async () => {
    // Prefer an explicit LabOrder when present
    if (!order && !labIntent) return toast.error('Order not found');

    const effectiveIntent = labIntent || (order && {
      partnerId: order.partner?._id || order.partner,
      testIds: (order.tests || []).map(t => (t._id ? t._id : t)),
      scheduledDate: order.scheduledDate,
      scheduledTime: order.scheduledTime,
      collectionType: order.collectionType,
      collectionAddress: order.collectionAddress,
      memberId: order.member,
      paymentMethod: order.paymentMethod
    });

    if (effectiveIntent && effectiveIntent.paymentMethod === 'cod' && !order) {
      return toast('This order is Cash on Collection. Partner must mark payment collected.');
    }

    open({
      createOrderFn: (payload) => paymentService.createLabOrder({ labIntent: effectiveIntent }),
      verifyFn: async (data) => {
        const res = await paymentService.verifyLabPayment(data);
        // If backend returned a labOrder, store an optimistic pending order for UI
        const labOrder = res?.data?.data || res?.data;
        try {
          if (labOrder) {
            const pending = {
              _id: `pending-${Date.now()}`,
              tests: (effectiveIntent.testIds || []).map(id => ({ _id: id, name: 'Pending Test', price: 0 })),
              totalAmount: effectiveIntent.totalAmount || labOrder.totalAmount || 0,
              status: labOrder?.status || 'new',
              paymentStatus: 'paid',
              createdAt: new Date().toISOString(),
              optimistic: true
            };
            sessionStorage.setItem('rivo_pending_order', JSON.stringify(pending));
          }
        } catch (e) { console.warn('Failed to set pending order', e); }
        return res;
      },
      payload: { labIntent: effectiveIntent },
      onSuccess: () => {
        try { sessionStorage.removeItem('rivo_lab_intent'); } catch (e) {}
        toast.success('Payment successful');
        window.location.href = '/dashboard/patient/labs/orders';
      },
      onError: (err) => { toast.error(err.message || 'Payment failed'); }
    });
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!order) return <div className="p-8">Order not found. Provide ?orderId=&lt;id&gt; in URL.</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-black text-slate-900 mb-4">Complete Booking</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm w-full max-w-2xl">
        <h2 className="font-bold text-lg mb-2">Order #{order._id}</h2>
        <p className="mb-2">Amount: <strong>₹{order.totalAmount}</strong></p>
        <p className="mb-4">Status: <strong>{order.paymentStatus}</strong></p>
        <div className="flex gap-3">
          <button onClick={handlePay} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Pay Now</button>
        </div>
      </div>
    </div>
  );
}
