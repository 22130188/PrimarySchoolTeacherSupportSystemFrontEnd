import React, { useState, useEffect, useCallback } from 'react';
import { questionApi } from '../services/questionApi';
import Navbar from '../components/Navbar';
import DashboardSidebar from '../components/DashboardSidebar';
import QuestionManagerModal from '../components/QuestionManagerModal';
import QuestionFormModal from '../components/QuestionFormModal';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import { useNavigate } from 'react-router-dom';

const QuestionManagement = () => {
  const navigate = useNavigate();
  const [showManagerModal, setShowManagerModal] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [questionToDelete, setQuestionToDelete] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const loadQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await questionApi.getMyQuestions();
      setQuestions(Array.isArray(data) ? data : []);
      showNotification('Danh sách câu hỏi đã được tải', 'success');
      setCurrentPage(1); // Reset to first page on new data load
    } catch (error) {
      console.error('Failed to load questions:', error);
      showNotification('Không thể tải danh sách câu hỏi', 'error');
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    if (!showManagerModal) return undefined;

    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 500;
    let timeoutId = null;
    let cancelled = false;

    const tryLoadQuestions = async () => {
      setIsLoading(true);

      try {
        const data = await questionApi.getMyQuestions();
        if (cancelled) return;

        setQuestions(Array.isArray(data) ? data : []);
        console.log('[QuestionManagement] Successfully loaded questions:', data?.length || 0);
        setCurrentPage(1); 
      } catch (error) {
        if (cancelled) return;

        retryCount++;
        console.warn(`[QuestionManagement] Attempt ${retryCount}/${maxRetries} failed:`, error.message);

        if (retryCount < maxRetries && error.response?.status === 401) {
          timeoutId = setTimeout(tryLoadQuestions, retryDelay);
        } else {
          console.error('[QuestionManagement] All retry attempts exhausted');
          showNotification(
            `Không thể tải danh sách câu hỏi (${retryCount}/${maxRetries} lần thử)`,
            'error'
          );
          setQuestions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    tryLoadQuestions();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [showManagerModal, showNotification]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleCloseManager = () => {
    setShowManagerModal(false);
    navigate('/tests');
  };

  const handleAddNew = () => {
    setFormMode('create');
    setSelectedQuestion(null);
    setShowFormModal(true);
  };

  const handleEditQuestion = (question) => {
    setFormMode('edit');
    setSelectedQuestion(question);
    setShowFormModal(true);
  };

  const handleDeleteQuestion = (question) => {
    setQuestionToDelete(question);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!questionToDelete) return;
    try {
      setIsActionLoading(true);
      await questionApi.deleteQuestion(questionToDelete.id);
      setQuestions(questions.filter((q) => q.id !== questionToDelete.id));
      showNotification(`Câu hỏi "${questionToDelete.title}" đã bị xóa`, 'success');
          setShowDeleteDialog(false);
          setQuestionToDelete(null);
    } catch (error) {
      console.error('Failed to delete question:', error);
      showNotification(
        `Lỗi khi xóa câu hỏi: ${error.response?.data?.error || error.message}`,
        'error'
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleShare = async (question) => {
    try {
      setIsActionLoading(true);
      const newShareStatus = !question.isShared;
      await questionApi.toggleSharing(question.id, newShareStatus);

      setQuestions(
        questions.map((q) =>
          q.id === question.id ? { ...q, isShared: newShareStatus } : q
        )
      );

      const message = newShareStatus
        ? `Câu hỏi "${question.title}" đã được chia sẻ`
        : `Câu hỏi "${question.title}" hiện là riêng tư`;
      showNotification(message, 'success');
    } catch (error) {
      console.error('Failed to toggle share:', error);
      showNotification(
        `Lỗi khi thay đổi trạng thái chia sẻ: ${error.response?.data?.error || error.message}`,
        'error'
      );
    } finally {
      setIsActionLoading(false);
    }
};

  const handleFormSubmit = async (formData) => {
    try {
      setIsActionLoading(true);

      if (formMode === 'create') {
        const response = await questionApi.createQuestion(formData);
        const newQuestion = response.question || response;
        setQuestions([newQuestion, ...questions]);
        showNotification('Câu hỏi mới đã được tạo thành công', 'success');
      } else {
        const response = await questionApi.updateQuestion(selectedQuestion.id, formData);
        const updatedQuestion = response.question || response;
        setQuestions(
          questions.map((q) => (q.id === selectedQuestion.id ? updatedQuestion : q))
        );
        showNotification('Câu hỏi đã cập nhật thành công', 'success');
      }

      setShowFormModal(false);
      setSelectedQuestion(null);
    } catch (error) {
      console.error('Failed to submit form:', error);
      const errorMsg = error.response?.data?.details || error.response?.data?.error || error.message;
      const fullMsg = `Lỗi: ${errorMsg}`;
      showNotification(fullMsg, 'error');
      console.error('[QuestionManagement] Full error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Navbar />
      <div className="flex" style={{ paddingTop: '64px' }}>
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)]" style={{ marginLeft: '72px' }}>
          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
              {notification && (
                <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg font-medium text-white shadow-lg animate-in fade-in slide-in-from-bottom-4 z-40 ${
                  notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {notification.message}
                </div>
              )}
              <QuestionManagerModal
                isOpen={showManagerModal}
                isPageMode={true}
                onClose={handleCloseManager}
                questions={questions}
                onEdit={handleEditQuestion}
                onDelete={handleDeleteQuestion}
                onAddNew={handleAddNew}
                onToggleShare={handleToggleShare}
                isLoading={isLoading || isActionLoading}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          </main>
        </div>
      </div>

      <QuestionFormModal
        isOpen={showFormModal}
        mode={formMode}
        initialData={selectedQuestion}
        onClose={() => {
          setShowFormModal(false);
          setSelectedQuestion(null);
        }}
        onSubmit={handleFormSubmit}
        isLoading={isActionLoading}
      />

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        title="Xác nhận xóa"
        message={
          questionToDelete
            ? `Bạn có chắc chắn muốn xóa câu hỏi "${questionToDelete.title}"? Thao tác này không thể hoàn tác.`
            : 'Bạn có chắc chắn muốn xóa câu hỏi này?'
        }
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setQuestionToDelete(null);
        }}
        isLoading={isActionLoading}
      />
    </div>
  );
};

export default QuestionManagement;

