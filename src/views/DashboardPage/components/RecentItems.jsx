import { useState } from 'react';
import { ChevronDown, ArrowUpDown, LayoutGrid, List, MoreHorizontal, Clock } from 'lucide-react';
import { RECENT_ITEMS } from '../../../data/homePageData';

export default function RecentItems({ compact = false, hideCreate = false, defaultViewMode = 'grid' }) {
  const [viewMode, setViewMode] = useState(defaultViewMode);

  return (
    <div className={`px-6 ${compact ? 'pt-2 pb-32' : 'pt-6 pb-12'}`}>
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-500" />
            Gần đây
          </h2>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="recent-owner-filter"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:border-violet-300 hover:text-violet-600 transition-all duration-200"
            >
              Chủ sở hữu
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              id="recent-type-filter"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:border-violet-300 hover:text-violet-600 transition-all duration-200"
            >
              Loại bất kỳ
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            <button
              id="recent-sort-btn"
              className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-violet-300 hover:text-violet-600 transition-all duration-200"
              title="Sắp xếp"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>

            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                id="recent-grid-view"
                onClick={() => setViewMode('grid')}
                className={`w-9 h-9 flex items-center justify-center transition-colors duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-violet-50 text-violet-600'
                    : 'text-gray-400 hover:text-violet-500'
                }`}
                title="Dạng lưới"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                id="recent-list-view"
                onClick={() => setViewMode('list')}
                className={`w-9 h-9 flex items-center justify-center transition-colors duration-200 ${
                  viewMode === 'list'
                    ? 'bg-violet-50 text-violet-600'
                    : 'text-gray-400 hover:text-violet-500'
                }`}
                title="Dạng danh sách"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
            {!hideCreate && (
            <button
              id="recent-create-new"
              className="group relative aspect-[4/3] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center gap-2 hover:border-violet-300 hover:bg-violet-50/50 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-violet-500 group-hover:border-violet-300 transition-all duration-200 group-hover:scale-110">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-400 group-hover:text-violet-500 transition-colors">Tạo mới</span>
            </button>
            )}

            {RECENT_ITEMS.map((item) => (
              <div
                key={item.id}
                id={`recent-item-${item.id}`}
                className="group relative rounded-xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
              >
                <div className={`relative aspect-[4/3] bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                  <span className="text-4xl opacity-80 group-hover:scale-125 transition-transform duration-300">
                    {item.emoji}
                  </span>

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                  <button className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white shadow-sm">
                    <MoreHorizontal className="w-4 h-4 text-gray-600" />
                  </button>

                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-gray-700 shadow-sm">
                    {item.type}
                  </span>
                </div>

                <div className="bg-white p-2.5 border border-gray-100 border-t-0 rounded-b-xl">
                  <h3 className="text-xs font-semibold text-gray-800 truncate mb-0.5 group-hover:text-violet-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    {item.subject} · {item.grade} · {item.updatedAt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 font-medium">
                  <th className="text-left px-4 py-3">Tên</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Loại</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Môn học</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Lớp</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Cập nhật</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {RECENT_ITEMS.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 hover:bg-violet-50/40 transition-colors duration-150 cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-sm flex-shrink-0`}>
                          {item.emoji}
                        </div>
                        <span className="text-sm font-medium text-gray-800 group-hover:text-violet-600 transition-colors truncate max-w-[200px]">
                          {item.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{item.subject}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{item.grade}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">{item.updatedAt}</td>
                    <td className="px-4 py-3">
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
