import { createElement, useEffect, useState } from 'react';
import {
  X, Loader2, School, Users, Mail, Calendar, Hash, Link2,
  Clock, GraduationCap, BookOpen, AlertTriangle, ScrollText,
} from 'lucide-react';
import * as adminClassroomApi from '../../../services/adminClassroomApi';
import { getActionLogs } from '../../../services/actionLogApi';
import { formatDate } from '../../../helpers/formatDate';
import { getActionLabel } from '../../../utils/actionLogLabels';

export default function ClassroomDetailModal({ isOpen, onClose, classroom, initialTab = 'info' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [members, setMembers] = useState(null);
  const [membersLoading, setMembersLoading] = useState(false);
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const loadMembers = async () => {
    if (!classroom) return;
    setMembersLoading(true);
    try {
      setMembers(await adminClassroomApi.getClassroomMembers(classroom.id));
    } catch {
      setMembers(null);
    } finally {
      setMembersLoading(false);
    }
  };

  const loadActivity = async () => {
    if (!classroom) return;
    setActivityLoading(true);
    try {
      const data = await getActionLogs({ module: 'classrooms', resourceId: classroom.id, size: 100 });
      setActivity(data?.content || []);
    } catch {
      setActivity([]);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !classroom) return;
    if (initialTab === 'members') loadMembers();
    if (initialTab === 'activity') loadActivity();
  }, [isOpen, classroom, initialTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'members' && !members) loadMembers();
    if (tab === 'activity' && activity.length === 0) loadActivity();
  };

  if (!isOpen || !classroom) return null;

  const tabs = [
    { key: 'info', label: 'Thông tin', icon: School },
    { key: 'members', label: 'Thành viên', icon: Users },
    { key: 'activity', label: 'Nhật ký', icon: ScrollText },
  ];
  const status = classroom.status || 'ACTIVE';
  const statusLabel = status === 'LOCKED' ? 'Bị khóa' : status === 'ARCHIVED' ? 'Đã lưu trữ' : 'Hoạt động';
  const statusClass = status === 'LOCKED' ? 'bg-amber-100 text-amber-700' : status === 'ARCHIVED' ? 'bg-gray-100 text-gray-700' : 'bg-emerald-100 text-emerald-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{classroom.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={'inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ' + statusClass}>{statusLabel}</span>
                <span className="text-xs text-gray-400">ID: {classroom.id}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-1 p-2 mx-5 mt-3 bg-gray-100 rounded-xl shrink-0">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)} className={'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ' + (activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">          {activeTab === 'info' && (
            <div className="space-y-4">
              <InfoRow icon={School} label="Tên lớp" value={classroom.name} />
              <InfoRow icon={Hash} label="Mã lớp" value={classroom.classCode} mono />
              <InfoRow icon={Users} label="Giáo viên" value={`${classroom.teacherName} (${classroom.teacherEmail})`} />
              <InfoRow icon={GraduationCap} label="Số học sinh" value={classroom.studentCount} />
              <InfoRow icon={GraduationCap} label="Khối lớp" value={classroom.gradeLevel ? `Lớp ${classroom.gradeLevel}` : '—'} />
              <InfoRow icon={BookOpen} label="Môn học" value={classroom.subject || '—'} />
              <InfoRow icon={Mail} label="Lời mời đang chờ" value={classroom.pendingInvitationCount} />
              <InfoRow icon={Link2} label="Link mời" value={classroom.inviteLink} mono small />
              <InfoRow icon={Calendar} label="Ngày tạo" value={formatDate(classroom.createdAt)} />
              <InfoRow icon={Clock} label="Cập nhật lần cuối" value={formatDate(classroom.updatedAt)} />
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
                <LoadingState label="Đang tải danh sách..." />
              ) : members ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Giáo viên</p>
                    <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
                      <Avatar name={members.teacher?.name} teacher />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{members.teacher?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{members.teacher?.email}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-700 uppercase">Giáo viên</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Học sinh ({members.students?.length || 0})</p>
                    {members.students?.length ? (
                      <div className="space-y-2">
                        {members.students.map((student) => (
                          <div key={student.memberId} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                            <Avatar name={student.name} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                              <p className="text-xs text-gray-400 truncate">{student.email}</p>
                            </div>
                            <span className="text-[10px] text-gray-400">{formatDate(student.joinedAt)}</span>
                          </div>
                        ))}
                      </div>
                    ) : <EmptyState icon={Users} label="Chưa có học sinh nào" />}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
                  <p className="text-sm text-gray-500">Không thể tải danh sách thành viên</p>
                  <button onClick={loadMembers} className="mt-3 px-4 py-2 text-sm font-medium text-violet-600 bg-violet-50 rounded-xl">Thử lại</button>
                </div>
              )}
            </div>
          )}
          {activeTab === 'activity' && (
            <div>
              {activityLoading ? (
                <LoadingState label="Đang tải nhật ký..." />
              ) : activity.length ? (
                <div className="space-y-3">
                  {activity.map((log) => (
                    <div key={log.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <p className="text-sm font-semibold text-gray-800">{getActionLabel(log.action, log.description)}</p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                        <span>{log.username || log.clientIdentifier || 'Hệ thống'}</span>
                        <span>{formatDate(log.createdAt)}</span>
                        {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                      </div>
                      {getLogReason(log.description) && <p className="mt-2 text-xs text-gray-600">Lý do: {getLogReason(log.description)}</p>}
                    </div>
                  ))}
                </div>
              ) : <EmptyState icon={ScrollText} label="Chưa có nhật ký cho lớp học này" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, mono, small }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-gray-100 text-gray-500">{createElement(icon, { className: 'w-4 h-4' })}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <p className={'text-sm text-gray-900 mt-0.5 ' + (mono ? 'font-mono ' : '') + (small ? 'text-xs break-all' : '')}>{value ?? '—'}</p>
      </div>
    </div>
  );
}

function Avatar({ name, teacher }) {
  return <div className={'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md ' + (teacher ? 'bg-gradient-to-br from-violet-400 to-indigo-500' : 'bg-gradient-to-br from-teal-400 to-cyan-500')}>{name?.charAt(0) || '?'}</div>;
}

function LoadingState({ label }) {
  return <div className="flex flex-col items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-violet-500" /><p className="text-sm text-gray-400 mt-2">{label}</p></div>;
}

function EmptyState({ icon, label }) {
  return <div className="py-10 text-center">{createElement(icon, { className: 'w-9 h-9 text-gray-300 mx-auto mb-2' })}<p className="text-sm text-gray-400">{label}</p></div>;
}

function getLogReason(description) {
  try {
    const parsed = typeof description === 'string' ? JSON.parse(description) : description;
    return parsed?.reason || '';
  } catch {
    return '';
  }
}