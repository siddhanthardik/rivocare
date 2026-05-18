import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import paymentService from '../../services/paymentService';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function PaymentSuccess() {
  const query = useQuery();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const paymentId = query.get('paymentId');
    const bookingId = query.get('bookingId');
    const amount = query.get('amount');
    const method = query.get('method');
    const razorpayId = query.get('razorpayId');

    async function fetch() {
      try {
        setLoading(true);
        // If bookingId exists fetch booking details, else show minimal info
        let booking = null;
        if (bookingId) {
          const res = await paymentService.getBooking(bookingId);
          booking = res.data;
        }
        setData({ paymentId, bookingId, amount, method, razorpayId, booking });
      } catch (e) {
        setError('Failed to load payment details');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return (
    <div className="p-6 text-red-600">
      <div className="mb-4">{error}</div>
      <div className="flex gap-2">
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-emerald-600 text-white rounded">Retry</button>
        <Link to="/support" className="px-4 py-2 border rounded">Contact Support</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-lg w-full bg-white rounded shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">Payment Successful</h2>
        <p className="mb-4">Your payment was processed successfully.</p>
        <div className="space-y-2 mb-4">
          <div><strong>Amount:</strong> ₹{data.amount}</div>
          <div><strong>Payment Method:</strong> {data.method || 'Razorpay'}</div>
          <div><strong>Razorpay Payment ID:</strong> {data.razorpayId}</div>
          <div><strong>Booking/Order ID:</strong> {data.bookingId ? data.bookingId : '—'}</div>
        </div>

        <div className="flex gap-3">
          {data.bookingId && (
            <Link to={`/bookings/${data.bookingId}`} className="px-4 py-2 bg-indigo-600 text-white rounded">View Booking</Link>
          )}
          {data.paymentId && (
            <a href={`/api/invoices/${data.paymentId}/download`} className="px-4 py-2 border rounded">Download Invoice</a>
          )}
          <Link to="/" className="px-4 py-2 border rounded">Go to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
