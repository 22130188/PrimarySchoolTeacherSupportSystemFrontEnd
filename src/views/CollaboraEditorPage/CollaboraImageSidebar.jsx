import { useEffect, useState } from 'react';
import { ImagePlus, Loader2, Palette, Search, Sparkles, Upload, X } from 'lucide-react';
import { LIBRARY_SUBJECT_OPTIONS } from '../../data/aiImageConstants';
import useImageLibrary from '../../hooks/useImageLibrary';
import AIImageGenerator from '../../common/AIImageGenerator';
import PexelsImageSearch from '../../common/PexelsImageSearch';
import SaveImageModal from '../../common/SaveImageModal';
import IllustrationStudioModal from '../../common/IllustrationStudioModal';

const TABS = [
  { id: 'images', icon: ImagePlus, label: 'Ảnh' },
  { id: 'pexels', icon: Search, label: 'Pexels' },
  { id: 'ai', icon: Sparkles, label: 'AI' },
];

const PANEL_TITLES = {
  images: 'Hình ảnh',
  pexels: 'Pexels',
  ai: 'Tạo ảnh AI',
};

export default function CollaboraImageSidebar({ onInsertImage }) {
  const [activeTab, setActiveTab] = useState('images');
  const [expanded, setExpanded] = useState(true);
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

  useEffect(() => {
    if (activeTab === 'images' && expanded && user?.id) {
      loadLibraryImages();
    }
  }, [activeTab, expanded, user?.id, loadLibraryImages]);

  const handleTabClick = (tabId) => {
    if (activeTab === tabId && expanded) {
      setExpanded(false);
      return;
    }
    setActiveTab(tabId);
    setExpanded(true);
  };

  return (
    <>
      <div className="w-[52px] min-w-[52px] bg-white border-r border-gray-200 flex flex-col items-center py-3 gap-0.5 z-50">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && expanded;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={`w-10 h-10 rounded-[10px] border-none bg-transparent flex flex-col items-center justify-center cursor-pointer transition-all duration-150 gap-0.5 text-[9px] font-medium relative ${
                isActive
                  ? 'bg-emerald-50 text-emerald-600 before:content-[""] before:absolute before:-left-1.5 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:bg-emerald-600 before:rounded-r'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-emerald-600'
              }`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className={`bg-white border-r border-gray-200 flex flex-col overflow-hidden z-[45] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        expanded ? 'w-[280px] min-w-[280px] opacity-100' : 'w-0 min-w-0 border-0 opacity-0'
      }`}>
        {expanded && (
          <>
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100 shrink-0">
              <span className="text-sm font-semibold text-gray-800">{PANEL_TITLES[activeTab]}</span>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="w-7 h-7 rounded-md bg-transparent text-gray-400 inline-flex items-center justify-center cursor-pointer transition-all hover:bg-gray-100 hover:text-gray-600 border-none"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto [scrollbar-width:thin]">
              {activeTab === 'images' && (
                <div>
                  <input type="file" accept="image/*" ref={libraryUploadRef} onChange={handleUploadFileChange} className="hidden" />
                  <button
                    type="button"
                    onClick={() => libraryUploadRef.current?.click()}
                    disabled={uploadingToLibrary}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-none rounded-xl text-[13px] font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="w-full mt-2 py-2.5 bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-xl text-[13px] font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Palette size={15} /> Tạo hình ảnh minh họa
                  </button>

                  <div className="flex items-center justify-between mt-5 mb-3">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Thư viện ảnh</p>
                    <button type="button" onClick={loadLibraryImages} className="text-[11px] text-emerald-500 hover:text-emerald-700 font-medium transition-colors cursor-pointer bg-transparent border-none">
                      Tải lại
                    </button>
                  </div>

                  <select
                    value={librarySubject}
                    onChange={(e) => setLibrarySubject(e.target.value)}
                    className="w-full mb-3 text-[12px] border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-700 outline-none cursor-pointer transition focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                  >
                    {LIBRARY_SUBJECT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

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
                    <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                      {filteredImages.map((img) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => onInsertImage(img.imageUrl)}
                          className="w-full text-left border border-gray-200 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:border-emerald-400 hover:shadow-[0_2px_12px_rgba(16,185,129,0.12)] hover:-translate-y-0.5 group bg-white block"
                          title="Chèn vào Collabora"
                        >
                          {img.imageUrl && (
                            <img src={img.imageUrl} alt={img.description} className="w-full h-[100px] object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
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
                <PexelsImageSearch onAddImage={onInsertImage} onSaved={loadLibraryImages} accent="indigo" />
              )}

              {activeTab === 'ai' && (
                <AIImageGenerator onAddImage={onInsertImage} accent="indigo" />
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
      />
    </>
  );
}
