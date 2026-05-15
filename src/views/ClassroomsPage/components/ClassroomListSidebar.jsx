import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMyClassrooms, getMyJoinedClassrooms } from '../../../services/classroomApi';
import { BANNER_COLORS } from '../../../data/classroomData';
import { useAuthStore } from '../../../stores/authStore';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

export default function ClassroomListSidebar({ currentClassroomId }) {
  const [classrooms, setClassrooms] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const roleId = useAuthStore(s => s.roleId);
  const user = useAuthStore(s => s.user);
  const isTeacher = roleId === 2;

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = isTeacher ? await getMyClassrooms() : await getMyJoinedClassrooms();
        setClassrooms(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err.message);
      }
    };
    fetch();
  }, [isTeacher]);

  const activeId = parseInt(currentClassroomId);

  return (
    <div
      className={`sticky top-16 h-[calc(100vh-64px)] bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[56px]' : 'w-[280px]'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100">
        {!collapsed && (
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Lớp học
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors ml-auto"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1.5">
        {classrooms.map((cls) => {
          const isActive = cls.id === activeId;
          const bannerColor = BANNER_COLORS[(cls.id || 0) % BANNER_COLORS.length];

          return (
            <button
              key={cls.id}
              onClick={() => navigate(`/classrooms/${cls.id}`)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-200 group ${
                isActive
                  ? 'bg-violet-50 border-r-[3px] border-violet-500'
                  : 'hover:bg-gray-50 border-r-[3px] border-transparent'
              }`}
              title={cls.name}
            >
              {(cls.teacherAvatarUrl || user?.avatarUrl) ? (
                <img
                  src={cls.teacherAvatarUrl || user.avatarUrl}
                  alt={cls.teacherName || cls.name}
                  className={`w-8 h-8 rounded-full object-cover flex-shrink-0 ${
                    isActive ? 'ring-2 ring-violet-300 ring-offset-1' : ''
                  }`}
                />
              ) : (
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${bannerColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                    isActive ? 'ring-2 ring-violet-300 ring-offset-1' : ''
                  }`}
                >
                  {getInitials(cls.teacherName || cls.name)}
                </div>
              )}

              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium truncate leading-tight ${
                      isActive ? 'text-violet-700' : 'text-gray-700 group-hover:text-gray-900'
                    }`}
                  >
                    {cls.name}
                  </p>
                  {cls.description && (
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                      {cls.description}
                    </p>
                  )}
                </div>
              )}
            </button>
          );
        })}

        {classrooms.length === 0 && !collapsed && (
          <p className="text-xs text-gray-400 text-center py-6">Chưa có lớp học nào</p>
        )}
      </div>
    </div>
  );
}
