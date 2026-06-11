export default function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">

      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 40%, #0ea5e9 100%)',
        }}
      />


      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white/5 blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-teal-400/10 blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">


        <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
          Sẵn sàng nâng tầm
          <span className="block mt-3">bài giảng của bạn?</span>
        </h2>

        <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
          Tham gia cùng hàng nghìn giáo viên tiểu học đang sử dụng TeachPrimary để tạo bài giảng song ngữ thông minh, tiết kiệm thời gian và nâng cao chất lượng học tập.
        </p>


        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/register"
            className="px-10 py-4 rounded-full bg-white text-violet-700 font-bold text-base shadow-2xl hover:shadow-white/30 hover:-translate-y-1 transition-all duration-300 hover:bg-violet-50"
          >
            Bắt đầu
          </a>
          <a
            href="/login"
            className="px-10 py-4 rounded-full border-2 border-white/50 text-white font-semibold text-base hover:bg-white/15 hover:-translate-y-1 transition-all duration-300"
          >
            Đã có tài khoản? Đăng nhập
          </a>
        </div>
      </div>
    </section>
  );
}
