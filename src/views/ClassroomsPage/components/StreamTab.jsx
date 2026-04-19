import { useMemo, useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import DOMPurify from 'dompurify';
import { Link2, Loader2, MessageSquare, Send, Trash2, X, Paperclip } from 'lucide-react';
import { openGoogleDrivePicker } from '../../../utils/googleDrivePicker';

const GOOGLE_PICKER_CONFIG = {
  apiKey: 'AIzaSyD4jN3KFoefV9npftw0m0N0ZKeOlY8N9iQ',
  clientId: '866637403686-eai7uvirdmklen72pl66h1e3eidgoojv.apps.googleusercontent.com',
  appId: '866637403686',
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

export default function StreamTab({
  posts,
  loading,
  submitting,
  deletingId,
  onCreatePost,
  onDeletePost,
}) {
  const [content, setContent] = useState('');
  const [driveUrlInput, setDriveUrlInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [pickerOpening, setPickerOpening] = useState(false);

  const canSubmit = useMemo(() => {
    return stripHtml(content).length > 0 || attachments.length > 0;
  }, [content, attachments]);

  const handleAddAttachment = () => {
    const url = driveUrlInput.trim();
    if (!url) return;

    if (attachments.some((item) => item.driveUrl === url)) {
      setDriveUrlInput('');
      return;
    }

    setAttachments((prev) => [...prev, { driveUrl: url }]);
    setDriveUrlInput('');
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handlePickFromGoogleDrive = async () => {
    if (pickerOpening) return;

    const { apiKey, clientId, appId } = GOOGLE_PICKER_CONFIG;
    if (!apiKey || !clientId || apiKey.includes('PASTE_') || clientId.includes('PASTE_')) {
      const manualUrl = window.prompt('Ban chua nhap key vao StreamTab. Dan link Google Drive de dinh kem:');
      const url = (manualUrl || '').trim();
      if (!url) return;
      setAttachments((prev) => {
        if (prev.some((item) => item.driveUrl === url)) return prev;
        return [...prev, { driveUrl: url }];
      });
      return;
    }

    setPickerOpening(true);
    try {
      await openGoogleDrivePicker({
        apiKey,
        clientId,
        appId,
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
      alert(error.message || 'Khong the mo Google Drive Picker');
    } finally {
      setPickerOpening(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;

    try {
      await onCreatePost({
        content,
        attachments,
      });
      setContent('');
      setAttachments([]);
      setDriveUrlInput('');
    } catch {
      // Error feedback handled by parent with alert.
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-3">Tạo thông báo mới</h3>

        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <CKEditor
            editor={ClassicEditor}
            data={content}
            config={{
              placeholder: 'Thông báo nội dung nào đó cho lớp học của bạn',
              toolbar: [
                'bold',
                'italic',
                'underline',
                '|',
                'bulletedList',
                'numberedList',
                '|',
                'link',
                'blockQuote',
                '|',
                'undo',
                'redo',
              ],
            }}
            onChange={(_, editor) => {
              setContent(editor.getData());
            }}
          />
        </div>

        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={driveUrlInput}
              onChange={(event) => setDriveUrlInput(event.target.value)}
              placeholder="Dán link Google Drive để đính kèm"
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
            />
          </div>
          <button
            type="button"
            onClick={handleAddAttachment}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Paperclip className="w-4 h-4" />
            Thêm link
          </button>
          <button
            type="button"
            onClick={handlePickFromGoogleDrive}
            disabled={pickerOpening}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70"
          >
            {pickerOpening ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            {pickerOpening ? 'Dang mo Drive...' : 'Google Drive'}
          </button>
        </div>

        {attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div
                key={`${attachment.driveUrl}-${index}`}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs text-cyan-800"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span className="max-w-[240px] truncate">{attachment.driveUrl}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(index)}
                  className="text-cyan-600 hover:text-cyan-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-2 text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'Đang đăng...' : 'Đăng'}
          </button>
        </div>
      </div>

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
                {post.canDelete && (
                  <button
                    type="button"
                    onClick={() => onDeletePost(post.id)}
                    disabled={deletingId === post.id}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600"
                  >
                    {deletingId === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Xóa
                  </button>
                )}
              </div>

              {post.content && (
                <div
                  className="mt-3 text-sm text-slate-700 leading-relaxed ck-content"
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
