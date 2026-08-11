import React, { useState, useEffect } from 'react';
import './QuestionModal.css';
import { confirmToast } from '../utils/toastNotifications.js';

const QuestionModal = ({ open, question, onClose, onSave, onDelete }) => {
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (question) {
      setForm({
        title: question.title || '',
        content: question.content || '',
        points: question.points || 0,
        prompt: question.prompt || '',
        audioUrl: question.audioUrl || '',
        imageUrl: question.imageUrl || '',
        transcript: question.transcript || '',
        rubric: question.rubric || '',
        maxLength: question.maxLength || null,
        isShared: question.isShared || false,
      });
    } else {
      setForm(null);
    }
  }, [question]);

  if (!open || !form) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const save = () => {
    onSave({ ...question, ...form });
  };

  const del = async () => {
    if (await confirmToast(`Xác nhận xóa câu hỏi "${question.title || ''}"?`, { title: 'Xóa câu hỏi', confirmLabel: 'Xóa' })) {
      try {
        await onDelete(question.id);
        window.showAlertToast('Đã xóa câu hỏi thành công.');
      } catch (error) {
        window.showAlertToast(error?.message || 'Không thể xóa câu hỏi.');
      }
    }
  };

  return (
    <div className="qm-modal-overlay">
      <div className="qm-modal">
        <div className="qm-modal-header">
          <h3>Chỉnh sửa câu hỏi</h3>
          <button className="qm-close" onClick={onClose}>✖</button>
        </div>

        <div className="qm-modal-body">
          <label>Tiêu đề</label>
          <input name="title" value={form.title} onChange={handleChange} />

          <label>Nội dung</label>
          <textarea name="content" value={form.content} onChange={handleChange} rows={6} />

          <label>Điểm</label>
          <input type="number" name="points" value={form.points} onChange={handleChange} />

          <label>Gợi ý / Prompt</label>
          <textarea name="prompt" value={form.prompt} onChange={handleChange} rows={3} />

          <label>Audio URL</label>
          <input name="audioUrl" value={form.audioUrl} onChange={handleChange} />

          <label>Image URL</label>
          <input name="imageUrl" value={form.imageUrl} onChange={handleChange} />

          <label>Transcript</label>
          <input name="transcript" value={form.transcript} onChange={handleChange} />

          <label>Rubric</label>
          <input name="rubric" value={form.rubric} onChange={handleChange} />

          <label>Max Length</label>
          <input type="number" name="maxLength" value={form.maxLength || ''} onChange={handleChange} />

          <label className="qm-checkbox"><input type="checkbox" name="isShared" checked={form.isShared} onChange={handleChange} /> Đã chia sẻ</label>
        </div>

        <div className="qm-modal-footer">
          <button className="btn btn-danger" onClick={del}>🗑️ Xóa</button>
          <div style={{flex:1}} />
          <button className="btn" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={save}>Lưu</button>
        </div>
      </div>
    </div>
  );
};

export default QuestionModal;
