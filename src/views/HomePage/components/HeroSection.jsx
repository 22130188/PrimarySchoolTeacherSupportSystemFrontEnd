import { HERO_ICONS, HERO_STATS } from '../../../data/homePageData';
import { useParallax } from '../../../hooks/useParallax';

export default function HeroSection() {
  const heroRef = useParallax();

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
      style={{
        background: 'linear-gradient(180deg, #ede9fe 0%, #f3e8ff 30%, #fdf4ff 60%, #ffffff 100%)',
      }}
    >

      {HERO_ICONS.map((item, i) => (
        <div
          key={i}
          className={`parallax-icon absolute w-16 h-16 rounded-2xl shadow-xl flex items-center justify-center text-3xl select-none transition-transform duration-100 ${item.className}`}
          style={{ ...item.style, animation: `floatIcon 6s ease-in-out ${item.delay}s infinite` }}
        >
          {item.icon}
        </div>
      ))}


      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-violet-200/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-pink-200/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-100/20 blur-3xl pointer-events-none" />


      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">

        <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-violet-100/60 backdrop-blur-sm border border-violet-200 text-violet-700 text-sm font-medium">
          Tích hợp AI hỗ trợ giáo viên
        </div>


        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-violet-500 leading-tight mb-6 tracking-tight">
          Hệ thống hỗ trợ
          <span className="block mt-3">Giáo Viên Tiểu Học</span>
        </h1>


        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Soạn bài giảng song ngữ, tạo bài kiểm tra tương tác và kiểm tra phát âm với{' '}
          <strong className="text-gray-800">TeachAI</strong> — trợ lý thông minh dành riêng cho giáo viên tiểu học.
        </p>


        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a href="/register" className="px-8 py-4 rounded-full bg-violet-600 text-white font-bold text-base shadow-xl shadow-violet-300/40 hover:shadow-violet-400/50 hover:-translate-y-1 transition-all duration-300 hover:bg-violet-700">
            Bắt đầu
          </a>
          <a href="#demo" className="px-8 py-4 rounded-full bg-white text-gray-700 font-semibold text-base border border-gray-200 hover:border-violet-300 hover:text-violet-600 hover:-translate-y-1 transition-all duration-300">
            Hướng dẫn →
          </a>
        </div>


        <div className="mt-8 flex flex-wrap justify-center gap-8 text-gray-700">
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-extrabold">{stat.num}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>


      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 80L48 69.3C96 59 192 37 288 32C384 27 480 37 576 48C672 59 768 69 864 64C960 59 1056 37 1152 32C1248 27 1344 37 1392 42.7L1440 48V80H0Z" fill="white" />
        </svg>
      </div>

      <style>{`
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-12px) rotate(3deg); }
          66%       { transform: translateY(-6px) rotate(-2deg); }
        }
      `}</style>
    </section>
  );
}
