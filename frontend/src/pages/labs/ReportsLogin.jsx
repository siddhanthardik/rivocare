import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ReportsLogin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'patient') {
      navigate('/dashboard/patient/labs/reports');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-black text-slate-900 mb-4">View Reports</h1>
      <p className="text-slate-600">Login to view your lab reports.</p>
    </div>
  );
}
