import { useState, useEffect } from 'react';
import { labService } from '@/services';
import { LAB_DEPARTMENTS as FALLBACK_DEPARTMENTS } from '@/constants/departments';

export function useDepartments() {
  const [departments, setDepartments] = useState(FALLBACK_DEPARTMENTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await labService.getDepartments();
        if (res.success && res.data) {
          setDepartments(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch departments, using fallback:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepts();
  }, []);

  return { departments, loading };
}
