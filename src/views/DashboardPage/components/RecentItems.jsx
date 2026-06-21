import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, ArrowDownUp, BookOpen, ClipboardCheck,
  FileText, Grid3X3, List, Loader2, Pencil, Plus, Presentation,
  RefreshCw, School, SearchX, X,
} from 'lucide-react';
import lessonDraftApi from '../../../services/lessonDraftApi';
import testApi from '../../../services/testApi';
import { getClassroomPosts, getMyJoinedClassrooms } from '../../../services/classroomApi';
import { useAuthStore } from '../../../stores/authStore';
import CreateLessonModal from '../../LessonsPage/CreateLessonModal';

const CONTENT_TYPES = [
  ['all', 'Loại bất kỳ'],
  ['LESSON', 'Bài giảng'],
  ['EXAM', 'Bài kiểm tra'],
  ['EXERCISE', 'Bài tập'],
];
const CONTENT_TYPE_NAME = Object.fromEntries(CONTENT_TYPES);
const LESSON_TYPE_NAME = {
  DOCX: 'Tài liệu', PPTX: 'Bài thuyết trình',
  COLLABORA_DOCX: 'Tài liệu', COLLABORA_PPTX: 'Bài thuyết trình',
};
const COLORS = {
  Toán: 'from-rose-500 to-amber-300',
  'Tiếng Việt': 'from-sky-500 to-teal-300',
  'Tiếng Anh': 'from-violet-600 to-pink-400',
  'Khoa học': 'from-indigo-600 to-cyan-400',
};

const getName = (user) => user?.username || user?.fullName || user?.name || user?.email || 'Bạn';
const getOwnerKey = (item, fallback) => `owner:${item.ownerEmail || item.ownerName || item.authorId || fallback}`;
const normalizeText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLocaleLowerCase('vi')
  .trim();

function timeAgo(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} giờ trước`;
  if (minutes < 10080) return `${Math.floor(minutes / 1440)} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

function Preview({ item, compact = false }) {
  if (item.kind === 'EXAM' || item.kind === 'EXERCISE') {
    const exercise = item.kind === 'EXERCISE';
    const Icon = exercise ? Pencil : ClipboardCheck;
    const color = exercise ? 'from-blue-600 to-violet-500' : 'from-orange-500 to-rose-500';
    return (
      <div className={`relative h-full overflow-hidden bg-gradient-to-br ${color} text-white ${compact ? 'grid place-items-center p-2' : 'p-4'}`}>
        <i className="absolute -right-7 -top-8 h-24 w-24 rounded-full bg-white/15" />
        <Icon className={compact ? 'relative h-6 w-6' : 'relative mb-3 h-6 w-6'} />
        {!compact && (
          <>
            <p className="relative line-clamp-3 text-sm font-extrabold">{item.title}</p>
            <small className="absolute bottom-3 left-4 right-4 truncate">
              {exercise ? 'Bài tập' : 'Bài kiểm tra'}{item.questionCount ? ` · ${item.questionCount} câu` : ''}
            </small>
          </>
        )}
      </div>
    );
  }

  const pptx = item.type === 'PPTX' || item.type === 'COLLABORA_PPTX';
  const color = COLORS[item.subject] || 'from-slate-600 to-violet-400';
  if (pptx) {
    return (
      <div className={`relative h-full overflow-hidden bg-gradient-to-br ${color} text-white ${compact ? 'grid place-items-center p-2' : 'p-4'}`}>
        <i className="absolute -right-7 -top-8 h-24 w-24 rounded-full bg-white/15" />
        <Presentation className={compact ? 'relative h-6 w-6' : 'relative mb-3 h-6 w-6'} />
        {!compact && (
          <>
            <p className="relative line-clamp-3 text-sm font-extrabold">{item.title}</p>
            <small className="absolute bottom-3 left-4 right-4 truncate">
              {[item.subject, item.grade].filter(Boolean).join(' · ')}
            </small>
          </>
        )}
      </div>
    );
  }

  if (compact) {
    return <div className="grid h-full place-items-center bg-slate-100"><FileText className="h-6 w-6 text-slate-500" /></div>;
  }

  return (
    <div className="flex h-full items-center justify-center bg-slate-100 p-4">
      <div className="relative h-full w-[72%] border border-slate-200 bg-white p-3 shadow-sm">
        <i className={`mb-3 block h-2 w-2/3 rounded bg-gradient-to-r ${color}`} />
        <p className="line-clamp-3 text-[10px] font-bold text-slate-700">{item.title}</p>
        <div className="mt-3 space-y-1.5">
          <i className="block h-1 bg-slate-200" />
          <i className="block h-1 w-5/6 bg-slate-200" />
          <i className="block h-1 w-3/4 bg-slate-200" />
        </div>
        <FileText className="absolute bottom-3 right-3 h-4 w-4 text-slate-300" />
      </div>
    </div>
  );
}

