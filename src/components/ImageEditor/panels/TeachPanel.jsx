import { useMemo, useState } from 'react';
import {
  PieChart, Clock, Divide, Smile, ChevronDown,
  Ruler, Thermometer, Scale, Minus, Grid3x3, Shapes, BarChart3, CalendarDays, Hash,
} from 'lucide-react';
import { addFractionPizza, fractionState, setFractionColor, FRACTION_COLORS } from '../tools/fractionTool.js';
import { addClock, setClockTime } from '../tools/clockTool.js';
import { addTextFraction } from '../tools/textFraction.js';
import { addRuler, addThermometer, setThermometerValue, addBalanceScale } from '../tools/measureTools.js';
import { addNumberLine, addCoordinatePlane } from '../tools/numberTools.js';
import { addGeometryShape } from '../tools/geometryTools.js';
import { addChart } from '../tools/chartTools.js';
import { addCalendar } from '../tools/calendarTools.js';
import { addCountingSticks, setCountingStickColor } from '../tools/countingStickTool.js';

const GEOMETRY_SHAPES = [
  { id: 'square', label: 'Vuông' },
  { id: 'rectangle', label: 'Chữ nhật' },
  { id: 'circle', label: 'Tròn' },
  { id: 'triangle', label: 'Tam giác' },
  { id: 'rightTriangle', label: 'TG vuông' },
  { id: 'pentagon', label: 'Ngũ giác' },
  { id: 'hexagon', label: 'Lục giác' },
  { id: 'rhombus', label: 'Thoi' },
  { id: 'trapezoid', label: 'Thang' },
  { id: 'parallelogram', label: 'B.hành' },
  { id: 'oval', label: 'Bầu dục' },
];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({ value: i, label: `Tháng ${i + 1}` }));

function Section({ id, icon: Icon, title, accent, open, onToggle, children }) {
  return (
    <div className="rounded-lg border border-slate-200">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700"
      >
        <Icon className={`h-4 w-4 ${accent}`} />
        <span className="flex-1 text-left">{title}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="space-y-2 border-t border-slate-100 p-3">{children}</div>}
    </div>
  );
}

const inputCls = 'w-16 rounded-md border border-slate-200 px-2 py-1 text-xs';
const btnPrimary = 'w-full rounded-md px-3 py-1.5 text-xs font-semibold text-white';

