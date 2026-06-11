import { HERO_STATS } from '../../../data/homePageData';
import IllustratedBackground from '../../../components/IllustratedBackground';

export default function HeroSection() {
  return (
    <IllustratedBackground
      as="section"
      className="flex items-center justify-center pt-16"
      gradient="linear-gradient(180deg, #ede9fe 0%, #f3e8ff 30%, #fdf4ff 60%, #ffffff 100%)"
      imageOpacity={0.8}
      imageHeight="h-[75%] max-h-[650px]"
      showOnMobile={true}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[
          { top: '15%', left: '8%', size: 6, color: '#c4b5fd', delay: 0 },
          { top: '25%', right: '12%', size: 8, color: '#ddd6fe', delay: 0.5 },
          { top: '70%', left: '15%', size: 5, color: '#f0abfc', delay: 1.0 },
          { top: '60%', right: '8%', size: 7, color: '#c4b5fd', delay: 1.5 },
          { top: '40%', left: '5%', size: 4, color: '#e9d5ff', delay: 0.8 },
          { top: '35%', right: '5%', size: 5, color: '#fbcfe8', delay: 1.2 },
        ].map((dot, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              top: dot.top,
              left: dot.left,
              right: dot.right,
              width: dot.size,
              height: dot.size,
              backgroundColor: dot.color,
              opacity: 0.5,
              animation: `floatDot 8s ease-in-out ${dot.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-violet-500 leading-tight mb-6 tracking-tight">
          Hệ Thống Hỗ Trợ
          <span className="block mt-3">Giáo Viên Tiểu Học</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Soạn bài giảng song ngữ, tạo bài kiểm tra tương tác và kiểm tra phát âm với{' '}
          <strong className="text-gray-800">TeachPrimary</strong> — tích hợp AI dành riêng cho giáo viên tiểu học.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a href="/register" className="px-8 py-4 rounded-full bg-violet-600 text-white font-bold text-base shadow-xl shadow-violet-300/40 hover:shadow-violet-400/50 hover:-translate-y-1 transition-all duration-300 hover:bg-violet-700">
            Bắt đầu
          </a>
          <a href="#demo" className="px-8 py-4 rounded-full bg-white text-gray-700 font-semibold text-base border border-gray-200 hover:border-violet-300 hover:text-violet-600 hover:-translate-y-1 transition-all duration-300">
            Hướng dẫn →
          </a>
        </div>


      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 80L48 69.3C96 59 192 37 288 32C384 27 480 37 576 48C672 59 768 69 864 64C960 59 1056 37 1152 32C1248 27 1344 37 1392 42.7L1440 48V80H0Z" fill="white" />
        </svg>
      </div>

      <style>{`
        @keyframes floatDot {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-15px); }
        }
      `}</style>
    </IllustratedBackground>
  );
}
