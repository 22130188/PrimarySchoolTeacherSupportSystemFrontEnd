import { ChevronsUp, ArrowUp, ArrowDown, ChevronsDown } from 'lucide-react';
import { SIDEBAR_TABS } from './pptxConstants';

export default function PptxToolStrip({
  activeTab, panelOpen, onTogglePanel,
  hasSelection, onBringToFront, onBringForward, onSendBackward, onSendToBack,
}) {
  const isActive = (id) => panelOpen && activeTab === id;

  return (
    <div className="w-[72px] min-w-[72px] h-full bg-white border-r border-gray-200 flex flex-col items-center py-2 gap-1 overflow-y-auto [scrollbar-width:thin] z-[46]">
      {SIDEBAR_TABS.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.id);
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTogglePanel(tab.id)}
            title={tab.label}
            id={`pptx-rail-${tab.id}`}
            className={`w-[60px] shrink-0 flex flex-col items-center justify-center gap-1 py-2 rounded-lg cursor-pointer transition-all ${
              active
                ? 'bg-teal-50 text-teal-600'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-tight text-center">{tab.label}</span>
          </button>
        );
      })}

      {hasSelection && (
        <>
          <span className="my-1 h-px w-8 shrink-0 bg-gray-200" />
          <button type="button" onClick={onBringToFront} title="Đưa lên trên cùng" id="pptx-layer-front"
            className="w-9 h-9 shrink-0 rounded-md inline-flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all">
            <ChevronsUp className="h-4 w-4" />
          </button>
          <button type="button" onClick={onBringForward} title="Lên một lớp" id="pptx-layer-forward"
            className="w-9 h-9 shrink-0 rounded-md inline-flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all">
            <ArrowUp className="h-4 w-4" />
          </button>
          <button type="button" onClick={onSendBackward} title="Xuống một lớp" id="pptx-layer-backward"
            className="w-9 h-9 shrink-0 rounded-md inline-flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all">
            <ArrowDown className="h-4 w-4" />
          </button>
          <button type="button" onClick={onSendToBack} title="Đưa xuống dưới cùng" id="pptx-layer-back"
            className="w-9 h-9 shrink-0 rounded-md inline-flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all">
            <ChevronsDown className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
