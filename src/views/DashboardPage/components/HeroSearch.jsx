import { useState } from 'react';
import { Search, ChevronDown, Star } from 'lucide-react';
import { SEARCH_FILTERS as FILTERS } from '../../../data/mockDashboardData';

export default function HeroSearch() {
  const [query, setQuery] = useState('');

  return (
    <div className="relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, #ede9fe 0%, #f3e8ff 30%, #fdf4ff 60%, #ffffff 100%)',
        }}
      />

      <div className="relative z-10 px-6 pt-10 pb-6 max-w-4xl mx-auto text-center">



        <h1
          className="text-3xl sm:text-4xl md:text-[42px] font-extrabold leading-tight mb-8"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 40%, #0ea5e9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Bạn muốn tạo bài giảng gì?
        </h1>

        <div className="relative max-w-2xl mx-auto mb-6">
          <div className="flex items-center bg-white rounded-2xl shadow-lg border border-gray-200/80 hover:shadow-xl hover:border-violet-200 transition-all duration-300">
            <Search className="w-5 h-5 text-gray-400 ml-5 flex-shrink-0" />
            <input
              id="hero-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm bài giảng, bài kiểm tra và nội dung tải lên"
              className="flex-1 py-4 px-4 text-sm text-gray-700 bg-transparent outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 justify-center">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              id={`filter-${f.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:border-violet-300 hover:text-violet-600 hover:shadow-sm transition-all duration-200"
            >
              {f.label}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
