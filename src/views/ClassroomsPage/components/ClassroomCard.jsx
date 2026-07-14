import { MoreVertical, Users, Copy, Link2, GraduationCap, BookOpen, RotateCcw, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';

export default function ClassroomCard({
  classroom,
  isTeacher,
  onViewDetail,
  onCopyLink,
  onCopyCode,
  onRestore,
  onPermanentDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const teacherAvatar = classroom.teacherAvatarUrl
    || (isTeacher && user?.avatarUrl ? user.avatarUrl : null);
  const isWritable = (classroom.status || 'ACTIVE') === 'ACTIVE';
  const isArchived = classroom.status === 'ARCHIVED';
  const showMenu = isTeacher && (isWritable || isArchived);

  return (
    <div
      className="group bg-white rounded-xl border border-black/40 overflow-hidden hover:-translate-y-1 transition-all duration-300 cursor-pointer relative"
      onClick={() => onViewDetail?.(classroom.id)}
    >
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br from-violet-500 to-teal-400 opacity-40 group-hover:opacity-55 transition-opacity duration-300" />


      <div className="relative p-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center border border-black/15 shrink-0 overflow-hidden">
            {teacherAvatar ? (
              <img
                src={teacherAvatar}
                alt={classroom.teacherName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <GraduationCap className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h3 className="text-lg font-bold text-gray-900 truncate leading-tight">{classroom.name}</h3>
            {classroom.description && (
              <p className="text-gray-600 text-xs mt-0.5 truncate">{classroom.description}</p>
            )}
            <p className="text-gray-700 text-sm font-medium mt-1 truncate">
              <span className="text-gray-500">Giáo viên:</span> {classroom.teacherName}
            </p>
          </div>
          {showMenu && (
            <div ref={menuRef} className="absolute top-3 right-3">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                  {isWritable ? (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); onCopyLink?.(classroom); setMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Link2 className="w-4 h-6 text-gray-400" /> Sao chép link mời
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onCopyCode?.(classroom); setMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Copy className="w-4 h-6 text-gray-400" /> Sao chép mã lớp
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); onRestore?.(classroom); setMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <RotateCcw className="w-4 h-4 text-teal-500" /> Khôi phục lớp học
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onPermanentDelete?.(classroom); setMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" /> Xóa vĩnh viễn
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 pt-1 min-h-[64px] flex flex-col justify-end border-t border-black/40">
        {(classroom.gradeLevel || classroom.subject) && (
          <div className="flex items-center gap-2 mt-3 mb-2 flex-wrap">
            {classroom.gradeLevel && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-violet-50 text-violet-700 border border-black/10">
                <GraduationCap className="w-3 h-3" />
                Lớp {classroom.gradeLevel}
              </span>
            )}
            {classroom.subject && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-teal-50 text-teal-700 border border-black/10">
                <BookOpen className="w-3 h-3" />
                {classroom.subject}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between mt-auto">
          <span className="flex items-center gap-1.5 text-sm text-gray-700">
            <Users className="w-4 h-4 text-violet-500" />
            {classroom.studentCount} học sinh
          </span>
          {isTeacher && isWritable && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-black/15">
              <span className="text-xs font-mono font-bold text-gray-700 tracking-wider">{classroom.classCode}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
