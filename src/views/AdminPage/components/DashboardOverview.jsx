import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Users, School, GraduationCap, FolderOpen, Mic, Sparkles, FileText, ClipboardCheck, Brain } from 'lucide-react';
import { getAdminActivity } from '../../../services/adminDashboardApi';
import { getActionLogs } from '../../../services/actionLogApi';
import { getUsers } from '../../../services/userApi';
import { getAdminDashboardStats } from '../../../services/adminClassroomApi';
import { getAdminFeedback } from '../../../services/supportApi';
import resourceService from '../../../services/resourceService';
import adminLessonService from '../../../services/adminLessonService';
import adminTestService from '../../../services/adminTestService';
import { getActionLabel } from '../../../utils/actionLogLabels';

const normalizeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.content)) return value.content;
  return [];
};

const emptyMonthly = () => Array.from({ length: 12 }, (_, index) => ({
  month: `T${index + 1}`,
  sessions: 0,
  users: 0,
}));

const formatCount = (value) => new Intl.NumberFormat('en-US').format(Number(value || 0));

const mapMonthlyFromApi = (items = []) => {
  const base = emptyMonthly();
  items.forEach((item) => {
    const monthIndex = Number(item.month || item.monthIndex || 0) - 1;
    if (monthIndex < 0 || monthIndex > 11) return;
    base[monthIndex] = {
      month: `T${monthIndex + 1}`,
      sessions: Number(item.sessions ?? item.accessCount ?? item.visits ?? 0),
      users: Number(item.newUsers ?? item.users ?? item.userCount ?? 0),
    };
  });
  return base;
};

const mapRecentFromApi = (items = []) => items.map((act, index) => ({
  resourceId: act.resourceId ?? act.id ?? `act-${index}`,
  actor: act.actor || act.username || act.userName || act.clientIdentifier || 'Hệ thống',
  type: act.type || act.action || '',
  description: act.description || act.subject || '',
  createdAt: act.createdAt || act.timestamp || act.time,
}));

const buildMonthlyFromLogs = (logs = [], users = []) => {
  const year = new Date().getFullYear();
  const base = emptyMonthly();

  logs.forEach((log) => {
    const date = new Date(log.createdAt);
    if (Number.isNaN(date.getTime()) || date.getFullYear() !== year) return;
    base[date.getMonth()].sessions += 1;
  });

  users.forEach((user) => {
    const raw = user.createdAt || user.created_at || user.joinedAt || user.registeredAt;
    if (!raw) return;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime()) || date.getFullYear() !== year) return;
    base[date.getMonth()].users += 1;
  });

  return base;
};

const fetchRecentActionLogs = async (limit = 8) => {
  const response = await getActionLogs({ page: 0, size: Math.max(limit, 50), sort: 'createdAt,desc' });
  const content = normalizeArray(response?.content ?? response);
  return content
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, limit);
};

