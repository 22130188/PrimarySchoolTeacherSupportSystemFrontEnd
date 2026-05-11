import { useLocation, Link } from 'react-router-dom';
import { Home, BookOpen, ClipboardCheck, Sparkles, School, Plus, MoreHorizontal, Bell } from 'lucide-react';
import { SIDEBAR_MENU } from '../data/mockDashboardData';
import { useAuthStore } from '../stores/authStore';

export default function DashboardSidebar() {
  const location = useLocation();
  const roleId = useAuthStore(s => s.roleId);
  const MENU = SIDEBAR_MENU.filter(item => roleId === 1 ? item.id !== 'ai' && item.id !== 'lessons' : true);

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-[72px] bg-white border-r border-gray-100 z-40 flex flex-col items-center py-4 gap-1">

      <button
        id="sidebar-create-btn"
        className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 mb-4 group"
        title="Tạo mới"
      >
        <Plus className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-300" />
      </button>

      <div className="w-8 h-px bg-gray-100 mb-2" />

      <nav className="flex flex-col items-center gap-1 flex-1">
        {MENU.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              id={`sidebar-${item.id}`}
              className={`group flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-200
                ${isActive
                  ? 'bg-violet-50 text-violet-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-violet-600'
                }`}
              title={item.label}
            >
              <Icon className={`w-5 h-5 mb-0.5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-violet-600' : ''}`} />
              <span className={`text-[10px] font-medium leading-tight ${isActive ? 'text-violet-600' : 'text-gray-500 group-hover:text-violet-600'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-2 mt-auto">
        <button
          className="w-10 h-10 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-violet-500 flex items-center justify-center transition-all duration-200"
          title="Thêm"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>

        <button
          className="w-10 h-10 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-violet-500 flex items-center justify-center transition-all duration-200 relative"
          title="Thông báo"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
        </button>

        <Link
          to="/profile"
          className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-teal-400 flex items-center justify-center text-white text-xs font-bold shadow-md hover:shadow-lg hover:scale-110 transition-all duration-200"
          title="Hồ sơ"
        >
          GV
        </Link>
      </div>
    </aside>
  );
}
