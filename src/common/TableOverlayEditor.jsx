import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Plus, Minus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Palette, X, Check, Merge, SplitSquareHorizontal,
} from 'lucide-react';
import { TABLE_STYLES } from '../utils/tableModel';
import { FONT_LIST } from '../data/editorSharedConstants';

const STYLE_SWATCHES = {
  plain: '#ffffff',
  professional: '#1e3a5f',
  grid: '#ea580c',
  striped: '#4f46e5',
  minimal: '#374151',
  colorful: '#8b5cf6',
};

function EditableCellText({ text, onInput, textRef }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (textRef) textRef.current = el;
    if (!el || document.activeElement === el) return;
    const nextText = text || '';
    if (el.textContent !== nextText) {
      el.textContent = nextText;
    }
  }, [text, textRef]);

  useEffect(() => () => {
    if (textRef) textRef.current = null;
  }, [textRef]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={(e) => onInput(e.currentTarget.textContent)}
      className="w-full outline-none"
    />
  );
}

export default function TableOverlayEditor({
  tableData,
  position,
  zoom = 1,
  onSave,
  onCancel,
}) {
  const [data, setData] = useState(() => JSON.parse(JSON.stringify(tableData)));
  const [selectedCell, setSelectedCell] = useState({ r: 0, c: 0 });
  const [selectionScope, setSelectionScope] = useState('cell');
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [resizing, setResizing] = useState(null);
  const editorRef = useRef(null);
  const tableRef = useRef(null);
  const cellRefs = useRef({});
  const textRefs = useRef({});
  const dataRef = useRef(data);

  useEffect(() => {
    const nextData = JSON.parse(JSON.stringify(tableData));
    dataRef.current = nextData;
    setData(nextData);
    setSelectedCell({ r: 0, c: 0 });
    setSelectionScope('cell');
  }, [tableData]);

  const getCellKey = (r, c) => `${r}-${c}`;

  const handleCellClick = (r, c) => {
    setSelectedCell({ r, c });
    setSelectionScope('cell');
  };

  const handleCellInput = useCallback((r, c, text) => {
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.cells[r][c].text = text;
      dataRef.current = next;
      return next;
    });
  }, []);

  const getLatestDataFromDom = useCallback((source = dataRef.current) => {
    const next = JSON.parse(JSON.stringify(source));
    for (let r = 0; r < next.rows; r++) {
      for (let c = 0; c < next.cols; c++) {
        const cell = next.cells[r]?.[c];
        if (!cell || cell.hidden) continue;
        const el = textRefs.current[getCellKey(r, c)]?.current;
        if (el) cell.text = el.textContent || '';
      }
    }
    dataRef.current = next;
    return next;
  }, []);

  const saveCurrentData = useCallback(() => {
    onSave(getLatestDataFromDom());
  }, [getLatestDataFromDom, onSave]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        saveCurrentData();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saveCurrentData]);

  const getTargetCells = (source = data) => {
    const { r, c } = selectedCell;
    if (selectionScope === 'row') {
      return Array.from({ length: source.cols }, (_, col) => ({ r, c: col }));
    }
    if (selectionScope === 'col') {
      return Array.from({ length: source.rows }, (_, row) => ({ r: row, c }));
    }
    return [{ r, c }];
  };

  const updateTargetCells = (updater) => {
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      getTargetCells(next).forEach(({ r, c }) => {
        const target = next.cells[r]?.[c];
        if (target && !target.hidden) updater(target, r, c);
      });
      return next;
    });
  };

  const isCellInSelection = (r, c) => {
    if (selectionScope === 'row') return r === selectedCell.r;
    if (selectionScope === 'col') return c === selectedCell.c;
    return r === selectedCell.r && c === selectedCell.c;
  };

  const toggleCellProp = (prop) => {
    const nextValue = !cell?.[prop];
    updateTargetCells(target => {
      target[prop] = nextValue;
    });
  };

  const setCellProp = (prop, value) => {
    updateTargetCells(target => {
      target[prop] = value;
    });
  };

  const setCellAlign = (align) => {
    updateTargetCells(target => {
      target.align = align;
    });
  };

  const addRow = (position) => {
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const { r } = selectedCell;
      const insertAt = position === 'before' ? r : r + 1;
      const newRow = Array(next.cols).fill(null).map(() => ({
        text: '', bold: false, italic: false, color: '', bgColor: '',
        align: '', fontFamily: '', fontSize: 0, colSpan: 1, rowSpan: 1, hidden: false,
      }));
      next.cells.splice(insertAt, 0, newRow);
      next.rows += 1;
      next.rowHeights.splice(insertAt, 0, next.rowHeights[r] || 36);
      return next;
    });
  };

  const addCol = (position) => {
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const { c } = selectedCell;
      const insertAt = position === 'before' ? c : c + 1;
      for (let r = 0; r < next.rows; r++) {
        next.cells[r].splice(insertAt, 0, {
          text: '', bold: false, italic: false, color: '', bgColor: '',
          align: '', fontFamily: '', fontSize: 0, colSpan: 1, rowSpan: 1, hidden: false,
        });
      }
      next.cols += 1;
      next.colWidths.splice(insertAt, 0, 120);
      return next;
    });
  };

  const deleteRow = () => {
    if (data.rows <= 1) return;
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const { r } = selectedCell;
      next.cells.splice(r, 1);
      next.rows -= 1;
      next.rowHeights.splice(r, 1);
      if (selectedCell.r >= next.rows) {
        setSelectedCell(s => ({ ...s, r: next.rows - 1 }));
      }
      return next;
    });
  };

  const deleteCol = () => {
    if (data.cols <= 1) return;
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const { c } = selectedCell;
      for (let r = 0; r < next.rows; r++) {
        next.cells[r].splice(c, 1);
      }
      next.cols -= 1;
      next.colWidths.splice(c, 1);
      if (selectedCell.c >= next.cols) {
        setSelectedCell(s => ({ ...s, c: next.cols - 1 }));
      }
      return next;
    });
  };

  const changeStyle = (styleName) => {
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.styleName = styleName;
      next.style = { ...TABLE_STYLES[styleName] };
      return next;
    });
    setShowStylePicker(false);
  };

  const handleResizeStart = (colIndex, e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = data.colWidths[colIndex];

    const handleMouseMove = (e) => {
      const diff = e.clientX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      setData(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        next.colWidths[colIndex] = newWidth;
        return next;
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setResizing(null);
    };

    setResizing({ type: 'col', index: colIndex });
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleRowResizeStart = (rowIndex, e) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const measuredHeight = cellRefs.current[getCellKey(rowIndex, 0)]?.getBoundingClientRect().height || 36;
    const startHeight = data.rowHeights[rowIndex] || measuredHeight;

    const handleMouseMove = (e) => {
      const diff = e.clientY - startY;
      const newHeight = Math.max(28, startHeight + diff);
      setData(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        next.rowHeights[rowIndex] = newHeight;
        return next;
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setResizing(null);
    };

    setResizing({ type: 'row', index: rowIndex });
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const style = data.style;
  const cell = data.cells[selectedCell.r]?.[selectedCell.c];
  const selectedFontFamily = cell?.fontFamily || style.fontFamily?.split(',')[0]?.trim() || 'Inter';
  const isGradientHeader = style.headerBg?.includes?.('gradient');
  const bottomBorderOnly = style.bottomBorderOnly;

  return (
    <>

      <div
        className="fixed inset-0 z-[9998]"
        onClick={saveCurrentData}
      />

      <div
        ref={editorRef}
        className="fixed z-[9999] bg-white rounded-xl flex flex-col max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{
          left: position.left,
          top: position.top,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.12), 0 12px 40px rgba(0,0,0,0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >

        <div className="flex items-center gap-0.5 px-2.5 py-1.5 border-b border-gray-100 bg-gray-50/80 rounded-t-xl flex-wrap">

          <div className="relative">
            <button
              onClick={() => setShowStylePicker(!showStylePicker)}
              className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md bg-transparent text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 transition-all text-[11px] font-medium border-none cursor-pointer"
              title="Kiểu bảng"
            >
              <Palette size={14} />
              <span className="hidden sm:inline">{TABLE_STYLES[data.styleName]?.name || 'Kiểu'}</span>
            </button>
            {showStylePicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-1.5 z-50 min-w-[160px] animate-in fade-in zoom-in-95 duration-150">
                {Object.entries(TABLE_STYLES).map(([key, s]) => (
                  <button
                    key={key}
                    onClick={() => changeStyle(key)}
                    className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md border-none cursor-pointer transition-colors text-left ${
                      data.styleName === key ? 'bg-indigo-50' : 'bg-transparent hover:bg-gray-100'
                    }`}
                  >
                    <span
                      className="w-5 h-3.5 rounded-sm border border-black/10 shrink-0"
                      style={{ background: STYLE_SWATCHES[key] }}
                    />
                    <span className="text-xs text-gray-700 font-medium">{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <div className="flex items-center gap-px">
            <button
              onClick={() => setSelectionScope(selectionScope === 'row' ? 'cell' : 'row')}
              className={`inline-flex items-center justify-center h-7 px-2 rounded-md border-none cursor-pointer transition-all text-[11px] font-medium ${
                selectionScope === 'row' ? 'bg-indigo-100 text-indigo-700' : 'bg-transparent text-gray-600 hover:bg-gray-200/70'
              }`}
              title="Chọn cả hàng hiện tại"
            >
              Hàng
            </button>
            <button
              onClick={() => setSelectionScope(selectionScope === 'col' ? 'cell' : 'col')}
              className={`inline-flex items-center justify-center h-7 px-2 rounded-md border-none cursor-pointer transition-all text-[11px] font-medium ${
                selectionScope === 'col' ? 'bg-indigo-100 text-indigo-700' : 'bg-transparent text-gray-600 hover:bg-gray-200/70'
              }`}
              title="Chọn cả cột hiện tại"
            >
              Cột
            </button>
          </div>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <select
            value={selectedFontFamily}
            onChange={(e) => setCellProp('fontFamily', e.target.value)}
            className="h-7 max-w-[128px] px-2 rounded-md border border-gray-200 bg-white text-[11px] text-gray-700 outline-none hover:border-gray-300 focus:border-indigo-400"
            title="Font chữ"
            style={{ fontFamily: selectedFontFamily }}
          >
            {FONT_LIST.map(font => (
              <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
            ))}
          </select>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <div className="flex items-center gap-px">
            <button
              onClick={() => toggleCellProp('bold')}
              className={`inline-flex items-center justify-center w-7 h-7 rounded-md border-none cursor-pointer transition-all ${
                cell?.bold ? 'bg-indigo-100 text-indigo-700' : 'bg-transparent text-gray-600 hover:bg-gray-200/70'
              }`}
              title="In đậm"
            >
              <Bold size={14} />
            </button>
            <button
              onClick={() => toggleCellProp('italic')}
              className={`inline-flex items-center justify-center w-7 h-7 rounded-md border-none cursor-pointer transition-all ${
                cell?.italic ? 'bg-indigo-100 text-indigo-700' : 'bg-transparent text-gray-600 hover:bg-gray-200/70'
              }`}
              title="In nghiêng"
            >
              <Italic size={14} />
            </button>
          </div>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <div className="flex items-center gap-px">
            {[
              { align: 'left', icon: AlignLeft },
              { align: 'center', icon: AlignCenter },
              { align: 'right', icon: AlignRight },
            ].map(({ align, icon: Icon }) => (
              <button
                key={align}
                onClick={() => setCellAlign(align)}
                className={`inline-flex items-center justify-center w-7 h-7 rounded-md border-none cursor-pointer transition-all ${
                  cell?.align === align ? 'bg-indigo-100 text-indigo-700' : 'bg-transparent text-gray-600 hover:bg-gray-200/70'
                }`}
                title={align === 'left' ? 'Trái' : align === 'center' ? 'Giữa' : 'Phải'}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <div className="flex items-center gap-1">
            <div className="relative w-7 h-7 rounded-md overflow-hidden border border-gray-200 cursor-pointer" title="Màu chữ">
              <input
                type="color"
                value={cell?.color || style.bodyColor}
                onChange={(e) => setCellProp('color', e.target.value)}
                className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] border-none cursor-pointer p-0"
              />
            </div>
            <div className="relative w-7 h-7 rounded-md overflow-hidden border border-gray-200 cursor-pointer" title="Màu nền ô">
              <input
                type="color"
                value={cell?.bgColor || '#ffffff'}
                onChange={(e) => setCellProp('bgColor', e.target.value)}
                className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] border-none cursor-pointer p-0"
              />
            </div>
          </div>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <div className="flex items-center gap-px">
            <button
              onClick={() => addRow('before')}
              className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-transparent text-gray-600 hover:bg-gray-200/70 border-none cursor-pointer transition-all"
              title="Thêm hàng phía trên"
            >
              <ArrowUp size={13} />
            </button>
            <button
              onClick={() => addRow('after')}
              className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-transparent text-gray-600 hover:bg-gray-200/70 border-none cursor-pointer transition-all"
              title="Thêm hàng phía dưới"
            >
              <ArrowDown size={13} />
            </button>
            <button
              onClick={() => addCol('before')}
              className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-transparent text-gray-600 hover:bg-gray-200/70 border-none cursor-pointer transition-all"
              title="Thêm cột bên trái"
            >
              <ArrowLeft size={13} />
            </button>
            <button
              onClick={() => addCol('after')}
              className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-transparent text-gray-600 hover:bg-gray-200/70 border-none cursor-pointer transition-all"
              title="Thêm cột bên phải"
            >
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <div className="flex items-center gap-px">
            <button
              onClick={deleteRow}
              disabled={data.rows <= 1}
              className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-transparent text-red-500 hover:bg-red-50 border-none cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="Xóa hàng"
            >
              <Minus size={13} />
            </button>
            <button
              onClick={deleteCol}
              disabled={data.cols <= 1}
              className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-transparent text-red-500 hover:bg-red-50 border-none cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="Xóa cột"
            >
              <X size={13} />
            </button>
          </div>

          <div className="flex-1" />

          <button
            onClick={saveCurrentData}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-indigo-500 text-white hover:bg-indigo-600 border-none cursor-pointer transition-all text-[11px] font-semibold"
          >
            <Check size={13} />
            Xong
          </button>
        </div>

        <div className="overflow-auto max-h-[calc(80vh-50px)] p-3">
          <table
            ref={tableRef}
            className="border-collapse"
            style={{
              fontFamily: style.fontFamily,
              fontSize: style.fontSize + 'px',
              lineHeight: style.lineHeight || 1.2,
              tableLayout: 'fixed',
              width: data.colWidths.reduce((s, w) => s + w, 0) + 'px',
              border: style.outerBorderWidth ? `${style.outerBorderWidth}px solid ${style.outerBorderColor}` : 'none',
            }}
          >
            <colgroup>
              {data.colWidths.map((w, i) => (
                <col key={i} style={{ width: w + 'px' }} />
              ))}
            </colgroup>
            <tbody>
              {data.cells.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => {
                    if (cell.hidden) return null;
                    const isHeader = r === 0;
                    const isSelected = isCellInSelection(r, c);
                    const Tag = isHeader ? 'th' : 'td';

                    const cellColor = cell.color || (isHeader ? style.headerColor : style.bodyColor);
                    const cellBg = cell.bgColor || (isHeader
                      ? style.headerBg
                      : (r % 2 === 0 ? style.bodyAltBg : style.bodyBg));
                    const cellAlign = cell.align || (isHeader ? style.headerAlign : 'left');
                    const fontWeight = cell.bold ? '700' : (isHeader ? style.headerFontWeight : 'normal');
                    const fontStyleVal = cell.italic ? 'italic' : 'normal';
                    const fontFamily = cell.fontFamily || style.fontFamily;
                    const justifyContent = cellAlign === 'center' ? 'center' : cellAlign === 'right' ? 'flex-end' : 'flex-start';

                    let borderStyle = {};
                    if (bottomBorderOnly) {
                      borderStyle = isHeader
                        ? { borderBottom: `${style.headerBorderWidth ?? 2}px solid ${style.headerBorderColor}` }
                        : { borderBottom: `1px solid ${style.borderColor}` };
                    } else {
                      borderStyle = {
                        border: `${style.borderWidth}px solid ${style.borderColor}`,
                        ...(isHeader && { borderBottom: `${style.headerBorderWidth ?? 2}px solid ${style.headerBorderColor}` }),
                      };
                    }

                    const bgIsGradient = isHeader && isGradientHeader && !cell.bgColor;

                    return (
                      <Tag
                        key={c}
                        ref={el => { cellRefs.current[getCellKey(r, c)] = el; }}
                        onClick={() => handleCellClick(r, c)}
                        colSpan={cell.colSpan > 1 ? cell.colSpan : undefined}
                        rowSpan={cell.rowSpan > 1 ? cell.rowSpan : undefined}
                        className={`relative min-w-[40px] min-h-[28px] break-words cursor-text transition-shadow duration-100 ${
                          isSelected ? 'ring-2 ring-inset ring-indigo-500 z-[1]' : ''
                        }`}
                        style={{
                          ...(bgIsGradient
                            ? { background: style.headerBg }
                            : { backgroundColor: cellBg }),
                          color: cellColor,
                          padding: 0,
                          lineHeight: style.lineHeight || 1.2,
                          height: data.rowHeights[r] ? `${data.rowHeights[r]}px` : undefined,
                          fontWeight,
                          fontStyle: fontStyleVal,
                          fontFamily,
                          textAlign: cellAlign,
                          verticalAlign: 'middle',
                          ...borderStyle,
                        }}
                      >

                        {r === 0 && (
                          <div
                            className={`absolute top-0 -right-[3px] w-[6px] h-full cursor-col-resize z-10 transition-colors ${
                              resizing?.type === 'col' && resizing.index === c ? 'bg-indigo-500' : 'bg-transparent hover:bg-indigo-500'
                            }`}
                            onMouseDown={(e) => handleResizeStart(c, e)}
                          />
                        )}
                        <div
                          className={`absolute -bottom-[3px] left-0 h-[6px] w-full cursor-row-resize z-10 transition-colors ${
                            resizing?.type === 'row' && resizing.index === r ? 'bg-indigo-500' : 'bg-transparent hover:bg-indigo-500'
                          }`}
                          onMouseDown={(e) => handleRowResizeStart(r, e)}
                        />
                        <div
                          style={{
                            boxSizing: 'border-box',
                            width: '100%',
                            height: '100%',
                            minHeight: data.rowHeights[r] ? `${data.rowHeights[r]}px` : '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent,
                            padding: style.cellPadding,
                            textAlign: cellAlign,
                            lineHeight: style.lineHeight || 1.2,
                          }}
                        >
                          <EditableCellText
                            text={cell.text}
                            onInput={(text) => handleCellInput(r, c, text)}
                            textRef={textRefs.current[getCellKey(r, c)] ||= { current: null }}
                          />
                        </div>
                      </Tag>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50/60 rounded-b-xl flex items-center justify-between">
          <span className="text-[10px] text-gray-400">
            {data.rows} × {data.cols} · Ô [{selectedCell.r + 1}, {selectedCell.c + 1}]
          </span>
          <span className="text-[10px] text-gray-400">
            ESC hoặc nhấn "Xong" để lưu
          </span>
        </div>
      </div>
    </>
  );
}
