import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import collaboraApi from '../../services/collaboraApi';
import lessonDraftApi from '../../services/lessonDraftApi';
import CollaboraImageSidebar, { COLLABORA_IMAGE_TABS } from './CollaboraImageSidebar';
import { useAuthStore } from '../../stores/authStore';

export default function CollaboraEditorPage() {
  const navigate = useNavigate();
  const roleId = Number(useAuthStore((state) => state.roleId));
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draftId');
  const templateId = searchParams.get('templateId');
  const classroomId = searchParams.get('classroomId');
  const fromAdmin = searchParams.get('from') === 'admin';
  const isTemplateMode = !!templateId;
  const isAdmin = roleId === 3;
  const isAdminTemplateEdit = isTemplateMode && isAdmin;
  const isTemplatePreview = isTemplateMode && !isAdminTemplateEdit;
  const isAdminLessonView = fromAdmin && isAdmin && !!draftId && !isTemplateMode;
  const isStudentClassroomView = classroomId && roleId === 1;
  const mode = isAdminTemplateEdit
    ? 'edit'
    : (isTemplatePreview || isStudentClassroomView || isAdminLessonView || searchParams.get('mode') === 'view'
      ? 'view'
      : (searchParams.get('mode') || 'edit'));
  const formRef = useRef(null);
  const imageToolsRef = useRef(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editorReady, setEditorReady] = useState(false);
  const [insertStatus, setInsertStatus] = useState('');
  const [activeImageTab, setActiveImageTab] = useState('images');
  const [imagePanelExpanded, setImagePanelExpanded] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      if (!draftId && !templateId) {
        setError('Không tìm thấy bài giảng Collabora.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        if (templateId) {
          const data = await collaboraApi.getTemplateEditorSession(templateId);
          setSession(data);
          return;
        }
        if (classroomId) {
          await lessonDraftApi.getClassroomSharedDraft(classroomId, draftId);
        }
        const data = classroomId
          ? await collaboraApi.getClassroomEditorSession(classroomId, draftId)
          : await collaboraApi.getEditorSession(draftId);
        setSession(data);
      } catch (err) {
        console.error('Failed to load Collabora session:', err);
        setError(err.response?.data?.message || err.message || 'Không thể mở Collabora Online.');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [classroomId, draftId, templateId]);

  useEffect(() => {
    if (session && formRef.current) {
      formRef.current.submit();
    }
  }, [session]);

  useEffect(() => {
    const postToCollabora = (message) => {
      const frame = document.getElementById('collabora-editor-frame');
      frame?.contentWindow?.postMessage(JSON.stringify({
        SendTime: Date.now(),
        ...message,
      }), '*');
    };

    const setInitialZoom = () => {
      [300, 900, 1600, 2600].forEach((delay) => {
        setTimeout(() => {
          postToCollabora({
            MessageId: 'Send_UNO_Command',
            Values: {
              Command: '.uno:Zoom',
              Args: {
                'Zoom.Value': { type: 'short', value: 300 },
                'Zoom.ValueSet': { type: 'short', value: 28703 },
                'Zoom.Type': { type: 'short', value: 0 },
              },
            },
          });
        }, delay);
      });
    };

    const handleMessage = (event) => {
      let message = event.data;
      if (typeof message === 'string') {
        try {
          message = JSON.parse(message);
        } catch {
          return;
        }
      }

      if (!message?.MessageId) return;
      if (message.MessageId === 'App_LoadingStatus' && message.Values?.Status === 'Initialized') {
        postToCollabora({ MessageId: 'Host_PostmessageReady' });
      }
      if (
        (message.MessageId === 'App_LoadingStatus' && message.Values?.Status === 'Document_Loaded') ||
        message.MessageId === 'View_Added'
      ) {
        setEditorReady(true);
        setInitialZoom();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const normalizeSourceUrl = (source) => {
    if (!source || source.startsWith?.('data:') || source.startsWith?.('blob:')) {
      return source;
    }

    try {
      return new URL(source, window.location.origin).href;
    } catch {
      return source;
    }
  };

  const sourceToFile = async (source) => {
    if (source?.startsWith?.('data:')) {
      const blob = await fetch(source).then((res) => res.blob());
      return new File([blob], 'image.png', { type: blob.type || 'image/png' });
    }

    try {
      const normalizedSource = normalizeSourceUrl(source);
      const res = await fetch(normalizedSource, { mode: 'cors' });
      if (!res.ok) throw new Error('Image fetch failed');
      const blob = await res.blob();
      return new File([blob], 'image.' + ((blob.type || 'image/png').split('/')[1] || 'png'), { type: blob.type || 'image/png' });
    } catch {
      return null;
    }
  };

  const handleInsertImage = async (source) => {
    if (!source) return;
    if (isStudentClassroomView) {
      setInsertStatus('Học sinh không được dùng thư viện ảnh trong bài giảng lớp.');
      return;
    }
    if (!isAdminTemplateEdit && session?.canWrite === false) {
      setInsertStatus('Bạn không có quyền sửa bài giảng này.');
      return;
    }
    const frame = document.getElementById('collabora-editor-frame');
    if (!frame?.contentWindow) {
      setInsertStatus('Collabora chưa sẵn sàng.');
      return;
    }

    try {
      setInsertStatus('Đang chuẩn bị ảnh...');
      const normalizedSource = normalizeSourceUrl(source);
      const file = await sourceToFile(source);
      if (!file && !/^https?:\/\//i.test(normalizedSource || '')) {
        throw new Error('Nguồn ảnh này chỉ tồn tại trên trình duyệt, vui lòng thử ảnh khác.');
      }
      const asset = await collaboraApi.createImageAsset(file ? { file } : { sourceUrl: normalizedSource });
      frame.contentWindow.postMessage(JSON.stringify({
        MessageId: 'Action_InsertGraphic',
        SendTime: Date.now(),
        Values: {
          filename: asset.fileName || 'image.png',
          url: asset.url,
        },
      }), '*');
      setInsertStatus(editorReady ? 'Đã gửi ảnh vào Collabora.' : 'Đã gửi ảnh, Collabora có thể cần vài giây để sẵn sàng.');
      setTimeout(() => setInsertStatus(''), 3000);
    } catch (err) {
      console.error('Failed to insert image into Collabora:', err);
      setInsertStatus(err.response?.data?.message || err.message || 'Không thể chèn ảnh vào Collabora.');
    }
  };

  const canUseImageTools = session
    && (isAdminTemplateEdit || (session.canWrite !== false && !isStudentClassroomView && !isTemplatePreview && !isAdminLessonView && mode !== 'view'));

  const handleImageTabClick = (tabId) => {
    if (activeImageTab === tabId && imagePanelExpanded) {
      setImagePanelExpanded(false);
      return;
    }
    setActiveImageTab(tabId);
    setImagePanelExpanded(true);
  };
  useEffect(() => {
    if (!imagePanelExpanded) return undefined;

    const handlePointerDown = (event) => {
      if (imageToolsRef.current?.contains(event.target)) return;
      setImagePanelExpanded(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [imagePanelExpanded]);

  return (
    <div className="fixed inset-0 flex flex-col z-[9999] bg-white font-[Inter,sans-serif]">
      <div className="h-13 min-h-[52px] bg-white border-b border-gray-200 relative flex items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => {
              if (classroomId) {
                navigate(`/classrooms/${classroomId}?tab=lessons`);
                return;
              }
              if (isTemplateMode && isAdmin) {
                navigate('/admin/lesson_templates');
                return;
              }
              if (fromAdmin || isAdminLessonView) {
                navigate('/admin/lessons');
                return;
              }
              navigate('/lessons');
            }}
            className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            title="Quay lại"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-8 h-8 shrink-0 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
            <FileText size={17} />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-gray-900 truncate">{session?.fileName || 'Collabora Online'}</h1>
            <p className="text-xs text-gray-500 truncate">
              {isAdminTemplateEdit
                ? 'Chỉnh sửa mẫu bài giảng'
                : isTemplatePreview
                  ? 'Xem mẫu bài giảng'
                  : isAdminLessonView || session?.canWrite === false || mode === 'view'
                    ? 'Xem bằng Collabora Online'
                    : 'Soạn thảo bằng Collabora Online'}
            </p>
          </div>
        </div>
        <div ref={imageToolsRef} className="flex items-center gap-3 shrink-0">
          {canUseImageTools && (
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 max-sm:static max-sm:translate-x-0 max-sm:translate-y-0">
              {COLLABORA_IMAGE_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeImageTab === tab.id && imagePanelExpanded;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleImageTabClick(tab.id)}
                    className={`h-9 px-2.5 rounded-lg border-none inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-all duration-150 ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 shadow-[inset_0_-2px_0_#059669]'
                        : 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-emerald-600'
                    }`}
                    title={tab.label}
                  >
                    <Icon size={17} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
          {canUseImageTools && (
            <CollaboraImageSidebar
              onInsertImage={handleInsertImage}
              activeTab={activeImageTab}
              expanded={imagePanelExpanded}
              onExpandedChange={setImagePanelExpanded}
            />
          )}
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1">
            Collabora
          </span>
        </div>
      </div>
      <div className="flex-1 flex min-h-0 bg-gray-50">

        <div className="flex-1 relative min-w-0">
          {insertStatus && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 rounded-lg bg-gray-900/85 px-4 py-2 text-xs font-medium text-white shadow-lg">
              {insertStatus}
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-600">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="text-sm font-medium">Đang kết nối Collabora Online...</span>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <div className="max-w-xl w-full border border-red-200 bg-red-50 text-red-700 rounded-md px-4 py-3 text-sm">
                {error}
              </div>
            </div>
          )}

          {session && (
            <>
              <form
                ref={formRef}
                target="collabora-editor-frame"
                action={session.actionUrl}
                method="post"
                style={{ display: 'none' }}
              >
                <input name="access_token" value={session.accessToken || ''} readOnly type="hidden" />
                <input name="access_token_ttl" value={session.accessTokenTtl || '0'} readOnly type="hidden" />
                <input
                  name="ui_defaults"
                  value="UIMode=tabbed;PresentationStatusbar=true;SavedUIState=false;"
                  readOnly
                  type="hidden"
                />
                <input
                  name="permission"
                  value={isAdminTemplateEdit || (!isTemplatePreview && !isStudentClassroomView && !isAdminLessonView && mode !== 'view') ? 'edit' : 'readonly'}
                  readOnly
                  type="hidden"
                />
              </form>
              <iframe
                id="collabora-editor-frame"
                name="collabora-editor-frame"
                title="Collabora Online Editor"
                allow="fullscreen"
                className="w-full h-full border-0 bg-white"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
