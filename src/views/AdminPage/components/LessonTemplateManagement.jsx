import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  FileText,
  Loader2,
  Plus,
  Presentation,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { SUBJECTS, GRADES } from '../../../data/editorSharedConstants';
import lessonTemplateApi from '../../../services/lessonTemplateApi';
import { confirmToast } from '../../../utils/toastNotifications.js';

const STATUS_LABELS = {
  ACTIVE: 'Đang hiển thị',
  INACTIVE: 'Đã ẩn',
};

const TEMPLATE_TYPES = [
  { value: 'COLLABORA_DOCX', label: 'DOCX Collabora' },
  { value: 'COLLABORA_PPTX', label: 'PPTX Collabora' },
];

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả định dạng' },
  ...TEMPLATE_TYPES,
];

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Hiển thị' },
  { value: 'INACTIVE', label: 'Đã ẩn' },
];

const PAGE_SIZE = 5;

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('vi-VN');
};

const getTypeInfo = (type) => {
  const isPptx = type === 'COLLABORA_PPTX';
  return {
    label: isPptx ? 'PPTX' : 'DOCX',
    icon: isPptx ? Presentation : FileText,
    className: isPptx ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700',
  };
};

const getSortValue = (template, key) => {
  switch (key) {
    case 'title':
      return template.title || '';
    case 'subjectGrade':
      return `${template.subject || ''} ${template.grade || ''}`;
    case 'type':
      return template.type || '';
    case 'status':
      return template.status || '';
    case 'updatedAt':
      return new Date(template.updatedAt || 0).getTime();
    default:
      return '';
  }
};

