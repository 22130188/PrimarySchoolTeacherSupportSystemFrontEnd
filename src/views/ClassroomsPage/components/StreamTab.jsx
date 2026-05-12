import { useMemo, useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import DOMPurify from 'dompurify';
import {
  Link2, Loader2, MessageSquare, Send, Trash2, X, Paperclip,
  Edit3, Link, MoreVertical,
} from 'lucide-react';
import { openGoogleDrivePicker } from '../../../utils/googleDrivePicker';
import { useAuthStore } from '../../../stores/authStore';

const GOOGLE_PICKER_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_PICKER_API_KEY,
  clientId: import.meta.env.VITE_GOOGLE_PICKER_CLIENT_ID,
  appId: import.meta.env.VITE_GOOGLE_PICKER_APP_ID,
};

function formatTime(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function prettySize(bytes) {
  if (!bytes || Number.isNaN(Number(bytes))) return '';
  const size = Number(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function stripHtml(html) {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return (doc.body.textContent || '').trim();
}

function canDeletePost({ post, isTeacher, teacherName }) {
  if (!post?.canDelete) return false;
  if (isTeacher) return true;
  const normalizedTeacherName = (teacherName || '').trim().toLowerCase();
  const normalizedAuthorName = (post?.authorName || '').trim().toLowerCase();
  if (!normalizedTeacherName || !normalizedAuthorName) return Boolean(post?.canDelete);
  return normalizedAuthorName !== normalizedTeacherName;
}

function CreateAnnouncementModal({ onClose, onSubmit, submitting }) {
  const user = useAuthStore((state) => state.user);
  const [content, setContent] = useState('');
  const [driveUrlInput, setDriveUrlInput] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [pickerOpening, setPickerOpening] = useState(false);
  const [hiddenByPicker, setHiddenByPicker] = useState(false);

  const canSubmit = useMemo(() => {
    return stripHtml(content).length > 0 || attachments.length > 0;
  }, [content, attachments]);

  const handleAddLink = () => {
    const url = driveUrlInput.trim();
    if (!url) return;
    if (attachments.some((item) => item.driveUrl === url)) {
      setDriveUrlInput('');
      return;
    }
    setAttachments((prev) => [...prev, { driveUrl: url }]);
    setDriveUrlInput('');
    setShowLinkInput(false);
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handlePickFromGoogleDrive = async () => {
    if (pickerOpening) return;
    const { apiKey, clientId, appId } = GOOGLE_PICKER_CONFIG;
    if (!apiKey || !clientId || apiKey.includes('PASTE_') || clientId.includes('PASTE_')) {
      const manualUrl = window.prompt('Dán link Google Drive để đính kèm:');
      const url = (manualUrl || '').trim();
      if (!url) return;
      setAttachments((prev) => {
        if (prev.some((item) => item.driveUrl === url)) return prev;
        return [...prev, { driveUrl: url }];
      });
      return;
    }
    setPickerOpening(true);
    setHiddenByPicker(true);
    try {
      await openGoogleDrivePicker({
        apiKey, clientId, appId,
        loginHint: user?.email,
        onPicked: (docs) => {
          setAttachments((prev) => {
            const seen = new Set(prev.map((item) => item.driveUrl));
            const next = [...prev];
            docs.forEach((doc) => {
              if (doc.driveUrl && !seen.has(doc.driveUrl)) {
                seen.add(doc.driveUrl);
                next.push(doc);
              }
            });
            return next;
          });
        },
      });
    } catch (error) {
      alert(error.message || 'Không thể mở Google Drive Picker');
    } finally {
      setPickerOpening(false);
      setHiddenByPicker(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    try {
      await onSubmit({ content, attachments });
      onClose();
    } catch {

    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/20 transition-opacity duration-200 ${hiddenByPicker ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
      >
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Đăng thông báo</h2>
        </div>
        <div className="px-6 pt-4">
          <div className="rounded-xl border border-slate-200 overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all stream-modal-editor">
            <CKEditor
              editor={ClassicEditor}
              data={content}
              config={{
                placeholder: 'Thông báo nội dung nào đó cho lớp học của bạn',
                toolbar: [
                  'bold', 'italic',
                  '|', 'bulletedList', 'numberedList',
                  '|', 'link', 'blockQuote',
                  '|', 'undo', 'redo',
                ],
              }}
              onChange={(_, editor) => { setContent(editor.getData()); }}
            />
          </div>
        </div>
        {attachments.length > 0 && (
          <div className="px-6 pt-3 flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div
                key={`${attachment.driveUrl}-${index}`}
                className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-700 max-w-[320px]"
              >
                <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{attachment.driveUrl}</span>
                <button type="button" onClick={() => handleRemoveAttachment(index)} className="text-blue-500 hover:text-blue-800 flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        {showLinkInput && (
          <div className="px-6 pt-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={driveUrlInput}
                  onChange={(event) => setDriveUrlInput(event.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddLink(); }}
                  placeholder="Dán link để đính kèm"
                  autoFocus
                  className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button type="button" onClick={handleAddLink} className="px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-semibold hover:bg-blue-100 transition-colors">
                Thêm
              </button>
              <button type="button" onClick={() => { setShowLinkInput(false); setDriveUrlInput(''); }} className="px-2 py-2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        <div className="px-6 pt-4 pb-5 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePickFromGoogleDrive}
              disabled={pickerOpening}
              title="Google Drive"
              className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 transition-all disabled:opacity-60"
            >
              {pickerOpening ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 19h20L12 2z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M7.5 12H16.5" stroke="currentColor" strokeWidth="1.5" /><path d="M5 16.5H19" stroke="currentColor" strokeWidth="1.5" /></svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowLinkInput(!showLinkInput)}
              title="Đính kèm link"
              className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 transition-all"
            >
              <Link className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">
              Huỷ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm transition-all duration-200"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? 'Đang đăng...' : 'Đăng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StreamTab({
  classroom,
  isTeacher,
  posts,
  loading,
  submitting,
  deletingId,
  onCreatePost,
  onDeletePost,
}) {
  const teacherName = classroom?.teacherName;
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async (data) => {
    await onCreatePost(data);
  };

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => setShowModal(true)}
        id="stream-new-post-btn"
        className="group w-full flex items-center gap-3 rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4 hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
          <Edit3 className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm font-medium text-slate-500 group-hover:text-blue-600 transition-colors">
          Thông báo mới cho lớp học...
        </span>
      </button>

      {showModal && (
        <CreateAnnouncementModal
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      {loading && (
        <div className="py-10 text-center">
          <Loader2 className="w-7 h-7 text-teal-500 animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-500">Đang tải bảng tin...</p>
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-7 h-7 text-slate-400" />
          </div>
          <h4 className="text-base font-bold text-slate-700">Chưa có bài đăng nào</h4>
          <p className="text-sm text-slate-500 mt-1">Hãy bắt đầu bằng một thông báo đầu tiên cho lớp học.</p>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => (
            <article key={post.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {post.authorAvatarUrl ? (
                    <img src={post.authorAvatarUrl} alt={post.authorName} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-white font-bold text-sm flex items-center justify-center">
                      {initials(post.authorName)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{post.authorName || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{formatTime(post.createdAt)}</p>
                  </div>
                </div>
                {canDeletePost({ post, isTeacher, teacherName }) && (
                  <button
                    type="button"
                    onClick={() => onDeletePost(post.id)}
                    disabled={deletingId === post.id}
                    className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Xóa bài đăng"
                  >
                    {deletingId === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {post.content && (
                <div
                  className="mt-3 text-sm text-slate-700 leading-relaxed rich-content"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(post.content),
                  }}
                />
              )}

              {post.attachments?.length > 0 && (
                <div className="mt-3 space-y-2">
                  {post.attachments.map((attachment) => (
                    <a
                      key={attachment.id || attachment.driveFileId}
                      href={attachment.webViewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 transition-colors"
                    >
                      {attachment.thumbnailLink ? (
                        <img
                          src={attachment.thumbnailLink}
                          alt={attachment.name}
                          className="w-10 h-10 rounded-md object-cover border border-slate-100"
                        />
                      ) : attachment.iconLink ? (
                        <img src={attachment.iconLink} alt="icon" className="w-8 h-8" />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center">
                          <Paperclip className="w-4 h-4 text-slate-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{attachment.name}</p>
                        <p className="text-xs text-slate-500">
                          {attachment.mimeType || 'Google Drive file'}
                          {attachment.sizeBytes ? ` • ${prettySize(attachment.sizeBytes)}` : ''}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
