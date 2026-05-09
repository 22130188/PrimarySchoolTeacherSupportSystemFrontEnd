import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAdminStore } from '../../stores/adminStore';
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import DashboardOverview from './components/DashboardOverview';
import AdminProfile from './components/AdminProfile';
import UserManagement from './components/UserManagement';
import ClassroomManagement from './components/ClassroomManagement';
import SubjectManagement from './components/SubjectManagement';
import TestManagement from './components/TestManagement';
import ResourceManagement from './components/ResourceManagement';
import AccessManagement from './components/AccessManagement';
import SystemSettings from './components/SystemSettings';

const PAGE_MAP = {
  dashboard:  DashboardOverview,
  profile:    AdminProfile,
  users:      UserManagement,
  classrooms: ClassroomManagement,
  subjects:   SubjectManagement,
  tests:      TestManagement,
  resources:  ResourceManagement,
  access:     AccessManagement,
  settings:   SystemSettings,
};

export default function AdminPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const roleId = useAuthStore((s) => s.roleId);
  const { activePage, sidebarCollapsed } = useAdminStore();
  const ActiveComponent = PAGE_MAP[activePage] || DashboardOverview;

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
        <ActiveComponent />
      </div>
    </div>
  );
}
