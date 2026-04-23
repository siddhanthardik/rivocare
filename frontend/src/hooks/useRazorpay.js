import { useEffect, useState } from 'react';

export default function useRazorpay() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (window.Razorpay) {
      setIsLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setIsLoaded(false);
    document.body.appendChild(script);

    return () => {
      // Cleanup not strictly necessary as it's cached, but good practice
      // document.body.removeChild(script); 
    };
  }, []);

  return isLoaded;
}
