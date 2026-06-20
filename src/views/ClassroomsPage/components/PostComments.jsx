import { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, Loader2, User } from 'lucide-react';
import {
  getPostComments,
  createPostComment,
  deletePostComment
} from '../../../services/classroomApi';
import { useAuthStore } from '../../../stores/authStore';

function formatTime(value) {
  if (!value) return '';
  try {
    const date = new Date(value);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return value;
  }
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

export default function PostComments({
  classroomId,
  postId,
  initialCommentCount = 0,
  isTeacher,
  getComments = getPostComments,
  createComment = createPostComment,
  deleteComment = deletePostComment,
  onCommentCountChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [hasLoaded, setHasLoaded] = useState(false);

  const currentUser = useAuthStore(state => state.user);

  useEffect(() => {
    setCommentCount(initialCommentCount);
  }, [initialCommentCount]);

  const syncCommentCount = (nextCount) => {
    setCommentCount(nextCount);
    onCommentCountChange?.(postId, nextCount);
  };

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await getComments(classroomId, postId);
      setComments(Array.isArray(data) ? data : []);
      syncCommentCount(Array.isArray(data) ? data.length : 0);
      setHasLoaded(true);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen && !hasLoaded) {
      loadComments();
    }
    setIsOpen(!isOpen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const savedComment = await createComment(classroomId, postId, newComment.trim());
      setComments(prev => [...prev, savedComment]);
      syncCommentCount(commentCount + 1);
      setHasLoaded(true);
      setNewComment('');
    } catch (err) {
      alert(err.message || 'Không thể gửi nhận xét');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Bạn có chắc muốn xóa nhận xét này?')) return;
    setDeletingId(commentId);
    try {
      await deleteComment(classroomId, postId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      syncCommentCount(Math.max(0, commentCount - 1));
    } catch (err) {
      alert(err.message || 'Không thể xóa nhận xét');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors w-full group py-1"
      >
        <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
        {commentCount > 0 ? (
          <span>{commentCount} nhận xét về lớp học</span>
        ) : (
          <span>Thêm nhận xét</span>
        )}
      </button>

      {/* Comment Section */}
      {isOpen && (
        <div className="mt-4 space-y-4">
          {/* List of Comments */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 group">
                  {/* Avatar */}
                  {comment.authorAvatarUrl ? (
                    <img src={comment.authorAvatarUrl} alt={comment.authorName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                      {initials(comment.authorName)}
                    </div>
                  )}

                  {/* Comment Content */}
                  <div className="flex-1 min-w-0 flex items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 text-xs">
                        <span className="font-bold text-slate-800">{comment.authorName}</span>
                        <span className="text-slate-500">• {formatTime(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{comment.content}</p>
                    </div>

                    {/* Delete Button */}
                    {(comment.canDelete || isTeacher) && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 shrink-0"
                        title="Xóa nhận xét"
                      >
                        {deletingId === comment.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Comment Input */}
          <div className="flex items-start gap-3 mt-4 pt-2">
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.fullName || currentUser.username} className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                {initials(currentUser?.fullName || currentUser?.username)}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex-1 relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Thêm nhận xét trong lớp học..."
                rows={1}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 pr-12 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none overflow-hidden transition-all placeholder:text-slate-500"
                style={{ minHeight: '44px', height: '44px' }}
                onInput={(e) => {
                  e.target.style.height = '44px';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="absolute right-2 top-1.5 p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
