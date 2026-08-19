import { useState, useEffect, useCallback } from 'react';
import { Student } from '../types';

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/students?limit=100', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setStudents(data.students || []);
      } else {
        setError(data.error || 'Failed to load students.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { students, loading, error, reload };
}