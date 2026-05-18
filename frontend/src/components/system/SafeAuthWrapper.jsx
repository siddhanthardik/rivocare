import { useAuth } from '@/context/AuthContext';

export default function SafeAuthWrapper({ children }) {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return children;
}
