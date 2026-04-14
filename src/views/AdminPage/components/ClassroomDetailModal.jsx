import { useState, useEffect } from 'react';
import {
  X, Loader2, School, Users, Mail, Calendar, Hash, Link2,
  Clock, Trash2, UserMinus, GraduationCap, AlertTriangle,
} from 'lucide-react';
import * as adminClassroomApi from '../../../services/adminClassroomApi';
import { formatDate } from '../../../helpers/formatDate';

export default function ClassroomDetailModal({ isOpen, onClose, classroom, onRefresh }) {
  const [activeTab, setActiveTab] = useState('info');
  const [members, setMembers] = useState(null);
  const [membersLoading, setMembersLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (isOpen && classroom) {
      setActiveTab('info');
      setMembers(null);
    }
  }, [isOpen, classroom]);

  const loadMembers = async () => {
    if (!classroom) return;
    setMembersLoading(true);
    try {
      const data = await adminClassroomApi.getClassroomMembers(classroom.id);
      setMembers(data);
    } catch {
      setMembers(null);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'members' && !members) {
      loadMembers();
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!classroom) return;
    setRemovingId(memberId);
    try {
      await adminClassroomApi.removeMember(classroom.id, memberId);
      loadMembers();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  if (!isOpen || !classroom) return null;

  const TABS = [
    { key: 'info', label: 'Thông tin', icon: School },
    { key: 'members', label: 'Thành viên', icon: Users },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{classroom.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide
                  ${classroom.isDeleted
                    ? 'bg-red-100 text-red-700'
                    : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${classroom.isDeleted ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  {classroom.isDeleted ? 'Đã xóa' : 'Hoạt động'}
                </span>
                <span className="text-xs text-gray-400">ID: {classroom.id}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-1 p-2 mx-5 mt-3 bg-gray-100 rounded-xl shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                ${activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <InfoRow icon={School} label="Tên lớp" value={classroom.name} />
              <InfoRow icon={Hash} label="Mã lớp" value={classroom.classCode} mono />
              <InfoRow icon={Users} label="Giáo viên" value={`${classroom.teacherName} (${classroom.teacherEmail})`} />
              <InfoRow icon={GraduationCap} label="Số học sinh" value={classroom.studentCount} />
              <InfoRow icon={Mail} label="Lời mời đang chờ" value={classroom.pendingInvitationCount} />
              <InfoRow icon={Link2} label="Link mời" value={classroom.inviteLink} mono small />
              <InfoRow icon={Calendar} label="Ngày tạo" value={formatDate(classroom.createdAt)} />
              <InfoRow icon={Clock} label="Cập nhật lần cuối" value={formatDate(classroom.updatedAt)} />
              {classroom.isDeleted && (
                <InfoRow icon={Trash2} label="Ngày xóa" value={formatDate(classroom.deletedAt)} danger />
              )}
              {classroom.description && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">Mô tả</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{classroom.description}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div>
              {membersLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                  <p className="text-sm text-gray-400 mt-2">Đang tải danh sách...</p>
                </div>
              ) : members ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Giáo viên</p>
                    <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                        {members.teacher?.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{members.teacher?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{members.teacher?.email}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-700 uppercase">
                        Giáo viên
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Học sinh ({members.students?.length || 0})
                    </p>
                    {members.students?.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Chưa có học sinh nào</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {members.students?.map((student) => (
                          <div
                            key={student.memberId}
                            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
                          >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                              {student.name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                              <p className="text-xs text-gray-400 truncate">{student.email}</p>
                            </div>
                            <span className="text-[10px] text-gray-400 hidden sm:block">
                              {formatDate(student.joinedAt)}
                            </span>
                            <button
                              onClick={() => handleRemoveMember(student.memberId)}
                              disabled={removingId === student.memberId}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                              title="Xóa thành viên"
                            >
                              {removingId === student.memberId
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <UserMinus className="w-4 h-4" />
                              }
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
                  <p className="text-sm text-gray-500">Không thể tải danh sách thành viên</p>
                  <button
                    onClick={loadMembers}
                    className="mt-3 px-4 py-2 text-sm font-medium text-violet-600 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors"
                  >
                    Thử lại
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono, small, danger }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${danger ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <p className={`text-sm ${danger ? 'text-red-600 font-medium' : 'text-gray-900'} ${mono ? 'font-mono' : ''} ${small ? 'text-xs break-all' : ''} mt-0.5`}>
          {value ?? '—'}
        </p>
      </div>
    </div>
  );
}
