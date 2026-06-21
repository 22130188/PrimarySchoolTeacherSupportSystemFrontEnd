import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

const TYPE_OPTIONS = [
  { value: 'all', label: 'Tất cả loại' },
  { value: 'LESSON', label: 'Bài giảng' },
  { value: 'EXAM', label: 'Bài kiểm tra' },
  { value: 'EXERCISE', label: 'Bài tập' },
];

const DATE_OPTIONS = [
  { value: 'all', label: 'Mọi thời gian' },
  { value: '7', label: '7 ngày qua' },
  { value: '30', label: '30 ngày qua' },
  { value: '90', label: '90 ngày qua' },
  { value: '365', label: 'Năm qua' },
];

function FilterMenu({ id, label, value, options, open, onOpen, onChange }) {
  const selected = options.find((option) => option.value === value);
  const active = value !== 'all';

  return (
    <div className="relative">
      <button
        type="button"
        id={`search-filter-${id}`}
        aria-expanded={open}
        onClick={onOpen}
        className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all ${
          active || open
            ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-sm ring-2 ring-violet-100'
            : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:text-violet-700'
        }`}
      >
        <span className="max-w-40 truncate">{active ? selected?.label : label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-1/2 z-40 mt-2 min-w-56 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-xl">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm ${
                option.value === value ? 'bg-violet-50 font-medium text-violet-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && <Check className="h-4 w-4 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HeroSearch({ compact = false, filters, options, onChange }) {
  const [openMenu, setOpenMenu] = useState(null);
  const controlsRef = useRef(null);
  const update = (key, value) => onChange((current) => ({ ...current, [key]: value }));
  const hasFilters = Object.entries(filters).some(([key, value]) => key !== 'query' && value !== 'all');

  useEffect(() => {
    const close = (event) => {
      if (controlsRef.current && !controlsRef.current.contains(event.target)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const menus = [
    { id: 'type', label: 'Loại', options: TYPE_OPTIONS },
    { id: 'subject', label: 'Môn học', options: [{ value: 'all', label: 'Tất cả môn học' }, ...options.subjects] },
    { id: 'grade', label: 'Lớp', options: [{ value: 'all', label: 'Tất cả lớp' }, ...options.grades] },
    { id: 'owner', label: 'Chủ sở hữu', options: [{ value: 'all', label: 'Mọi chủ sở hữu' }, ...options.owners] },
    { id: 'date', label: 'Ngày sửa đổi', options: DATE_OPTIONS },
  ];

  return (
    <div className="relative overflow-visible">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, #ede9fe 0%, #f3e8ff 30%, #fdf4ff 60%, #ffffff 100%)' }}
      />

      <div className={`relative z-10 mx-auto max-w-5xl px-6 pt-16 text-center ${compact ? 'pb-6' : 'pb-12'}`}>
        <h1
          className="mb-9 text-3xl font-extrabold leading-tight sm:text-4xl md:text-[46px]"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 40%, #0ea5e9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Hệ thống hỗ trợ giáo viên tiểu học
        </h1>

        <div className="relative mx-auto mb-4 max-w-4xl">
          <label className="flex items-center rounded-2xl border border-violet-200 bg-white shadow-lg transition-all duration-300 focus-within:border-violet-500 focus-within:shadow-xl focus-within:ring-4 focus-within:ring-violet-100">
            <Search className="ml-5 h-6 w-6 flex-shrink-0 text-slate-700" />
            <input
              id="hero-search-input"
              autoComplete="off"
              type="search"
              value={filters.query}
              onChange={(event) => update('query', event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Escape') update('query', ''); }}
              placeholder="Tìm kiếm trong tất cả nội dung"
              className="min-w-0 flex-1 bg-transparent px-4 py-5 text-base text-slate-800 outline-none placeholder:text-slate-400 [&::-webkit-search-cancel-button]:hidden"
            />
            {filters.query && (
              <button type="button" onClick={() => update('query', '')} aria-label="Xóa nội dung tìm kiếm" className="mr-4 grid h-8 w-8 place-items-center rounded-full bg-slate-600 text-white hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
        </div>

        <div ref={controlsRef} className="flex flex-wrap justify-center gap-2.5">
          {hasFilters && (
            <button
              type="button"
              onClick={() => onChange((current) => ({ ...current, type: 'all', subject: 'all', grade: 'all', owner: 'all', date: 'all' }))}
              aria-label="Xóa tất cả bộ lọc"
              title="Xóa tất cả bộ lọc"
              className="grid h-11 w-11 place-items-center rounded-full border border-violet-200 bg-white text-slate-700 hover:border-violet-400 hover:text-violet-700"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {menus.map((menu) => (
            <FilterMenu
              key={menu.id}
              {...menu}
              value={filters[menu.id]}
              open={openMenu === menu.id}
              onOpen={() => setOpenMenu((current) => current === menu.id ? null : menu.id)}
              onChange={(value) => { update(menu.id, value); setOpenMenu(null); }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
