import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Users, School, GraduationCap, FolderOpen } from 'lucide-react';
import { getAdminActivity } from '../../../services/adminDashboardApi';
import { getUsers } from '../../../services/userApi';
import { getAdminDashboardStats } from '../../../services/adminClassroomApi';
import resourceService from '../../../services/resourceService';
import { getActionLabel } from '../../../utils/actionLogLabels';

const normalizeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.content)) return value.content;
  return [];
};

const formatCount = (value) => new Intl.NumberFormat('en-US').format(Number(value || 0));

export default function DashboardOverview() {
  const navigate = useNavigate();
  const [monthlyData, setMonthlyData] = useState(Array.from({ length: 12 }, (_, index) => ({ month: `T${index + 1}`, sessions: 0, users: 0 })));
  const [recentActivities, setRecentActivities] = useState([]);
  const [overviewStats, setOverviewStats] = useState({
    teachers: 0,
    students: 0,
    classrooms: 0,
    resources: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const maxSessions = Math.max(1, ...monthlyData.map((d) => d.sessions));
  const maxUsers = Math.max(1, ...monthlyData.map((d) => d.users));
  const chartMax = Math.max(maxSessions, maxUsers);

  useEffect(() => {
    let active = true;
    getAdminActivity().then((response) => {
      if (!active) return;
      setMonthlyData((response.monthlyActivity || []).map((item) => ({ month: `T${item.month}`, sessions: item.sessions, users: item.newUsers })));
      setRecentActivities(response.recentActivities || []);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchOverviewStats = async () => {
      setStatsLoading(true);

      const [teachersRes, studentsRes, classroomsRes, imagesRes, audiosRes] = await Promise.allSettled([
        getUsers(null, 'TEACHER'),
        getUsers(null, 'STUDENT'),
        getAdminDashboardStats(),
        resourceService.getAllImages(),
        resourceService.getAllAudios(),
      ]);

      if (!isMounted) return;

      const teachers = teachersRes.status === 'fulfilled'
        ? normalizeArray(teachersRes.value).length
        : 0;
      const students = studentsRes.status === 'fulfilled'
        ? normalizeArray(studentsRes.value).length
        : 0;
      const classrooms = classroomsRes.status === 'fulfilled'
        ? Number(
            classroomsRes.value?.totalClassrooms ??
            classroomsRes.value?.classroomCount ??
            classroomsRes.value?.total ??
            0,
          )
        : 0;
      const resources =
        (imagesRes.status === 'fulfilled' ? normalizeArray(imagesRes.value).length : 0) +
        (audiosRes.status === 'fulfilled' ? normalizeArray(audiosRes.value).length : 0);

      setOverviewStats({ teachers, students, classrooms, resources });
      setStatsLoading(false);
    };

    fetchOverviewStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const statCards = useMemo(() => ([
    { id: 1, label: 'Giáo viên', value: formatCount(overviewStats.teachers), icon: Users, gradient: 'from-violet-500 to-indigo-600' },
    { id: 2, label: 'Học sinh', value: formatCount(overviewStats.students), icon: GraduationCap, gradient: 'from-teal-500 to-cyan-600' },
    { id: 3, label: 'Lớp học', value: formatCount(overviewStats.classrooms), icon: School, gradient: 'from-rose-500 to-pink-600' },
    { id: 4, label: 'Tài nguyên', value: formatCount(overviewStats.resources), icon: FolderOpen, gradient: 'from-amber-500 to-orange-600' },
  ]), [overviewStats]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="group relative bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {statsLoading ? '...' : card.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className={`absolute bottom-0 left-4 right-4 h-1 rounded-full bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            </div>
          );
        })}
      </div>


      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        <div className="xl:col-span-3 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Hoạt động theo tháng</h3>
              <p className="text-sm text-gray-500 mt-0.5">Lượt truy cập và người dùng mới trong năm</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
                <span className="text-gray-500">Lượt truy cập</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400" />
                <span className="text-gray-500">Người dùng mới</span>
              </div>
            </div>
          </div>


          <div className="flex items-end gap-2 sm:gap-3 h-72 pt-2">
            {monthlyData.map((d) => {
              const sessionsPct = Math.max(d.sessions > 0 ? (d.sessions / chartMax) * 100 : 0, d.sessions > 0 ? 8 : 0);
              const usersPct = Math.max(d.users > 0 ? (d.users / chartMax) * 100 : 0, d.users > 0 ? 8 : 0);
              return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group/bar h-full">
                <span className="text-[10px] font-semibold text-gray-600 opacity-0 group-hover/bar:opacity-100 transition-opacity h-4">
                  {d.sessions > 0 || d.users > 0 ? `${d.sessions}/${d.users}` : ''}
                </span>
                <div className="w-full flex gap-0.5 items-end flex-1 min-h-0">
                  <div
                    className="flex-1 bg-gradient-to-t from-violet-500 to-indigo-400 rounded-t-md hover:from-violet-600 hover:to-indigo-500 transition-all duration-200 relative"
                    style={{ height: `${sessionsPct}%`, minHeight: d.sessions > 0 ? '12px' : '3px' }}
                    title={`Lượt truy cập: ${d.sessions}`}
                  >
                    {d.sessions > 0 && sessionsPct >= 20 && (
                      <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-violet-600 whitespace-nowrap">
                        {d.sessions}
                      </span>
                    )}
                  </div>
                  <div
                    className="flex-1 bg-gradient-to-t from-teal-400 to-cyan-300 rounded-t-md hover:from-teal-500 hover:to-cyan-400 transition-all duration-200 relative"
                    style={{ height: `${usersPct}%`, minHeight: d.users > 0 ? '12px' : '3px' }}
                    title={`Người dùng mới: ${d.users}`}
                  />
                </div>
                <span className="text-[10px] text-gray-400 font-medium">{d.month}</span>
              </div>
              );
            })}
          </div>
        </div>


        <div className="xl:col-span-2 space-y-6">

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Thao tác nhanh</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Plus,     label: 'Thêm người dùng',   gradient: 'from-violet-500 to-indigo-600', route: '/admin/users/create' },
                { icon: BookOpen, label: 'Quản lý môn học',    gradient: 'from-teal-500 to-cyan-600', route: '/admin/subjects' },
                { icon: School,   label: 'Tạo lớp học',       gradient: 'from-rose-500 to-pink-600', route: '/admin/classrooms/create' },
                { icon: Users,    label: 'Quản lý quyền',     gradient: 'from-amber-500 to-orange-600', route: '/admin/users' },
              ].map((action) => {
                const AIcon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.route)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all duration-200 group"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200`}>
                      <AIcon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-600 text-center">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>


      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Hoạt động gần đây</h3>
          <button
            type="button"
            onClick={() => navigate('/admin/access')}
            className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
          >
            Xem tất cả
          </button>
        </div>
        <div className="space-y-4">
          {recentActivities.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">Chưa có hoạt động đáng chú ý</p>
          )}
          {recentActivities.map((act) => (
            <div
              key={act.resourceId}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {(act.actor || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">
                  <span className="font-semibold">{act.actor}</span>{' '}
                  <span className="text-gray-600">
                    {(() => {
                      const code = act.type || act.action || '';
                      const label = getActionLabel(code, act.description || act.subject);
                      return `đã ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
                    })()}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(act.createdAt).toLocaleString('vi-VN')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
