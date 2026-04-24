import { useNavigate } from 'react-router-dom';
import { FileText, Presentation, X } from 'lucide-react';

export default function CreateLessonModal({ onClose }) {
  const navigate = useNavigate();

  const handleSelectDocx = () => {
    onClose();
    navigate('/lessons/docx-editor');
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-[9999] animate-[fadeIn_0.2s_ease]"
      onClick={onClose} id="create-lesson-modal-overlay">
      <div
        className="bg-white rounded-3xl p-9 max-w-[540px] w-[92%] shadow-[0_24px_80px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.04)]"
        style={{ animation: 'modalScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        onClick={(e) => e.stopPropagation()}>

        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-[22px] font-bold text-gray-800 mb-1.5">Tạo bài giảng mới</h2>
            <p className="text-sm text-gray-500 mb-7">Chọn định dạng bạn muốn sử dụng</p>
          </div>
          <button onClick={onClose} id="modal-close-x"
            className="w-8 h-8 rounded-md bg-transparent text-gray-400 inline-flex items-center justify-center cursor-pointer transition-all hover:bg-gray-100 hover:text-gray-600 border-none shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* DOCX */}
        <div onClick={handleSelectDocx} id="lesson-type-docx"
          className="p-5 border-2 border-gray-200 rounded-2xl cursor-pointer transition-all duration-[220ms] flex items-center gap-4 mb-3 bg-white hover:border-indigo-400 hover:bg-gradient-to-r hover:from-violet-50 hover:to-indigo-50 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(99,102,241,0.14)]">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shrink-0">
            <FileText size={28} color="#ffffff" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">Tài liệu DOCX</h3>
            <p className="text-[13px] text-gray-500 m-0">Soạn thảo bài giảng dạng tài liệu với văn bản, hình ảnh và đồ họa</p>
          </div>
        </div>

        {/* PowerPoint (disabled) */}
        <div id="lesson-type-pptx"
          className="p-5 border-2 border-gray-200 rounded-2xl flex items-center gap-4 mb-3 bg-white opacity-45 cursor-not-allowed pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
            <Presentation size={28} color="#ffffff" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">Trình chiếu PowerPoint</h3>
            <p className="text-[13px] text-gray-500 m-0">Tạo slide trình chiếu cho bài giảng trên lớp</p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-[3px] rounded-md bg-amber-100 text-amber-800 ml-auto shrink-0">Sắp ra mắt</span>
        </div>

        <button onClick={onClose} id="modal-close-btn"
          className="mt-2 w-full py-2.5 border-none bg-transparent text-gray-500 text-sm font-medium cursor-pointer rounded-[10px] transition-all hover:bg-gray-100 hover:text-gray-700 font-[Inter,sans-serif]">
          Hủy bỏ
        </button>
      </div>
    </div>
  );
}
