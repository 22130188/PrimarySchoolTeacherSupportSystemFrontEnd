import { useState } from 'react';
import Navbar from '../../components/Navbar';
import DashboardSidebar from '../../components/DashboardSidebar';
import { Sparkles } from 'lucide-react';
import { AI_TOOLS, AI_TOOL_CATEGORIES } from '../../data/mockDashboardData';
import { useNavigate } from 'react-router-dom';

export default function AIToolsPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const filteredTools = activeCategory === 'all'
    ? AI_TOOLS
    : AI_TOOLS.filter((tool) => tool.category === activeCategory);

  const handleToolClick = (toolId) => {
    switch (toolId) {
      case 'tts':
        navigate('/tts');
        break;
      case 'audio-gen':
        navigate('/image');
        break;
      case 'ai-image':
        navigate('/ai-image');
        break;
      case 'pronunciation':
        navigate('/pronunciation');
        break;
      default:
        console.log(`Tool ${toolId} clicked - implement navigation`);
        break;
    }
  };
  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Navbar />
      <div className="flex" style={{ paddingTop: '64px' }}>
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)]" style={{ marginLeft: '72px' }}>

          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">

              <div className="mb-5">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  Công cụ AI
                </h1>
              </div>

              <div className="mb-6 flex flex-wrap gap-2">
                {AI_TOOL_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.id)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeCategory === category.id ? 'bg-violet-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-violet-50'}`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredTools.map((tool) => (
                  <div
                    key={tool.id}
                    id={`ai-tool-${tool.id}`}
                    className="group bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer relative overflow-hidden"
                    onClick={() => handleToolClick(tool.id)}
                  >
                    <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br ${tool.gradient} opacity-5 group-hover:opacity-10 group-hover:scale-150 transition-all duration-500`} />

                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center text-white shadow-md mb-3 group-hover:scale-110 transition-transform duration-300`}>
                      {tool.icon}
                    </div>

                    <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full mb-2 ${tool.tagColor}`}>
                      {tool.tag}
                    </span>

                    <h3 className="text-base font-bold text-gray-800 mb-1.5">{tool.title}</h3>
                    <p className="text-sm text-gray-500 leading-snug mb-1.5">{tool.desc}</p>

                    <div className="flex items-center justify-end h-4">
                      <span className="text-xs font-semibold text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Sử dụng →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
