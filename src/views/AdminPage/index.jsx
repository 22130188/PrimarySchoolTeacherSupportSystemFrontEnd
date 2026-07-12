import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAdminStore } from '../../stores/adminStore';
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';

export default function AdminPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const roleId = useAuthStore((s) => s.roleId);
  const { sidebarCollapsed } = useAdminStore();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (roleId !== 3) {
      navigate('/profile');
      return;
    }
  }, [token, roleId, navigate]);

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <AdminSidebar />
      <div
        className="transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? 72 : 250 }}
      >
        <AdminHeader />
        <Outlet />
      </div>
    </div>
  );
}
