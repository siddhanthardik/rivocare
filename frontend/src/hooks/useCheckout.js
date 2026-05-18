import { useEffect, useState, useCallback } from 'react';
import paymentService from '@/services/paymentService';

export default function useCheckout() {
  const [isLoaded, setIsLoaded] = useState(!!window.Razorpay);
  const [isInitializing, setIsInitializing] = useState(!window.Razorpay);

  useEffect(() => {
    if (window.Razorpay) {
      setIsLoaded(true);
      setIsInitializing(false);
      return;
    }

    // Check if script is already being loaded by another instance
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      const handleLoad = () => { setIsLoaded(true); setIsInitializing(false); };
      const handleError = () => { setIsLoaded(false); setIsInitializing(false); };
      
      existingScript.addEventListener('load', handleLoad);
      existingScript.addEventListener('error', handleError);
      return () => {
        existingScript.removeEventListener('load', handleLoad);
        existingScript.removeEventListener('error', handleError);
      };
    }

    setIsInitializing(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      setIsLoaded(true);
      setIsInitializing(false);
    };
    script.onerror = () => {
      setIsLoaded(false);
      setIsInitializing(false);
    };
    document.body.appendChild(script);
  }, []);

  const open = useCallback(async ({ createOrderFn, verifyFn, payload, onSuccess, onError }) => {
    if (!isLoaded) return onError && onError(new Error('Razorpay SDK not loaded'));

    try {
      const res = await createOrderFn(payload);
      const { order, keyId } = res.data.data || res.data || {};
      if (!order) return onError && onError(new Error('Failed to create order'));

      const options = {
        key: keyId || process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'RIVO Care',
        description: 'Order Payment',
        order_id: order.id,
        handler: async function (response) {
          try {
            await verifyFn({ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature });
            onSuccess && onSuccess(response);
          } catch (err) {
            onError && onError(err);
          }
        },
        prefill: {},
        theme: { color: '#2563eb' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      onError && onError(err);
    }
  }, [isLoaded]);

  return { isLoaded, isInitializing, open };
}
