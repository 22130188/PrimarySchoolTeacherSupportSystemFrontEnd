import { useMemo, useState } from 'react';
import { Download, ImagePlus, Loader2, Search } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { extractErrorMessage, saveImageToLibrary, sourceToBlob } from '../helpers/aiImageHelpers';
import SaveImageModal from './SaveImageModal';

const PEXELS_SEARCH_URL = 'https://api.pexels.com/v1/search';
const DEFAULT_PER_PAGE = 20;

const ORIENTATION_OPTIONS = [
  { value: '', label: 'Tất cả hướng' },
  { value: 'landscape', label: 'Ngang / landscape' },
  { value: 'portrait', label: 'Dọc / portrait' },
  { value: 'square', label: 'Vuông / square' },
];

const SIZE_OPTIONS = [
  { value: '', label: 'Kích thước: mặc định' },
  { value: 'large', label: 'Lớn / large' },
  { value: 'medium', label: 'Vừa / medium' },
  { value: 'small', label: 'Nhỏ / small' },
];

const COLOR_OPTIONS = [
  { value: '', label: 'Màu: mặc định' },
  { value: 'red', label: 'Đỏ' },
  { value: 'orange', label: 'Cam' },
  { value: 'yellow', label: 'Vàng' },
  { value: 'green', label: 'Xanh lá' },
  { value: 'turquoise', label: 'Ngọc lam' },
  { value: 'blue', label: 'Xanh dương' },
  { value: 'violet', label: 'Tím' },
  { value: 'pink', label: 'Hồng' },
  { value: 'brown', label: 'Nâu' },
  { value: 'black', label: 'Đen' },
  { value: 'gray', label: 'Xám' },
  { value: 'white', label: 'Trắng' },
];

const LOCALE_OPTIONS = [
  { value: 'vi-VN', label: 'Tiếng Việt' },
  { value: 'en-US', label: 'English' },
  { value: 'fr-FR', label: 'Français' },
  { value: 'de-DE', label: 'Deutsch' },
  { value: 'es-ES', label: 'Español' },
  { value: 'ja-JP', label: '日本語' },
  { value: 'ko-KR', label: '한국어' },
];

const THEMES = {
  orange: {
    focus: 'focus:border-orange-400 focus:ring-orange-100',
    button: 'bg-orange-500 hover:bg-orange-600',
    insert: 'border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100',
    saveHover: 'hover:border-orange-200 hover:text-orange-600',
    text: 'text-orange-600',
  },
  indigo: {
    focus: 'focus:border-indigo-400 focus:ring-indigo-100',
    button: 'bg-indigo-500 hover:bg-indigo-600',
    insert: 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
    saveHover: 'hover:border-indigo-200 hover:text-indigo-600',
    text: 'text-indigo-600',
  },
};

function getPhotoSource(photo) {
  return photo?.src?.large2x || photo?.src?.large || photo?.src?.medium || photo?.src?.original || '';
}

function getPhotoDescription(photo) {
  return photo?.alt?.trim() || `Pexels photo by ${photo?.photographer || 'Unknown'}`;
}

function appendParam(params, key, value) {
  if (value) params.set(key, value);
}

