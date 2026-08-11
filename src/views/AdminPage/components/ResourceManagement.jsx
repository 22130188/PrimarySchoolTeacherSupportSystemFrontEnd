import { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Search, Image, Volume2, Upload, Trash2, Download, Eye, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { RESOURCE_TABS } from '../../../data/adminDashboardData';
import SortIcon from '../../../components/SortIcon';
import resourceService from '../../../services/resourceService';
import { confirmToast } from '../../../utils/toastNotifications.js';
import { useAuthStore } from '../../../stores/authStore';
import UploadResourceModal from './UploadResourceModal';

export default function ResourceManagement() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState('images');
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [images, setImages] = useState([]);
  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewImageModal, setViewImageModal] = useState({ open: false, image: null });
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [imagesRes, audiosRes] = await Promise.all([
          resourceService.getAllImages(),
          resourceService.getAllAudios()
        ]);

        if (imagesRes.success) {
          setImages(imagesRes.data.map(img => ({
            id: img.id,
            fileName: img.description || `Image ${img.id}`,
            uploadedBy: img.userName,
            subject: img.subject,
            createdAt: new Date(img.createdAt).toLocaleDateString('vi-VN'),
            url: img.imageUrl,
            mimeType: 'image/*'
          })));
        }

        if (audiosRes.success) {
          setAudios(audiosRes.data.map(audio => ({
            id: audio.id,
            fileName: audio.audioName || `Audio ${audio.id}`,
            uploadedBy: audio.userName,
            subject: audio.subject,
            createdAt: new Date(audio.createdAt).toLocaleDateString('vi-VN'),
            url: audio.audioUrl,
            mimeType: 'audio/*',
            text: audio.text
          })));
        }
      } catch (err) {
        setError('Không thể tải dữ liệu tài nguyên');
        console.error('Error fetching resources:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const isImageTab = activeTab === 'images';
  const data = isImageTab ? images : audios;

  const imageColumns = useMemo(() => {
    const baseColumns = [
      {
        accessorKey: 'fileName',
        header: 'Tên file',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
              <Image className="w-5 h-5 text-gray-800" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{row.original.fileName}</p>
              <p className="text-xs text-gray-400">{row.original.mimeType}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'subject',
        header: 'Môn học',
        cell: ({ getValue }) => {
          return <span className="text-xs font-semibold text-gray-900">{getValue()}</span>;
        },
      },
      {
        accessorKey: 'uploadedBy',
        header: 'Người tải lên',
        cell: ({ getValue }) => <span className="text-sm text-gray-600">{getValue()}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: 'Ngày tải',
        cell: ({ getValue }) => <span className="text-sm text-gray-500">{getValue()}</span>,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleViewImage(row.original)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
              title="Xem"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDownload(row.original.url, row.original.fileName)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Tải xuống"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original.id, true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ];

    return baseColumns;
  }, []);

  const audioColumns = useMemo(() => {
    const baseColumns = [
      {
        accessorKey: 'fileName',
        header: 'Tên file',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
              <Volume2 className="w-5 h-5 text-gray-800" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{row.original.fileName}</p>
              <p className="text-xs text-gray-400">{row.original.mimeType}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'subject',
        header: 'Môn học',
        cell: ({ getValue }) => {
          return <span className="text-xs font-semibold text-gray-900">{getValue()}</span>;
        },
      },
      {
        accessorKey: 'uploadedBy',
        header: 'Người tải lên',
        cell: ({ getValue }) => <span className="text-sm text-gray-600">{getValue()}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: 'Ngày tải',
        cell: ({ getValue }) => <span className="text-sm text-gray-500">{getValue()}</span>,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePlayAudio(row.original.url)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
              title="Phát"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDownload(row.original.url, row.original.fileName)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Tải xuống"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original.id, false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ];

    return baseColumns;
  }, []);

  const handleDelete = async (id, isImage) => {
    if (!(await confirmToast('Bạn có chắc chắn muốn xóa tài nguyên này?', { title: 'Xóa tài nguyên', confirmLabel: 'Xóa' }))) return;

    try {
      if (isImage) {
        await resourceService.deleteImage(id);
        setImages(prev => prev.filter(img => img.id !== id));
      } else {
        await resourceService.deleteAudio(id);
        setAudios(prev => prev.filter(audio => audio.id !== id));
      }
      window.showAlertToast('Đã xóa tài nguyên thành công.');
    } catch (err) {
      console.error('Delete error:', err);
      window.showAlertToast('Không thể xóa tài nguyên: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleViewImage = (image) => {
    setViewImageModal({ open: true, image });
  };

  const handleDownload = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback to opening in new tab
      window.open(url, '_blank');
    }
  };

  const handlePlayAudio = (url) => {
    window.open(url, '_blank');
  };

  const columns = isImageTab ? imageColumns : audioColumns;

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 6 },
    },
  });

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            <span className="text-gray-600">Đang tải dữ liệu...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý tài nguyên</h2>
          <p className="text-sm text-gray-500 mt-1">{images.length} ảnh · {audios.length} file âm thanh</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-200">
          <Upload className="w-4 h-4" />
          Tải lên tài nguyên
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {RESOURCE_TABS.map((tab) => {
            const count = tab.key === 'images' ? images.length : audios.length;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setGlobalFilter(''); table.setPageIndex(0); }}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-md ${activeTab === tab.key ? 'bg-violet-100 text-violet-600' : 'bg-gray-200 text-gray-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => { setGlobalFilter(e.target.value); table.setPageIndex(0); }}
            placeholder="Tìm kiếm file..."
            className="w-full sm:w-56 pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all duration-200 placeholder-gray-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-gray-100">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {header.isPlaceholder ? null : (
                        <button
                          className={`flex items-center gap-1.5 ${header.column.getCanSort() ? 'cursor-pointer select-none hover:text-gray-700' : ''}`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && <SortIcon column={header.column} />}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors duration-150">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-5 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-12 text-center text-gray-400 text-sm">
                    Không tìm thấy tài nguyên nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Hiển thị {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
              {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}{' '}
              / {table.getFilteredRowModel().rows.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: table.getPageCount() }, (_, i) => i).map((pageIndex) => (
                <button key={pageIndex} onClick={() => table.setPageIndex(pageIndex)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 ${pageIndex === table.getState().pagination.pageIndex ? 'bg-violet-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {pageIndex + 1}
                </button>
              ))}
              <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Image View Modal */}
      {viewImageModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{viewImageModal.image?.fileName}</h3>
              <button
                onClick={() => setViewImageModal({ open: false, image: null })}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-center">
              <img
                src={viewImageModal.image?.url}
                alt={viewImageModal.image?.fileName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      <UploadResourceModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={() => {
          const fetchData = async () => {
            try {
              const [imagesRes, audiosRes] = await Promise.all([
                resourceService.getAllImages(),
                resourceService.getAllAudios()
              ]);

              if (imagesRes.success) {
                setImages(imagesRes.data.map(img => ({
                  id: img.id,
                  fileName: img.description || `Image ${img.id}`,
                  uploadedBy: img.userName,
                  subject: img.subject,
                  createdAt: new Date(img.createdAt).toLocaleDateString('vi-VN'),
                  url: img.imageUrl,
                  mimeType: 'image/*'
                })));
              }

              if (audiosRes.success) {
                setAudios(audiosRes.data.map(audio => ({
                  id: audio.id,
                  fileName: audio.audioName || `Audio ${audio.id}`,
                  uploadedBy: audio.userName,
                  subject: audio.subject,
                  createdAt: new Date(audio.createdAt).toLocaleDateString('vi-VN'),
                  url: audio.audioUrl,
                  mimeType: 'audio/*',
                  text: audio.text
                })));
              }
            } catch (err) {
              console.error('Error refreshing resources:', err);
            }
          };
          fetchData();
        }}
        user={user}
      />
    </div>
  );
}
