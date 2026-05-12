import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import DashboardSidebar from '../../components/DashboardSidebar';
import { Plus, X, Trash2, Mic, Send, Loader2 } from 'lucide-react';
import testApi from '../../services/testApi';

export default function CreateTestPage() {
  const navigate = useNavigate();
  const { id } = useParams();  
  const isEditing = !!id;
  
  const [testInfo, setTestInfo] = useState({
    name: '',
    subject: '',
    grade: '',
    duration: '',
  });

  const [questions, setQuestions] = useState([]);
  const [showQuestionTypeModal, setShowQuestionTypeModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [recordingId, setRecordingId] = useState(null);
  const [isRecording, setIsRecording] = useState({});
  const [saveStatus, setSaveStatus] = useState('DRAFT');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

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
          duration: test.duration || '',
        });
        setSaveStatus(test.status || 'DRAFT');
        
        if (test.questions && test.questions.length > 0) {
          const loadedQuestions = test.questions.map((q, idx) => ({
            id: q.id || Date.now() + idx,
            type: q.type === 'MULTIPLE_CHOICE' ? 'multiple-choice' : 'audio',
            content: q.content || '',
            points: q.points || '',
            title: q.title || '',
            numberQuestions: q.numberQuestions || '',
            answers: q.answers ? q.answers.map((a, aIdx) => ({
              id: a.id || aIdx + 1,
              label: a.label || String.fromCharCode(65 + aIdx),
              content: a.content || '',
              isCorrect: a.isCorrect || false,
            })) : [
              { id: 1, label: 'A', content: '', isCorrect: false },
              { id: 2, label: 'B', content: '', isCorrect: false },
              { id: 3, label: 'C', content: '', isCorrect: false },
              { id: 4, label: 'D', content: '', isCorrect: false },
            ],
            audioUrl: q.audioUrl || null,
            transcript: q.transcript || '',
          }));
          setQuestions(loadedQuestions);
        }
      }
    } catch (error) {
      console.error('Error loading test:', error);
      alert('Lỗi khi tải thông tin bài kiểm tra');
      navigate('/tests');
    } finally {
      setInitialLoading(false);
    }
  };

  const addMultipleChoiceQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      type: 'multiple-choice',
      title: '',
      numberQuestions: '',
      points: '',
      answers: [
        { id: 1, label: 'A', content: '', isCorrect: false },
        { id: 2, label: 'B', content: '', isCorrect: false },
        { id: 3, label: 'C', content: '', isCorrect: false },
        { id: 4, label: 'D', content: '', isCorrect: false },
      ],
    };
    setQuestions([...questions, newQuestion]);
    setShowQuestionTypeModal(false);
  };

  const addAudioQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      type: 'audio',
      content: '',
      points: '',
      audioUrl: null,
      transcript: '',
    };
    setQuestions([...questions, newQuestion]);
    setShowQuestionTypeModal(false);
  };

  const handleTestInfoChange = (field, value) => {
    setTestInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleMultipleChoiceUpdate = (questionId, field, value) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, [field]: value } : q
      )
    );
  };

  const handleAnswerUpdate = (questionId, answerId, field, value) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            answers: q.answers.map((a) =>
              a.id === answerId
                ? field === 'isCorrect'
                  ? { ...a, [field]: value }
                  : { ...a, [field]: value }
                : a
            ),
          };
        }
        return q;
      })
    );
  };

  const handleAudioQuestionUpdate = (questionId, field, value) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, [field]: value } : q
      )
    );
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
      };

      mediaRecorder.start();
      setIsRecording((prev) => ({ ...prev, [questionId]: mediaRecorder }));
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  const stopRecording = (questionId) => {
    const mediaRecorder = isRecording[questionId];
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setIsRecording((prev) => {
        const newState = { ...prev };
        delete newState[questionId];
        return newState;
      });
    }
  };

  // Lưu bài kiểm tra
  const handleSaveTest = async (status = saveStatus) => {
    setShowSaveModal(false);
    if (!testInfo.name || !testInfo.subject || !testInfo.duration) {
      alert('Vui lòng điền đầy đủ thông tin bài kiểm tra');
      return;
    }

    if (questions.length === 0) {
      alert('Vui lòng thêm ít nhất 1 câu hỏi');
      return;
    }

    try {
      setLoading(true);
      const { user } = useAuthStore.getState();
      const testData = {
        name: testInfo.name,
        subject: testInfo.subject,
        grade: testInfo.grade,
        duration: parseInt(testInfo.duration, 10),
        status,
        userId: user?.id,
        userName: user?.fullName || user?.name || user?.username || 'Unknown',
        questions: questions.map((q, index) => {
          const baseQuestion = {
            type: q.type === 'multiple-choice' ? 'MULTIPLE_CHOICE' : 'AUDIO',
            content: q.content || '',
            points: q.points ? parseInt(q.points, 10) : 0,
            title: q.title || '',
            numberQuestions: q.numberQuestions ? parseInt(q.numberQuestions, 10) : 0,
            orderIndex: index,
            audioUrl: q.audioUrl || null,
            transcript: q.transcript || '',
          };

          if (q.type === 'multiple-choice') {
            return {
              ...baseQuestion,
              answers: (q.answers || []).map((a, aIdx) => ({
                id: a.id || aIdx + 1,
                label: a.label || String.fromCharCode(65 + aIdx),
                content: a.content || '',
                isCorrect: a.isCorrect || false,
              })),
            };
          }

          return baseQuestion;
        }),
      };

      if (isEditing && id) {
        await testApi.updateTest(id, testData);
        alert('Cập nhật bài kiểm tra thành công!');
      } else {
        await testApi.createTest(testData);
        alert('Lưu bài kiểm tra thành công!');
      }
      navigate('/tests');
    } catch (error) {
      console.error('Error saving test:', error);
      const message = error.response?.data?.message || error.message || 'Lỗi khi lưu bài kiểm tra';
      alert(`Lỗi khi lưu bài kiểm tra: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTest = async () => {
    if (!testInfo.name || !testInfo.subject || questions.length === 0) {
      alert('Vui lòng hoàn thành bài kiểm tra trước khi tải xuống');
      return;
    }

    try {
      const testData = {
        name: testInfo.name,
        subject: testInfo.subject,
        grade: testInfo.grade,
        duration: parseInt(testInfo.duration, 10),
        questions: questions.map((q, index) => {
          const baseQuestion = {
            type: q.type === 'multiple-choice' ? 'MULTIPLE_CHOICE' : 'AUDIO',
            content: q.content || '',
            points: q.points ? parseInt(q.points, 10) : 0,
            title: q.title || '',
            numberQuestions: q.numberQuestions ? parseInt(q.numberQuestions, 10) : 0,
            orderIndex: index,
            audioUrl: q.audioUrl || null,
            transcript: q.transcript || '',
          };

          if (q.type === 'multiple-choice') {
            return {
              ...baseQuestion,
              answers: (q.answers || []).map((a, aIdx) => ({
                id: a.id || aIdx + 1,
                label: a.label || String.fromCharCode(65 + aIdx),
                content: a.content || '',
                isCorrect: a.isCorrect || false,
              })),
            };
          }

          return baseQuestion;
        }),
      };

      await testApi.downloadTestAsDocx(testData);
    } catch (error) {
      console.error('Error downloading test:', error);
      alert('Lỗi khi tải xuống file');
    }
  };

  const handleCancel = () => {
    if (
      testInfo.name ||
      testInfo.subject ||
      testInfo.duration ||
      questions.length > 0
    ) {
      if (window.confirm('Bạn có chắc muốn hủy? Tất cả dữ liệu sẽ bị xóa.')) {
        navigate('/tests');
      }
    } else {
      navigate('/tests');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Navbar />
      <div className="flex" style={{ paddingTop: '64px' }}>
        <DashboardSidebar />
        <div
          className="flex-1 flex flex-col min-h-[calc(100vh-64px)]"
          style={{ marginLeft: '72px' }}
        >
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">
                Tạo bài kiểm tra mới
              </h1>

              <div className="bg-white rounded-xl p-6 border border-gray-100 mb-8 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Thông tin bài kiểm tra
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên bài kiểm tra
                    </label>
                    <input
                      type="text"
                      value={testInfo.name}
                      onChange={(e) =>
                        handleTestInfoChange('name', e.target.value)
                      }
                      placeholder="Nhập tên bài kiểm tra"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Môn học
                    </label>
                    <input
                      type="text"
                      value={testInfo.subject}
                      onChange={(e) =>
                        handleTestInfoChange('subject', e.target.value)
                      }
                      placeholder="VD: Tiếng Anh"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lớp
                    </label>
                    <input
                      type="text"
                      value={testInfo.grade}
                      onChange={(e) =>
                        handleTestInfoChange('grade', e.target.value)
                      }
                      placeholder="VD: 6A, 10B"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={testInfo.duration}
                      onChange={(e) =>
                        handleTestInfoChange('duration', e.target.value)
                      }
                      placeholder="VD: 60"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setShowQuestionTypeModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Tạo câu hỏi
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Câu hỏi {index + 1} -{' '}
                        {question.type === 'multiple-choice'
                          ? 'Trắc nghiệm'
                          : 'Âm thanh'}
                      </h3>
                      <button
                        onClick={() => deleteQuestion(question.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {question.type === 'multiple-choice' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={question.title}
                            onChange={(e) =>
                              handleMultipleChoiceUpdate(
                                question.id,
                                'title',
                                e.target.value
                              )
                            }
                            placeholder="Tên đề"
                            className="px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                          />
                          <input
                            type="number"
                            value={question.numberQuestions}
                            onChange={(e) =>
                              handleMultipleChoiceUpdate(
                                question.id,
                                'numberQuestions',
                                e.target.value
                              )
                            }
                            placeholder="Số câu"
                            className="px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                          />
                          <input
                            type="number"
                            value={question.points}
                            onChange={(e) =>
                              handleMultipleChoiceUpdate(
                                question.id,
                                'points',
                                e.target.value
                              )
                            }
                            placeholder="Điểm"
                            className="px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Nội dung câu hỏi
                          </label>
                          <textarea
                            value={question.content}
                            onChange={(e) =>
                              handleMultipleChoiceUpdate(
                                question.id,
                                'content',
                                e.target.value
                              )
                            }
                            placeholder="Nhập nội dung câu hỏi"
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all resize-none"
                            rows="4"
                          />
                        </div>

                        <div className="space-y-3 border-t pt-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Đáp án
                          </label>
                          {question.answers.map((answer) => (
                            <div
                              key={answer.id}
                              className="flex items-center gap-3"
                            >
                              <span className="font-semibold text-gray-700 w-6">
                                {answer.label}:
                              </span>
                              <input
                                type="text"
                                value={answer.content}
                                onChange={(e) =>
                                  handleAnswerUpdate(
                                    question.id,
                                    answer.id,
                                    'content',
                                    e.target.value
                                  )
                                }
                                placeholder={`Nhập đáp án ${answer.label}`}
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                              />
                              <input
                                type="checkbox"
                                checked={answer.isCorrect}
                                onChange={(e) =>
                                  handleAnswerUpdate(
                                    question.id,
                                    answer.id,
                                    'isCorrect',
                                    e.target.checked
                                  )
                                }
                                className="w-5 h-5 cursor-pointer rounded"
                                title="Chọn đáp án đúng"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={question.content}
                            onChange={(e) =>
                              handleAudioQuestionUpdate(
                                question.id,
                                'content',
                                e.target.value
                              )
                            }
                            placeholder="Nội dung câu hỏi"
                            className="px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                          />
                          <input
                            type="number"
                            value={question.points}
                            onChange={(e) =>
                              handleAudioQuestionUpdate(
                                question.id,
                                'points',
                                e.target.value
                              )
                            }
                            placeholder="Điểm"
                            className="px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                          />
                        </div>

                        <div className="border-t pt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Ghi âm câu trả lời
                          </label>
                          <div className="flex items-center gap-3">
                            {!isRecording[question.id] ? (
                              <button
                                onClick={() => startRecording(question.id)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                              >
                                <Mic className="w-4 h-4" />
                                Bắt đầu ghi âm
                              </button>
                            ) : (
                              <button
                                onClick={() => stopRecording(question.id)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-500 text-white font-medium hover:bg-gray-600 transition-colors"
                              >
                                Dừng ghi âm
                              </button>
                            )}
                            {question.audioUrl && (
                              <div className="flex-1">
                                <audio
                                  controls
                                  src={question.audioUrl}
                                  className="w-full"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {questions.length > 0 && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => setShowQuestionTypeModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-500 text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm câu hỏi
                  </button>
                </div>
              )}

              <div className="flex flex-col items-center gap-4 mt-10 mb-8 sm:flex-row sm:justify-center">
                <button
                  onClick={handleCancel}
                  className="px-6 py-2.5 rounded-xl bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDownloadTest}
                  className="px-6 py-2.5 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-all"
                >
                  Tải xuống
                </button>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all"
                >
                  Lưu
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>

      {showQuestionTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Chọn loại câu hỏi
              </h2>
              <button
                onClick={() => setShowQuestionTypeModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={addMultipleChoiceQuestion}
                className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all text-left"
              >
                <div className="font-semibold text-gray-900">
                  📋 Câu hỏi trắc nghiệm
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Chọn đáp án đúng từ A, B, C, D
                </div>
              </button>

              <button
                onClick={addAudioQuestion}
                className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <div className="font-semibold text-gray-900">
                  🎤 Câu hỏi âm thanh
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Trả lời bằng ghi âm phát âm
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Chọn cách lưu bài kiểm tra
              </h2>
              <button
                onClick={() => setShowSaveModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleSaveTest('DRAFT')}
                className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all text-left"
              >
                <div className="font-semibold text-gray-900">Lưu bản nháp</div>
                <div className="text-sm text-gray-600 mt-1">
                  Bài kiểm tra được lưu lại nhưng chưa xuất bản.
                </div>
              </button>
              <button
                onClick={() => handleSaveTest('PUBLISHED')}
                className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all text-left"
              >
                <div className="font-semibold text-gray-900">Lưu đã hoàn thành</div>
                <div className="text-sm text-gray-600 mt-1">
                  Bài kiểm tra được lưu và đánh dấu là hoàn thành.
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
