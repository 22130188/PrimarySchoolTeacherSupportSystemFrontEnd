import { useAdminStore } from '../../stores/adminStore';
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import DashboardOverview from './components/DashboardOverview';
import UserManagement from './components/UserManagement';
import ClassroomManagement from './components/ClassroomManagement';
import SubjectManagement from './components/SubjectManagement';
import ResourceManagement from './components/ResourceManagement';
import AccessManagement from './components/AccessManagement';
import SystemSettings from './components/SystemSettings';

const PAGE_MAP = {
  dashboard:  DashboardOverview,
  users:      UserManagement,
  classrooms: ClassroomManagement,
  subjects:   SubjectManagement,
  resources:  ResourceManagement,
  access:     AccessManagement,
  settings:   SystemSettings,
};

export default function AdminPage() {
  const { activePage, sidebarCollapsed } = useAdminStore();
  const ActiveComponent = PAGE_MAP[activePage] || DashboardOverview;

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
