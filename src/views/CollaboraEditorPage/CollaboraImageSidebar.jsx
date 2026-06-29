import { useEffect, useState } from 'react';
import { ImagePlus, Loader2, Palette, Search, Sparkles, Upload, X } from 'lucide-react';
import { LIBRARY_SUBJECT_OPTIONS } from '../../data/aiImageConstants';
import useImageLibrary from '../../hooks/useImageLibrary';
import AIImageGenerator from '../../common/AIImageGenerator';
import PexelsImageSearch from '../../common/PexelsImageSearch';
import SaveImageModal from '../../common/SaveImageModal';
import IllustrationStudioModal from '../../common/IllustrationStudioModal';

export const COLLABORA_IMAGE_TABS = [
  { id: 'images', icon: ImagePlus, label: 'Ảnh' },
  { id: 'pexels', icon: Search, label: 'Pexels' },
  { id: 'ai', icon: Sparkles, label: 'AI' },
];

export const COLLABORA_IMAGE_PANEL_TITLES = {
  images: 'Hình ảnh',
  pexels: 'Pexels',
  ai: 'Tạo ảnh AI',
};

export default function CollaboraImageSidebar({
  onInsertImage,
  activeTab = 'images',
  expanded = true,
  onExpandedChange,
}) {
  const [librarySubject, setLibrarySubject] = useState('all');
  const [showStudio, setShowStudio] = useState(false);

  const {
    user, libraryUploadRef, libraryImages, loadingLibrary, uploadingToLibrary,
    loadLibraryImages, handleUploadFileChange,
    showSaveModal, saveForm, setSaveForm, cancelSave, confirmSave,
  } = useImageLibrary();

  const filteredImages = librarySubject === 'all'
    ? libraryImages
    : libraryImages.filter((img) => img.subject === librarySubject);

  const panelSizeClass = activeTab === 'ai'
    ? 'h-[72vh] max-h-[760px] min-h-[540px]'
    : activeTab === 'pexels'
      ? 'h-[58vh] max-h-[610px] min-h-[455px]'
      : 'h-[58vh] max-h-[560px] min-h-[360px]';

  useEffect(() => {
    if (activeTab === 'images' && expanded && user?.id) {
      loadLibraryImages();
    }
  }, [activeTab, expanded, user?.id, loadLibraryImages]);


  return (
    <>
      <div className={`absolute inset-x-0 top-full z-[80] flex ${panelSizeClass} flex-col overflow-hidden border-b border-gray-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.16)] transition-all duration-200 ease-out max-sm:h-[calc(100vh-56px)] max-sm:max-h-none max-sm:min-h-0 ${expanded ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-3 opacity-0'
        }`}>
        {expanded && (
          <>
            <div className="px-6 py-3 flex items-center gap-3 border-b border-gray-100 shrink-0">
              <span className="text-sm font-semibold text-gray-800">{COLLABORA_IMAGE_PANEL_TITLES[activeTab]}</span>
              <button
                type="button"
                onClick={() => onExpandedChange?.(false)}
                className="w-7 h-7 rounded-md bg-transparent text-gray-400 inline-flex items-center justify-center cursor-pointer transition-all hover:bg-gray-100 hover:text-gray-600 border-none"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 [scrollbar-width:thin]">
              {activeTab === 'images' && (
                <div className="mx-auto w-full max-w-7xl">
                  <input type="file" accept="image/*" ref={libraryUploadRef} onChange={handleUploadFileChange} className="hidden" />
                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => libraryUploadRef.current?.click()}
                      disabled={uploadingToLibrary}
                      className="w-full py-2.5 bg-white text-slate-900 border border-emerald-400 rounded-xl text-[13px] font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingToLibrary ? (
                        <><Loader2 size={15} className="animate-spin" /> Đang tải...</>
                      ) : (
                        <><Upload size={15} /> Tải ảnh lên thư viện</>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowStudio(true)}
                      className="w-full py-2.5 bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-xl text-[13px] font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Palette size={15} /> Tạo hình ảnh minh họa
                    </button>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Thư viện ảnh (Nhấn vào ảnh đề chèn)</p>
                      <button type="button" onClick={loadLibraryImages} className="text-[11px] text-emerald-500 hover:text-emerald-700 font-medium transition-colors cursor-pointer bg-transparent border-none">
                        Tải lại
                      </button>
                    </div>

                    <select
                      value={librarySubject}
                      onChange={(e) => setLibrarySubject(e.target.value)}
                      className="w-full text-[12px] border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-700 outline-none cursor-pointer transition focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 md:w-[260px]"
                    >
                      {LIBRARY_SUBJECT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {loadingLibrary && (
                    <div className="flex items-center justify-center py-6 text-gray-400">
                      <Loader2 size={20} className="animate-spin mr-2" />
                      <span className="text-xs">Đang tải...</span>
                    </div>
                  )}

                  {!loadingLibrary && filteredImages.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-lg">
                      Chưa có ảnh trong thư viện.
                    </div>
                  )}

                  {!loadingLibrary && filteredImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3 overflow-visible pr-0.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {filteredImages.map((img) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => onInsertImage(img.imageUrl)}
                          className="w-full text-left border border-gray-200 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:border-emerald-400 hover:shadow-[0_2px_12px_rgba(16,185,129,0.12)] hover:-translate-y-0.5 group bg-white block"
                          title="Chèn vào Collabora"
                        >
                          {img.imageUrl && (
                            <img src={img.imageUrl} alt={img.description} className="w-full aspect-[4/3] object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                          )}
                          <div className="px-3 py-2">
                            <p className="text-[12px] font-medium text-gray-700 truncate group-hover:text-emerald-600 transition-colors">
                              {img.description || 'Ảnh không tên'}
                            </p>
                            {img.subject && <p className="text-[10px] text-gray-400 mt-0.5">Môn: {img.subject}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'pexels' && (
                <div className="mx-auto w-full max-w-7xl">
                  <PexelsImageSearch onAddImage={onInsertImage} onSaved={loadLibraryImages} accent="indigo" wide />
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="mx-auto h-full w-full max-w-7xl">
                  <AIImageGenerator onAddImage={onInsertImage} accent="indigo" wide />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <SaveImageModal
        open={showSaveModal}
        form={saveForm}
        onChange={setSaveForm}
        onClose={cancelSave}
        onSubmit={confirmSave}
        saving={uploadingToLibrary}
      />

      <IllustrationStudioModal
        open={showStudio}
        onClose={() => setShowStudio(false)}
        onSaved={() => loadLibraryImages()}
        user={user}
        savedImages={libraryImages}
      />
    </>
  );
}
