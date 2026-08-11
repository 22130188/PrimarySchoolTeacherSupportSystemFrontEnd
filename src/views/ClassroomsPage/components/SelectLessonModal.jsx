import { useState, useEffect } from 'react';
import { X, Search, Loader2, Presentation, FileText, AlertTriangle } from 'lucide-react';
import lessonDraftApi from '../../../services/lessonDraftApi';

export default function SelectLessonModal({ classroomId, onClose, onLessonShared }) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sharingId, setSharingId] = useState(null);

  useEffect(() => {
    const fetchDrafts = async () => {
      setLoading(true);
      try {
        const data = await lessonDraftApi.getDrafts();
        setDrafts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Không thể tải danh sách bài giảng.');
      } finally {
        setLoading(false);
      }
    };
    fetchDrafts();
  }, []);

  const handleShare = async (draftId) => {
    try {
      setSharingId(draftId);
      await lessonDraftApi.shareToClassroom(draftId, classroomId);
      onLessonShared();
    } catch (err) {
      window.showAlertToast(err.response?.data?.message || err.message || 'Lỗi khi chia sẻ bài giảng');
    } finally {
      setSharingId(null);
    }
  };

  const filteredDrafts = drafts.filter(d => 
    d.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Chia sẻ bài giảng vào lớp</h2>
            <p className="text-sm text-gray-500 mt-1">Chọn bài giảng của bạn để chia sẻ cho học sinh</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm bài giảng..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-4" />
              <p className="text-gray-500">Đang tải danh sách...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-red-500">
              <AlertTriangle className="w-8 h-8 mb-4" />
              <p>{error}</p>
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Không tìm thấy bài giảng nào.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDrafts.map(draft => (
                <div key={draft.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50/50 transition-colors">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${draft.type === 'PPTX' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                    {draft.type === 'PPTX' ? <Presentation className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">{draft.title || 'Bài giảng không tên'}</h4>
                    <p className="text-sm text-gray-500 truncate">
                      {draft.subject} {draft.grade ? `· Lớp ${draft.grade}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleShare(draft.id)}
                    disabled={sharingId === draft.id}
                    className="shrink-0 px-4 py-2 rounded-lg bg-violet-100 text-violet-700 font-semibold hover:bg-violet-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {sharingId === draft.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Chia sẻ'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