export default function TeachPanel({ fabricRef, selectedObject, saveHistory, fractionTick }) {
  const [openSection, setOpenSection] = useState('fraction');

  // fraction
  const [slices, setSlices] = useState(8);
  const [pizzaShape, setPizzaShape] = useState('circle');
  const [fractionColor, setFractionColorState] = useState(FRACTION_COLORS[0]);
  const [fracNum, setFracNum] = useState('3');
  const [fracDen, setFracDen] = useState('8');
  // clock
  const [hour, setHour] = useState(3);
  const [minute, setMinute] = useState(0);
  // text fraction
  const [numerator, setNumerator] = useState('1');
  const [denominator, setDenominator] = useState('2');
  // measure
  const [rulerLen, setRulerLen] = useState(15);
  const [thermoVal, setThermoVal] = useState(25);
  const [scaleLeft, setScaleLeft] = useState(3);
  const [scaleRight, setScaleRight] = useState(2);
  // number
  const [nlMin, setNlMin] = useState(0);
  const [nlMax, setNlMax] = useState(10);
  const [nlStep, setNlStep] = useState(1);
  const [cpMin, setCpMin] = useState(-5);
  const [cpMax, setCpMax] = useState(5);
  // geometry
  const [geoShape, setGeoShape] = useState('square');
  const [geoLabel, setGeoLabel] = useState(true);
  // chart
  const [chartType, setChartType] = useState('column');
  const [chartData, setChartData] = useState('A:5, B:8, C:3, D:6');
  const [chartTitle, setChartTitle] = useState('Biểu đồ');
  // calendar
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calHighlight, setCalHighlight] = useState('');
  // que tính
  const [stickOnes, setStickOnes] = useState(5);
  const [stickTens, setStickTens] = useState(1);
  const [stickColor, setStickColor] = useState('#f59e0b');
  const [stickLabel, setStickLabel] = useState(false);

  const c = () => fabricRef.current;
  const toggle = (id) => setOpenSection((cur) => (cur === id ? null : id));
  const withCanvas = (fn) => {
    const canvas = c();
    if (!canvas) return;
    fn(canvas);
    saveHistory();
  };

  const makePizza = () => withCanvas((canvas) => addFractionPizza(canvas, { slices, shape: pizzaShape, color: fractionColor }));
  const makePizzaFromFraction = () => withCanvas((canvas) => {
    const den = Math.max(2, Math.min(12, parseInt(fracDen, 10) || 2));
    const num = Math.max(0, Math.min(den, parseInt(fracNum, 10) || 0));
    addFractionPizza(canvas, { slices: den, shape: pizzaShape, color: fractionColor, filled: num });
  });
  const makeClock = () => withCanvas((canvas) => addClock(canvas, { hour, minute }));
  const makeTextFraction = () => withCanvas((canvas) => addTextFraction(canvas, { numerator, denominator }));
  const makeRuler = () => withCanvas((canvas) => addRuler(canvas, { lengthCm: rulerLen }));
  const makeThermo = () => withCanvas((canvas) => addThermometer(canvas, { value: thermoVal }));
  const makeScale = () => withCanvas((canvas) => addBalanceScale(canvas, { leftValue: scaleLeft, rightValue: scaleRight }));
  const makeNumberLine = () => withCanvas((canvas) => addNumberLine(canvas, { min: nlMin, max: nlMax, step: nlStep }));
  const makeCoordPlane = () => withCanvas((canvas) => addCoordinatePlane(canvas, { min: cpMin, max: cpMax }));
  const makeGeometry = () => withCanvas((canvas) => addGeometryShape(canvas, { shape: geoShape, showLabel: geoLabel }));
  const makeCalendar = () => withCanvas((canvas) => addCalendar(canvas, {
    year: Number(calYear) || new Date().getFullYear(),
    month: Number(calMonth),
    highlight: calHighlight === '' ? null : Number(calHighlight),
  }));
  const makeChart = () => withCanvas((canvas) => {
    const data = chartData.split(',').map((pair) => {
      const [label, value] = pair.split(':');
      return { label: (label || '').trim(), value: Number((value || '').trim()) || 0 };
    }).filter((d) => d.label);
    addChart(canvas, { type: chartType, data: data.length ? data : null, title: chartTitle });
  });
  const makeCountingSticks = () => withCanvas((canvas) => {
    addCountingSticks(canvas, {
      ones: Math.max(0, Math.min(20, Number(stickOnes) || 0)),
      tens: Math.max(0, Math.min(20, Number(stickTens) || 0)),
      color: stickColor,
      showLabel: stickLabel,
    });
  });

  const selSticks = selectedObject?.teachTool === 'countingStick' ? selectedObject : null;
  const pickStickColor = (color) => {
    setStickColor(color);
    if (selSticks) {
      setCountingStickColor(selSticks, color);
      saveHistory();
    }
  };

  // live-edit selected clock / thermometer
  const selClock = selectedObject?.teachTool === 'clock' ? selectedObject : null;
  const applyClockTime = (h, m) => {
    if (!selClock) return;
    setClockTime(selClock, h, m);
    c()?.requestRenderAll();
    saveHistory();
  };
  const selThermo = selectedObject?.teachTool === 'thermometer' ? selectedObject : null;
  const applyThermo = (v) => {
    if (!selThermo) return;
    setThermometerValue(selThermo, v);
    saveHistory();
  };

  const selFraction = selectedObject?.teachTool === 'fraction' ? selectedObject : null;
  const frac = useMemo(
    () => (selFraction ? fractionState(selFraction) : null),
    [selFraction, fractionTick]
  );
  const pickColor = (color) => {
    setFractionColorState(color);
    if (selFraction) {
      setFractionColor(selFraction, color);
      c()?.requestRenderAll();
      saveHistory();
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-slate-800">Công cụ dạy học</h4>

      {/* Que tính */}
      <Section id="queTinh" icon={Hash} title="Que tính (đếm)" accent="text-orange-500" open={openSection === 'queTinh'} onToggle={toggle}>
        <p className="text-[11px] text-slate-500">Dành cho môn Toán — tạo que rời và bó 1 chục (10 que).</p>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Số chục</span>
          <input
            type="number" min={0} max={20} value={stickTens}
            onChange={(e) => setStickTens(Math.max(0, Math.min(20, parseInt(e.target.value, 10) || 0)))}
            className={inputCls}
          />
          <span className="ml-2">Số que rời</span>
          <input
            type="number" min={0} max={20} value={stickOnes}
            onChange={(e) => setStickOnes(Math.max(0, Math.min(20, parseInt(e.target.value, 10) || 0)))}
            className={inputCls}
          />
        </div>
        <div className="space-y-1">
          <span className="text-xs text-slate-600">Màu que{selSticks ? ' (đổi hình đang chọn)' : ''}</span>
          <div className="flex flex-wrap gap-1.5">
            {['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#78716c'].map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => pickStickColor(color)}
                style={{ backgroundColor: color }}
                className={`h-6 w-6 rounded-full border-2 transition ${stickColor === color ? 'border-slate-700 ring-2 ring-slate-300' : 'border-white'}`}
                aria-label={`Màu ${color}`}
              />
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={stickLabel} onChange={(e) => setStickLabel(e.target.checked)} />
          Hiện nhãn tổng (= số)
        </label>
        <button type="button" onClick={() => makeCountingSticks()} className={`${btnPrimary} bg-orange-500 hover:bg-orange-600`}>
          Thêm que tính ({stickTens * 10 + stickOnes})
        </button>
      </Section>

      {/* Phân số */}
      <Section id="fraction" icon={PieChart} title="Phân số (hình)" accent="text-amber-500" open={openSection === 'fraction'} onToggle={toggle}>
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
            type="number" min={2} max={12} value={slices}
            onChange={(e) => setSlices(Math.max(2, Math.min(12, parseInt(e.target.value, 10) || 2)))}
            className={inputCls}
          />
        </div>
        <div className="space-y-1">
          <span className="text-xs text-slate-600">Màu {selFraction ? '(đổi hình đang chọn)' : ''}</span>
          <div className="flex flex-wrap gap-1.5">
            {FRACTION_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => pickColor(color)}
                style={{ backgroundColor: color }}
                className={`h-6 w-6 rounded-full border-2 transition ${fractionColor === color ? 'border-slate-700 ring-2 ring-slate-300' : 'border-white'}`}
                aria-label={`Chọn màu ${color}`}
              />
            ))}
          </div>
        </div>
        <button type="button" onClick={makePizza} className={`${btnPrimary} bg-amber-500 hover:bg-amber-600`}>
          Thêm hình phân số
        </button>
        <div className="space-y-1 border-t border-slate-100 pt-2">
          <span className="text-xs text-slate-600">Tạo từ phân số</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              <input type="number" min={0} max={12} value={fracNum} onChange={(e) => setFracNum(e.target.value)} className="w-12 rounded-md border border-slate-200 px-2 py-1 text-center" />
              <span className="text-slate-400">/</span>
              <input type="number" min={2} max={12} value={fracDen} onChange={(e) => setFracDen(e.target.value)} className="w-12 rounded-md border border-slate-200 px-2 py-1 text-center" />
            </div>
            <button type="button" onClick={makePizzaFromFraction} className="flex-1 rounded-md border border-amber-500 px-2 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-50">
              Tạo hình
            </button>
          </div>
        </div>
        {frac && (
          <p className="text-center text-xs text-slate-500">
            Còn lại: <b className="text-amber-600">{frac.present}/{frac.total}</b>
            <span className="block text-[10px]">(nháy đúp vào lát để đánh dấu "đã ăn")</span>
          </p>
        )}
      </Section>

      {/* Đồng hồ */}
      <Section id="clock" icon={Clock} title="Đồng hồ" accent="text-blue-600" open={openSection === 'clock'} onToggle={toggle}>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <input type="number" min={0} max={23} value={hour}
            onChange={(e) => { const h = parseInt(e.target.value, 10) || 0; setHour(h); if (selClock) applyClockTime(h, minute); }}
            className="w-14 rounded-md border border-slate-200 px-2 py-1" />
          <span>:</span>
          <input type="number" min={0} max={59} value={minute}
            onChange={(e) => { const m = parseInt(e.target.value, 10) || 0; setMinute(m); if (selClock) applyClockTime(hour, m); }}
            className="w-14 rounded-md border border-slate-200 px-2 py-1" />
        </div>
        <button type="button" onClick={makeClock} className={`${btnPrimary} bg-blue-600 hover:bg-blue-700`}>Thêm đồng hồ</button>
        {selClock && <p className="text-center text-[10px] text-slate-500">Đang chỉnh đồng hồ đã chọn</p>}
      </Section>

      {/* Phân số dạng chữ */}
      <Section id="textFrac" icon={Divide} title="Phân số dạng chữ" accent="text-emerald-600" open={openSection === 'textFrac'} onToggle={toggle}>
        <div className="flex items-center justify-center gap-2 text-xs">
          <input value={numerator} onChange={(e) => setNumerator(e.target.value)} className="w-12 rounded-md border border-slate-200 px-2 py-1 text-center" />
          <span className="text-slate-400">/</span>
          <input value={denominator} onChange={(e) => setDenominator(e.target.value)} className="w-12 rounded-md border border-slate-200 px-2 py-1 text-center" />
        </div>
        <button type="button" onClick={makeTextFraction} className={`${btnPrimary} bg-emerald-600 hover:bg-emerald-700`}>Thêm ký hiệu phân số</button>
      </Section>

      {/* Thước kẻ */}
      <Section id="ruler" icon={Ruler} title="Thước kẻ (cm)" accent="text-yellow-600" open={openSection === 'ruler'} onToggle={toggle}>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Độ dài</span>
          <input type="number" min={2} max={30} value={rulerLen}
            onChange={(e) => setRulerLen(Math.max(2, Math.min(30, parseInt(e.target.value, 10) || 2)))} className={inputCls} />
          <span>cm</span>
        </div>
        <button type="button" onClick={makeRuler} className={`${btnPrimary} bg-yellow-500 hover:bg-yellow-600`}>Thêm thước</button>
      </Section>

      {/* Nhiệt kế */}
      <Section id="thermo" icon={Thermometer} title="Nhiệt kế" accent="text-red-500" open={openSection === 'thermo'} onToggle={toggle}>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Nhiệt độ</span>
          <input type="number" min={-10} max={50} value={thermoVal}
            onChange={(e) => { const v = parseInt(e.target.value, 10) || 0; setThermoVal(v); if (selThermo) applyThermo(v); }}
            className={inputCls} />
          <span>°C</span>
        </div>
        <button type="button" onClick={makeThermo} className={`${btnPrimary} bg-red-500 hover:bg-red-600`}>Thêm nhiệt kế</button>
        {selThermo && <p className="text-center text-[10px] text-slate-500">Đang chỉnh nhiệt kế đã chọn</p>}
      </Section>

      {/* Cân thăng bằng */}
      <Section id="scale" icon={Scale} title="Cân thăng bằng" accent="text-teal-600" open={openSection === 'scale'} onToggle={toggle}>
        <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
          <input type="number" min={0} max={99} value={scaleLeft} onChange={(e) => setScaleLeft(Math.max(0, parseInt(e.target.value, 10) || 0))} className="w-14 rounded-md border border-slate-200 px-2 py-1 text-center" />
          <span className="text-slate-400">kg / kg</span>
          <input type="number" min={0} max={99} value={scaleRight} onChange={(e) => setScaleRight(Math.max(0, parseInt(e.target.value, 10) || 0))} className="w-14 rounded-md border border-slate-200 px-2 py-1 text-center" />
        </div>
        <button type="button" onClick={makeScale} className={`${btnPrimary} bg-teal-600 hover:bg-teal-700`}>Thêm cân</button>
      </Section>

      {/* Trục số */}
      <Section id="numberLine" icon={Minus} title="Trục số" accent="text-indigo-600" open={openSection === 'numberLine'} onToggle={toggle}>
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <span>Từ</span>
          <input type="number" value={nlMin} onChange={(e) => setNlMin(parseInt(e.target.value, 10) || 0)} className="w-12 rounded-md border border-slate-200 px-2 py-1 text-center" />
          <span>đến</span>
          <input type="number" value={nlMax} onChange={(e) => setNlMax(parseInt(e.target.value, 10) || 0)} className="w-12 rounded-md border border-slate-200 px-2 py-1 text-center" />
          <span>bước</span>
          <input type="number" min={1} value={nlStep} onChange={(e) => setNlStep(Math.max(1, parseInt(e.target.value, 10) || 1))} className="w-10 rounded-md border border-slate-200 px-2 py-1 text-center" />
        </div>
        <button type="button" onClick={makeNumberLine} className={`${btnPrimary} bg-indigo-600 hover:bg-indigo-700`}>Thêm trục số</button>
      </Section>

      {/* Mặt phẳng tọa độ */}
      <Section id="coordPlane" icon={Grid3x3} title="Mặt phẳng tọa độ" accent="text-sky-600" open={openSection === 'coordPlane'} onToggle={toggle}>
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <span>Từ</span>
          <input type="number" value={cpMin} onChange={(e) => setCpMin(parseInt(e.target.value, 10) || 0)} className="w-12 rounded-md border border-slate-200 px-2 py-1 text-center" />
          <span>đến</span>
          <input type="number" value={cpMax} onChange={(e) => setCpMax(parseInt(e.target.value, 10) || 0)} className="w-12 rounded-md border border-slate-200 px-2 py-1 text-center" />
        </div>
        <button type="button" onClick={makeCoordPlane} className={`${btnPrimary} bg-sky-600 hover:bg-sky-700`}>Thêm hệ trục</button>
      </Section>

      {/* Hình học */}
      <Section id="geometry" icon={Shapes} title="Hình học" accent="text-blue-500" open={openSection === 'geometry'} onToggle={toggle}>
        <div className="grid grid-cols-3 gap-1">
          {GEOMETRY_SHAPES.map((s) => (
            <button key={s.id} type="button" onClick={() => setGeoShape(s.id)}
              className={`rounded-md border px-1.5 py-1 text-[11px] ${geoShape === s.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}>
              {s.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={geoLabel} onChange={(e) => setGeoLabel(e.target.checked)} />
          Hiện tên hình
        </label>
        <button type="button" onClick={makeGeometry} className={`${btnPrimary} bg-blue-500 hover:bg-blue-600`}>Thêm hình</button>
      </Section>

      {/* Biểu đồ */}
      <Section id="chart" icon={BarChart3} title="Biểu đồ" accent="text-violet-600" open={openSection === 'chart'} onToggle={toggle}>
        <div className="grid grid-cols-3 gap-1">
          {[
            { id: 'column', label: 'Cột' },
            { id: 'bar', label: 'Ngang' },
            { id: 'pie', label: 'Tròn' },
          ].map((t) => (
            <button key={t.id} type="button" onClick={() => setChartType(t.id)}
              className={`rounded-md border px-2 py-1 text-xs ${chartType === t.id ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-600'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <input value={chartTitle} onChange={(e) => setChartTitle(e.target.value)} placeholder="Tiêu đề" className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs" />
        <textarea value={chartData} onChange={(e) => setChartData(e.target.value)} rows={2}
          placeholder="Nhãn:giá trị, cách nhau bởi dấu phẩy" className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs" />
        <p className="text-[10px] text-slate-400">VD: Táo:5, Cam:8, Chuối:3</p>
        <button type="button" onClick={makeChart} className={`${btnPrimary} bg-violet-600 hover:bg-violet-700`}>Thêm biểu đồ</button>
      </Section>

      {/* Lịch */}
      <Section id="calendar" icon={CalendarDays} title="Lịch tháng" accent="text-rose-600" open={openSection === 'calendar'} onToggle={toggle}>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <select value={calMonth} onChange={(e) => setCalMonth(Number(e.target.value))} className="flex-1 rounded-md border border-slate-200 px-2 py-1">
            {MONTH_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <input type="number" value={calYear} onChange={(e) => setCalYear(e.target.value)} className="w-20 rounded-md border border-slate-200 px-2 py-1 text-center" />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Tô đậm ngày</span>
          <input type="number" min={1} max={31} value={calHighlight} onChange={(e) => setCalHighlight(e.target.value)}
            placeholder="—" className={inputCls} />
        </div>
        <button type="button" onClick={makeCalendar} className={`${btnPrimary} bg-rose-600 hover:bg-rose-700`}>Thêm lịch</button>
      </Section>

      <p className="flex items-start gap-1 text-[11px] text-slate-400">
        <Smile className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Sticker đếm nằm ở tab Biểu tượng — thêm rồi nhân bản (Ctrl+C/V) để tạo bộ đếm.
      </p>
    </div>
  );
}
