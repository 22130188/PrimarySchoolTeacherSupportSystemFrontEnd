import { useEffect, useState } from 'react';
import { Plus, X, Loader2, Upload, Palette } from 'lucide-react';
import { SIDEBAR_TABS, TEXT_PRESETS, PANEL_TITLES } from './editorConstants';
import { LIBRARY_SUBJECT_OPTIONS } from '../../data/aiImageConstants';
import { SHAPE_GROUPS } from '../../data/shapeLibrary';
import TablePicker from '../../common/TablePicker';
import useImageLibrary from '../../hooks/useImageLibrary';
import AIImageGenerator from '../../common/AIImageGenerator';
import PexelsImageSearch from '../../common/PexelsImageSearch';
import SaveImageModal from '../../common/SaveImageModal';
import IllustrationStudioModal from '../../common/IllustrationStudioModal';

const TABLE_QUICK = [
  { r: 2, c: 2, label: 'Bảng 2×2' },
  { r: 3, c: 3, label: 'Bảng 3×3' },
  { r: 4, c: 4, label: 'Bảng 4×4' },
  { r: 5, c: 3, label: 'Bảng 5×3' },
];

export default function LeftSidebar({
  activeTab, onTabChange, expanded, onToggle,
  onAddText, onAddTable, onAddImage, onAddShape,
  pages, currentPageIndex, onSwitchPage, onAddPage, onDeletePage,
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
            <button key={tab.id} onClick={() => handleTabClick(tab.id)} id={`sidebar-tab-${tab.id}`}
              className={`w-10 h-10 rounded-[10px] border-none bg-transparent flex flex-col items-center justify-center cursor-pointer transition-all duration-150 gap-0.5 text-[9px] font-medium relative
                ${isActive
                  ? 'bg-indigo-50 text-indigo-600 before:content-[""] before:absolute before:-left-1.5 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:bg-indigo-600 before:rounded-r'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-indigo-600'
                }`}>
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className={`bg-white border-r border-gray-200 flex flex-col overflow-hidden z-[45] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${expanded ? 'w-[280px] min-w-[280px] opacity-100' : 'w-0 min-w-0 border-0 opacity-0'}`}>
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
                  <p className="text-xs text-gray-400 mb-3.5">Nhấp để thêm văn bản vào trang</p>
                  {TEXT_PRESETS.map((preset) => (
                    <button key={preset.id} onClick={() => onAddText(preset.id)} id={`text-preset-${preset.id}`}
                      className="w-full text-left p-3.5 border border-gray-200 rounded-[10px] bg-white cursor-pointer transition-all duration-200 mb-2 block hover:border-indigo-300 hover:bg-violet-50 hover:translate-x-1 hover:shadow-[0_2px_12px_rgba(99,102,241,0.1)]">
                      <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">{preset.label}</div>
                      <div className={`leading-tight ${preset.style}`}>{preset.preview}</div>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'table' && (
                <div>
                  <p className="text-xs text-gray-400 mb-3.5">Chọn kích thước bảng</p>
                  <TablePicker onSelect={(r, c) => onAddTable(r, c)} />
                  <div className="mt-4">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-2">Mẫu nhanh</p>
                    {TABLE_QUICK.map(({ r, c, label }) => (
                      <button key={label} onClick={() => onAddTable(r, c)}
                        className="w-full text-left px-3 py-2 mb-1.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 cursor-pointer transition-all duration-150 hover:border-indigo-300 hover:bg-violet-50 hover:translate-x-0.5">
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'shapes' && (
                <div>
                  <p className="text-xs text-gray-400 mb-3.5">Nhấp để thêm hình vào trang</p>
                  <div className="space-y-4">
                    {SHAPE_GROUPS.map((group) => (
                      <div key={group.title}>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{group.title}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {group.tools.map(({ id, label, icon }) => (
                            <button key={id} onClick={() => onAddShape(id)} title={label}
                              className="group flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-2 text-gray-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-[0_6px_18px_rgba(99,102,241,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">
                              <span className="flex h-9 w-10 items-center justify-center rounded-md border border-indigo-100 bg-indigo-50 text-indigo-500 transition-colors group-hover:border-indigo-200 group-hover:bg-white group-hover:text-indigo-600">
                                {icon}
                              </span>
                              <span className="w-full text-center text-[10px] font-medium leading-tight">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'images' && (
                <div>
                  <input type="file" accept="image/*" ref={libraryUploadRef} onChange={handleUploadFileChange} className="hidden" id="library-upload-input" />
                  <button onClick={() => libraryUploadRef.current?.click()} disabled={uploadingToLibrary}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-none rounded-xl text-[13px] font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    id="library-upload-btn">
                    {uploadingToLibrary ? (
                      <><Loader2 size={15} className="animate-spin" /> Đang tải...</>
                    ) : (
                      <><Upload size={15} /> Tải ảnh lên thư viện</>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowStudio(true)}
                    className="w-full mt-2 py-2.5 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl text-[13px] font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Palette size={15} /> Tạo hình ảnh minh họa
                  </button>

                  <div className="flex items-center justify-between mt-5 mb-3">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Thư viện ảnh</p>
                    <button onClick={loadLibraryImages}
                      className="text-[11px] text-indigo-500 hover:text-indigo-700 font-medium transition-colors cursor-pointer bg-transparent border-none" title="Tải lại">
                      Tải lại
                    </button>
                  </div>

                  <select
                    value={librarySubject}
                    onChange={(e) => setLibrarySubject(e.target.value)}
                    className="w-full mb-3 text-[12px] border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-700 outline-none cursor-pointer transition focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
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
                    <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                      {filteredImages.map((img) => (
                        <button key={img.id} type="button" onClick={() => handleLibraryImageClick(img.imageUrl)}
                          className="w-full text-left border border-gray-200 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:border-indigo-400 hover:shadow-[0_2px_12px_rgba(99,102,241,0.12)] hover:-translate-y-0.5 group bg-white block"
                          title="Nhấp để thêm vào bài giảng">
                          {img.imageUrl && (
                            <img src={img.imageUrl} alt={img.description} className="w-full h-[100px] object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }} />
                          )}
                          <div className="px-3 py-2">
                            <p className="text-[12px] font-medium text-gray-700 truncate group-hover:text-indigo-600 transition-colors">
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
                <AIImageGenerator onAddImage={onAddImage} accent="indigo" />
              )}

              {activeTab === 'pexels' && (
                <PexelsImageSearch onAddImage={onAddImage} onSaved={loadLibraryImages} accent="indigo" />
              )}

              {activeTab === 'pages' && (
                <div>
                  <p className="text-xs text-gray-400 mb-3.5">{pages.length} trang</p>
                  {pages.map((page, index) => (
                    <div key={page.id} className="relative mb-3 group">
                      <div onClick={() => onSwitchPage(index)} id={`page-thumb-${index}`}
                        className={`relative w-full aspect-[595/842] rounded-lg overflow-hidden cursor-pointer transition-all duration-200 bg-white
                          ${index === currentPageIndex
                            ? 'border-2 border-indigo-600 shadow-[0_0_0_2px_rgba(79,70,229,0.2)]'
                            : 'border-2 border-gray-200 hover:border-indigo-300 hover:shadow-[0_2px_12px_rgba(99,102,241,0.12)]'
                          }`}>
                        {page.thumbnail ? (
                          <img src={page.thumbnail} alt={`Trang ${index + 1}`} className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Trang trống</div>
                        )}
                        <span className="absolute top-1.5 left-1.5 bg-black/55 text-white text-[10px] font-semibold px-[7px] py-0.5 rounded backdrop-blur-sm">{index + 1}</span>
                      </div>
                      {pages.length > 1 && (
                        <button onClick={(e) => { e.stopPropagation(); onDeletePage(index); }} id={`page-delete-${index}`}
                          className="absolute top-1 right-1 w-[22px] h-[22px] rounded-full border-none bg-red-500/85 text-white hidden group-hover:flex items-center justify-center cursor-pointer text-xs transition-all backdrop-blur-sm hover:bg-red-600 hover:scale-110">
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={onAddPage} id="add-page-btn"
                    className="w-full py-3.5 border-2 border-dashed border-gray-300 rounded-[10px] bg-transparent text-gray-500 text-[13px] font-medium cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 hover:border-indigo-400 hover:bg-violet-50 hover:text-indigo-600">
                    <Plus size={16} /> Thêm trang mới
                  </button>
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
      />
    </>
  );
}
