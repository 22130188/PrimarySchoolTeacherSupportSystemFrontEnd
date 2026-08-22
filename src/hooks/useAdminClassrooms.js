import { useState, useCallback, useEffect } from 'react';
import * as adminClassroomApi from '../services/adminClassroomApi';

const emptyPagination = {
  page: 0,
  size: 8,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
};

export function useAdminClassrooms({
  page = 0,
  size = 8,
  status,
  keyword = '',
  sort = 'createdAt',
  direction = 'desc',
} = {}) {
  const [classrooms, setClassrooms] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchClassrooms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminClassroomApi.getAdminClassrooms({
        page,
        size,
        status,
        keyword,
        sort,
        direction,
      });
      setClassrooms(Array.isArray(data?.content) ? data.content : []);
      setPagination({ ...emptyPagination, ...data });
    } catch (err) {
      setError(err.message);
      setClassrooms([]);
      setPagination({ ...emptyPagination, page, size });
    } finally {
      setLoading(false);
    }
  }, [page, size, status, keyword, sort, direction]);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  return { classrooms, pagination, loading, error, setError, refetch: fetchClassrooms };
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