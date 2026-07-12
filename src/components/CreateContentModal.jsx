import { BookOpen, ClipboardCheck, Pencil, X } from 'lucide-react';

export default function CreateContentModal({ onClose, onCreateLesson, onCreateTest, onCreateExercise }) {
  const choices = [
    { title: 'Bài giảng', description: 'Soạn tài liệu hoặc bài trình chiếu', icon: <BookOpen className="h-5 w-5" />, color: 'from-violet-600 to-indigo-500', action: onCreateLesson },
    { title: 'Bài kiểm tra', description: 'Tạo đề kiểm tra trực tuyến', icon: <ClipboardCheck className="h-5 w-5" />, color: 'from-orange-500 to-rose-500', action: onCreateTest },
    { title: 'Bài tập', description: 'Tạo bài luyện tập cho học sinh', icon: <Pencil className="h-5 w-5" />, color: 'from-blue-600 to-cyan-500', action: onCreateExercise },
  ];

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div><h3 className="text-xl font-bold text-slate-900">Tạo nội dung mới</h3><p className="mt-1 text-sm text-slate-500">Bạn muốn bắt đầu với nội dung nào?</p></div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Đóng"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {choices.map(({ title, description, icon, color, action }) => (
            <button key={title} type="button" onClick={action} className="group rounded-2xl border border-slate-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg">
              <span className={`mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${color} text-white shadow-sm`}>{icon}</span>
              <strong className="block text-sm text-slate-900 group-hover:text-violet-700">{title}</strong>
              <span className="mt-1 block text-xs leading-relaxed text-slate-500">{description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
