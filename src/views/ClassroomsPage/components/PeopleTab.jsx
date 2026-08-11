import { useState, useMemo } from 'react';
import {
  useReactTable, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, flexRender,
} from '@tanstack/react-table';
import {
  UserPlus, MoreVertical, Search, Mail, XCircle, Trash2, RefreshCw,
  ChevronLeft, ChevronRight, UserX, Send, Shield
} from 'lucide-react';
import { removeStudent, resendInvitation, revokeInvitation } from '../../../services/classroomApi';
import { STATUS_BADGE as STATUS_BADGE_DATA, STATUS_ICONS } from '../../../data/classroomData';
import { confirmToast } from '../../../utils/toastNotifications.js';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

function StatusBadge({ status }) {
  const data = STATUS_BADGE_DATA[status] || { label: status, bg: 'bg-gray-50 text-gray-500 border-gray-200' };
  const icon = STATUS_ICONS[status] || null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${data.bg}`}>
      {icon} {data.label}
    </span>
  );
}

export default function PeopleTab({ roster, classroomId, isTeacher, readOnly = false, onRefresh, onInvite }) {
  const [searchStudent, setSearchStudent] = useState('');
  const [searchInvite, setSearchInvite] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // =================== STUDENT TABLE ===================
  const studentColumns = useMemo(() => [
    {
      id: 'avatar',
      header: '',
      size: 48,
      cell: ({ row }) => (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-teal-400 flex items-center justify-center text-white text-xs font-bold">
          {row.original.avatarUrl
            ? <img src={row.original.avatarUrl} className="w-full h-full rounded-full object-cover" />
            : getInitials(row.original.name)}
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Họ tên',
      cell: ({ getValue }) => <span className="font-medium text-gray-800">{getValue()}</span>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => <span className="text-gray-500">{getValue()}</span>,
    },
    {
      accessorKey: 'joinType',
      header: 'Hình thức',
      cell: ({ getValue }) => {
        const v = getValue();
        const map = { INVITE_LINK: 'Link mời', EMAIL_INVITE: 'Email', CLASS_CODE: 'Mã lớp' };
        return <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">{map[v] || v}</span>;
      },
    },
    {
      accessorKey: 'joinedAt',
      header: 'Ngày tham gia',
      cell: ({ getValue }) => {
        const d = getValue();
        return <span className="text-xs text-gray-400">{d ? new Date(d).toLocaleDateString('vi-VN') : '-'}</span>;
      },
    },
    ...(isTeacher && !readOnly ? [{
      id: 'actions',
      header: '',
      size: 40,
      cell: ({ row }) => (
        <button
          disabled={actionLoading === `rm-${row.original.memberId}`}
          onClick={() => handleRemove(row.original.memberId)}
          className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
          title="Xóa khỏi lớp"
        >
          <UserX className="w-4 h-4" />
        </button>
      ),
    }] : []),
  ], [isTeacher, readOnly, actionLoading]);

  const studentData = useMemo(() => roster?.students || [], [roster]);

  const studentTable = useReactTable({
    data: studentData,
    columns: studentColumns,
    state: { globalFilter: searchStudent },
    onGlobalFilterChange: setSearchStudent,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // =================== INVITATION TABLE ===================
  const allInvitations = useMemo(() => {
    const invited = (roster?.invited || []).map(i => ({ ...i, _type: 'invited' }));
    const waiting = (roster?.waitingRegister || []).map(i => ({ ...i, _type: 'waiting' }));
    return [...invited, ...waiting];
  }, [roster]);

  const inviteColumns = useMemo(() => [
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => <span className="font-medium text-gray-700">{getValue()}</span>,
    },
    {
      accessorKey: 'studentName',
      header: 'Tên',
      cell: ({ getValue }) => <span className="text-gray-500">{getValue() || '—'}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    },
    {
      accessorKey: 'invitedAt',
      header: 'Ngày mời',
      cell: ({ getValue }) => {
        const d = getValue();
        return <span className="text-xs text-gray-400">{d ? new Date(d).toLocaleDateString('vi-VN') : '-'}</span>;
      },
    },
    {
      accessorKey: 'expiredAt',
      header: 'Hết hạn',
      cell: ({ getValue }) => {
        const d = getValue();
        if (!d) return <span className="text-xs text-gray-400">—</span>;
        const expired = new Date(d) < new Date();
        return (
          <span className={`text-xs ${expired ? 'text-red-500' : 'text-gray-400'}`}>
            {new Date(d).toLocaleDateString('vi-VN')}
          </span>
        );
      },
    },
    ...(isTeacher && !readOnly ? [{
      id: 'actions',
      header: '',
      size: 80,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            disabled={actionLoading === `resend-${row.original.invitationId}`}
            onClick={() => handleResend(row.original.invitationId)}
            className="w-8 h-8 rounded-full hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors"
            title="Gửi lại"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={actionLoading === `revoke-${row.original.invitationId}`}
            onClick={() => handleRevoke(row.original.invitationId)}
            className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
            title="Thu hồi"
          >
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    }] : []),
  ], [isTeacher, readOnly, actionLoading]);

  const inviteTable = useReactTable({
    data: allInvitations,
    columns: inviteColumns,
    state: { globalFilter: searchInvite },
    onGlobalFilterChange: setSearchInvite,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // =================== ACTIONS ===================
  const handleRemove = async (memberId) => {
    if (!(await confirmToast('Xóa học sinh này khỏi lớp?', { title: 'Xóa học sinh', confirmLabel: 'Xóa khỏi lớp' }))) return;
    setActionLoading(`rm-${memberId}`);
    try {
      await removeStudent(classroomId, memberId);
      onRefresh?.();
      window.showAlertToast('Đã xóa học sinh khỏi lớp.');
    } catch (err) {
      window.showAlertToast(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResend = async (invitationId) => {
    setActionLoading(`resend-${invitationId}`);
    try {
      await resendInvitation(classroomId, invitationId);
      onRefresh?.();
    } catch (err) {
      window.showAlertToast(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (invitationId) => {
    if (!(await confirmToast('Thu hồi lời mời này?', { title: 'Thu hồi lời mời', confirmLabel: 'Thu hồi' }))) return;
    setActionLoading(`revoke-${invitationId}`);
    try {
      await revokeInvitation(classroomId, invitationId);
      onRefresh?.();
      window.showAlertToast('Đã thu hồi lời mời.');
    } catch (err) {
      window.showAlertToast(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* ====== TEACHER SECTION ====== */}
      <section>
        <div className="flex items-center gap-3 pb-3 border-b-2 border-teal-500 mb-4">
          <Shield className="w-5 h-5 text-teal-600" />
          <h3 className="text-base font-bold text-teal-700">Giáo viên</h3>
        </div>
        {roster?.teacher && (
          <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
              {roster.teacher.avatarUrl
                ? <img src={roster.teacher.avatarUrl} className="w-full h-full rounded-full object-cover" />
                : getInitials(roster.teacher.name)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{roster.teacher.name}</p>
              <p className="text-xs text-gray-500">{roster.teacher.email}</p>
            </div>
          </div>
        )}
      </section>

      {/* ====== STUDENTS SECTION ====== */}
      <section>
        <div className="flex items-center justify-between pb-3 border-b-2 border-teal-500 mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-teal-700">Học sinh</h3>
            <span className="text-sm text-gray-400 font-medium">{studentData.length} học sinh</span>
          </div>
          <div className="flex items-center gap-2">
            {isTeacher && !readOnly && (
              <button onClick={onInvite}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                <UserPlus className="w-4 h-4" /> Mời
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchStudent}
            onChange={e => setSearchStudent(e.target.value)}
            placeholder="Tìm kiếm học sinh..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-50 transition-all"
          />
        </div>

        {/* Table */}
        {studentData.length === 0 ? (
          <div className="text-center pt-2 pb-8">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-2">
              <UserPlus className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">Chưa có học sinh nào</p>
            {isTeacher && !readOnly && (
              <button onClick={onInvite} className="mt-1 text-sm font-semibold text-teal-600 hover:text-teal-700 hover:underline transition-colors">
                Mời học sinh ngay
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full">
                <thead>
                  {studentTable.getHeaderGroups().map(hg => (
                    <tr key={hg.id} className="bg-gray-50/80">
                      {hg.headers.map(h => (
                        <th key={h.id} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                          style={{ width: h.getSize() !== 150 ? h.getSize() : undefined }}>
                          {flexRender(h.column.columnDef.header, h.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {studentTable.getRowModel().rows.map(row => (
                    <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-4 py-2.5 text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination table={studentTable} />
          </>
        )}
      </section>

      {/* ====== INVITATIONS SECTION (only teacher) ====== */}
      {isTeacher && allInvitations.length > 0 && (
        <section>
          <div className="flex items-center justify-between pb-3 border-b-2 border-amber-400 mb-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-amber-700">Lời mời đang chờ</h3>
              <span className="text-sm text-gray-400">{allInvitations.length}</span>
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInvite}
              onChange={e => setSearchInvite(e.target.value)}
              placeholder="Tìm email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-sm outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-50 transition-all"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full">
              <thead>
                {inviteTable.getHeaderGroups().map(hg => (
                  <tr key={hg.id} className="bg-amber-50/50">
                    {hg.headers.map(h => (
                      <th key={h.id} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        style={{ width: h.getSize() !== 150 ? h.getSize() : undefined }}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {inviteTable.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-t border-gray-50 hover:bg-amber-50/30 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-2.5 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination table={inviteTable} />
        </section>
      )}
    </div>
  );
}

function Pagination({ table }) {
  const pageCount = table.getPageCount();
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-3 px-1">
      <span className="text-xs text-gray-400">
        Trang {table.getState().pagination.pageIndex + 1} / {pageCount}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
