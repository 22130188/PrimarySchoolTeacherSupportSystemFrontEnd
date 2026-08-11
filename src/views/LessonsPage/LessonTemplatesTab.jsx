import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe2,
  Loader2,
  PanelsTopLeft,
  Presentation,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { SUBJECTS, GRADES } from '../../data/editorSharedConstants';
import lessonTemplateApi from '../../services/lessonTemplateApi';
import PublicTeacherLessonsSection from './PublicTeacherLessonsSection';

const TYPE_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'COLLABORA_DOCX', label: 'DOCX' },
  { value: 'COLLABORA_PPTX', label: 'PPTX' },
];

const CATALOG_TABS = [
  {
    key: 'system',
    label: 'Mẫu hệ thống',
    icon: PanelsTopLeft,
    active: 'bg-violet-600 text-white shadow-sm',
    idle: 'text-gray-500 hover:bg-white hover:text-violet-600',
  },
  {
    key: 'public',
    label: 'Công khai của GV',
    icon: Globe2,
    active: 'bg-sky-600 text-white shadow-sm',
    idle: 'text-gray-500 hover:bg-white hover:text-sky-600',
  },
];

const getTypeMeta = (type) => {
  const isPptx = type === 'COLLABORA_PPTX';
  return {
    label: isPptx ? 'PPTX' : 'DOCX',
    icon: isPptx ? Presentation : FileText,
    badge: isPptx ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700',
    cover: isPptx ? 'from-orange-400 to-amber-500' : 'from-blue-500 to-sky-500',
  };
};

export default function LessonTemplatesTab() {
  const navigate = useNavigate();
  const [catalogTab, setCatalogTab] = useState('system');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usingId, setUsingId] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [type, setType] = useState('');

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await lessonTemplateApi.getTemplates({
        subject: subject || undefined,
        grade: grade || undefined,
        type: type || undefined,
      });
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load lesson templates:', err);
      setError('Không thể tải kho mẫu bài giảng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (catalogTab !== 'system') return;
    fetchTemplates();
  }, [subject, grade, type, catalogTab]);

  const visibleTemplates = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return templates;
    return templates.filter((template) => [
      template.title,
      template.description,
      template.subject,
      template.grade,
    ].some((value) => String(value || '').toLowerCase().includes(normalized)));
  }, [templates, keyword]);

  const ITEMS_PER_PAGE = 6;
  const [templatePage, setTemplatePage] = useState(1);
  const templateTotalPages = Math.max(1, Math.ceil(visibleTemplates.length / ITEMS_PER_PAGE));
  const paginatedTemplates = useMemo(() => {
    const start = (templatePage - 1) * ITEMS_PER_PAGE;
    return visibleTemplates.slice(start, start + ITEMS_PER_PAGE);
  }, [visibleTemplates, templatePage]);

  useEffect(() => {
    setTemplatePage(1);
  }, [keyword, subject, grade, type]);

  const handleUseTemplate = async (templateId) => {
    try {
      setUsingId(templateId);
      const draft = await lessonTemplateApi.useTemplate(templateId);
      navigate(`/lessons/collabora-editor?draftId=${draft.id}`);
    } catch (err) {
      console.error('Failed to use lesson template:', err);
      window.showAlertToast('Không thể tạo bài giảng từ mẫu: ' + (err.response?.data?.message || err.message));
    } finally {
      setUsingId(null);
    }
  };

  const handlePreviewTemplate = (templateId) => {
    navigate(`/lessons/collabora-editor?templateId=${templateId}&mode=template`);
  };

  return (
    <div className="space-y-5">
      {/* Single-row switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm w-full sm:w-auto">
          {CATALOG_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = catalogTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCatalogTab(tab.key)}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  active ? tab.active : tab.idle
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {catalogTab === 'public' && <PublicTeacherLessonsSection hideIntro />}

      {catalogTab === 'system' && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Tìm mẫu bài giảng hệ thống..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <button
                type="button"
                onClick={fetchTemplates}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50"
              >
                <RefreshCw className="w-4 h-4" />
                Tải lại
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
              >
                <option value="">Tất cả môn học</option>
                {SUBJECTS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
                className="h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
              >
                <option value="">Tất cả lớp</option>
                {GRADES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-200 p-1">
                {TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={`flex-1 h-8 rounded-md text-xs font-semibold transition-all ${
                      type === option.value
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-gray-500 hover:bg-white hover:text-violet-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
              <p className="text-sm text-gray-400">Đang tải kho mẫu bài giảng...</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertTriangle className="w-9 h-9 text-amber-400 mb-3" />
              <p className="text-sm text-gray-500 mb-4">{error}</p>
              <button
                type="button"
                onClick={fetchTemplates}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold"
              >
                <RefreshCw className="w-4 h-4" />
                Thử lại
              </button>
            </div>
          )}

          {!loading && !error && visibleTemplates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center mb-4">
                <Sparkles className="w-9 h-9 text-violet-300" />
              </div>
              <h3 className="text-base font-bold text-gray-700 mb-1">Chưa có mẫu phù hợp</h3>
              <p className="text-sm text-gray-400">Thử đổi bộ lọc hoặc liên hệ admin để thêm mẫu mới</p>
            </div>
          )}

          {!loading && !error && visibleTemplates.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedTemplates.map((template) => {
                  const meta = getTypeMeta(template.type);
                  const Icon = meta.icon;
                  return (
                    <div
                      key={template.id}
                      className="relative text-left group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    >
                      <button
                        type="button"
                        onClick={() => handlePreviewTemplate(template.id)}
                        className="w-full text-left cursor-pointer"
                        title="Xem mẫu"
                      >
                        <div className="h-22 bg-white border-b border-gray-100 flex items-center justify-center relative">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.cover} flex items-center justify-center shadow-sm`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold ${meta.badge}`}>
                            {meta.label}
                          </span>
                          <span className="absolute bottom-2 left-3 text-[10px] font-semibold text-violet-500 uppercase tracking-wider">
                            Mẫu hệ thống
                          </span>
                        </div>
                        <div className="p-3">
                          <h3 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-violet-600 transition-colors truncate">{template.title}</h3>
                          <p className="text-xs text-gray-400 truncate">{template.subject} · {template.grade}</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleUseTemplate(template.id);
                        }}
                        disabled={usingId === template.id}
                        className="absolute bottom-2 right-2 inline-flex h-6 items-center gap-1 rounded-md bg-violet-600 px-2 text-[10px] font-semibold text-white shadow-sm transition-all hover:bg-violet-700 disabled:opacity-60"
                      >
                        {usingId === template.id && <Loader2 className="w-3 h-3 animate-spin" />}
                        Dùng mẫu
                      </button>
                    </div>
                  );
                })}
              </div>

              {visibleTemplates.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-center gap-1 pt-2">
                  <button
                    type="button"
                    onClick={() => setTemplatePage((p) => Math.max(1, p - 1))}
                    disabled={templatePage <= 1}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-500 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-100 transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  {Array.from({ length: templateTotalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setTemplatePage(page)}
                      className={`h-7 min-w-[28px] rounded-lg text-xs font-semibold transition-all ${
                        page === templatePage
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'border border-gray-100 bg-white text-gray-600 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTemplatePage((p) => Math.min(templateTotalPages, p + 1))}
                    disabled={templatePage >= templateTotalPages}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-500 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-100 transition-all"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
