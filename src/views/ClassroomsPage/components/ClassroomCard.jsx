import { MoreVertical, Users, Copy, Link2, GraduationCap, BookOpen } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { BANNER_COLORS } from '../../../data/classroomData';
import { useAuthStore } from '../../../stores/authStore';

function getBannerColor(id) {
  return BANNER_COLORS[(id || 0) % BANNER_COLORS.length];
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

export default function ClassroomCard({ classroom, isTeacher, onViewDetail, onCopyLink, onCopyCode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const bannerColor = getBannerColor(classroom.id);

  const teacherAvatar = classroom.teacherAvatarUrl
    || (isTeacher && user?.avatarUrl ? user.avatarUrl : null);

  return (
    <div
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer relative"
      onClick={() => onViewDetail?.(classroom.id)}
    >

      <div className={`h-[100px] bg-gradient-to-r ${bannerColor} relative p-4 flex flex-col justify-between`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-8">
            <h3 className="text-lg font-bold text-white truncate leading-tight">{classroom.name}</h3>
            {classroom.description && (
              <p className="text-white/80 text-xs mt-0.5 truncate">{classroom.description}</p>
            )}
          </div>
          {isTeacher && (
            <div ref={menuRef} className="relative flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-white" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 w-52 max-h-[120px] overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                  <button onClick={(e) => { e.stopPropagation(); onCopyLink?.(classroom); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Link2 className="w-4 h-6 text-gray-400" /> Sao chép link mời
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onCopyCode?.(classroom); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Copy className="w-4 h-6 text-gray-400" /> Sao chép mã lớp
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <p className="text-white/90 text-sm font-medium"><span className="text-white/60">Giáo viên:</span> {classroom.teacherName}</p>

        <div className="absolute -bottom-6 right-4">
          <div className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center shadow-md border-2 border-white">
            {teacherAvatar ? (
              <img
                src={teacherAvatar}
                alt={classroom.teacherName}
                className="w-[48px] h-[48px] rounded-full object-cover"
              />
            ) : (
              <div className={`w-[48px] h-[48px] rounded-full bg-gradient-to-br ${bannerColor} flex items-center justify-center text-white font-bold text-base`}>
                {getInitials(classroom.teacherName)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 pt-3 min-h-[72px] flex flex-col justify-end">
        {(classroom.gradeLevel || classroom.subject) && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {classroom.gradeLevel && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-gray-800">
                <GraduationCap className="w-3 h-3" />
                Lớp {classroom.gradeLevel}
              </span>
            )}
            {classroom.subject && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-gray-800">
                <BookOpen className="w-3 h-3" />
                {classroom.subject}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between mt-auto">
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            {classroom.studentCount} học sinh
          </span>
          {isTeacher && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-xs font-mono font-bold text-gray-700 tracking-wider">{classroom.classCode}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
