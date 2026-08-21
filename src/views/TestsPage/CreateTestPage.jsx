import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import useImageLibrary from '../../hooks/useImageLibrary';
import resourceService from '../../services/resourceService';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import DashboardSidebar from '../../components/DashboardSidebar';
import { Plus, X, Trash2, Mic } from 'lucide-react';
import testApi from '../../services/testApi';
import { confirmToast } from '../../utils/toastNotifications.js';
import { useCategories } from '../../hooks/useCategories';

export default function CreateTestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const isEditing = !!id;
  const { user } = useAuthStore();
  const currentUserId = user?.id || user?.userId || null;
  const getQuestionTimestamp = (question) => {
    const timestamp = Date.parse(question?.createdAt || '');
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };
  const sortQuestionsByNewest = (questionList) => [...questionList].sort((firstQuestion, secondQuestion) => {
    const timestampDifference = getQuestionTimestamp(secondQuestion) - getQuestionTimestamp(firstQuestion);
    if (timestampDifference !== 0) return timestampDifference;
    return (Number(secondQuestion?.id) || 0) - (Number(firstQuestion?.id) || 0);
  });
  const formatQuestionCreatedAt = (createdAt) => {
    if (!createdAt) return 'Ch\u01b0a c\u00f3 th\u1eddi gian t\u1ea1o';
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return 'Ch\u01b0a c\u00f3 th\u1eddi gian t\u1ea1o';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  const { libraryImages, loadingLibrary, loadLibraryImages } = useImageLibrary();
  const { homeroomClasses, subjects } = useCategories();

  const gradeOptions = homeroomClasses.map((item) => ({
    value: `${item.gradeLevel}${item.classGroup}`,
    label: `${item.gradeLevel}${item.classGroup}`,
  }));

  const testTypeOptions = [
    { value: 'EXAM', label: 'Bài kiểm tra' },
    { value: 'EXERCISE', label: 'Bài tập' },
  ];

  const [contentOptions, setContentOptions] = useState([]);

  useEffect(() => {
    const loadContents = async () => {
      try {
        const data = await testApi.getLessonContents();
        setContentOptions(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load lesson contents', e);
      }
    };
    loadContents();
  }, []);

  const [testInfo, setTestInfo] = useState({
    name: '',
    subject: '',
    grade: '',
    lessonContentName: '',
    duration: '',
    testType: searchParams.get('type') === 'EXERCISE' ? 'EXERCISE' : 'EXAM',
  });

  useEffect(() => {
    if (!testInfo || !testInfo.lessonContentName) return;
    const selectedGrade = testInfo.grade || '';
    const found = contentOptions.find(
        (c) =>
            c.name === testInfo.lessonContentName &&
            c.subject === testInfo.subject &&
            (c.grade === selectedGrade || (selectedGrade && selectedGrade.startsWith(c.grade)))
    );
    if (!found && testInfo.lessonContentName !== '') {
      setIsOtherSelected(true);
      setCustomLessonContent(testInfo.lessonContentName);
    }
  }, [contentOptions, testInfo.lessonContentName, testInfo.subject, testInfo.grade]);

  const [questions, setQuestions] = useState([]);
  const [showQuestionSourceModal, setShowQuestionSourceModal] = useState(false);
  const [showQuestionTypeModal, setShowQuestionTypeModal] = useState(false);
  const [showExistingQuestionsModal, setShowExistingQuestionsModal] = useState(false);
  const [existingQuestions, setExistingQuestions] = useState([]);
  const [loadingExistingQuestions, setLoadingExistingQuestions] = useState(false);
  const [showQuestionDetailModal, setShowQuestionDetailModal] = useState(false);
  const [selectedQuestionDetail, setSelectedQuestionDetail] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showImageLibraryModal, setShowImageLibraryModal] = useState(false);
  const [showAudioLibraryModal, setShowAudioLibraryModal] = useState(false);
  const [currentImageQuestionId, setCurrentImageQuestionId] = useState(null);
  const [currentAudioQuestionId, setCurrentAudioQuestionId] = useState(null);
  const [recordingBlobs, setRecordingBlobs] = useState({});
  const [uploadingAudio, setUploadingAudio] = useState({});
  const [libraryAudios, setLibraryAudios] = useState([]);
  const [loadingAudioLibrary, setLoadingAudioLibrary] = useState(false);
  const [isRecording, setIsRecording] = useState({});
  const [saveStatus, setSaveStatus] = useState('DRAFT');
  const [, setLoading] = useState(false);
  const [customLessonContent, setCustomLessonContent] = useState('');
  const [filterType, setFilterType] = useState('my-questions');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterLessonContent, setFilterLessonContent] = useState('');
  const [filterTestType, setFilterTestType] = useState('all');
  const [isOtherSelected, setIsOtherSelected] = useState(false);

  const availableSubjects = Array.from(new Set(contentOptions.map((c) => c.subject).filter(Boolean)));
  const availableLessonContents = Array.from(new Set(
    contentOptions
      .filter((c) => !filterSubject || c.subject === filterSubject)
      .map((c) => c.name)
      .filter(Boolean)
  ));
  const [, setInitialLoading] = useState(isEditing);

  useEffect(() => {
    if (isEditing && id) {
      loadTestData();
    }
  }, [id]);

  const loadTestData = async () => {
    try {
      setInitialLoading(true);
      const response = await testApi.getTestById(id);
      const test = response.data || response;

      if (test) {
        setTestInfo({
          name: test.name || '',
          subject: test.subject || '',
          grade: test.grade || '',
          lessonContentName: test.lessonContentName || '',
          duration: test.duration || '',
          testType: test.testType || 'EXAM',
        });
        setSaveStatus(test.status || 'DRAFT');

        if (test.questions && test.questions.length > 0) {
          const loadedQuestions = test.questions.map((q, idx) => {
            const baseQuestion = {
              id: q.id || Date.now() + idx,
              content: q.content || '',
              points: q.points || '',
              audioUrl: q.audioUrl || null,
              imageUrl: q.imageUrl || null,
              transcript: q.transcript || '',
              testType: test.testType || 'EXAM',
            };

            switch (q.type) {
              case 'MULTIPLE_CHOICE':
                return {
                  ...baseQuestion,
                  type: 'multiple-choice',
                  title: q.title || '',
                  numberQuestions: q.numberQuestions || '',
                  answers: q.answers
                      ? q.answers.map((a, aIdx) => ({
                        id: a.id || aIdx + 1,
                        label: a.label || String.fromCharCode(65 + aIdx),
                        content: a.content || '',
                        isCorrect: a.isCorrect || false,
                      }))
                      : [
                        { id: 1, label: 'A', content: '', isCorrect: false },
                        { id: 2, label: 'B', content: '', isCorrect: false },
                        { id: 3, label: 'C', content: '', isCorrect: false },
                        { id: 4, label: 'D', content: '', isCorrect: false },
                      ],
                };
              case 'AUDIO':
                return { ...baseQuestion, type: 'audio' };
              case 'MATCHING':
                return {
                  ...baseQuestion,
                  type: 'matching',
                  matchingPairs: q.matchingPairs || [
                    { id: 1, left: '', right: '' },
                    { id: 2, left: '', right: '' },
                    { id: 3, left: '', right: '' },
                    { id: 4, left: '', right: '' },
                    { id: 5, left: '', right: '' },
                  ],
                };
              case 'FILL_IN_BLANK':
                return {
                  ...baseQuestion,
                  type: 'fill-in-blank',
                  textWithBlanks: q.textWithBlanks || '',
                  blanks: q.blanks || [{ id: 1, correctAnswer: '', points: 1 }],
                };
              case 'ESSAY':
                return {
                  ...baseQuestion,
                  type: 'essay',
                  prompt: q.prompt || '',
                  maxLength: q.maxLength || 500,
                };
              default:
                return {
                  ...baseQuestion,
                  type: 'multiple-choice',
                  title: q.title || '',
                  answers: [
                    { id: 1, label: 'A', content: '', isCorrect: false },
                    { id: 2, label: 'B', content: '', isCorrect: false },
                    { id: 3, label: 'C', content: '', isCorrect: false },
                    { id: 4, label: 'D', content: '', isCorrect: false },
                  ],
                };
            }
          });
          setQuestions(loadedQuestions);
        }
      }
    } catch (error) {
      console.error('Error loading test:', error);
      window.showAlertToast('Lỗi khi tải thông tin bài kiểm tra');
      navigate('/tests');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadExistingQuestions = async () => {
    try {
      setLoadingExistingQuestions(true);
      const qs = await testApi.getFilteredQuestions(filterType, filterSubject, filterLessonContent, filterTestType === 'all' ? '' : filterTestType);
      setExistingQuestions(sortQuestionsByNewest(qs || []));
    } catch (error) {
      console.error('Error loading existing questions:', error);
      window.showAlertToast('Lỗi khi tải danh sách câu hỏi cũ');
    } finally {
      setLoadingExistingQuestions(false);
    }
  };

  useEffect(() => {
    if (showExistingQuestionsModal) {
      loadExistingQuestions();
    }
  }, [filterType, filterSubject, filterLessonContent, filterTestType, showExistingQuestionsModal]);

  const addMultipleChoiceQuestion = () => {
    setQuestions([...questions, {
      id: Date.now(),
      type: 'multiple-choice',
      title: '',
      numberQuestions: '',
      points: '',
      testType: testInfo.testType,
      answers: [
        { id: 1, label: 'A', content: '', isCorrect: false },
        { id: 2, label: 'B', content: '', isCorrect: false },
        { id: 3, label: 'C', content: '', isCorrect: false },
        { id: 4, label: 'D', content: '', isCorrect: false },
      ],
    }]);
    setShowQuestionTypeModal(false);
  };

  const addAudioQuestion = () => {
    setQuestions([...questions, {
      id: Date.now(),
      type: 'audio',
      content: '',
      points: '',
      testType: testInfo.testType,
      audioUrl: null,
      imageUrl: null,
      transcript: '',
    }]);
    setShowQuestionTypeModal(false);
  };

  const addMatchingQuestion = () => {
    setQuestions([...questions, {
      id: Date.now(),
      type: 'matching',
      content: '',
      points: '',
      testType: testInfo.testType,
      matchingPairs: [
        { id: 1, left: '', right: '' },
        { id: 2, left: '', right: '' },
        { id: 3, left: '', right: '' },
        { id: 4, left: '', right: '' },
        { id: 5, left: '', right: '' },
      ],
    }]);
    setShowQuestionTypeModal(false);
  };

  const addFillInBlankQuestion = () => {
    setQuestions([...questions, {
      id: Date.now(),
      type: 'fill-in-blank',
      content: '',
      points: '',
      testType: testInfo.testType,
      textWithBlanks: '',
      blanks: [{ id: 1, position: 0, correctAnswer: '', points: 1 }],
    }]);
    setShowQuestionTypeModal(false);
  };

  const addEssayQuestion = () => {
    setQuestions([...questions, {
      id: Date.now(),
      type: 'essay',
      content: '',
      points: '',
      testType: testInfo.testType,
      prompt: '',
      maxLength: 500,
    }]);
    setShowQuestionTypeModal(false);
  };

  const addExistingQuestion = (existingQuestion) => {
    const baseQuestion = {
      id: Date.now(),
      content: existingQuestion.content || '',
      points: existingQuestion.points || '',
      audioUrl: existingQuestion.audioUrl || null,
      imageUrl: existingQuestion.imageUrl || null,
      transcript: existingQuestion.transcript || '',
      testType: existingQuestion.testType || testInfo.testType,
    };

    let newQuestion;
    switch (existingQuestion.type) {
      case 'MULTIPLE_CHOICE':
        newQuestion = {
          ...baseQuestion,
          type: 'multiple-choice',
          title: existingQuestion.title || '',
          numberQuestions: existingQuestion.numberQuestions || '',
          answers: existingQuestion.answers || [
            { id: 1, label: 'A', content: '', isCorrect: false },
            { id: 2, label: 'B', content: '', isCorrect: false },
            { id: 3, label: 'C', content: '', isCorrect: false },
            { id: 4, label: 'D', content: '', isCorrect: false },
          ],
        };
        break;
      case 'AUDIO':
        newQuestion = { ...baseQuestion, type: 'audio' };
        break;
      case 'MATCHING':
        newQuestion = {
          ...baseQuestion,
          type: 'matching',
          matchingPairs: existingQuestion.matchingPairs || [
            { id: 1, left: '', right: '' },
            { id: 2, left: '', right: '' },
            { id: 3, left: '', right: '' },
            { id: 4, left: '', right: '' },
            { id: 5, left: '', right: '' },
          ],
        };
        break;
      case 'FILL_IN_BLANK':
        newQuestion = {
          ...baseQuestion,
          type: 'fill-in-blank',
          textWithBlanks: existingQuestion.textWithBlanks || '',
          blanks: existingQuestion.blanks || [{ id: 1, correctAnswer: '', points: 1 }],
        };
        break;
      case 'ESSAY':
        newQuestion = {
          ...baseQuestion,
          type: 'essay',
          prompt: existingQuestion.prompt || '',
          maxLength: existingQuestion.maxLength || 500,
        };
        break;
      default:
        newQuestion = {
          ...baseQuestion,
          type: 'multiple-choice',
          title: existingQuestion.title || '',
          answers: [
            { id: 1, label: 'A', content: '', isCorrect: false },
            { id: 2, label: 'B', content: '', isCorrect: false },
            { id: 3, label: 'C', content: '', isCorrect: false },
            { id: 4, label: 'D', content: '', isCorrect: false },
          ],
        };
    }

    setQuestions([...questions, newQuestion]);
    setShowExistingQuestionsModal(false);
  };

  const normalizeGrade = (grade) => {
    if (!grade) return '';
    const match = grade.toString().match(/^(\d+)/);
    return match ? match[1] : grade;
  };

  const handleTestInfoChange = (field, value) => {
    setTestInfo((prev) => ({ ...prev, [field]: value, ...(field === 'subject' || field === 'grade' ? { lessonContentName: '' } : {}) }));
    if (field === 'subject' || field === 'grade') {
      setIsOtherSelected(false);
      setCustomLessonContent('');
    }
    if (field === 'testType') {
      setQuestions((prev) => prev.map((q) => ({ ...q, testType: value })));
    }
  };

  const updateQuestionField = (questionId, field, value) => {
    setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, [field]: value } : q))
    );
  };

  const handleMultipleChoiceUpdate = (questionId, field, value) => {
    updateQuestionField(questionId, field, value);
  };

  const handleAnswerUpdate = (questionId, answerId, field, value) => {
    setQuestions((prev) =>
        prev.map((q) => {
          if (q.id === questionId) {
            return {
              ...q,
              answers: q.answers.map((a) =>
                  a.id === answerId ? { ...a, [field]: value } : a
              ),
            };
          }
          return q;
        })
    );
  };

  const buildQuestionPayload = (q, orderIndex) => {
    const type = q.type ? q.type.toString().trim().toUpperCase().replace(/-/g, '_') : '';
    const baseQuestion = {
      content: q.content || '',
      points: q.points ? parseInt(q.points, 10) : 0,
      orderIndex,
      audioUrl: q.audioUrl || null,
      imageUrl: q.imageUrl || null,
      transcript: q.transcript || '',
    };

    switch (type) {
      case 'MULTIPLE_CHOICE':
        return {
          ...baseQuestion,
          type: 'MULTIPLE_CHOICE',
          title: q.title || '',
          numberQuestions: 0,
          answers: (q.answers || []).map((a, aIdx) => ({
            id: a.id || aIdx + 1,
            label: a.label || String.fromCharCode(65 + aIdx),
            content: a.content || '',
            isCorrect: a.isCorrect || false,
          })),
        };
      case 'AUDIO':
        return { ...baseQuestion, type: 'AUDIO', title: '', numberQuestions: 0 };
      case 'MATCHING':
        return {
          ...baseQuestion,
          type: 'MATCHING',
          title: '',
          numberQuestions: 0,
          matchingPairs: (q.matchingPairs || []).map((pair) => ({
            left: pair.left || '',
            right: pair.right || '',
          })),
        };
      case 'FILL_IN_BLANK':
        return {
          ...baseQuestion,
          type: 'FILL_IN_BLANK',
          title: '',
          numberQuestions: 0,
          textWithBlanks: q.textWithBlanks || '',
          blanks: q.blanks || [],
        };
      case 'ESSAY':
        return {
          ...baseQuestion,
          type: 'ESSAY',
          title: '',
          numberQuestions: 0,
          prompt: q.prompt || '',
          maxLength: q.maxLength || 500,
        };
      default:
        return {
          ...baseQuestion,
          type: 'MULTIPLE_CHOICE',
          title: q.title || '',
          numberQuestions: 0,
          answers: (q.answers || []).map((a, aIdx) => ({
            id: a.id || aIdx + 1,
            label: a.label || String.fromCharCode(65 + aIdx),
            content: a.content || '',
            isCorrect: a.isCorrect || false,
          })),
        };
    }
  };

  const handleAudioQuestionUpdate = (questionId, field, value) => {
    updateQuestionField(questionId, field, value);
  };

  const openImageLibrary = async (questionId) => {
    setCurrentImageQuestionId(questionId);
    setShowImageLibraryModal(true);
    await loadLibraryImages();
  };

  const selectLibraryImage = (questionId, imageUrl) => {
    updateQuestionField(questionId, 'imageUrl', imageUrl);
    setShowImageLibraryModal(false);
    setCurrentImageQuestionId(null);
  };

  const openAudioLibrary = async (questionId) => {
    setCurrentAudioQuestionId(questionId);
    setShowAudioLibraryModal(true);
    await loadAudioLibrary();
  };

  const loadAudioLibrary = async () => {
    try {
      setLoadingAudioLibrary(true);
      const response = await resourceService.getAllAudios();
      setLibraryAudios(response?.success ? response.data || [] : []);
    } catch (error) {
      console.error('Error loading audio library:', error);
      setLibraryAudios([]);
    } finally {
      setLoadingAudioLibrary(false);
    }
  };

  const selectLibraryAudio = (questionId, audioUrl) => {
    updateQuestionField(questionId, 'audioUrl', audioUrl);
    setShowAudioLibraryModal(false);
    setCurrentAudioQuestionId(null);
  };

  const handleUploadQuestionImage = async (questionId, file) => {
    if (!file) return;
    try {
      const uploadResponse = await resourceService.uploadImage(
          file, file.name, testInfo.subject, user?.id,
          user?.fullName || user?.name || user?.username || 'Unknown'
      );
      const imageUrl = uploadResponse?.imageUrl || uploadResponse?.image_url || uploadResponse?.data?.imageUrl;
      if (!imageUrl) throw new Error('Không nhận được đường dẫn ảnh từ server');
      updateQuestionField(questionId, 'imageUrl', imageUrl);
    } catch (error) {
      console.error('Error uploading question image:', error);
      window.showAlertToast('Lỗi khi tải ảnh lên. Vui lòng thử lại.');
    }
  };

  const handleUploadQuestionAudio = async (questionId, file) => {
    if (!file) return;
    if (!file.type.startsWith('audio/')) { window.showAlertToast('Vui lòng chọn file âm thanh hợp lệ'); return; }
    try {
      setUploadingAudio((prev) => ({ ...prev, [questionId]: true }));
      const uploadResponse = await resourceService.uploadAudio(
          file, file.name, testInfo.subject, user?.id,
          user?.fullName || user?.name || user?.username || 'Unknown'
      );
      const audioUrl = uploadResponse?.audioUrl || uploadResponse?.audio_url || uploadResponse?.data?.audioUrl || uploadResponse?.data?.audio_url;
      if (!audioUrl) throw new Error('Không nhận được đường dẫn audio từ server');
      updateQuestionField(questionId, 'audioUrl', audioUrl);
    } catch (error) {
      console.error('Error uploading question audio:', error);
      window.showAlertToast('Lỗi khi tải audio lên. Vui lòng thử lại.');
    } finally {
      setUploadingAudio((prev) => { const next = { ...prev }; delete next[questionId]; return next; });
    }
  };

  const handleUploadRecordedAudio = async (questionId) => {
    const blob = recordingBlobs[questionId];
    if (!blob) { window.showAlertToast('Chưa có ghi âm để tải lên'); return; }
    try {
      setUploadingAudio((prev) => ({ ...prev, [questionId]: true }));
      const uploadResponse = await resourceService.uploadAudio(
          blob, `recording-${Date.now()}.wav`, testInfo.subject, user?.id,
          user?.fullName || user?.name || user?.username || 'Unknown'
      );
      const audioUrl = uploadResponse?.audioUrl || uploadResponse?.audio_url || uploadResponse?.data?.audioUrl || uploadResponse?.data?.audio_url;
      if (!audioUrl) throw new Error('Không nhận được đường dẫn audio từ server');
      updateQuestionField(questionId, 'audioUrl', audioUrl);
      setRecordingBlobs((prev) => { const next = { ...prev }; delete next[questionId]; return next; });
      window.showAlertToast('Ghi âm đã được tải lên và lưu trong thư viện');
    } catch (error) {
      console.error('Error uploading recorded audio:', error);
      window.showAlertToast('Lỗi khi tải ghi âm lên. Vui lòng thử lại.');
    } finally {
      setUploadingAudio((prev) => { const next = { ...prev }; delete next[questionId]; return next; });
    }
  };

  const deleteQuestion = (questionId) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const startRecording = async (questionId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        handleAudioQuestionUpdate(questionId, 'audioUrl', url);
        setRecordingBlobs((prev) => ({ ...prev, [questionId]: blob }));
      };
      mediaRecorder.start();
      setIsRecording((prev) => ({ ...prev, [questionId]: mediaRecorder }));
    } catch (error) {
      console.error('Error accessing microphone:', error);
      window.showAlertToast('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  const stopRecording = (questionId) => {
    const mediaRecorder = isRecording[questionId];
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setIsRecording((prev) => { const newState = { ...prev }; delete newState[questionId]; return newState; });
    }
  };

  const isRemoteAudioUrl = (audioUrl) => {
    return typeof audioUrl === 'string' && /^(https?:)?\/\//.test(audioUrl);
  };

  const autoUploadRecordedAudios = async () => {
    const { user } = useAuthStore.getState();
    const updatedQuestions = [...questions];
    let uploadedCount = 0;

    for (const [questionId, audioBlob] of Object.entries(recordingBlobs)) {
      if (!audioBlob) continue;
      const questionIdx = updatedQuestions.findIndex((q) => q.id === parseInt(questionId, 10));
      if (questionIdx === -1) continue;
      const question = updatedQuestions[questionIdx];
      if (question.audioUrl && isRemoteAudioUrl(question.audioUrl)) continue; // already uploaded remote audio

      try {
        const uploadResponse = await resourceService.uploadAudio(
          audioBlob,
          `auto-upload-${Date.now()}.wav`,
          testInfo.subject,
          user?.id,
          user?.fullName || user?.name || user?.username || 'Unknown'
        );
        const uploadedUrl = uploadResponse?.audioUrl || uploadResponse?.audio_url || uploadResponse?.data?.audioUrl || uploadResponse?.data?.audio_url;
        if (uploadedUrl) {
          updatedQuestions[questionIdx] = { ...question, audioUrl: uploadedUrl };
          uploadedCount++;
        }
      } catch (error) {
        console.warn(`Failed to auto-upload audio for question ${questionId}:`, error);
      }
    }

    if (uploadedCount > 0) {
      setQuestions(updatedQuestions);
    }
    return updatedQuestions;
  };

  const handleSaveTest = async (status = saveStatus) => {
    setShowSaveModal(false);
    if (!testInfo.name || !testInfo.subject || !testInfo.duration) {
      window.showAlertToast('Vui lòng điền đầy đủ thông tin bài kiểm tra'); return;
    }
    if (questions.length === 0) { window.showAlertToast('Vui lòng thêm ít nhất 1 câu hỏi'); return; }

    try {
      const invalidMatching = questions.some((q) => q.type === 'matching' && (q.matchingPairs || []).some((pair) => !pair.left?.trim() || !pair.right?.trim()));
      if (invalidMatching) {
        window.showAlertToast('Vui lòng điền đầy đủ các cặp nối từ hoặc xóa các cặp trống trước khi lưu.');
        return;
      }
      setLoading(true);
      
      // Auto-upload any recorded audio that hasn't been uploaded yet
      const finalQuestions = await autoUploadRecordedAudios();
      
      const { user } = useAuthStore.getState();
      const testData = {
        name: testInfo.name,
        subject: testInfo.subject,
        lessonContentName: testInfo.lessonContentName,
        grade: testInfo.grade,
        duration: parseInt(testInfo.duration, 10),
        testType: testInfo.testType,
        status,
        userId: user?.id,
        userName: user?.fullName || user?.name || user?.username || 'Unknown',
        questions: finalQuestions.map((q, index) => buildQuestionPayload(q, index)),
      };

      console.log('Saving test payload', {
        ...testData,
        questions: testData.questions.map((q) => ({
          ...q,
          matchingPairs: q.matchingPairs?.length ? q.matchingPairs : undefined,
        })),
      });
      testData.questions.forEach((q, idx) => {
        if (q.type === 'MATCHING') {
          console.log(`Saving matching question #${idx}`, q.matchingPairs);
        }
      });

      if (isEditing && id) {
        await testApi.updateTest(id, testData);
        window.showAlertToast('Cập nhật bài kiểm tra thành công!');
      } else {
        await testApi.createTest(testData);
        window.showAlertToast('Lưu bài kiểm tra thành công!');
      }
      navigate('/tests');
    } catch (error) {
      console.error('Error saving test:', error);
      const message = error.response?.data?.message || error.message || 'Lỗi khi lưu bài kiểm tra';
      window.showAlertToast(`Lỗi khi lưu bài kiểm tra: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTest = async (includeAnswers) => {
    if (!testInfo.name || !testInfo.subject || questions.length === 0) {
      window.showAlertToast('Vui lòng hoàn thành bài kiểm tra trước khi tải xuống'); return;
    }
    try {
      const testData = {
        name: testInfo.name,
        subject: testInfo.subject,
        lessonContentName: testInfo.lessonContentName,
        grade: testInfo.grade,
        duration: parseInt(testInfo.duration, 10),
        testType: testInfo.testType,
        includeAnswers,
        questions: questions.map((q, index) => buildQuestionPayload(q, index)),
      };
      await testApi.downloadTestAsDocx(testData);
    } catch (error) {
      console.error('Error downloading test:', error);
      window.showAlertToast('Lỗi khi tải xuống file');
    }
  };

  const handleCancel = async () => {
    if (testInfo.name || testInfo.subject || testInfo.duration || questions.length > 0) {
      if (await confirmToast('Bạn có chắc muốn hủy? Tất cả dữ liệu sẽ bị xóa.', { title: 'Hủy soạn bài kiểm tra', confirmLabel: 'Hủy và thoát', cancelLabel: 'Tiếp tục soạn', tone: 'warning' })) {
        window.showAlertToast('Đã hủy soạn bài kiểm tra.');
        navigate('/tests');
      }
    } else {
      navigate('/tests');
    }
  };

  const renderQuestionContent = (question) => {
    switch (question.type) {
      case 'multiple-choice':
        return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" value={question.title} onChange={(e) => handleMultipleChoiceUpdate(question.id, 'title', e.target.value)} placeholder="Tên đề" className="px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all" />
                <input type="number" value={question.points} onChange={(e) => handleMultipleChoiceUpdate(question.id, 'points', e.target.value)} placeholder="Điểm" className="px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Nội dung câu hỏi</label>
                <textarea value={question.content} onChange={(e) => handleMultipleChoiceUpdate(question.id, 'content', e.target.value)} placeholder="Nhập nội dung câu hỏi" className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all resize-none" rows="4" />
              </div>
              <div className="space-y-4 border-t pt-4">
                <label className="block text-sm font-medium text-gray-700">Hình ảnh câu hỏi</label>
                {question.imageUrl && (
                    <div className="mb-3">
                      <img src={question.imageUrl} alt="Ảnh câu hỏi" className="w-full max-h-60 object-contain rounded-lg border border-gray-200" />
                      <button type="button" onClick={() => updateQuestionField(question.id, 'imageUrl', null)} className="mt-2 text-red-600 hover:text-red-800">Xóa ảnh</button>
                    </div>
                )}
                <div className="flex flex-wrap gap-3 items-center">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-200">
                    Chọn file ảnh
                    <input type="file" accept="image/*" onChange={(e) => handleUploadQuestionImage(question.id, e.target.files?.[0])} className="hidden" />
                  </label>
                  <button type="button" onClick={() => openImageLibrary(question.id)} className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600">Chọn từ thư viện</button>
                </div>
              </div>
              <div className="space-y-3 border-t pt-4">
                <label className="block text-sm font-medium text-gray-700">Đáp án</label>
                {question.answers.map((answer) => (
                    <div key={answer.id} className="flex items-center gap-3">
                      <span className="font-semibold text-gray-700 w-6">{answer.label}:</span>
                      <input type="text" value={answer.content} onChange={(e) => handleAnswerUpdate(question.id, answer.id, 'content', e.target.value)} placeholder={`Nhập đáp án ${answer.label}`} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all" />
                      <input type="checkbox" checked={answer.isCorrect} onChange={(e) => handleAnswerUpdate(question.id, answer.id, 'isCorrect', e.target.checked)} className="w-5 h-5 cursor-pointer rounded" title="Chọn đáp án đúng" />
                    </div>
                ))}
              </div>
            </div>
        );

      case 'audio':
        return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" value={question.content} onChange={(e) => handleAudioQuestionUpdate(question.id, 'content', e.target.value)} placeholder="Nội dung câu hỏi" className="px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all" />
                <input type="number" value={question.points} onChange={(e) => handleAudioQuestionUpdate(question.id, 'points', e.target.value)} placeholder="Điểm" className="px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all" />
              </div>
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">Ghi âm câu trả lời</label>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-3 items-center">
                    {!isRecording[question.id] ? (
                        <button onClick={() => startRecording(question.id)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors">
                          <Mic className="w-4 h-4" /> Bắt đầu ghi âm
                        </button>
                    ) : (
                        <button onClick={() => stopRecording(question.id)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-500 text-white font-medium hover:bg-gray-600 transition-colors">Dừng ghi âm</button>
                    )}
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-200">
                      Tải file âm thanh
                      <input type="file" accept="audio/*" onChange={(e) => handleUploadQuestionAudio(question.id, e.target.files?.[0])} className="hidden" />
                    </label>
                    <button type="button" onClick={() => openAudioLibrary(question.id)} className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600">Chọn audio từ thư viện</button>
                  </div>
                  {question.audioUrl && (
                      <div className="flex items-center gap-3">
                        <audio controls src={question.audioUrl} className="w-full rounded-lg border border-gray-200" />
                        <button type="button" onClick={() => { updateQuestionField(question.id, 'audioUrl', null); updateQuestionField(question.id, 'transcript', ''); }} className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100">Xóa audio</button>
                      </div>
                  )}
                  {recordingBlobs[question.id] && (
                      <button type="button" onClick={() => handleUploadRecordedAudio(question.id)} disabled={uploadingAudio[question.id]} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 disabled:opacity-50">
                        {uploadingAudio[question.id] ? 'Đang tải...' : 'Tải ghi âm lên thư viện'}
                      </button>
                  )}
                </div>
                <div className="space-y-4 mt-6">
                  <label className="block text-sm font-medium text-gray-700">Hình ảnh câu hỏi</label>
                  {question.imageUrl && (
                      <div className="mb-3">
                        <img src={question.imageUrl} alt="Ảnh câu hỏi" className="w-full max-h-60 object-contain rounded-lg border border-gray-200" />
                        <button type="button" onClick={() => updateQuestionField(question.id, 'imageUrl', null)} className="mt-2 text-red-600 hover:text-red-800">Xóa ảnh</button>
                      </div>
                  )}
                  <div className="flex flex-wrap gap-3 items-center">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-200">
                      Chọn file ảnh
                      <input type="file" accept="image/*" onChange={(e) => handleUploadQuestionImage(question.id, e.target.files?.[0])} className="hidden" />
                    </label>
                    <button type="button" onClick={() => openImageLibrary(question.id)} className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600">Chọn từ thư viện</button>
                  </div>
                </div>
              </div>
            </div>
        );

      case 'matching':
        return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" value={question.content} onChange={(e) => updateQuestionField(question.id, 'content', e.target.value)} placeholder="Nội dung câu hỏi" className="px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-green-300 focus:ring-2 focus:ring-green-100 transition-all" />
                <input type="number" value={question.points} onChange={(e) => updateQuestionField(question.id, 'points', e.target.value)} placeholder="Điểm" className="px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-green-300 focus:ring-2 focus:ring-green-100 transition-all" />
              </div>
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">Các cặp từ cần nối</label>
                {question.matchingPairs?.map((pair, idx) => (
                    <div key={pair.id} className="flex items-center gap-3 mb-3">
                      <span className="font-semibold text-gray-700 w-8">{idx + 1}.</span>
                      <input type="text" value={pair.left} onChange={(e) => { const newPairs = [...question.matchingPairs]; newPairs[idx] = { ...newPairs[idx], left: e.target.value }; updateQuestionField(question.id, 'matchingPairs', newPairs); }} placeholder="Từ bên trái" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-green-300 focus:ring-2 focus:ring-green-100 transition-all" />
                      <span className="text-gray-500">→</span>
                      <input type="text" value={pair.right} onChange={(e) => { const newPairs = [...question.matchingPairs]; newPairs[idx] = { ...newPairs[idx], right: e.target.value }; updateQuestionField(question.id, 'matchingPairs', newPairs); }} placeholder="Từ bên phải" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-green-300 focus:ring-2 focus:ring-green-100 transition-all" />
                      <button onClick={() => updateQuestionField(question.id, 'matchingPairs', question.matchingPairs.filter((_, i) => i !== idx))} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                ))}
                <button onClick={() => updateQuestionField(question.id, 'matchingPairs', [...(question.matchingPairs || []), { id: Date.now(), left: '', right: '' }])} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600">
                  <Plus className="w-4 h-4" /> Thêm cặp từ
                </button>
              </div>
            </div>
        );

      case 'fill-in-blank':
        return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" value={question.content} onChange={(e) => updateQuestionField(question.id, 'content', e.target.value)} placeholder="Nội dung câu hỏi" className="px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all" />
                <input type="number" value={question.points} onChange={(e) => updateQuestionField(question.id, 'points', e.target.value)} placeholder="Điểm" className="px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all" />
              </div>
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">Đoạn văn có chỗ trống</label>
                <textarea value={question.textWithBlanks || ''} onChange={(e) => updateQuestionField(question.id, 'textWithBlanks', e.target.value)} placeholder="Nhập đoạn văn và sử dụng [BLANK_1], [BLANK_2] cho chỗ trống" className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all resize-none" rows="6" />
                <p className="text-sm text-gray-500 mt-2">Sử dụng [BLANK_1], [BLANK_2], v.v. để đánh dấu chỗ trống</p>
              </div>
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">Đáp án cho chỗ trống</label>
                {question.blanks?.map((blank, idx) => (
                    <div key={blank.id} className="flex items-center gap-3 mb-3">
                      <span className="font-semibold text-gray-700 w-20">Chỗ trống {idx + 1}:</span>
                      <input type="text" value={blank.correctAnswer} onChange={(e) => { const newBlanks = [...question.blanks]; newBlanks[idx] = { ...newBlanks[idx], correctAnswer: e.target.value }; updateQuestionField(question.id, 'blanks', newBlanks); }} placeholder="Đáp án đúng" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all" />
                      <input type="number" value={blank.points} onChange={(e) => { const newBlanks = [...question.blanks]; newBlanks[idx] = { ...newBlanks[idx], points: parseInt(e.target.value) || 0 }; updateQuestionField(question.id, 'blanks', newBlanks); }} placeholder="Điểm" className="w-20 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all" />
                      <button onClick={() => updateQuestionField(question.id, 'blanks', question.blanks.filter((_, i) => i !== idx))} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                ))}
                <button onClick={() => updateQuestionField(question.id, 'blanks', [...(question.blanks || []), { id: Date.now(), correctAnswer: '', points: 1 }])} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600">
                  <Plus className="w-4 h-4" /> Thêm chỗ trống
                </button>
              </div>
            </div>
        );

      case 'essay':
        return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" value={question.content} onChange={(e) => updateQuestionField(question.id, 'content', e.target.value)} placeholder="Nội dung câu hỏi" className="px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all" />
                <input type="number" value={question.points} onChange={(e) => updateQuestionField(question.id, 'points', e.target.value)} placeholder="Điểm" className="px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all" />
              </div>
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">Yêu cầu bài viết</label>
                <textarea value={question.prompt || ''} onChange={(e) => updateQuestionField(question.id, 'prompt', e.target.value)} placeholder="Nhập yêu cầu chi tiết cho bài viết" className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all resize-none" rows="4" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Độ dài tối đa (ký tự)</label>
                  <input type="number" value={question.maxLength || 500} onChange={(e) => updateQuestionField(question.id, 'maxLength', parseInt(e.target.value) || 500)} placeholder="500" className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all" />
                </div>
              </div>
            </div>
        );

      default:
        return <div>Loại câu hỏi không được hỗ trợ</div>;
    }
  };

  return (
      <div className="min-h-screen bg-[#f8f7ff]">
        <Navbar />
        <div className="flex" style={{ paddingTop: '64px' }}>
          <DashboardSidebar />
          <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)]" style={{ marginLeft: '72px' }}>
            <main className="flex-1 p-6">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Tạo bài kiểm tra mới</h1>

                <div className="bg-white rounded-xl p-6 border border-gray-100 mb-8 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Thông tin bài kiểm tra</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tên bài kiểm tra</label>
                      <input type="text" value={testInfo.name} onChange={(e) => handleTestInfoChange('name', e.target.value)} placeholder="Nhập tên bài kiểm tra" className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Môn học</label>
                      <select value={testInfo.subject} onChange={(e) => handleTestInfoChange('subject', e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all">
                        <option value="">Chọn môn học</option>
                        {subjects.map((subject) => <option key={subject.value} value={subject.value}>{subject.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lớp</label>
                      <select value={testInfo.grade} onChange={(e) => handleTestInfoChange('grade', e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all">
                        <option value="">Chọn lớp</option>
                        {gradeOptions.map((grade) => <option key={grade.value} value={grade.value}>{grade.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Loại bài</label>
                      <select value={testInfo.testType} onChange={(e) => handleTestInfoChange('testType', e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all">
                        {testTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tên nội dung bài học</label>
                      {!isOtherSelected ? (
                          <select value={testInfo.lessonContentName || ''} onChange={(e) => { const v = e.target.value; if (v === '__other__') { setIsOtherSelected(true); setCustomLessonContent(''); handleTestInfoChange('lessonContentName', ''); } else { setIsOtherSelected(false); handleTestInfoChange('lessonContentName', v); } }} className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all">
                            <option value="">Chọn nội dung</option>
                            {contentOptions.filter((c) => { if (!testInfo.subject || !testInfo.grade) return false; return c.subject === testInfo.subject && normalizeGrade(testInfo.grade) === normalizeGrade(c.grade); }).map((c) => <option key={`${c.subject}-${c.grade}-${c.name}`} value={c.name}>{c.name}</option>)}
                            <option value="__other__">Khác (tự nhập)</option>
                          </select>
                      ) : (
                          <input type="text" value={testInfo.lessonContentName || customLessonContent} onChange={(e) => { const v = e.target.value; setCustomLessonContent(v); handleTestInfoChange('lessonContentName', v); }} placeholder="Nhập tên nội dung bài học" className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all" />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian làm bài (phút)</label>
                      <input type="number" value={testInfo.duration} onChange={(e) => handleTestInfoChange('duration', e.target.value)} placeholder="Thời gian (phút)" className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all" />
                    </div>
                  </div>
                  <div className="text-center">
                    <button onClick={() => setShowQuestionSourceModal(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all duration-200">
                      <Plus className="w-4 h-4" /> Tạo câu hỏi
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {questions.map((question, index) => (
                      <div key={question.id} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">
                            Câu hỏi {index + 1} -{' '}
                            {question.type === 'multiple-choice' ? 'Trắc nghiệm' : question.type === 'audio' ? 'Âm thanh' : question.type === 'matching' ? 'Nối từ' : question.type === 'fill-in-blank' ? 'Điền khuyết' : question.type === 'essay' ? 'Tự luận' : 'Không xác định'}
                            {question.testType && (
                              <span className="ml-2 text-sm font-medium text-blue-600">({question.testType === 'EXAM' ? 'Bài kiểm tra' : 'Bài tập'})</span>
                            )}
                          </h3>
                          <button onClick={() => deleteQuestion(question.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {renderQuestionContent(question)}
                      </div>
                  ))}
                </div>

                {questions.length > 0 && (
                    <div className="mt-6 flex justify-center">
                      <button onClick={() => setShowQuestionSourceModal(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-500 text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all duration-200">
                        <Plus className="w-4 h-4" /> Thêm câu hỏi
                      </button>
                    </div>
                )}

                <div className="flex flex-col items-center gap-4 mt-10 mb-8 sm:flex-row sm:justify-center">
                  <button onClick={handleCancel} className="px-6 py-2.5 rounded-xl bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-all">Hủy</button>
                  <button onClick={() => setShowDownloadModal(true)} className="px-6 py-2.5 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-all">Tải xuống</button>
                  <button onClick={() => setShowSaveModal(true)} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all">Lưu</button>
                </div>
              </div>
            </main>
          </div>
        </div>

        {/* Modal: Chọn nguồn câu hỏi */}
        {showQuestionSourceModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Chọn nguồn câu hỏi</h2>
                  <button onClick={() => setShowQuestionSourceModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                <div className="space-y-3">
                  <button onClick={() => { setShowQuestionSourceModal(false); setShowQuestionTypeModal(true); }} className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all text-left">
                    <div className="font-semibold text-gray-900">🆕 Câu hỏi mới</div>
                    <div className="text-sm text-gray-600 mt-1">Tạo câu hỏi mới từ đầu</div>
                  </button>
                  <button onClick={async () => { setShowQuestionSourceModal(false); await loadExistingQuestions(); setShowExistingQuestionsModal(true); }} className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
                    <div className="font-semibold text-gray-900">📚 Câu hỏi cũ</div>
                    <div className="text-sm text-gray-600 mt-1">Chọn từ các câu hỏi đã tạo trước đây</div>
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Modal: Chọn loại câu hỏi */}
        {showQuestionTypeModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Chọn loại câu hỏi</h2>
                  <button onClick={() => setShowQuestionTypeModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                <div className="space-y-3">
                  <button onClick={addMultipleChoiceQuestion} className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all text-left">
                    <div className="font-semibold text-gray-900">📋 Câu hỏi trắc nghiệm</div>
                    <div className="text-sm text-gray-600 mt-1">Chọn đáp án đúng từ A, B, C, D</div>
                  </button>
                  <button onClick={addAudioQuestion} className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
                    <div className="font-semibold text-gray-900">🎤 Câu hỏi âm thanh</div>
                    <div className="text-sm text-gray-600 mt-1">Trả lời bằng ghi âm phát âm</div>
                  </button>
                  <button onClick={addMatchingQuestion} className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all text-left">
                    <div className="font-semibold text-gray-900">🔗 Câu hỏi nối từ</div>
                    <div className="text-sm text-gray-600 mt-1">Nối các cặp từ từ trái sang phải</div>
                  </button>
                  <button onClick={addFillInBlankQuestion} className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all text-left">
                    <div className="font-semibold text-gray-900">📝 Câu hỏi điền khuyết</div>
                    <div className="text-sm text-gray-600 mt-1">Điền từ vào chỗ trống trong đoạn văn</div>
                  </button>
                  <button onClick={addEssayQuestion} className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 transition-all text-left">
                    <div className="font-semibold text-gray-900">✍️ Câu hỏi tự luận</div>
                    <div className="text-sm text-gray-600 mt-1">Viết bài luận với textarea</div>
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Modal: Câu hỏi cũ */}
        {showExistingQuestionsModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-xl p-6 max-w-5xl w-full shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Chọn câu hỏi cũ</h2>
                    <p className="text-sm text-gray-500">Chọn câu hỏi từ danh sách đã tạo của bạn.</p>
                  </div>
                  <button onClick={() => setShowExistingQuestionsModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Lọc câu hỏi</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Nguồn câu hỏi</label>
                      <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300">
                        <option value="my-questions">Câu hỏi của tôi</option>
                        <option value="other-questions">Câu hỏi của người khác</option>
                        <option value="all">Tất cả câu hỏi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Loại bài</label>
                      <select value={filterTestType} onChange={(e) => setFilterTestType(e.target.value)} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300">
                        <option value="all">Tất cả loại</option>
                        <option value="EXAM">Bài kiểm tra</option>
                        <option value="EXERCISE">Bài tập</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Môn học</label>
                      <select value={filterSubject} onChange={(e) => { setFilterSubject(e.target.value); setFilterLessonContent(''); }} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300">
                        <option value="">Tất cả môn</option>
                        {availableSubjects.map((subject) => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Bài học</label>
                      <select value={filterLessonContent} onChange={(e) => setFilterLessonContent(e.target.value)} className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300">
                        <option value="">Tất cả bài học</option>
                        {availableLessonContents.map((lessonName) => (
                          <option key={lessonName} value={lessonName}>{lessonName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">&nbsp;</label>
                      <button onClick={loadExistingQuestions} disabled={loadingExistingQuestions} className="w-full px-3 py-1 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400">
                        {loadingExistingQuestions ? 'Đang lọc...' : 'Làm mới'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="overflow-y-auto flex-1">
                  {loadingExistingQuestions ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                        <p className="text-gray-600 mt-2">Đang tải danh sách câu hỏi...</p>
                      </div>
                  ) : existingQuestions.length === 0 ? (
                      <div className="text-center py-8"><p className="text-gray-600">Không tìm thấy câu hỏi nào.</p></div>
                  ) : (
                      <div className="space-y-3">
                        {existingQuestions.map((question) => {
                          const authorLabel = question.createdBy === currentUserId ? 'Của bạn' : (question.createdByName || 'Không rõ');
                          const questionTypeLabel = question.type === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm'
                            : question.type === 'AUDIO' ? 'Âm thanh'
                            : question.type === 'MATCHING' ? 'Nối từ'
                            : question.type === 'FILL_IN_BLANK' ? 'Điền khuyết'
                            : question.type === 'ESSAY' ? 'Tự luận'
                            : 'Không xác định';
                          return (
                            <div key={question.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:bg-orange-50 transition-all">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap gap-2 mb-3 items-center">
                                    <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-1 rounded">{questionTypeLabel}</span>
                                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{question.points || 0} điểm</span>
                                    {question.subject && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{question.subject}</span>}
                                    {question.lessonContentName && <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">{question.lessonContentName}</span>}
                                  </div>
                                  <div className="text-sm text-gray-900 font-semibold mb-1 line-clamp-2">{question.title || question.content || 'Không có nội dung'}</div>
                                  {question.title && question.content && (
                                    <div className="text-xs text-slate-600 line-clamp-2">{question.content}</div>
                                  )}
                                  <div className="mt-3 text-xs text-gray-600">
                                    <span className="font-medium">Người tạo:</span> {authorLabel}
                                    <span className="ml-2">{'\u00b7 T\u1ea1o l\u00fac: '}{formatQuestionCreatedAt(question.createdAt)}</span>
                                  </div>
                                </div>
                                <div className="ml-3 flex gap-2 flex-shrink-0">
                                  <button onClick={() => { setSelectedQuestionDetail(question); setShowQuestionDetailModal(true); }} className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors">Xem</button>
                                  <button onClick={() => addExistingQuestion(question)} className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors">Chọn</button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                  )}
                </div>
                <div className="flex justify-end mt-4 pt-4 border-t">
                  <button onClick={() => { setShowExistingQuestionsModal(false); setShowQuestionSourceModal(true); }} className="px-4 py-2 text-gray-600 hover:text-gray-800">Quay trở lại</button>
                </div>
              </div>
            </div>
        )}

        {/* Modal: Xem chi tiết câu hỏi */}
        {showQuestionDetailModal && selectedQuestionDetail && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-xl overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Xem chi tiết câu hỏi</h2>
                  <button onClick={() => setShowQuestionDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Loại câu hỏi</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedQuestionDetail.type === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : selectedQuestionDetail.type === 'AUDIO' ? 'Âm thanh' : selectedQuestionDetail.type === 'MATCHING' ? 'Nối từ' : selectedQuestionDetail.type === 'FILL_IN_BLANK' ? 'Điền khuyết' : selectedQuestionDetail.type === 'ESSAY' ? 'Tự luận' : 'Không xác định'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Điểm</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedQuestionDetail.points} điểm</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Môn học</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedQuestionDetail.subject || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Bài học</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedQuestionDetail.lessonContentName || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-medium text-gray-600 mb-1">Tác giả</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedQuestionDetail.createdBy === currentUserId ? 'Của bạn' : (selectedQuestionDetail.createdByName || 'N/A')}</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-xs font-medium text-gray-600 mb-2">Nội dung câu hỏi</p>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedQuestionDetail.content || selectedQuestionDetail.title || 'Không có nội dung'}</p>
                    </div>
                  </div>
                  {selectedQuestionDetail.type === 'MULTIPLE_CHOICE' && selectedQuestionDetail.answers && (
                      <div className="border-t pt-4">
                        <p className="text-xs font-medium text-gray-600 mb-2">Các phương án</p>
                        <div className="space-y-2">
                          {selectedQuestionDetail.answers.map((answer, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="text-xs font-semibold bg-gray-200 px-2 py-1 rounded min-w-[24px] text-center">{answer.label}</span>
                                <span className={`text-sm ${answer.isCorrect ? 'text-green-700 font-semibold' : 'text-gray-700'}`}>{answer.content}</span>
                                {answer.isCorrect && <span className="text-xs text-green-600 font-semibold">(Đúng)</span>}
                              </div>
                          ))}
                        </div>
                      </div>
                  )}
                  {selectedQuestionDetail.type === 'ESSAY' && (
                      <div className="border-t pt-4">
                        <p className="text-xs font-medium text-gray-600 mb-2">Đề bài</p>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">{selectedQuestionDetail.prompt}</p>
                        <p className="text-xs text-gray-600 mt-2">Độ dài tối đa: {selectedQuestionDetail.maxLength} ký tự</p>
                      </div>
                  )}
                  {selectedQuestionDetail.audioUrl && (
                      <div className="border-t pt-4">
                        <p className="text-xs font-medium text-gray-600 mb-2">Âm thanh</p>
                        <audio controls src={selectedQuestionDetail.audioUrl} className="w-full rounded-lg border border-gray-200" />
                        {selectedQuestionDetail.transcript && <p className="text-xs text-gray-600 mt-2"><strong>Transcript:</strong> {selectedQuestionDetail.transcript}</p>}
                      </div>
                  )}
                  {selectedQuestionDetail.imageUrl && (
                      <div className="border-t pt-4">
                        <p className="text-xs font-medium text-gray-600 mb-2">Hình ảnh</p>
                        <img src={selectedQuestionDetail.imageUrl} alt="Question" className="w-full max-h-48 object-contain rounded-lg border border-gray-200" />
                      </div>
                  )}
                </div>
                <div className="flex justify-between mt-6 pt-4 border-t">
                  <button onClick={() => setShowQuestionDetailModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Trở lại</button>
                  <button onClick={() => { addExistingQuestion(selectedQuestionDetail); setShowQuestionDetailModal(false); setShowExistingQuestionsModal(false); }} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">Chọn câu hỏi này</button>
                </div>
              </div>
            </div>
        )}

        {/* Modal: Lưu bài kiểm tra */}
        {showSaveModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Chọn cách lưu bài kiểm tra</h2>
                  <button onClick={() => setShowSaveModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                <div className="space-y-3">
                  <button onClick={() => handleSaveTest('DRAFT')} className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all text-left">
                    <div className="font-semibold text-gray-900">Lưu bản nháp</div>
                    <div className="text-sm text-gray-600 mt-1">Bài kiểm tra được lưu lại nhưng chưa xuất bản.</div>
                  </button>
                  <button onClick={() => handleSaveTest('PUBLISHED')} className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all text-left">
                    <div className="font-semibold text-gray-900">Lưu đã hoàn thành</div>
                    <div className="text-sm text-gray-600 mt-1">Bài kiểm tra được lưu và đánh dấu là hoàn thành.</div>
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Modal: Tải xuống */}
        {showDownloadModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Tải xuống bài kiểm tra</h2>
                    <p className="text-sm text-gray-500">Chọn tải bản có đáp án hoặc không có đáp án.</p>
                  </div>
                  <button onClick={() => setShowDownloadModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                <div className="space-y-3">
                  <button type="button" onClick={() => { setShowDownloadModal(false); handleDownloadTest(true); }} className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all text-left">
                    <div className="font-semibold text-gray-900">Tải có đáp án</div>
                    <div className="text-sm text-gray-600 mt-1">Dành cho giáo viên tham khảo, file có đáp án đúng.</div>
                  </button>
                  <button type="button" onClick={() => { setShowDownloadModal(false); handleDownloadTest(false); }} className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
                    <div className="font-semibold text-gray-900">Tải không đáp án</div>
                    <div className="text-sm text-gray-600 mt-1">Dành cho học sinh, file không ghi đáp án đúng.</div>
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Modal: Thư viện ảnh */}
        {showImageLibraryModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-xl p-6 max-w-4xl w-full shadow-xl overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Chọn ảnh từ thư viện</h2>
                    <p className="text-sm text-gray-500">Tải lên hoặc chọn ảnh đã lưu trong thư viện của bạn.</p>
                  </div>
                  <button onClick={() => { setShowImageLibraryModal(false); setCurrentImageQuestionId(null); }} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
                    <p className="text-sm text-gray-600 mb-3">Chưa có ảnh? Bạn có thể tải hình mới lên.</p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium cursor-pointer hover:bg-blue-600">
                      Tải ảnh lên
                      <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file && currentImageQuestionId) handleUploadQuestionImage(currentImageQuestionId, file); }} className="hidden" />
                    </label>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-600 mb-3">Ảnh trong thư viện</p>
                    {loadingLibrary ? (
                        <div className="text-sm text-gray-500">Đang tải thư viện...</div>
                    ) : libraryImages.length === 0 ? (
                        <div className="text-sm text-gray-500">Chưa có ảnh trong thư viện.</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto">
                          {libraryImages.map((img) => (
                              <button key={img.id} type="button" onClick={() => selectLibraryImage(currentImageQuestionId, img.imageUrl)} className="border rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-orange-400">
                                <img src={img.imageUrl} alt={img.description || 'Library image'} className="w-full h-28 object-cover" />
                              </button>
                          ))}
                        </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Modal: Thư viện audio */}
        {showAudioLibraryModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-xl p-6 max-w-4xl w-full shadow-xl overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Chọn âm thanh từ thư viện</h2>
                    <p className="text-sm text-gray-500">Chọn một file âm thanh đã tải lên trước đó.</p>
                  </div>
                  <button onClick={() => { setShowAudioLibraryModal(false); setCurrentAudioQuestionId(null); }} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  {loadingAudioLibrary ? (
                      <div className="text-sm text-gray-500">Đang tải thư viện audio...</div>
                  ) : libraryAudios.length === 0 ? (
                      <div className="text-sm text-gray-500">Chưa có audio trong thư viện.</div>
                  ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                        {libraryAudios.map((audio) => (
                            <button key={audio.id} type="button" onClick={() => selectLibraryAudio(currentAudioQuestionId, audio.audioUrl)} className="border rounded-xl p-4 text-left hover:border-orange-500 transition-all">
                              <div className="font-semibold text-gray-900">{audio.name || audio.title || 'Audio'}</div>
                              <div className="text-sm text-gray-500 truncate">{audio.description || audio.originalFilename || audio.audioUrl}</div>
                              <audio controls src={audio.audioUrl} className="mt-3 w-full" />
                            </button>
                        ))}
                      </div>
                  )}
                </div>
              </div>
            </div>
        )}

        <Footer />
      </div>
  );
}
