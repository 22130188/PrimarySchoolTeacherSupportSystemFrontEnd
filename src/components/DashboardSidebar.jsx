import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Plus, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { SIDEBAR_MENU } from '../data/mockDashboardData';
import { useAuthStore } from '../stores/authStore';
import NotificationCenter from './NotificationCenter';
import CreateContentModal from './CreateContentModal';
import CreateLessonModal from '../views/LessonsPage/CreateLessonModal';

export default function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const roleId = useAuthStore(s => s.roleId);
  const profileInitials = roleId === 1 ? 'HS' : roleId === 3 ? 'QT' : 'GV';
  const [showCreateChoices, setShowCreateChoices] = useState(false);
  const [showLessonCreator, setShowLessonCreator] = useState(false);
  
  const MENU = SIDEBAR_MENU.filter(item => {
    if (roleId === 1) { // STUDENT
      return item.id !== 'ai' && item.id !== 'lessons' && item.id !== 'tests';
    }
    return true;
  });

  return (
    <>
      <aside className="fixed left-0 top-16 bottom-0 w-[72px] bg-white border-r border-gray-100 z-40 flex flex-col items-center py-4 gap-1">

        <button
          id="sidebar-create-btn"
          className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 mb-4 group"
          title="Tạo mới"
          onClick={() => setShowCreateChoices(true)}
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

          <NotificationCenter placement="sidebar" />

          <Link
            to="/profile"
            className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-teal-400 flex items-center justify-center text-white text-xs font-bold shadow-md hover:shadow-lg hover:scale-110 transition-all duration-200"
            title="Hồ sơ"
          >
            {profileInitials}
          </Link>
        </div>
      </aside>

      {showCreateChoices && (
        <CreateContentModal
          onClose={() => setShowCreateChoices(false)}
          onCreateLesson={() => { setShowCreateChoices(false); setShowLessonCreator(true); }}
          onCreateTest={() => { setShowCreateChoices(false); navigate('/tests/create?type=EXAM'); }}
          onCreateExercise={() => { setShowCreateChoices(false); navigate('/tests/create?type=EXERCISE'); }}
        />
      )}
      {showLessonCreator && <CreateLessonModal onClose={() => setShowLessonCreator(false)} />}
    </>
  );
}
