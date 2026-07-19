import {
  BookOpen,
  ClipboardCheck,
  Sparkles,
  Music,
  School,
  Pencil,
  Image,
  Upload,
  Library,
  CircleHelp,
  CheckCircle2,
  Target,
  ClipboardList,
  Volume2,
  Languages,
  Mic,
  Headphones,
  Megaphone,
  Mail,
  BarChart3,
  Settings,
} from 'lucide-react';
import { TOOL_CATEGORIES, TOOL_CARDS } from '../../../data/homePageData';
import { useUIStore } from '../../../stores/uiStore';

const ICONS = {
  BookOpen,
  ClipboardCheck,
  Sparkles,
  Music,
  School,
  Pencil,
  Image,
  Upload,
  Library,
  CircleHelp,
  CheckCircle2,
  Target,
  ClipboardList,
  Volume2,
  Languages,
  Mic,
  Headphones,
  Megaphone,
  Mail,
  BarChart3,
  Settings,
};

function ToolIcon({ name, className }) {
  const Icon = ICONS[name] || Sparkles;
  return <Icon className={className} />;
}

export default function ToolsSection() {
  const { activeToolCategory, setActiveToolCategory } = useUIStore();
  const cards = TOOL_CARDS[activeToolCategory] || [];

  return (
    <section id="ai-tools" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            Các công cụ giúp bạn tạo
            <span className="block mt-3 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-teal-500">
              thành quả tuyệt nhất
            </span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Từ soạn bài đến chấm điểm — tất cả trong một nền tảng duy nhất.
          </p>
        </div>


        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {TOOL_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveToolCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 ${activeToolCategory === cat.id
                  ? `bg-gradient-to-r ${cat.color} text-white border-transparent shadow-md scale-105`
                  : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600'
                }`}
            >
              <ToolIcon name={cat.icon} className="w-4 h-4" />
              {cat.label}
            </button>
          ))}
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => (
            <div
              key={i}
              className={`group relative rounded-2xl p-6 bg-gradient-to-br ${card.gradient} border border-white hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer overflow-hidden`}
            >
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/40 blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
              <div className="mb-4">
                <ToolIcon name={card.icon} className="w-9 h-9 text-gray-700" strokeWidth={1.75} />
              </div>
              <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full mb-3 ${card.tagColor}`}>
                {card.tag}
              </span>
              <h3 className="text-base font-bold text-gray-800 mb-2 leading-snug">{card.title}</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">{card.desc}</p>
              <div className="text-xs text-gray-600 bg-white/70 backdrop-blur-sm rounded-xl px-3 py-2 font-mono border border-white/80">
                {card.preview}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
