import { useState, useCallback, useEffect } from 'react';
import * as adminClassroomApi from '../services/adminClassroomApi';

export function useAdminClassrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchClassrooms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminClassroomApi.getAdminClassrooms();
      setClassrooms(data);
    } catch (err) {
      setError(err.message);
      setClassrooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  return { classrooms, loading, error, setError, refetch: fetchClassrooms };
}

export function useAdminClassroomStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminClassroomApi.getAdminDashboardStats();
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
