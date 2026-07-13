import { useEffect, useMemo, useState } from 'react';
import { AI_IMAGE_ICON_LIBRARY } from '../../../data/mockDashboardData.jsx';
import { loadServerIcons, processImage, serverIconUrl } from '../PillowBridge.js';
import { addLibrarySticker, addServerSticker } from '../tools/stickers.js';

const ICON_COLOR_NONE = 'none';
const DEFAULT_LIBRARY_COLOR = '#111827';

const COLOR_OPTIONS = [
  '#7c3aed', '#2b5c8f', '#d9534f', '#4b8b3b', '#5b32a1',
  '#9b1c7a', '#f0ad4e', '#17a2b8', '#111827', '#dc2626',
];

const SERVER_CATEGORY_LABELS = {
  animal: '🐶 Động vật',
  default: 'Server',
  fruit: '🍎 Trái cây',
  money: '💵 Tiền Việt Nam',
  nature: '🌿 Thiên nhiên',
  shape: '🔷 Hình học',
  material: '📐 Material Icons',
  school: '🏫 Học tập',
};

const CATEGORY_ALIASES = {
  animal: ['animal', 'animals', 'dong_vat'],
  fruit: ['fruit', 'fruits', 'trai_cay'],
  money: ['money', 'tien', 'tien_vietnam'],
  nature: ['nature', 'thien_nhien'],
  shape: ['shape', 'shapes', 'hinh_khoi'],
  material: ['material', 'material_icons', 'md'],
  school: ['school', 'hoc_tap', 'education'],
};

function normalizeCategory(value) {
  const normalized = String(value || '').toLowerCase();
  const found = Object.entries(CATEGORY_ALIASES).find(([, aliases]) => aliases.includes(normalized));
  return found?.[0] || normalized;
}

function iconDisplayName(icon) {
  return (icon.display_name || icon.name || icon.id || 'Icon').replace(/\.[^.]+$/, '');
}

export default function IconsPanel({ fabricRef, saveHistory }) {
  const [serverIcons, setServerIcons] = useState([]);
  const [category, setCategory] = useState(AI_IMAGE_ICON_LIBRARY?.[0]?.category || 'all');
  const [color, setColor] = useState(ICON_COLOR_NONE);

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
        category: normalizeCategory(group.category),
      }))
    ),
    []
  );

  const serverCategoryOptions = useMemo(() => {
    const libraryCategories = new Set((AI_IMAGE_ICON_LIBRARY || []).map((group) => normalizeCategory(group.category)));
    const serverCategories = Array.from(new Set(serverIcons.map((icon) => normalizeCategory(icon.category)).filter(Boolean)));

    return serverCategories
      .filter((id) => !libraryCategories.has(id) && id !== 'default')
      .sort((a, b) => (SERVER_CATEGORY_LABELS[a] || a).localeCompare(SERVER_CATEGORY_LABELS[b] || b, 'vi'))
      .map((id) => ({ id, label: SERVER_CATEGORY_LABELS[id] || id }));
  }, [serverIcons]);

  const categoryOptions = useMemo(() => [
    ...(AI_IMAGE_ICON_LIBRARY || []).map((g) => ({ id: normalizeCategory(g.category), label: g.label })),
    ...serverCategoryOptions,
    { id: 'server', label: 'Server' },
    { id: 'all', label: 'Tất cả' },
  ], [serverCategoryOptions]);

  const shownLibrary = libraryIcons.filter(
    (li) => category === 'all' || li.category === category
  );
  const shownServer = serverIcons.filter((icon) => {
    const iconCategory = normalizeCategory(icon.category);
    return category === 'all' || category === 'server' || iconCategory === category;
  });

  const recolorObject = async (object, nextColor) => {
    if (!object || object.type !== 'image' || object.isBackground) return false;

    const source = object.stickerSource || object.getSrc?.() || object._element?.src;
    if (!source) return false;

    if (nextColor === ICON_COLOR_NONE) {
      await object.setSrc(source, { crossOrigin: 'anonymous' });
      object.set({ stickerSource: source, stickerColor: null, dirty: true });
      return true;
    }

    const resultUrl = await processImage(
      source,
      [{ type: 'recolor_icon', color: nextColor, threshold: 245, strength: 1 }],
      { returnType: 'base64' }
    );
    if (!resultUrl) return false;

    await object.setSrc(resultUrl, { crossOrigin: 'anonymous' });
    object.set({ stickerSource: source, stickerColor: nextColor, dirty: true });
    return true;
  };

  const applyColor = async (nextColor) => {
    setColor(nextColor);

    const c = fabricRef.current;
    const active = c?.getActiveObject();
    if (!c || !active) return;

    try {
      if (active.type === 'activeselection') {
        const changed = await Promise.all(active.getObjects().map((obj) => recolorObject(obj, nextColor)));
        if (!changed.some(Boolean)) return;
      } else {
        const changed = await recolorObject(active, nextColor);
        if (!changed) return;
      }

      c.setActiveObject(active);
      c.requestRenderAll();
      saveHistory?.();
    } catch (err) {
      console.error('Error recoloring selected icon:', err);
    }
  };

  const dropLibrary = async (jsx) => {
    const c = fabricRef.current;
    if (!c) return;
    await addLibrarySticker(c, jsx, { color: color === ICON_COLOR_NONE ? DEFAULT_LIBRARY_COLOR : color, size: 96 });
    saveHistory?.();
  };

  const dropServer = async (name) => {
    const c = fabricRef.current;
    if (!c) return;

    const iconUrl = serverIconUrl(name);
    let stickerUrl = iconUrl;
    if (color !== ICON_COLOR_NONE) {
      try {
        stickerUrl = await processImage(
          iconUrl,
          [{ type: 'recolor_icon', color, threshold: 245, strength: 1 }],
          { returnType: 'base64' }
        ) || iconUrl;
      } catch (err) {
        console.error('Error recoloring server icon:', err);
      }
    }

    await addServerSticker(c, stickerUrl, { size: 96, sourceUrl: iconUrl, color: color === ICON_COLOR_NONE ? null : color });
    saveHistory?.();
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-800">Biểu tượng / Sticker</h4>

      <div>
        <span className="text-xs font-medium text-slate-600">Màu icon</span>
        <div className="mt-1 flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => applyColor(ICON_COLOR_NONE)}
            className={`h-6 rounded-full border-2 px-2 text-[11px] font-semibold ${color === ICON_COLOR_NONE ? 'border-slate-800 bg-white text-slate-700' : 'border-slate-200 bg-white text-slate-500'} shadow`}
            title="Dùng ảnh gốc"
          >
            None
          </button>
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => applyColor(c)}
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
            style={{ color: color === ICON_COLOR_NONE ? DEFAULT_LIBRARY_COLOR : color }}
          >
            {ic.jsx}
          </button>
        ))}
        {shownServer.map((ic) => {
          const name = ic.name || ic.id;
          const label = iconDisplayName(ic);
          return (
            <button
              key={ic.id || name}
              type="button"
              title={label}
              aria-label={label}
              onClick={() => dropServer(name)}
              className="flex aspect-square items-center justify-center overflow-hidden rounded-md border border-slate-200 hover:border-indigo-400"
            >
              <img src={ic.url || serverIconUrl(name)} alt={label} className="h-8 w-8 object-contain" />
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400">Bấm để thả sticker; bấm nhiều lần để nhân bản.</p>
    </div>
  );
}