export default function DashboardOverview() {
  const navigate = useNavigate();
  const [monthlyData, setMonthlyData] = useState(emptyMonthly());
  const [recentActivities, setRecentActivities] = useState([]);
  const [overviewStats, setOverviewStats] = useState({
    teachers: 0,
    students: 0,
    classrooms: 0,
    resources: 0,
    lessons: 0,
    exams: 0,
    exercises: 0,
  });
  const [aiUsage, setAiUsage] = useState({
    TTS: 0,
    IMAGE: 0,
    PRONUNCIATION: 0,
    TRANSLATE: 0,
  });
  const [feedbackStats, setFeedbackStats] = useState({
    NEW: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    CLOSED: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const maxSessions = Math.max(1, ...monthlyData.map((d) => d.sessions));
  const maxUsers = Math.max(1, ...monthlyData.map((d) => d.users));
  const chartMax = Math.max(maxSessions, maxUsers);

  const totalAI = (aiUsage.TTS || 0) + (aiUsage.IMAGE || 0) + (aiUsage.PRONUNCIATION || 0) + (aiUsage.TRANSLATE || 0);
  const getPercentage = (val) => {
    if (!totalAI) return 0;
    return Math.round((val / totalAI) * 100);
  };

  const totalFeedback = (feedbackStats.NEW || 0) + (feedbackStats.IN_PROGRESS || 0) + (feedbackStats.RESOLVED || 0) + (feedbackStats.CLOSED || 0);
  const resolvedPct = totalFeedback > 0 ? Math.round(((feedbackStats.RESOLVED + feedbackStats.CLOSED) / totalFeedback) * 100) : 0;
  
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (resolvedPct / 100) * circumference;

  useEffect(() => {
    let active = true;

    const loadActivity = async () => {
      let hasMonthly = false;
      let hasRecent = false;

      try {
        const response = await getAdminActivity();
        if (!active) return;

        const monthlySource = response?.monthlyActivity || response?.monthly || response?.months || [];
        const recentSource = response?.recentActivities || response?.activities || response?.recent || [];
        const mappedMonthly = mapMonthlyFromApi(monthlySource);
        const mappedRecent = mapRecentFromApi(recentSource);
        hasMonthly = mappedMonthly.some((d) => d.sessions > 0 || d.users > 0);
        hasRecent = mappedRecent.length > 0;

        if (hasMonthly) setMonthlyData(mappedMonthly);
        if (hasRecent) setRecentActivities(mappedRecent);
        if (hasMonthly && hasRecent) return;
      } catch {
        // fallback below
      }

      try {
        const needUsers = !hasMonthly;
        const [logs, teachers, students] = await Promise.all([
          fetchRecentActionLogs(hasMonthly ? 20 : 200),
          needUsers ? getUsers(null, 'TEACHER').catch(() => []) : Promise.resolve([]),
          needUsers ? getUsers(null, 'STUDENT').catch(() => []) : Promise.resolve([]),
        ]);
        if (!active) return;

        if (!hasMonthly) {
          const allUsers = [...normalizeArray(teachers), ...normalizeArray(students)];
          setMonthlyData(buildMonthlyFromLogs(logs, allUsers));
        }
        if (!hasRecent) {
          setRecentActivities(mapRecentFromApi(logs.slice(0, 8)));
        }
      } catch {
        // keep empty state
      }
    };

    loadActivity();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchOverviewStats = async () => {
      setStatsLoading(true);

      // Fetch all data in parallel — including action logs, feedback, lessons, and tests
      const [teachersRes, studentsRes, classroomsRes, imagesRes, audiosRes, feedbackRes,
        ttsLogsRes, imageLogsRes, pronLogsRes, translateLogsRes, lessonsRes, testsRes,
      ] = await Promise.allSettled([
        getUsers(null, 'TEACHER'),
        getUsers(null, 'STUDENT'),
        getAdminDashboardStats(),
        resourceService.getAllImages(),
        resourceService.getAllAudios(),
        getAdminFeedback(),
        getActionLogs({ module: 'tts', size: 1 }),
        getActionLogs({ module: 'images', size: 1 }),
        getActionLogs({ module: 'pronunciation', size: 1 }),
        getActionLogs({ action: 'CREATE_BILINGUAL_LESSON', size: 1 }),
        adminLessonService.getAllLessons(),
        adminTestService.getAllTests(),
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

      let lessons = 0;
      let exams = 0;
      let exercises = 0;

      if (lessonsRes.status === 'fulfilled' && lessonsRes.value) {
        const val = lessonsRes.value;
        const list = Array.isArray(val) ? val : (val.data || val.items || []);
        lessons = list.length;
      }

      if (testsRes.status === 'fulfilled' && testsRes.value) {
        const val = testsRes.value;
        const list = Array.isArray(val) ? val : (val.data || val.items || []);
        exams = list.filter((t) => t.testType === 'EXAM' || t.test_type === 'EXAM').length;
        exercises = list.filter((t) => t.testType === 'EXERCISE' || t.test_type === 'EXERCISE').length;
      }

      setOverviewStats({ teachers, students, classrooms, resources, lessons, exams, exercises });

      // --- AI Usage: extract totalElements from paginated action-log responses ---
      const extractTotal = (res) => {
        if (res.status !== 'fulfilled' || !res.value) return 0;
        const v = res.value;
        return Number(v.totalElements ?? v.total ?? (Array.isArray(v.content) ? v.content : v).length ?? 0);
      };
      setAiUsage({
        TTS: extractTotal(ttsLogsRes),
        IMAGE: extractTotal(imageLogsRes),
        PRONUNCIATION: extractTotal(pronLogsRes),
        TRANSLATE: extractTotal(translateLogsRes),
      });

      // --- Feedback Stats: count items by status from the feedback list ---
      if (feedbackRes.status === 'fulfilled' && feedbackRes.value) {
        const fbList = Array.isArray(feedbackRes.value) ? feedbackRes.value : (feedbackRes.value?.content ?? feedbackRes.value?.data ?? []);
        const counts = { NEW: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 };
        fbList.forEach((item) => {
          const st = (item.status || 'NEW').toUpperCase();
          if (st in counts) counts[st] += 1;
          else counts.NEW += 1;
        });
        setFeedbackStats(counts);
      }

      setStatsLoading(false);
    };

    fetchOverviewStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const allStatCards = useMemo(() => ([
    { id: 1, label: 'Giáo viên', value: formatCount(overviewStats.teachers), icon: Users, gradient: 'from-violet-500 to-indigo-600' },
    { id: 2, label: 'Học sinh', value: formatCount(overviewStats.students), icon: GraduationCap, gradient: 'from-teal-500 to-cyan-600' },
    { id: 3, label: 'Lớp học', value: formatCount(overviewStats.classrooms), icon: School, gradient: 'from-rose-500 to-pink-600' },
    { id: 4, label: 'Tài nguyên', value: formatCount(overviewStats.resources), icon: FolderOpen, gradient: 'from-amber-500 to-orange-600' },
    { id: 5, label: 'Bài giảng', value: formatCount(overviewStats.lessons), icon: FileText, gradient: 'from-fuchsia-500 to-pink-600' },
    { id: 6, label: 'Bài kiểm tra', value: formatCount(overviewStats.exams), icon: ClipboardCheck, gradient: 'from-orange-500 to-red-600' },
    { id: 7, label: 'Bài tập', value: formatCount(overviewStats.exercises), icon: Brain, gradient: 'from-sky-500 to-blue-600' },
  ]), [overviewStats]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {allStatCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="group relative bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[96px]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-500 truncate">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1 truncate">
                    {statsLoading ? '...' : card.value}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <Icon className="w-4.5 h-4.5 text-gray-800" />
                </div>
              </div>

              <div className={`absolute bottom-0 left-3 right-3 h-1 rounded-full bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
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
                <div className="w-full flex gap-0.5 items-end flex-1 min-h-0">
                  <div
                    className="flex-1 bg-gradient-to-t from-violet-500 to-indigo-400 rounded-t-md hover:from-violet-600 hover:to-indigo-500 transition-all duration-200 relative"
                    style={{ height: `${sessionsPct}%`, minHeight: d.sessions > 0 ? '12px' : '3px' }}
                    title={`Lượt truy cập: ${d.sessions}`}
                  >
                    {d.sessions > 0 && (
                      <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-violet-600 whitespace-nowrap">
                        {d.sessions}
                      </span>
                    )}
                  </div>
                  <div
                    className="flex-1 bg-gradient-to-t from-teal-400 to-cyan-300 rounded-t-md hover:from-teal-500 hover:to-cyan-400 transition-all duration-200 relative"
                    style={{ height: `${usersPct}%`, minHeight: d.users > 0 ? '12px' : '3px' }}
                    title={`Người dùng mới: ${d.users}`}
                  >
                    {d.users > 0 && (
                      <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-teal-600 whitespace-nowrap">
                        {d.users}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 font-medium">{d.month}</span>
              </div>
              );
            })}
          </div>
        </div>


        <div className="xl:col-span-2 space-y-6">
          {/* AI Usage Panel */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Sử dụng dịch vụ AI</h3>
                <p className="text-xs text-gray-500 mt-0.5">Thống kê lượt sử dụng công cụ AI</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900">{formatCount(totalAI)}</span>
                <p className="text-[10px] text-gray-400 font-medium">Lượt yêu cầu</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {[
                { name: 'Chuyển văn bản thành tiếng nói (TTS)', value: aiUsage.TTS, color: 'bg-violet-500', icon: Mic },
                { name: 'Tạo hình ảnh minh họa (Image)', value: aiUsage.IMAGE, color: 'bg-amber-500', icon: Sparkles },
                { name: 'Kiểm tra phát âm (Pronunciation)', value: aiUsage.PRONUNCIATION, color: 'bg-teal-500', icon: GraduationCap },
                { name: 'Dịch thuật bài học (Translate)', value: aiUsage.TRANSLATE, color: 'bg-pink-500', icon: BookOpen },
              ].map((item) => {
                const pct = getPercentage(item.value);
                const ItemIcon = item.icon;
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <ItemIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <span className="font-bold flex-shrink-0">{item.value} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Thao tác nhanh</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Plus,     label: 'Thêm người dùng',   gradient: 'from-violet-500 to-indigo-600', route: '/admin/users/create' },
                { icon: BookOpen, label: 'Quản lý môn học',    gradient: 'from-teal-500 to-cyan-600', route: '/admin/subjects' },
                { icon: FileText, label: 'Mẫu bài giảng',     gradient: 'from-rose-500 to-pink-600', route: '/admin/lesson_templates' },
                { icon: Users,    label: 'Quản lý quyền',     gradient: 'from-amber-500 to-orange-600', route: '/admin/users' },
              ].map((action) => {
                const AIcon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.route)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all duration-200 group"
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                      <AIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-600 text-center">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Feedback status grids */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
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
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {recentActivities.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Chưa có hoạt động đáng chú ý</p>
            )}
            {recentActivities.map((act) => {
              const when = act.createdAt ? new Date(act.createdAt) : null;
              const timeLabel = when && !Number.isNaN(when.getTime())
                ? when.toLocaleString('vi-VN')
                : '';
              return (
                <div
                  key={act.resourceId}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {(act.actor || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-800 leading-snug">
                      <span className="font-semibold text-gray-900">{act.actor}</span>{' '}
                      <span className="text-gray-600">
                        {(() => {
                          const code = act.type || act.action || '';
                          const label = getActionLabel(code, act.description || act.subject);
                          return `đã ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
                        })()}
                      </span>
                    </p>
                    {timeLabel && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{timeLabel}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback & Bug Reporting Status */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Phản hồi & Báo lỗi</h3>
              <p className="text-xs text-gray-500 mt-0.5">Tiến độ xử lý ý kiến từ giáo viên & học sinh</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/feedback')}
              className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
            >
              Xem chi tiết
            </button>
          </div>

          <div className="flex flex-col items-center gap-5 pt-2">
            {/* Radial Progress Ring — large, centered on top */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="text-gray-100"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="text-violet-600 transition-all duration-500 ease-out"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{resolvedPct}%</span>
                <span className="text-[10px] text-gray-400 font-medium">Hoàn thành</span>
              </div>
            </div>

            {/* Status counts grid */}
            <div className="grid grid-cols-2 gap-3 w-full">
              {[
                { label: 'Chưa xử lý', count: feedbackStats.NEW, dot: 'bg-red-500' },
                { label: 'Đang xử lý', count: feedbackStats.IN_PROGRESS, dot: 'bg-amber-500' },
                { label: 'Đã giải quyết', count: feedbackStats.RESOLVED, dot: 'bg-emerald-500' },
                { label: 'Đã đóng', count: feedbackStats.CLOSED, dot: 'bg-gray-500' },
              ].map((st) => (
                <div key={st.label} className="p-2.5 rounded-xl border border-gray-100 bg-white flex items-center justify-between shadow-sm hover:shadow-gray-100 transition-shadow duration-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot} flex-shrink-0`} />
                    <span className="text-xs font-semibold text-gray-800 truncate">{st.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 ml-1">{st.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