export default function LessonTemplateManagement() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    grade: '',
    status: 'ACTIVE',
    file: null,
  });
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    subject: '',
    grade: '',
    type: 'COLLABORA_DOCX',
    status: 'ACTIVE',
  });
  const hasActiveFilters = Boolean(filterSubject || filterGrade || filterType || filterStatus);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await lessonTemplateApi.getAdminTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load lesson templates:', err);
      setError('Không thể tải danh sách mẫu bài giảng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return templates.filter((item) => {
      const matchesKeyword = !keyword || [
        item.title,
        item.description,
        item.subject,
        item.grade,
        item.fileName,
      ].some((value) => String(value || '').toLowerCase().includes(keyword));
      return (
        matchesKeyword &&
        (!filterSubject || item.subject === filterSubject) &&
        (!filterGrade || item.grade === filterGrade) &&
        (!filterType || item.type === filterType) &&
        (!filterStatus || item.status === filterStatus)
      );
    });
  }, [filterGrade, filterStatus, filterSubject, filterType, query, templates]);

  const sortedTemplates = useMemo(() => {
    return [...filteredTemplates].sort((a, b) => {
      const aValue = getSortValue(a, sortConfig.key);
      const bValue = getSortValue(b, sortConfig.key);
      const result = typeof aValue === 'number' && typeof bValue === 'number'
        ? aValue - bValue
        : String(aValue).localeCompare(String(bValue), 'vi', { numeric: true, sensitivity: 'base' });
      return sortConfig.direction === 'asc' ? result : -result;
    });
  }, [filteredTemplates, sortConfig]);

  const pageCount = Math.max(1, Math.ceil(filteredTemplates.length / PAGE_SIZE));
  const pageStartIndex = (currentPage - 1) * PAGE_SIZE;
  const pageEndIndex = Math.min(pageStartIndex + PAGE_SIZE, filteredTemplates.length);
  const pagedTemplates = sortedTemplates.slice(pageStartIndex, pageEndIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterGrade, filterStatus, filterSubject, filterType, query, sortConfig]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateEditForm = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="h-3.5 w-3.5 text-gray-300" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5 text-violet-500" />
      : <ArrowDown className="h-3.5 w-3.5 text-violet-500" />;
  };

  const sortableHeaderClass = 'inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-gray-500 hover:text-violet-600';

  const openEditModal = (template) => {
    setEditingTemplate(template);
    setEditForm({
      title: template.title || '',
      description: template.description || '',
      subject: template.subject || '',
      grade: template.grade || '',
      type: template.type || 'COLLABORA_DOCX',
      status: template.status || 'ACTIVE',
    });
  };

  const closeEditModal = () => {
    if (updating) return;
    setEditingTemplate(null);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'docx' && extension !== 'pptx') {
      window.showAlertToast('Chỉ hỗ trợ file .docx hoặc .pptx');
      event.target.value = '';
      return;
    }
    setForm((prev) => ({
      ...prev,
      file,
      title: prev.title || file.name.replace(/\.(docx|pptx)$/i, ''),
    }));
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      subject: '',
      grade: '',
      status: 'ACTIVE',
      file: null,
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!form.file || !form.title.trim() || !form.subject || !form.grade) {
      window.showAlertToast('Vui lòng chọn file và nhập đầy đủ tên mẫu, môn học, lớp.');
      return;
    }

    try {
      setSaving(true);
      const created = await lessonTemplateApi.uploadAdminTemplate({
        file: form.file,
        title: form.title.trim(),
        description: form.description.trim(),
        subject: form.subject,
        grade: form.grade,
        status: form.status,
      });
      setTemplates((prev) => [created, ...prev]);
      resetForm();
    } catch (err) {
      console.error('Failed to upload lesson template:', err);
      window.showAlertToast('Không thể tải mẫu lên: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTemplate = async (event) => {
    event.preventDefault();
    if (!editingTemplate) return;
    if (!editForm.title.trim() || !editForm.subject || !editForm.grade || !editForm.type || !editForm.status) {
      window.showAlertToast('Vui lòng nhập đầy đủ tên mẫu, môn học, lớp, định dạng và trạng thái.');
      return;
    }

    try {
      setUpdating(true);
      const updated = await lessonTemplateApi.updateAdminTemplate(editingTemplate.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        subject: editForm.subject,
        grade: editForm.grade,
        type: editForm.type,
        status: editForm.status,
      });
      setTemplates((prev) => prev.map((item) => item.id === editingTemplate.id ? updated : item));
      setEditingTemplate(null);
    } catch (err) {
      console.error('Failed to update template:', err);
      window.showAlertToast('Không thể cập nhật mẫu: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (templateId) => {
    if (!(await confirmToast('Bạn có chắc chắn muốn xóa mẫu bài giảng này?', { title: 'Xóa mẫu bài giảng', confirmLabel: 'Xóa' }))) return;
    try {
      await lessonTemplateApi.deleteAdminTemplate(templateId);
      setTemplates((prev) => prev.filter((item) => item.id !== templateId));
      window.showAlertToast('Đã xóa mẫu bài giảng thành công.');
    } catch (err) {
      console.error('Failed to delete template:', err);
      window.showAlertToast('Không thể xóa mẫu: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mẫu bài giảng</h2>
          <p className="text-gray-600 mt-1">Quản lý kho mẫu bài giảng để giáo viên tạo bài giảng nhanh</p>
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm mẫu bài giảng..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          />
        </div>
      </div>

      <form onSubmit={handleUpload} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Thêm mẫu mới</h3>
            <p className="text-xs text-gray-500">Upload file .docx hoặc .pptx để tạo mẫu bài giảng</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <input
            value={form.title}
            onChange={(event) => updateForm('title', event.target.value)}
            placeholder="Tên mẫu bài giảng"
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 xl:col-span-2"
          />
          <select
            value={form.subject}
            onChange={(event) => updateForm('subject', event.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          >
            <option value="">Chọn môn học</option>
            {SUBJECTS.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
          </select>
          <select
            value={form.grade}
            onChange={(event) => updateForm('grade', event.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          >
            <option value="">Chọn lớp</option>
            {GRADES.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
          </select>
          <select
            value={form.status}
            onChange={(event) => updateForm('status', event.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          >
            <option value="ACTIVE">Hiển thị</option>
            <option value="INACTIVE">Ẩn tạm thời</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 mt-3">
          <textarea
            value={form.description}
            onChange={(event) => updateForm('description', event.target.value)}
            placeholder="Mô tả ngắn về mẫu bài giảng"
            rows={1}
            className="h-10 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 resize-none overflow-y-auto"
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 px-4 rounded-lg border border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {form.file ? form.file.name : 'Chọn file'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Lưu mẫu
            </button>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept=".docx,.pptx" onChange={handleFileChange} className="hidden" />
      </form>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            Tổng cộng {filteredTemplates.length} mẫu
          </span>
          <button
            type="button"
            onClick={fetchTemplates}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-violet-600 hover:bg-violet-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tải lại
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 border-b border-gray-100 px-4 py-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <select
            value={filterSubject}
            onChange={(event) => setFilterSubject(event.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
          >
            <option value="">Tất cả môn học</option>
            {SUBJECTS.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
          </select>
          <select
            value={filterGrade}
            onChange={(event) => setFilterGrade(event.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
          >
            <option value="">Tất cả lớp</option>
            {GRADES.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
          </select>
          <select
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
          >
            {TYPE_FILTER_OPTIONS.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
          >
            {STATUS_FILTER_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setFilterSubject('');
                setFilterGrade('');
                setFilterType('');
                setFilterStatus('');
              }}
              className="h-9 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {loading && (
          <div className="min-h-[260px] flex items-center justify-center gap-3 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
            Đang tải mẫu bài giảng...
          </div>
        )}

        {!loading && error && (
          <div className="min-h-[260px] flex flex-col items-center justify-center gap-3 text-gray-500">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
            <p>{error}</p>
            <button onClick={fetchTemplates} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold">
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && filteredTemplates.length === 0 && (
          <div className="min-h-[260px] flex flex-col items-center justify-center text-gray-400">
            <FileText className="w-10 h-10 mb-3 text-gray-300" />
            <p className="text-sm">Chưa có mẫu bài giảng nào</p>
          </div>
        )}

        {!loading && !error && filteredTemplates.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button type="button" onClick={() => handleSort('title')} className={sortableHeaderClass}>
                      Mẫu <SortIcon column="title" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button type="button" onClick={() => handleSort('subjectGrade')} className={sortableHeaderClass}>
                      Môn / Lớp <SortIcon column="subjectGrade" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button type="button" onClick={() => handleSort('type')} className={sortableHeaderClass}>
                      Định dạng <SortIcon column="type" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button type="button" onClick={() => handleSort('status')} className={sortableHeaderClass}>
                      Trạng thái <SortIcon column="status" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button type="button" onClick={() => handleSort('updatedAt')} className={sortableHeaderClass}>
                      Cập nhật <SortIcon column="updatedAt" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedTemplates.map((template) => {
                  const typeInfo = getTypeInfo(template.type);
                  const TypeIcon = typeInfo.icon;
                  return (
                    <tr key={template.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm text-gray-800">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate max-w-[260px]">{template.title}</p>
                            <p className="text-xs text-gray-400 truncate max-w-[320px]">{template.description || template.fileName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{template.subject} / {template.grade}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-900">
                          <TypeIcon className="w-3.5 h-3.5 text-gray-500" />
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold ${
                            template.status === 'ACTIVE'
                              ? 'text-emerald-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {STATUS_LABELS[template.status] || template.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(template.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/lessons/collabora-editor?templateId=${template.id}&mode=edit`)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50"
                            title="Mở mẫu trong Collabora"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(template)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                            title="Sửa thông tin mẫu"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(template.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                            title="Xóa mẫu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-gray-500">
                Hiển thị {pageStartIndex + 1}–{pageEndIndex} trong {filteredTemplates.length} mẫu
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 rounded-lg text-sm font-medium transition-all ${
                      page === currentPage
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                  disabled={currentPage === pageCount}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Trang sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4">
          <form onSubmit={handleUpdateTemplate} className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Chỉnh sửa mẫu bài giảng</h3>
                <p className="mt-0.5 text-xs text-gray-500">{editingTemplate.fileName || editingTemplate.title}</p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">Tên mẫu</span>
                <input
                  value={editForm.title}
                  onChange={(event) => updateEditForm('title', event.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">Mô tả</span>
                <textarea
                  value={editForm.description}
                  onChange={(event) => updateEditForm('description', event.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">Môn học</span>
                  <select
                    value={editForm.subject}
                    onChange={(event) => updateEditForm('subject', event.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="">Chọn môn học</option>
                    {SUBJECTS.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">Lớp</span>
                  <select
                    value={editForm.grade}
                    onChange={(event) => updateEditForm('grade', event.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="">Chọn lớp</option>
                    {GRADES.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">Định dạng</span>
                  <select
                    value={editForm.type}
                    onChange={(event) => updateEditForm('type', event.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  >
                    {TEMPLATE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">Trạng thái</span>
                  <select
                    value={editForm.status}
                    onChange={(event) => updateEditForm('status', event.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="ACTIVE">Hiển thị</option>
                    <option value="INACTIVE">Ẩn tạm thời</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
              <button
                type="button"
                onClick={closeEditModal}
                className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={updating}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
              >
                {updating && <Loader2 className="h-4 w-4 animate-spin" />}
                Cập nhật
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
