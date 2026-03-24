import { useState, useCallback, useEffect } from 'react';
import * as userApi from '../services/userApi';


export function useUsers(activeTab, searchInput) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const role = activeTab === 'all' ? null : activeTab;
      const data = await userApi.getUsers(searchInput || null, role);
      setUsers(data);
    } catch (err) {
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  return { users, loading, error, setError, refetch: fetchUsers };
}
