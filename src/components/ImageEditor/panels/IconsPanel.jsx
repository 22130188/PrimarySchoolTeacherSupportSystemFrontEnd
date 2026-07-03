import { useEffect, useMemo, useState } from 'react';
import { AI_IMAGE_ICON_LIBRARY } from '../../../data/mockDashboardData.jsx';
import { loadServerIcons, serverIconUrl } from '../PillowBridge.js';
import { addLibrarySticker, addServerSticker } from '../tools/stickers.js';

const COLOR_OPTIONS = [
  '#7c3aed', '#2b5c8f', '#d9534f', '#4b8b3b', '#5b32a1',
  '#9b1c7a', '#f0ad4e', '#17a2b8', '#111827', '#dc2626',
];

export default function IconsPanel({ fabricRef, saveHistory }) {
  const [serverIcons, setServerIcons] = useState([]);
  const [category, setCategory] = useState(AI_IMAGE_ICON_LIBRARY?.[0]?.category || 'all');
  const [color, setColor] = useState('#7c3aed');

  useEffect(() => {
    let alive = true;
    loadServerIcons().then((list) => { if (alive) setServerIcons(list || []); });
    return () => { alive = false; };
  }, []);

  const libraryIcons = useMemo(
    () => (AI_IMAGE_ICON_LIBRARY || []).flatMap((group) =>
      (group.icons || []).map((ic) => ({
        id: `lib-${group.category}-${ic.id}`,
        jsx: ic.icon,
        label: ic.label,
        category: group.category,
      }))
    ),
    []
  );

  const categoryOptions = useMemo(() => [
    ...(AI_IMAGE_ICON_LIBRARY || []).map((g) => ({ id: g.category, label: g.label })),
    { id: 'server', label: 'Server' },
    { id: 'all', label: 'Tất cả' },
  ], []);

  const shownLibrary = libraryIcons.filter(
    (li) => category === 'all' || li.category === category
  );
  const shownServer = (category === 'all' || category === 'server') ? serverIcons : [];

  const dropLibrary = async (jsx) => {
    const c = fabricRef.current;
    if (!c) return;
    await addLibrarySticker(c, jsx, { color, size: 96 });
    saveHistory?.();
  };

  const dropServer = async (name) => {
    const c = fabricRef.current;
    if (!c) return;
    await addServerSticker(c, serverIconUrl(name), { size: 96 });
    saveHistory?.();
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-800">Biểu tượng / Sticker</h4>

      <div>
        <span className="text-xs font-medium text-slate-600">Màu (icon thư viện)</span>
        <div className="mt-1 flex flex-wrap gap-1">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={`h-6 w-6 rounded-full border-2 ${color === c ? 'border-slate-800' : 'border-white'} shadow`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {categoryOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setCategory(opt.id)}
            className={`rounded-full px-2 py-0.5 text-[11px] ${
              category === opt.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid max-h-80 grid-cols-4 gap-2 overflow-y-auto pr-1">
        {shownLibrary.map((ic) => (
          <button
            key={ic.id}
            type="button"
            title={ic.label}
            onClick={() => dropLibrary(ic.jsx)}
            className="flex aspect-square items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:border-indigo-400 hover:bg-indigo-50"
            style={{ color }}
          >
            {ic.jsx}
          </button>
        ))}
        {shownServer.map((ic) => {
          const name = ic.name || ic.id;
          return (
            <button
              key={ic.id || name}
              type="button"
              title={name}
              onClick={() => dropServer(name)}
              className="flex aspect-square items-center justify-center overflow-hidden rounded-md border border-slate-200 hover:border-indigo-400"
            >
              <img src={ic.url || serverIconUrl(name)} alt={name} className="h-8 w-8 object-contain" />
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400">Bấm để thả sticker; bấm nhiều lần để nhân bản.</p>
    </div>
  );
}
