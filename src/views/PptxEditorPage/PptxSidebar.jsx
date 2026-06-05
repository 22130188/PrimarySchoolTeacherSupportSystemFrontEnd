import { useEffect, useState } from 'react';
import { X, Loader2, Upload, Palette } from 'lucide-react';
import { SIDEBAR_TABS, TEXT_PRESETS, PANEL_TITLES, SLIDE_THEME_COLORS } from './pptxConstants';
import { LIBRARY_SUBJECT_OPTIONS } from '../../data/aiImageConstants';
import { SHAPE_GROUPS } from '../../data/shapeLibrary';
import TablePicker from '../../common/TablePicker';
import useImageLibrary from '../../hooks/useImageLibrary';
import AIImageGenerator from '../../common/AIImageGenerator';
import PexelsImageSearch from '../../common/PexelsImageSearch';
import SaveImageModal from '../../common/SaveImageModal';
import IllustrationStudioModal from '../../common/IllustrationStudioModal';

export default function PptxSidebar({
  activeTab, onTabChange, expanded, onToggle,
  onAddText, onAddTable, onAddShape, onAddImage, onSetBackground,
}) {
  const {
    user, libraryUploadRef, libraryImages, loadingLibrary, uploadingToLibrary,
    loadLibraryImages, handleUploadFileChange,
    showSaveModal, saveForm, setSaveForm, cancelSave, confirmSave,
  } = useImageLibrary();

  const [librarySubject, setLibrarySubject] = useState('all');
  const [showStudio, setShowStudio] = useState(false);

  const filteredImages = librarySubject === 'all'
    ? libraryImages
    : libraryImages.filter((img) => img.subject === librarySubject);

  useEffect(() => {
    if (activeTab === 'images' && expanded && user?.id) {
      loadLibraryImages();
    }
  }, [activeTab, expanded, user?.id, loadLibraryImages]);

  const handleLibraryImageClick = (imageUrl) => {
    if (imageUrl) onAddImage(imageUrl);
  };

  const handleTabClick = (tabId) => {
    if (activeTab === tabId && expanded) { onToggle(false); }
    else { onTabChange(tabId); onToggle(true); }
  };

  return (
    <>
      <div className="w-[52px] min-w-[52px] bg-white border-r border-gray-200 flex flex-col items-center py-3 gap-0.5 z-50">
        {SIDEBAR_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && expanded;
          return (
            <button key={tab.id} onClick={() => handleTabClick(tab.id)} id={`pptx-tab-${tab.id}`}
              className={`w-10 h-10 rounded-[10px] border-none bg-transparent flex flex-col items-center justify-center cursor-pointer transition-all duration-150 gap-0.5 text-[9px] font-medium relative
                ${isActive
                  ? 'bg-orange-50 text-orange-600 before:content-[""] before:absolute before:-left-1.5 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:bg-orange-500 before:rounded-r'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-orange-600'
                }`}>
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className={`bg-white border-r border-gray-200 flex flex-col overflow-hidden z-[45] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${expanded ? 'w-[260px] min-w-[260px] opacity-100' : 'w-0 min-w-0 border-0 opacity-0'}`}>
        {expanded && (
          <>
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100 shrink-0">
              <span className="text-sm font-semibold text-gray-800">{PANEL_TITLES[activeTab] || 'Pexels'}</span>
              <button onClick={() => onToggle(false)}
                className="w-7 h-7 rounded-md bg-transparent text-gray-400 inline-flex items-center justify-center cursor-pointer transition-all hover:bg-gray-100 hover:text-gray-600 border-none">
                <X size={14} />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto [scrollbar-width:thin]">
              {activeTab === 'text' && (
                <div>
                  <p className="text-xs text-gray-400 mb-3.5">Nhấp để thêm văn bản vào slide</p>
                  {TEXT_PRESETS.map((preset) => (
                    <button key={preset.id} onClick={() => onAddText(preset.id)} id={`pptx-text-${preset.id}`}
                      className="w-full text-left p-3.5 border border-gray-200 rounded-[10px] bg-white cursor-pointer transition-all duration-200 mb-2 block hover:border-orange-300 hover:bg-orange-50 hover:translate-x-1 hover:shadow-[0_2px_12px_rgba(249,115,22,0.1)]">
                      <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">{preset.label}</div>
                      <div className={`leading-tight ${preset.style}`}>{preset.preview}</div>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'table' && (
                <div>
                  <p className="text-xs text-gray-400 mb-3.5">Chọn kích thước bảng</p>
                  <TablePicker onSelect={(r, c) => onAddTable(r, c)} accentColor="orange" />
                </div>
              )}

              {activeTab === 'shapes' && (
                <div>
                  <p className="text-xs text-gray-400 mb-3.5">Nhấp để thêm hình dạng vào slide</p>
                  <div className="mb-5 space-y-4">
                    {SHAPE_GROUPS.map((group) => (
                      <div key={group.title}>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{group.title}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {group.tools.map(({ id, label, icon }) => (
                            <button key={id} onClick={() => onAddShape(id)} id={`pptx-shape-${id}`} title={label}
                              className="group flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-2 text-gray-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 hover:shadow-[0_6px_18px_rgba(249,115,22,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
                              <span className="flex h-9 w-10 items-center justify-center rounded-md border border-orange-100 bg-orange-50 text-orange-500 transition-colors group-hover:border-orange-200 group-hover:bg-white group-hover:text-orange-600">
                                {icon}
                              </span>
                              <span className="w-full text-center text-[10px] font-medium leading-tight">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-3 font-semibold">Nền slide</p>
                    <div className="grid grid-cols-6 gap-1.5">
                      {SLIDE_THEME_COLORS.map((c) => (
                        <button key={c} onClick={() => onSetBackground(c)}
                          className="w-full aspect-square rounded-lg border border-gray-200 cursor-pointer transition-all hover:scale-110 hover:shadow-md hover:z-10 hover:relative"
                          style={{ backgroundColor: c }}
                          title={c} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'images' && (
                <div>
                  <input type="file" accept="image/*" ref={libraryUploadRef} onChange={handleUploadFileChange} className="hidden" id="pptx-library-upload" />
                  <button onClick={() => libraryUploadRef.current?.click()} disabled={uploadingToLibrary}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none rounded-xl text-[13px] font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    id="pptx-library-upload-btn">
                    {uploadingToLibrary ? (
                      <><Loader2 size={15} className="animate-spin" /> Đang tải...</>
                    ) : (
                      <><Upload size={15} /> Tải ảnh lên thư viện</>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowStudio(true)}
                    className="w-full mt-2 py-2.5 bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 rounded-xl text-[13px] font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Palette size={15} /> Tạo hình ảnh minh họa
                  </button>

                  <div className="flex items-center justify-between mt-5 mb-3">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Thư viện ảnh</p>
                    <button onClick={loadLibraryImages}
                      className="text-[11px] text-orange-500 hover:text-orange-700 font-medium transition-colors cursor-pointer bg-transparent border-none" title="Tải lại">
                      Tải lại
                    </button>
                  </div>

                  <select
                    value={librarySubject}
                    onChange={(e) => setLibrarySubject(e.target.value)}
                    className="w-full mb-3 text-[12px] border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-700 outline-none cursor-pointer transition focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
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
                      {librarySubject === 'all'
                        ? <>Chưa có ảnh nào trong thư viện.<br /><span className="text-[10px]">Tải ảnh lên hoặc tạo ảnh từ tab <strong>AI</strong></span></>
                        : <>Chưa có ảnh môn <strong>{librarySubject}</strong></>
                      }
                    </div>
                  )}

                  {!loadingLibrary && filteredImages.length > 0 && (
                    <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                      {filteredImages.map((img) => (
                        <button key={img.id} type="button" onClick={() => handleLibraryImageClick(img.imageUrl)}
                          className="w-full text-left border border-gray-200 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:border-orange-400 hover:shadow-[0_2px_12px_rgba(249,115,22,0.12)] hover:-translate-y-0.5 group bg-white block"
                          title="Nhấp để thêm vào slide">
                          {img.imageUrl && (
                            <img src={img.imageUrl} alt={img.description} className="w-full h-[80px] object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }} />
                          )}
                          <div className="px-3 py-2">
                            <p className="text-[12px] font-medium text-gray-700 truncate group-hover:text-orange-600 transition-colors">
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

              {activeTab === 'ai' && (
                <AIImageGenerator onAddImage={onAddImage} accent="orange" />
              )}

              {activeTab === 'pexels' && (
                <PexelsImageSearch onAddImage={onAddImage} onSaved={loadLibraryImages} accent="orange" />
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
