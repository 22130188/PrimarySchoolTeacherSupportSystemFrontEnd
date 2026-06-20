import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Presentation, Loader2, BookOpen, AlertTriangle, FileText, Eye, Copy, Plus, Trash2, Edit2, ArrowRight } from 'lucide-react';
import lessonDraftApi from '../../../services/lessonDraftApi';
import SelectLessonModal from './SelectLessonModal';
import { useAuthStore } from '../../../stores/authStore';
import PostComments from './PostComments';

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

const getLessonTypeLabel = (type) => {
  if (type === 'COLLABORA_PPTX') return 'PPTX Collabora';
  if (type === 'COLLABORA_DOCX') return 'DOCX Collabora';
  if (type === 'PPTX') return 'Tệp PPTX';
  return 'Tệp DOCX';
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
};

export default function ClassroomLessonsTab({ classroomId, isTeacher, teacherName, teacherAvatarUrl }) {
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.user);
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

  const handleOpenLesson = (lesson) => {
    const isCollabora = lesson.type === 'COLLABORA_DOCX' || lesson.type === 'COLLABORA_PPTX';
    const isPptx = lesson.type === 'PPTX' || lesson.type === 'COLLABORA_PPTX';
    const editorPath = isCollabora ? '/lessons/collabora-editor' : (isPptx ? '/lessons/pptx-editor' : '/lessons/docx-editor');
    const mode = isCollabora ? (isTeacher ? 'edit' : 'view') : (isTeacher ? 'edit' : (lesson.permission === 'COPY' ? 'copy' : 'view'));
    navigate(`${editorPath}?draftId=${lesson.id}&mode=${mode}&classroomId=${classroomId}`);
  };

  return (
    <div className="space-y-5">
      {isTeacher && (
        <button type="button" onClick={() => setIsSelectModalOpen(true)} className="group w-full flex items-center gap-3 rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4 hover:shadow-md hover:border-blue-200 transition-all duration-200 text-left">
          <span className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all shrink-0">
            <Plus className="w-5 h-5 text-white" />
          </span>
          <span className="text-sm font-medium text-slate-500 group-hover:text-blue-600 transition-colors">Chia sẻ bài giảng mới cho lớp học...</span>
        </button>
      )}

      {loading ? (
        <div className="py-10 text-center">
          <Loader2 className="w-7 h-7 text-teal-500 animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-500">Đang tải bài giảng...</p>
        </div>
      ) : error ? (
        <div className="py-6 px-5 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      ) : lessons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-700">Chưa có bài giảng nào</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {isTeacher
              ? 'Hãy bắt đầu bằng cách chia sẻ một bài giảng cho lớp học.'
              : 'Giáo viên chưa chia sẻ bài giảng nào vào lớp học này.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {lessons.map(lesson => (
            <article
              key={lesson.id}
              className="relative rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-teal-400 text-white font-bold text-sm flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
                    {(lesson.ownerAvatarUrl || lesson.authorAvatarUrl || teacherAvatarUrl || (isTeacher ? currentUser?.avatarUrl : null)) ? (
                      <img
                        src={lesson.ownerAvatarUrl || lesson.authorAvatarUrl || teacherAvatarUrl || currentUser?.avatarUrl}
                        alt={teacherName || lesson.ownerName || 'Giáo viên'}
                        className="w-full h-full object-cover"
                      />
                    ) : getInitials(teacherName || lesson.ownerName || lesson.ownerEmail)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">{teacherName || lesson.ownerName || lesson.ownerEmail || 'Giáo viên'}</p>
                      <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold bg-violet-100 text-violet-700">Bài giảng</span>
                    </div>
                    <p className="text-xs text-slate-500">{formatDate(lesson.updatedAt)}</p>
                  </div>
                </div>
                {isTeacher && (
                  <button type="button" onClick={(e) => handleRevokeShare(lesson.id, e)} disabled={revokingId === lesson.id} className="p-2 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50 shrink-0" title="Ngừng chia sẻ" aria-label={`Ngừng chia sẻ ${lesson.title}`}>
                    {revokingId === lesson.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
              </div>

              <button type="button" onClick={() => handleOpenLesson(lesson)} className="group w-full text-left mt-4 cursor-pointer">
                <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{lesson.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{[lesson.subject, lesson.grade].filter(Boolean).join(' · ') || 'Bài giảng dùng trong lớp học'}</p>

                <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 p-3 group-hover:bg-slate-50 group-hover:border-blue-200 transition-colors">
                  <span className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${lesson.type === 'PPTX' || lesson.type === 'COLLABORA_PPTX' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                    {lesson.type === 'PPTX' || lesson.type === 'COLLABORA_PPTX' ? <Presentation className="w-5 h-5 text-white" /> : <FileText className="w-5 h-5 text-white" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-800 truncate">{lesson.title}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">{getLessonTypeLabel(lesson.type)}</span>
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 shrink-0 ${isTeacher ? 'bg-teal-100 text-teal-700' : (PERMISSION_STYLE[lesson.permission] || PERMISSION_STYLE.VIEW)}`}>
                    {isTeacher ? <Edit2 className="w-3 h-3" /> : (lesson.permission === 'COPY' ? <Copy className="w-3 h-3" /> : <Eye className="w-3 h-3" />)}
                    {isTeacher ? 'Chỉnh sửa' : (PERMISSION_LABELS[lesson.permission] || PERMISSION_LABELS.VIEW)}
                  </span>
                </div>

                <span className="mt-4 flex justify-end">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold group-hover:shadow-lg transition-all">
                    {isTeacher ? 'Mở bài giảng' : 'Xem bài giảng'}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </span>
              </button>

              <PostComments
                classroomId={classroomId}
                postId={lesson.id}
                initialCommentCount={lesson.commentCount || lesson.commentsCount || 0}
                isTeacher={isTeacher}
                getComments={lessonDraftApi.getClassroomLessonComments}
                createComment={lessonDraftApi.createClassroomLessonComment}
                deleteComment={lessonDraftApi.deleteClassroomLessonComment}
              />
            </article>
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