export default function PexelsImageSearch({ onAddImage, onSaved, accent = 'orange' }) {
  const { user } = useAuthStore();
  const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
  const hasApiKey = Boolean(apiKey && apiKey !== 'your_pexels_api_key_here');
  const theme = THEMES[accent] || THEMES.orange;

  const [query, setQuery] = useState('');
  const [orientation, setOrientation] = useState('landscape');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [locale, setLocale] = useState('vi-VN');
  const [photos, setPhotos] = useState([]);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ msg: '', type: 'idle' });
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [saveForm, setSaveForm] = useState({ description: '', subject: '' });

  const statusClass = useMemo(() => {
    if (status.type === 'error') return 'text-red-500';
    if (status.type === 'success') return 'text-emerald-600';
    return 'text-gray-500';
  }, [status.type]);

  const canLoadMore = photos.length > 0 && photos.length < totalResults;

  const fetchPhotos = async ({ nextPage = 1, append = false } = {}) => {
    const keyword = query.trim();
    if (!keyword) {
      setStatus({ msg: 'Nhập từ khóa để tìm ảnh.', type: 'error' });
      return;
    }
    if (!hasApiKey) {
      setStatus({ msg: 'Thiếu VITE_PEXELS_API_KEY trong file .env.', type: 'error' });
      return;
    }

    setLoading(true);
    setStatus({ msg: append ? 'Đang tải thêm ảnh...' : 'Đang tìm ảnh trên Pexels...', type: 'info' });
    try {
      const params = new URLSearchParams({
        query: keyword,
        per_page: String(DEFAULT_PER_PAGE),
        page: String(nextPage),
      });
      appendParam(params, 'orientation', orientation);
      appendParam(params, 'size', size);
      appendParam(params, 'color', color);
      appendParam(params, 'locale', locale);

      const response = await fetch(`${PEXELS_SEARCH_URL}?${params.toString()}`, {
        headers: { Authorization: apiKey },
      });
      if (!response.ok) {
        throw new Error(response.status === 401 ? 'API key Pexels không hợp lệ.' : 'Không tìm được ảnh từ Pexels.');
      }

      const data = await response.json();
      const nextPhotos = data.photos || [];
      const loadedPhotos = append ? [...photos, ...nextPhotos] : nextPhotos;
      const nextTotal = data.total_results || loadedPhotos.length;

      setPhotos(loadedPhotos);
      setPage(nextPage);
      setTotalResults(nextTotal);
      setStatus({
        msg: loadedPhotos.length
          ? `Đã tải ${loadedPhotos.length} ảnh. Tổng kết quả: ${nextTotal}.`
          : 'Không có ảnh phù hợp.',
        type: loadedPhotos.length ? 'success' : 'info',
      });
    } catch (error) {
      if (!append) {
        setPhotos([]);
        setTotalResults(0);
      }
      setStatus({ msg: extractErrorMessage(error), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const searchPhotos = (event) => {
    event?.preventDefault();
    fetchPhotos({ nextPage: 1, append: false });
  };

  const loadMorePhotos = () => {
    fetchPhotos({ nextPage: page + 1, append: true });
  };

  const insertPhoto = (photo) => {
    const source = getPhotoSource(photo);
    if (source) onAddImage(source);
  };

  const openSaveModal = (photo) => {
    if (!user?.id) {
      setStatus({ msg: 'Vui lòng đăng nhập để lưu ảnh vào thư viện.', type: 'error' });
      return;
    }
    setSelectedPhoto(photo);
    setSaveForm({ description: getPhotoDescription(photo), subject: '' });
  };

  const closeSaveModal = () => {
    if (!saving) setSelectedPhoto(null);
  };

  const confirmSave = async () => {
    if (!selectedPhoto) return;
    if (!saveForm.description.trim() || !saveForm.subject.trim()) {
      setStatus({ msg: 'Vui lòng nhập mô tả và môn học cho ảnh.', type: 'error' });
      return;
    }

    setSaving(true);
    setStatus({ msg: 'Đang lưu ảnh Pexels vào thư viện...', type: 'info' });
    try {
      const blob = await sourceToBlob(getPhotoSource(selectedPhoto));
      await saveImageToLibrary({
        blob,
        description: saveForm.description,
        subject: saveForm.subject,
        user,
      });
      setSelectedPhoto(null);
      setStatus({ msg: 'Đã lưu ảnh vào thư viện.', type: 'success' });
      alert('Đã lưu ảnh Pexels vào thư viện thành công!');
      onSaved?.();
    } catch (error) {
      const errMsg = extractErrorMessage(error);
      setStatus({ msg: errMsg, type: 'error' });
      alert('Lưu ảnh thất bại: ' + errMsg);
    } finally {
      setSaving(false);
    }
  };

  const selectClass = `w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-[12px] text-gray-700 outline-none transition focus:ring-2 ${theme.focus}`;

  return (
    <div>
      <form onSubmit={searchPhotos} className="space-y-2.5">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm ảnh minh họa..."
            className={`min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] text-gray-700 outline-none transition focus:ring-2 ${theme.focus}`}
          />
          <button
            type="submit"
            disabled={loading || !hasApiKey}
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-none text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${theme.button}`}
            title="Tìm kiếm"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <select value={orientation} onChange={(e) => setOrientation(e.target.value)} className={selectClass}>
            {ORIENTATION_OPTIONS.map((option) => (
              <option key={option.value || 'all-orientation'} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select value={size} onChange={(e) => setSize(e.target.value)} className={selectClass}>
            {SIZE_OPTIONS.map((option) => (
              <option key={option.value || 'default-size'} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select value={color} onChange={(e) => setColor(e.target.value)} className={selectClass}>
            {COLOR_OPTIONS.map((option) => (
              <option key={option.value || 'default-color'} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select value={locale} onChange={(e) => setLocale(e.target.value)} className={selectClass}>
            {LOCALE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {!hasApiKey && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-500">
            Pexels chưa sẵn sàng vui lòng đợi.
          </p>
        )}
        {status.msg && <p className={`text-[11px] ${statusClass}`}>{status.msg}</p>}
      </form>

      <div className="mt-4 grid grid-cols-1 gap-3">
        {photos.map((photo) => {
          const source = getPhotoSource(photo);
          return (
            <div key={photo.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <button
                type="button"
                onClick={() => insertPhoto(photo)}
                className="block w-full border-none bg-transparent p-0"
                title="Chèn trực tiếp vào slide"
              >
                <img
                  src={photo.src?.medium || source}
                  alt={getPhotoDescription(photo)}
                  className="h-[118px] w-full object-cover"
                  loading="lazy"
                />
              </button>
              <div className="px-3 py-2">
                <p className="truncate text-[12px] font-medium text-gray-700">{getPhotoDescription(photo)}</p>
                <p className="mt-0.5 truncate text-[10px] text-gray-400">Pexels - {photo.photographer}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => insertPhoto(photo)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition ${theme.insert}`}
                  >
                    <ImagePlus size={13} /> Chèn
                  </button>
                  <button
                    type="button"
                    onClick={() => openSaveModal(photo)}
                    disabled={saving}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-gray-600 transition disabled:cursor-not-allowed disabled:opacity-50 ${theme.saveHover}`}
                  >
                    <Download size={13} /> Lưu
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {canLoadMore && (
        <button
          type="button"
          onClick={loadMorePhotos}
          disabled={loading}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${theme.saveHover}`}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          Tải thêm ảnh
        </button>
      )}

      <SaveImageModal
        open={Boolean(selectedPhoto)}
        title="Lưu ảnh Pexels vào thư viện"
        subtitle="Ảnh sẽ được lưu vào thư viện ảnh của bạn."
        form={saveForm}
        onChange={setSaveForm}
        onClose={closeSaveModal}
        onSubmit={confirmSave}
        saving={saving}
      />
    </div>
  );
}
