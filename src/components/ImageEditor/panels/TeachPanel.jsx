import { useState } from 'react';
import { PieChart, Clock, Divide, Smile } from 'lucide-react';
import { addFractionPizza, fractionState } from '../tools/fractionTool.js';
import { addClock, setClockTime } from '../tools/clockTool.js';
import { addTextFraction } from '../tools/textFraction.js';

export default function TeachPanel({ fabricRef, selectedObject, saveHistory }) {
  const [slices, setSlices] = useState(8);
  const [pizzaShape, setPizzaShape] = useState('circle');
  const [hour, setHour] = useState(3);
  const [minute, setMinute] = useState(0);
  const [numerator, setNumerator] = useState('1');
  const [denominator, setDenominator] = useState('2');

  const c = () => fabricRef.current;

  const makePizza = () => {
    const canvas = c();
    if (!canvas) return;
    addFractionPizza(canvas, { slices, shape: pizzaShape });
    saveHistory();
  };

  const makeClock = () => {
    const canvas = c();
    if (!canvas) return;
    addClock(canvas, { hour, minute });
    saveHistory();
  };

  const makeTextFraction = () => {
    const canvas = c();
    if (!canvas) return;
    addTextFraction(canvas, { numerator, denominator });
    saveHistory();
  };

  const selClock = selectedObject?.teachTool === 'clock' ? selectedObject : null;
  const applyClockTime = (h, m) => {
    if (!selClock) return;
    setClockTime(selClock, h, m);
    c()?.requestRenderAll();
    saveHistory();
  };

  const selFraction = selectedObject?.teachTool === 'fraction' ? selectedObject : null;
  const frac = selFraction ? fractionState(selFraction) : null;

  return (
    <div className="space-y-5">
      <h4 className="text-sm font-semibold text-slate-800">Công cụ dạy học</h4>

      <div className="space-y-2 rounded-lg border border-slate-200 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <PieChart className="h-4 w-4 text-amber-500" /> Phân số
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[
            { id: 'circle', label: 'Hình tròn' },
            { id: 'bar', label: 'Thanh' },
            { id: 'square', label: 'Vuông' },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setPizzaShape(s.id)}
              className={`rounded-md border px-2 py-1 text-xs ${pizzaShape === s.id ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Số {pizzaShape === 'circle' ? 'lát' : 'phần'}</span>
          <input
            type="number"
            min={2}
            max={12}
            value={slices}
            onChange={(e) => setSlices(Math.max(2, Math.min(12, parseInt(e.target.value, 10) || 2)))}
            className="w-16 rounded-md border border-slate-200 px-2 py-1"
          />
        </div>
        <button
          type="button"
          onClick={makePizza}
          className="w-full rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
        >
          Thêm hình phân số
        </button>
        {frac && (
          <p className="text-center text-xs text-slate-500">
            Còn lại: <b className="text-amber-600">{frac.present}/{frac.total}</b>
            <span className="block text-[10px]">(nháy đúp vào lát để đánh dấu "đã ăn")</span>
          </p>
        )}
      </div>

      <div className="space-y-2 rounded-lg border border-slate-200 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Clock className="h-4 w-4 text-blue-600" /> Đồng hồ
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <input
            type="number"
            min={0}
            max={23}
            value={hour}
            onChange={(e) => { const h = parseInt(e.target.value, 10) || 0; setHour(h); if (selClock) applyClockTime(h, minute); }}
            className="w-14 rounded-md border border-slate-200 px-2 py-1"
          />
          <span>:</span>
          <input
            type="number"
            min={0}
            max={59}
            value={minute}
            onChange={(e) => { const m = parseInt(e.target.value, 10) || 0; setMinute(m); if (selClock) applyClockTime(hour, m); }}
            className="w-14 rounded-md border border-slate-200 px-2 py-1"
          />
        </div>
        <button
          type="button"
          onClick={makeClock}
          className="w-full rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Thêm đồng hồ
        </button>
        {selClock && <p className="text-center text-[10px] text-slate-500">Đang chỉnh đồng hồ đã chọn</p>}
      </div>

      <div className="space-y-2 rounded-lg border border-slate-200 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Divide className="h-4 w-4 text-emerald-600" /> Phân số dạng chữ
        </div>
        <div className="flex items-center justify-center gap-2 text-xs">
          <input
            value={numerator}
            onChange={(e) => setNumerator(e.target.value)}
            className="w-12 rounded-md border border-slate-200 px-2 py-1 text-center"
          />
          <span className="text-slate-400">/</span>
          <input
            value={denominator}
            onChange={(e) => setDenominator(e.target.value)}
            className="w-12 rounded-md border border-slate-200 px-2 py-1 text-center"
          />
        </div>
        <button
          type="button"
          onClick={makeTextFraction}
          className="w-full rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          Thêm ký hiệu phân số
        </button>
      </div>

      <p className="flex items-start gap-1 text-[11px] text-slate-400">
        <Smile className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Sticker đếm nằm ở tab Biểu tượng — thêm rồi nhân bản (Ctrl+C/V) để tạo bộ đếm.
      </p>
    </div>
  );
}
