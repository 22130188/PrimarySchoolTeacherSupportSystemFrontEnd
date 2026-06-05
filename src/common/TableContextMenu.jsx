import { useEffect, useRef } from 'react';
import { Plus, Minus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

export default function TableContextMenu({ x, y, onClose, onAction }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const style = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 10000,
  };

  const menuItems = [
    { label: 'Thêm hàng phía trên', icon: ArrowUp, action: 'addRowBefore' },
    { label: 'Thêm hàng phía dưới', icon: ArrowDown, action: 'addRowAfter' },
    { type: 'separator' },
    { label: 'Thêm cột bên trái', icon: ArrowLeft, action: 'addColBefore' },
    { label: 'Thêm cột bên phải', icon: ArrowRight, action: 'addColAfter' },
    { type: 'separator' },
    { label: 'Xóa hàng cuối', icon: Minus, action: 'deleteRow', danger: true },
    { label: 'Xóa cột cuối', icon: Minus, action: 'deleteCol', danger: true },
  ];

  return (
    <div ref={menuRef} style={style}
      className="bg-white rounded-lg shadow-xl border border-gray-200 py-1.5 min-w-[200px] animate-in fade-in zoom-in-95 duration-150"
    >
      {menuItems.map((item, idx) => {
        if (item.type === 'separator') {
          return <div key={idx} className="h-px bg-gray-100 my-1" />;
        }
        const Icon = item.icon;
        return (
          <button
            key={idx}
            onClick={() => { onAction(item.action); onClose(); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
              item.danger
                ? 'text-red-600 hover:bg-red-50'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
