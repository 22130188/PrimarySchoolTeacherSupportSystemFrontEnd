import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Presentation, Loader2, BookOpen, AlertTriangle, FileText, Eye, Copy, Plus, Trash2, Edit2 } from 'lucide-react';
import lessonDraftApi from '../../../services/lessonDraftApi';
import SelectLessonModal from './SelectLessonModal';

const formatDate = (value) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return date.toLocaleDateString('vi-VN');
};

const PERMISSION_STYLE = {
  VIEW: 'bg-indigo-50 text-indigo-600',
  COPY: 'bg-emerald-50 text-emerald-600',
};

const PERMISSION_LABELS = {
  VIEW: 'Chỉ xem',
  COPY: 'Tạo bản sao',
};

export default function ClassroomLessonsTab({ classroomId, isTeacher }) {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await lessonDraftApi.getLessonsSharedToClassroom(classroomId);
      setLessons(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không thể tải danh sách bài giảng');
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleLessonShared = () => {
    setIsSelectModalOpen(false);
    fetchLessons();
  };

  const handleRevokeShare = async (draftId, e) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn ngừng chia sẻ bài giảng này trong lớp?')) return;
    try {
      setRevokingId(draftId);
      await lessonDraftApi.revokeClassroomShare(draftId, classroomId);
      setLessons(prev => prev.filter(l => l.id !== draftId));
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Không thể xóa bài giảng');
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {isTeacher && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsSelectModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-5 h-5" />
            Chia sẻ bài giảng
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="py-8 px-6 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      ) : lessons.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-teal-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Chưa có bài giảng nào</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {isTeacher 
              ? 'Bạn chưa chia sẻ bài giảng nào vào lớp học này. Nhấn nút "Chia sẻ bài giảng" ở trên để bắt đầu.'
              : 'Giáo viên chưa chia sẻ bài giảng nào vào lớp học này.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map(lesson => (
            <div 
              key={lesson.id}
              className="relative text-left group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <button
                type="button"
                onClick={() => {
                  const editorPath = lesson.type === 'PPTX' ? '/lessons/pptx-editor' : '/lessons/docx-editor';
                  const mode = isTeacher ? 'edit' : (lesson.permission === 'COPY' ? 'copy' : 'view');
                  navigate(`${editorPath}?draftId=${lesson.id}&mode=${mode}&classroomId=${classroomId}`);
                }}
                className="w-full text-left cursor-pointer"
              >
                <div className="h-22 bg-white border-b border-gray-100 flex items-center justify-center relative py-6">
                  {lesson.type === 'PPTX' ? (
                    <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm">
                      <Presentation className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                  )}
                  {isTeacher ? (
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 bg-teal-100 text-teal-700">
                      <Edit2 className="w-3 h-3" />
                      Chỉnh sửa
                    </span>
                  ) : (
                    <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 ${PERMISSION_STYLE[lesson.permission] || PERMISSION_STYLE.VIEW}`}>
                      {lesson.permission === 'COPY' ? <Copy className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {PERMISSION_LABELS[lesson.permission] || PERMISSION_LABELS.VIEW}
                    </span>
                  )}
                  <span className="absolute bottom-2 left-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {lesson.type === 'PPTX' ? '.pptx' : '.docx'}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-violet-600 transition-colors truncate">{lesson.title}</h3>
                  <p className="text-xs text-gray-400 truncate">
                    {lesson.subject} {lesson.grade ? `· ${lesson.grade}` : ''} {lesson.updatedAt ? `· ${formatDate(lesson.updatedAt)}` : ''}
                  </p>
                  <p className="text-xs text-violet-500 mt-1 truncate">Chia sẻ bởi: {lesson.ownerEmail || lesson.ownerName}</p>
                </div>
              </button>
              
              {isTeacher && (
                <button
                  type="button"
                  onClick={(e) => handleRevokeShare(lesson.id, e)}
                  disabled={revokingId === lesson.id}
                  className="absolute top-2 left-2 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  title="Ngừng chia sẻ"
                >
                  {revokingId === lesson.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isSelectModalOpen && (
        <SelectLessonModal
          classroomId={classroomId}
          onClose={() => setIsSelectModalOpen(false)}
          onLessonShared={handleLessonShared}
        />
      )}
    </div>
  );
}
