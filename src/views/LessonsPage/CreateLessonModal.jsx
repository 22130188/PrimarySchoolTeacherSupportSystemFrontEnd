import { useNavigate } from 'react-router-dom';
import { FileText, Loader2, Presentation, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import collaboraApi from '../../services/collaboraApi';
import lessonCatalogApi from '../../services/lessonCatalogApi';
import { SUBJECTS, GRADES } from '../../data/editorSharedConstants';

const CUSTOM_LESSON_VALUE = '__custom_lesson__';
const DEFAULT_VOLUME = 'Chưa phân tập';
const COMMON_VOLUME_OPTIONS = ['Tập 1', 'Tập 2', 'Tập 1, 2'];
const DEFAULT_BOOK_BY_SUBJECT = {
  'Tiếng Anh': 'Global Success',
  'Tiếng Việt': 'Kết nối tri thức',
  Toán: 'Kết nối tri thức',
};

const normalizeGradeValue = (grade) => {
  if (!grade) return '';
  const match = grade.toString().match(/\d+/);
  return match ? match[0] : grade.toString();
};

const getLessonVolume = (content) => (
  content?.volume || content?.bookVolume || content?.semester || content?.term || DEFAULT_VOLUME
);
export default function CreateLessonModal({ onClose }) {
  const navigate = useNavigate();
  const [creatingType, setCreatingType] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [lessonContents, setLessonContents] = useState([]);
  const [lessonContentsLoading, setLessonContentsLoading] = useState(false);
  const [lessonContentMode, setLessonContentMode] = useState('');
  const fileInputRef = useRef(null);
  const [collaboraForm, setCollaboraForm] = useState({
    title: '',
    subject: '',
    grade: '',
    volume: '',
    book: '',
  });

  useEffect(() => {
    const loadLessonContents = async () => {
      setLessonContentsLoading(true);
      try {
        const data = await lessonCatalogApi.getCatalog();
        setLessonContents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load lesson contents:', err);
        setLessonContents([]);
      } finally {
        setLessonContentsLoading(false);
      }
    };

    loadLessonContents();
  }, []);

  const matchingLessonContents = useMemo(() => {
    const selectedGrade = normalizeGradeValue(collaboraForm.grade);
    return lessonContents.filter((content) => {
      if (content?.isActive === false) return false;
      if (collaboraForm.subject && content.subject !== collaboraForm.subject) return false;
      if (selectedGrade && normalizeGradeValue(content.grade) !== selectedGrade) return false;
      return true;
    });
  }, [collaboraForm.grade, collaboraForm.subject, lessonContents]);

  const volumeOptions = useMemo(() => {
    if (!collaboraForm.subject || !collaboraForm.grade) return [];
    return Array.from(new Set([
      ...matchingLessonContents.map(getLessonVolume).filter(Boolean),
      ...COMMON_VOLUME_OPTIONS,
    ]));
  }, [collaboraForm.grade, collaboraForm.subject, matchingLessonContents]);

  const bookOptions = useMemo(() => (
    Array.from(new Set(matchingLessonContents
      .filter((content) => !collaboraForm.volume || getLessonVolume(content) === collaboraForm.volume)
      .map((content) => content.book)
      .filter(Boolean)))
  ), [collaboraForm.volume, matchingLessonContents]);

  const defaultBook = bookOptions[0] || DEFAULT_BOOK_BY_SUBJECT[collaboraForm.subject] || '';

  const lessonNameOptions = useMemo(() => (
    matchingLessonContents
      .filter((content) => !collaboraForm.volume || getLessonVolume(content) === collaboraForm.volume)
      .map((content) => content.name)
      .filter(Boolean)
      .filter((name, index, names) => names.indexOf(name) === index)
  ), [collaboraForm.volume, matchingLessonContents]);

  const resetLessonSelection = (keepCustomTitle = false) => {
    setCollaboraForm((prev) => ({
      ...prev,
      title: keepCustomTitle && lessonContentMode === CUSTOM_LESSON_VALUE ? prev.title : '',
      book: prev.book || defaultBook,
    }));
    setLessonContentMode('');
  };

  const handleSelectSimple = (type) => {
    if (selectedType === type && !uploadFile) {
      setSelectedType('');
      return;
    }
    setSelectedType(type);
    setUploadFile(null);
    resetLessonSelection(true);
  };

  const handleSelectCollabora = (type) => {
    if (selectedType === type && !uploadFile) {
      setSelectedType('');
      return;
    }
    setSelectedType(type);
    setUploadFile(null);
    resetLessonSelection(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'docx' && ext !== 'pptx') {
      alert('Chỉ hỗ trợ file .docx hoặc .pptx');
      e.target.value = '';
      return;
    }
    setUploadFile(file);
    const type = ext === 'pptx' ? 'COLLABORA_PPTX' : 'COLLABORA_DOCX';
    setSelectedType(type);
    const baseName = file.name.replace(/\.(docx|pptx)$/i, '');
    setCollaboraForm((prev) => ({
      ...prev,
      title: prev.title || baseName,
    }));
    setLessonContentMode((prev) => prev || CUSTOM_LESSON_VALUE);
  };

  const handleUploadAndOpen = async () => {
    if (!uploadFile || !collaboraForm.title.trim() || !collaboraForm.subject || !collaboraForm.grade || !collaboraForm.volume) {
      alert('Vui lòng chọn file và nhập đầy đủ môn học, lớp, tập, tên bài giảng.');
      return;
    }
    try {
      setCreatingType('UPLOAD');
      const draft = await collaboraApi.uploadDraft({
        file: uploadFile,
        title: collaboraForm.title.trim(),
        subject: collaboraForm.subject,
        grade: collaboraForm.grade,
        volume: collaboraForm.volume,
        book: collaboraForm.book || defaultBook,
      });
      onClose();
      navigate(`/lessons/collabora-editor?draftId=${draft.id}`);
    } catch (err) {
      alert('Không thể tải file lên: ' + (err.response?.data?.message || err.message));
    } finally {
      setCreatingType('');
    }
  };

  const handleCreateCollabora = async () => {
    if (!selectedType || !collaboraForm.title.trim() || !collaboraForm.subject || !collaboraForm.grade || !collaboraForm.volume) {
      alert('Vui lòng chọn môn học, lớp, tập và tên bài giảng.');
      return;
    }

    try {
      setCreatingType(selectedType);
      const draft = await collaboraApi.createDraft({
        title: collaboraForm.title.trim(),
        subject: collaboraForm.subject,
        grade: collaboraForm.grade,
        volume: collaboraForm.volume,
        book: collaboraForm.book || defaultBook,
        type: selectedType,
      });
      onClose();
      navigate(`/lessons/collabora-editor?draftId=${draft.id}`);
    } catch (err) {
      alert('Không thể tạo bài giảng Collabora: ' + (err.response?.data?.message || err.message));
    } finally {
      setCreatingType('');
    }
  };
  const handleCreateSimple = () => {
    if (!selectedType || !collaboraForm.title.trim() || !collaboraForm.subject || !collaboraForm.grade || !collaboraForm.volume) {
      alert('Vui lòng chọn môn học, lớp, tập và tên bài giảng.');
      return;
    }

    const editorPath = selectedType === 'PPTX' ? '/lessons/pptx-editor' : '/lessons/docx-editor';
    onClose();
    navigate(editorPath, {
      state: {
        lessonDraft: {
          title: collaboraForm.title.trim(),
          subject: collaboraForm.subject,
          grade: collaboraForm.grade,
          volume: collaboraForm.volume,
          book: collaboraForm.book || defaultBook,
          type: selectedType,
        },
      },
    });
  };

  const updateCollaboraForm = (field, value) => {
    setCollaboraForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'subject' || field === 'grade') {
        next.volume = '';
        next.book = '';
        next.title = '';
        setLessonContentMode('');
      }
      if (field === 'volume') {
        const matchingBook = matchingLessonContents.find((content) => getLessonVolume(content) === value)?.book;
        next.book = matchingBook || DEFAULT_BOOK_BY_SUBJECT[next.subject] || '';
        next.title = '';
        setLessonContentMode('');
      }
      return next;
    });
  };

  const handleLessonNameChange = (value) => {
    setLessonContentMode(value);
    const selectedContent = matchingLessonContents.find((content) => (
      content.name === value && (!collaboraForm.volume || getLessonVolume(content) === collaboraForm.volume)
    ));
    setCollaboraForm((prev) => ({
      ...prev,
      title: value === CUSTOM_LESSON_VALUE ? '' : value,
      book: selectedContent?.book || prev.book || defaultBook,
    }));
  };

  const renderForm = (mode) => {
    const isUpload = mode === 'upload';
    const isSimple = mode === 'simple';
    const focusClass = isUpload
      ? 'focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
      : isSimple
        ? 'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
        : 'focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100';
    const borderClass = isUpload ? 'border-blue-100' : isSimple ? 'border-indigo-100' : 'border-emerald-100';
    const buttonClass = isUpload
      ? 'bg-blue-600 hover:bg-blue-700'
      : isSimple
        ? 'bg-indigo-600 hover:bg-indigo-700'
        : 'bg-emerald-600 hover:bg-emerald-700';
    const actionLabel = isUpload ? 'Tải lên và mở bài giảng' : isSimple ? 'Mở trình soạn thảo' : 'Tạo bài giảng';
    const handleSubmit = isUpload ? handleUploadAndOpen : isSimple ? handleCreateSimple : handleCreateCollabora;

    return (
    <div className={`mt-1 mb-3 p-4 rounded-2xl border bg-white transition-all duration-200 ${
      borderClass
    }`}>
      <div className="grid grid-cols-1 gap-3">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={collaboraForm.subject}
            onChange={(e) => updateCollaboraForm('subject', e.target.value)}
            className={`h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white outline-none ${
              focusClass
            }`}
          >
            <option value="">Chọn môn học</option>
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
          <select
            value={collaboraForm.grade}
            onChange={(e) => updateCollaboraForm('grade', e.target.value)}
            className={`h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white outline-none ${
              focusClass
            }`}
          >
            <option value="">Chọn lớp</option>
            {GRADES.map((grade) => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
        </div>
        <select
          value={collaboraForm.volume}
          onChange={(e) => updateCollaboraForm('volume', e.target.value)}
          disabled={!collaboraForm.subject || !collaboraForm.grade || lessonContentsLoading}
          className={`h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white outline-none disabled:bg-gray-50 disabled:text-gray-400 ${
            focusClass
          }`}
        >
          <option value="">{lessonContentsLoading ? 'Đang tải tập...' : 'Chọn tập'}</option>
          {volumeOptions.map((volume) => (
            <option key={volume} value={volume}>{volume}</option>
          ))}
        </select>
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Tên bài giảng</label>
          <select
            value={lessonContentMode}
            onChange={(e) => handleLessonNameChange(e.target.value)}
            disabled={!collaboraForm.subject || !collaboraForm.grade || !collaboraForm.volume || lessonContentsLoading}
            className={`w-full h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white outline-none disabled:bg-gray-50 disabled:text-gray-400 ${
              focusClass
            }`}
          >
            <option value="">Chọn tên bài giảng</option>
            {lessonNameOptions.map((lessonName) => (
              <option key={lessonName} value={lessonName}>{lessonName}</option>
            ))}
            <option value={CUSTOM_LESSON_VALUE}>Không có trong danh sách - nhập tên khác</option>
          </select>
          {(lessonContentMode === CUSTOM_LESSON_VALUE || (!lessonContentMode && uploadFile && collaboraForm.title)) && (
            <input
              value={collaboraForm.title}
              onChange={(e) => updateCollaboraForm('title', e.target.value)}
              placeholder="Nhập tên bài giảng"
              className={`mt-2 w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none ${
                focusClass
              }`}
            />
          )}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!!creatingType}
          className={`h-10 rounded-lg text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
            buttonClass
          }`}
        >
          {creatingType ? <Loader2 size={16} className="animate-spin" /> : null}
          {actionLabel}
        </button>
      </div>
    </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-[9999] animate-[fadeIn_0.2s_ease]"
      onClick={onClose} id="create-lesson-modal-overlay">
      <div
        className="bg-white rounded-3xl p-9 max-w-[540px] w-[92%] max-h-[90vh] overflow-y-auto shadow-[0_24px_80px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.04)]"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <button
            type="button"
            onClick={() => handleSelectCollabora('COLLABORA_DOCX')}
            disabled={!!creatingType}
            id="lesson-type-collabora-docx"
            className={`p-4 border-2 rounded-2xl cursor-pointer transition-all duration-[220ms] flex items-center gap-3 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed text-left ${selectedType === 'COLLABORA_DOCX' ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-100 bg-emerald-50/60 hover:border-emerald-400 hover:bg-emerald-50'}`}
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 text-white">
              {creatingType === 'COLLABORA_DOCX' ? <Loader2 size={21} className="animate-spin" /> : <FileText size={22} />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-0.5">DOCX Collabora</h3>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectCollabora('COLLABORA_PPTX')}
            disabled={!!creatingType}
            id="lesson-type-collabora-pptx"
            className={`p-4 border-2 rounded-2xl cursor-pointer transition-all duration-[220ms] flex items-center gap-3 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed text-left ${selectedType === 'COLLABORA_PPTX' ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-100 bg-emerald-50/60 hover:border-emerald-400 hover:bg-emerald-50'}`}
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 text-white">
              {creatingType === 'COLLABORA_PPTX' ? <Loader2 size={21} className="animate-spin" /> : <Presentation size={22} />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-0.5">PPTX Collabora</h3>
            </div>
          </button>
        </div>

        {(selectedType === 'COLLABORA_DOCX' || selectedType === 'COLLABORA_PPTX') && !uploadFile && renderForm('collabora')}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!!creatingType}
          id="lesson-type-upload"
          className={`w-full p-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-[220ms] flex items-center gap-4 mb-3 bg-blue-50/40 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-sky-50 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(59,130,246,0.12)] disabled:opacity-60 disabled:cursor-not-allowed text-left ${
            uploadFile ? 'border-blue-400 bg-blue-50' : 'border-blue-200'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center shrink-0">
            <Upload size={28} color="#ffffff" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-800 mb-1">Tải file từ máy tính</h3>
            <p className="text-[13px] text-gray-500 m-0">
              {uploadFile
                ? <span className="text-blue-600 font-medium truncate block">{uploadFile.name}</span>
                : 'Tải lên file .docx hoặc .pptx có sẵn và mở bằng Collabora'}
            </p>
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.pptx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          onChange={handleFileChange}
          className="hidden"
        />

        {uploadFile && renderForm('upload')}

        <button type="button" onClick={() => handleSelectSimple('DOCX')} disabled={!!creatingType} id="lesson-type-docx"
          className={`w-full p-5 border-2 rounded-2xl cursor-pointer transition-all duration-[220ms] flex items-center gap-4 mb-3 bg-white hover:border-indigo-400 hover:bg-gradient-to-r hover:from-violet-50 hover:to-indigo-50 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(99,102,241,0.14)] disabled:opacity-60 disabled:cursor-not-allowed text-left ${selectedType === 'DOCX' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shrink-0">
            <FileText size={28} color="#ffffff" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">Bài giảng trang đơn giản</h3>
            <p className="text-[13px] text-gray-500 m-0">Soạn thảo bài giảng dạng tài liệu với văn bản, hình ảnh và đồ họa</p>
          </div>
        </button>

        {selectedType === 'DOCX' && !uploadFile && renderForm('simple')}

        <button type="button" onClick={() => handleSelectSimple('PPTX')} disabled={!!creatingType} id="lesson-type-pptx"
          className={`w-full p-5 border-2 rounded-2xl cursor-pointer transition-all duration-[220ms] flex items-center gap-4 mb-3 bg-white hover:border-orange-400 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(249,115,22,0.14)] disabled:opacity-60 disabled:cursor-not-allowed text-left ${selectedType === 'PPTX' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
            <Presentation size={28} color="#ffffff" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">Bài giảng slide đơn giản</h3>
            <p className="text-[13px] text-gray-500 m-0">Tạo slide cơ bản cho bài giảng trên lớp</p>
          </div>
        </button>

        {selectedType === 'PPTX' && !uploadFile && renderForm('simple')}

        <button onClick={onClose} id="modal-close-btn"
          className="mt-2 w-full py-2.5 border-none bg-transparent text-gray-500 text-sm font-medium cursor-pointer rounded-[10px] transition-all hover:bg-gray-100 hover:text-gray-700 font-[Inter,sans-serif]">
          Hủy bỏ
        </button>
      </div>
    </div>
  );
}