function CreateContentModal({ onClose, onCreateLesson, onCreateTest, onCreateExercise }) {
  const choices = [
    { title: 'Bài giảng', description: 'Soạn tài liệu hoặc bài trình chiếu', icon: <BookOpen className="h-5 w-5" />, color: 'from-violet-600 to-indigo-500', action: onCreateLesson },
    { title: 'Bài kiểm tra', description: 'Tạo đề kiểm tra trực tuyến', icon: <ClipboardCheck className="h-5 w-5" />, color: 'from-orange-500 to-rose-500', action: onCreateTest },
    { title: 'Bài tập', description: 'Tạo bài luyện tập cho học sinh', icon: <Pencil className="h-5 w-5" />, color: 'from-blue-600 to-cyan-500', action: onCreateExercise },
  ];

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div><h3 className="text-xl font-bold text-slate-900">Tạo nội dung mới</h3><p className="mt-1 text-sm text-slate-500">Bạn muốn bắt đầu với nội dung nào?</p></div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Đóng"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {choices.map(({ title, description, icon, color, action }) => (
            <button key={title} type="button" onClick={action} className="group rounded-2xl border border-slate-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg">
              <span className={`mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${color} text-white shadow-sm`}>{icon}</span>
              <strong className="block text-sm text-slate-900 group-hover:text-violet-700">{title}</strong>
              <span className="mt-1 block text-xs leading-relaxed text-slate-500">{description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
function lessonFromOwner(draft, userName) {
  return { ...draft, key: `lesson-own-${draft.id}`, kind: 'LESSON', source: 'OWNED', ownerKey: 'me', ownerName: userName };
}
function lessonFromDirectShare(draft) {
  return { ...draft, key: `lesson-direct-${draft.id}`, kind: 'LESSON', source: 'DIRECT', ownerKey: getOwnerKey(draft, draft.id), ownerName: draft.ownerName || draft.ownerEmail || 'Giáo viên' };
}
function lessonFromClass(draft, classroom) {
  return { ...draft, key: `lesson-class-${classroom.id}-${draft.id}`, kind: 'LESSON', source: 'CLASSROOM', classroomId: classroom.id, classroomName: classroom.name, ownerKey: getOwnerKey(draft, classroom.teacherId), ownerName: draft.ownerName || draft.ownerEmail || classroom.teacherName || 'Giáo viên' };
}
function testFromOwner(test, userName) {
  const kind = test.testType === 'EXERCISE' ? 'EXERCISE' : 'EXAM';
  return { ...test, key: `test-own-${test.id}`, kind, source: 'OWNED_TEST', title: test.name || CONTENT_TYPE_NAME[kind], ownerKey: 'me', ownerName: userName };
}
function postFromClass(post, classroom) {
  const kind = post.postType === 'ASSIGNMENT' ? 'EXERCISE' : 'EXAM';
  return { ...post, key: `post-${classroom.id}-${post.id}`, kind, source: 'CLASSROOM_POST', title: post.title || post.referenceTestName || CONTENT_TYPE_NAME[kind], classroomId: classroom.id, classroomName: classroom.name, ownerKey: getOwnerKey(post, classroom.teacherId), ownerName: post.authorName || classroom.teacherName || 'Giáo viên' };
}

export default function RecentItems({
  compact = false,
  hideCreate = false,
  defaultViewMode = 'grid',
  filters,
  onFilterOptionsChange,
  onResetFilters,
}) {
  const navigate = useNavigate();
  const roleId = useAuthStore((state) => state.roleId);
  const user = useAuthStore((state) => state.user);
  const student = roleId === 1;
  const userName = getName(user);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState(defaultViewMode);
  const [direction, setDirection] = useState('desc');
  const [showCreateChoices, setShowCreateChoices] = useState(false);
  const [showLessonCreator, setShowLessonCreator] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (student) {
        const classrooms = await getMyJoinedClassrooms();
        const results = await Promise.allSettled((Array.isArray(classrooms) ? classrooms : []).map(async (classroom) => {
          const [lessonsResult, postsResult] = await Promise.allSettled([
            lessonDraftApi.getLessonsSharedToClassroom(classroom.id),
            getClassroomPosts(classroom.id, 30),
          ]);
          const lessons = lessonsResult.status === 'fulfilled' && Array.isArray(lessonsResult.value)
            ? lessonsResult.value.map((draft) => lessonFromClass(draft, classroom)) : [];
          const posts = postsResult.status === 'fulfilled' && Array.isArray(postsResult.value)
            ? postsResult.value.filter((post) => post.postType === 'TEST' || post.postType === 'ASSIGNMENT').map((post) => postFromClass(post, classroom)) : [];
          return { items: [...lessons, ...posts], partial: lessonsResult.status === 'rejected' || postsResult.status === 'rejected' };
        }));
        setItems(results.flatMap((result) => result.status === 'fulfilled' ? result.value.items : []));
        if (results.some((result) => result.status === 'rejected' || result.value.partial)) setError('Một số nội dung lớp học chưa tải được. Các mục còn lại vẫn được hiển thị.');
      } else {
        const [mine, shared, tests] = await Promise.allSettled([
          lessonDraftApi.getDrafts(), lessonDraftApi.getSharedWithMe(), testApi.getAllTests(),
        ]);
        setItems([
          ...(mine.status === 'fulfilled' && Array.isArray(mine.value) ? mine.value.map((draft) => lessonFromOwner(draft, userName)) : []),
          ...(shared.status === 'fulfilled' && Array.isArray(shared.value) ? shared.value.map(lessonFromDirectShare) : []),
          ...(tests.status === 'fulfilled' && Array.isArray(tests.value) ? tests.value.map((test) => testFromOwner(test, userName)) : []),
        ]);
        if ([mine, shared, tests].some((result) => result.status === 'rejected')) setError('Một phần dữ liệu chưa tải được. Vui lòng thử lại.');
      }
    } catch (loadError) {
      console.error('Failed to load recent items:', loadError);
      setItems([]);
      setError('Không thể tải nội dung gần đây.');
    } finally {
      setLoading(false);
    }
  }, [student, userName]);

  useEffect(() => { load(); }, [load]);
  const owners = useMemo(() => {
    const unique = new Map();
    items.filter((item) => !item.source.startsWith('OWNED')).forEach((item) => unique.set(item.ownerKey, { value: item.ownerKey, label: item.ownerName }));
    return [
      { value: 'shared', label: 'Đã chia sẻ với bạn' },
      ...(!student ? [{ value: 'me', label: `${userName} (Bạn)` }] : []),
      ...unique.values(),
    ];
  }, [items, student, userName]);

  const subjects = useMemo(() => [...new Set(items.map((item) => item.subject).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'vi'))
    .map((value) => ({ value, label: value })), [items]);
  const grades = useMemo(() => [...new Set(items.map((item) => item.grade || item.className).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), 'vi', { numeric: true }))
    .map((value) => ({ value, label: String(value).startsWith('Lớp') ? value : `Lớp ${value}` })), [items]);

  useEffect(() => {
    onFilterOptionsChange({ owners, subjects, grades });
  }, [grades, onFilterOptionsChange, owners, subjects]);

  const visible = useMemo(() => {
    const terms = normalizeText(filters.query).split(/\s+/).filter(Boolean);
    const cutoff = filters.date === 'all' ? null : Date.now() - Number(filters.date) * 86400000;

    return items
      .filter((item) => filters.owner === 'all' || (filters.owner === 'shared' ? !item.source.startsWith('OWNED') : item.ownerKey === filters.owner))
      .filter((item) => filters.type === 'all' || item.kind === filters.type)
      .filter((item) => filters.subject === 'all' || item.subject === filters.subject)
      .filter((item) => filters.grade === 'all' || (item.grade || item.className) === filters.grade)
      .filter((item) => {
        if (!cutoff) return true;
        const modified = new Date(item.updatedAt || item.createdAt || 0).getTime();
        return Number.isFinite(modified) && modified >= cutoff;
      })
      .filter((item) => {
        if (!terms.length) return true;
        const searchable = normalizeText([
          item.title, item.name, item.description, item.subject, item.grade, item.className,
          item.ownerName, item.ownerEmail, item.classroomName, item.referenceTestName,
          CONTENT_TYPE_NAME[item.kind], LESSON_TYPE_NAME[item.type],
        ].filter(Boolean).join(' '));
        return terms.every((term) => searchable.includes(term));
      })
      .sort((a, b) => {
      const first = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const second = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return direction === 'desc' ? second - first : first - second;
      });
  }, [direction, filters, items]);

  const isFiltering = filters.query.trim() || Object.entries(filters).some(([key, value]) => key !== 'query' && value !== 'all');
  const itemTypeLabel = (item) => item.kind === 'LESSON' ? `Bài giảng · ${LESSON_TYPE_NAME[item.type] || 'Tài liệu'}` : CONTENT_TYPE_NAME[item.kind];

  const openItem = (item) => {
    if (item.source === 'OWNED_TEST') {
      navigate(`/tests/${item.id}/edit`);
      return;
    }
    if (item.source === 'CLASSROOM_POST') {
      navigate(`/classrooms/${item.classroomId}?tab=${item.kind === 'EXERCISE' ? 'assignments' : 'tests'}&postId=${item.id}`);
      return;
    }
    const collabora = item.type === 'COLLABORA_DOCX' || item.type === 'COLLABORA_PPTX';
    const pptx = item.type === 'PPTX' || item.type === 'COLLABORA_PPTX';
    const path = collabora ? '/lessons/collabora-editor' : pptx ? '/lessons/pptx-editor' : '/lessons/docx-editor';
    const params = new URLSearchParams({ draftId: String(item.id) });
    if (item.source === 'CLASSROOM') { params.set('classroomId', String(item.classroomId)); params.set('mode', student ? 'view' : 'edit'); }
    if (item.source === 'DIRECT') params.set('mode', item.permission === 'COPY' ? 'copy' : 'view');
    navigate(`${path}?${params.toString()}`);
  };

  return (
    <section className={`px-6 ${compact ? 'pb-32 pt-4' : 'pb-16 pt-4'}`}>
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{isFiltering ? 'Kết quả tìm kiếm' : 'Gần đây'}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {isFiltering
                ? `${visible.length} nội dung phù hợp${filters.query.trim() ? ` với “${filters.query.trim()}”` : ''}`
                : student ? 'Bài giảng, bài tập và bài kiểm tra mới nhất trong lớp' : 'Tiếp tục nội dung bạn đang xây dựng'}
            </p>
          </div>
          <div className="relative flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setDirection((value) => value === 'desc' ? 'asc' : 'desc')} title={direction === 'desc' ? 'Mới nhất trước' : 'Cũ nhất trước'} className="grid h-11 w-11 place-items-center rounded-full hover:bg-slate-100"><ArrowDownUp className={`h-5 w-5 ${direction === 'asc' ? 'rotate-180' : ''}`} /></button>
            <button type="button" onClick={() => setView((value) => value === 'grid' ? 'list' : 'grid')} title="Đổi kiểu hiển thị" className="grid h-11 w-11 place-items-center rounded-full hover:bg-slate-100">{view === 'grid' ? <List className="h-5 w-5" /> : <Grid3X3 className="h-5 w-5" />}</button>
            {!hideCreate && (
              <button type="button" onClick={() => setShowCreateChoices(true)} title="Tạo nội dung mới" className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white hover:border-violet-400 hover:text-violet-700">
                <Plus className="h-5 w-5" />
              </button>
            )}
          </div>
        </header>

        {error && <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><AlertCircle className="h-4 w-4" /><span className="flex-1">{error}</span><button type="button" onClick={load} className="flex items-center gap-1 font-semibold"><RefreshCw className="h-4 w-4" />Thử lại</button></div>}

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500"><Loader2 className="h-8 w-8 animate-spin text-violet-500" />Đang tải nội dung gần đây...</div>
        ) : visible.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-violet-200 bg-gradient-to-b from-violet-50/70 to-white px-6 text-center">
            {isFiltering ? <SearchX className="mb-4 h-12 w-12 text-violet-500" /> : <School className="mb-4 h-12 w-12 text-violet-500" />}
            <b className="text-lg text-slate-900">{isFiltering ? 'Không tìm thấy nội dung phù hợp' : 'Chưa có nội dung gần đây'}</b>
            <p className="mt-2 max-w-lg text-sm text-slate-500">
              {isFiltering
                ? 'Hãy kiểm tra từ khóa, thử tìm không dấu hoặc xóa bớt bộ lọc.'
                : student ? 'Nội dung giáo viên giao trong lớp sẽ xuất hiện tại đây.' : 'Bài giảng, bài tập và bài kiểm tra bạn tạo sẽ xuất hiện tại đây.'}
            </p>
            {isFiltering && <button type="button" onClick={onResetFilters} className="mt-5 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700">Xóa tìm kiếm và bộ lọc</button>}
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {!hideCreate && !isFiltering && <button type="button" onClick={() => setShowCreateChoices(true)} className="self-start text-left"><div className="flex aspect-[4/3] items-center justify-center rounded-2xl border-2 border-dashed bg-slate-50 hover:border-violet-400"><span className="flex flex-col items-center gap-2 text-sm font-semibold text-slate-500"><Plus />Tạo mới</span></div></button>}
            {visible.map((item) => <button key={item.key} type="button" onClick={() => openItem(item)} className="group min-w-0 text-left"><div className="aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-slate-200 group-hover:shadow-lg group-hover:ring-violet-300"><Preview item={item} /></div><h3 className="mt-3 truncate text-sm font-semibold group-hover:text-violet-700">{item.title || 'Nội dung không tên'}</h3><p className="mt-1 flex gap-1.5 text-xs text-slate-500"><span className={`mt-1 h-2 w-2 rounded-full ${item.source.startsWith('OWNED') ? 'bg-violet-500' : 'bg-emerald-500'}`} /><span className="truncate">{itemTypeLabel(item)}</span> · <span className="shrink-0">{timeAgo(item.updatedAt || item.createdAt)}</span></p><p className="mt-1 truncate text-[11px] text-slate-400">{item.source.startsWith('OWNED') ? 'Của bạn' : `${item.ownerName}${item.classroomName ? ` · ${item.classroomName}` : ''}`}</p></button>)}
          </div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full min-w-[760px]"><thead><tr className="border-b text-left text-sm"><th className="p-3">Tên</th><th>Người sở hữu</th><th>Loại</th><th>Đã sửa</th></tr></thead><tbody>{visible.map((item) => <tr key={item.key} onClick={() => openItem(item)} className="cursor-pointer border-b hover:bg-violet-50"><td className="p-3"><div className="flex items-center gap-3"><div className="h-14 w-16 overflow-hidden rounded"><Preview item={item} compact /></div><b className="max-w-sm truncate text-sm">{item.title}</b></div></td><td>{item.source.startsWith('OWNED') ? `${item.ownerName} (Bạn)` : item.ownerName}</td><td>{itemTypeLabel(item)}</td><td>{timeAgo(item.updatedAt || item.createdAt)}</td></tr>)}</tbody></table></div>
        )}
      </div>
      {showCreateChoices && (
        <CreateContentModal
          onClose={() => setShowCreateChoices(false)}
          onCreateLesson={() => { setShowCreateChoices(false); setShowLessonCreator(true); }}
          onCreateTest={() => navigate('/tests/create?type=EXAM')}
          onCreateExercise={() => navigate('/tests/create?type=EXERCISE')}
        />
      )}
      {showLessonCreator && <CreateLessonModal onClose={() => setShowLessonCreator(false)} />}
    </section>
  );
}
