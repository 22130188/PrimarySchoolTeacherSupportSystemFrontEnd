import { TESTIMONIALS, SOCIAL_PROOF } from '../../../data/homePageData';

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full mb-4">
            Giáo viên nói gì?
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            Được hàng nghìn giáo viên
            <span className="block mt-3 text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
              tin tưởng lựa chọn
            </span>
          </h2>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="group flex flex-col bg-white rounded-2xl p-7 shadow-md border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-gray-50 to-transparent -translate-y-8 translate-x-8 group-hover:scale-125 transition-transform duration-500" />


              <div className="flex gap-1 mb-5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <span key={j} className="text-amber-400 text-lg">★</span>
                ))}
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-1">"{t.quote}"</p>

              <span className="inline-block px-3 py-1 bg-violet-50 text-violet-600 text-xs font-semibold rounded-full mb-5 self-start">
                {t.tag}
              </span>

              <div className="flex items-center gap-3 border-t border-gray-100 pt-5">
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.avatarBg} flex items-center justify-center text-xl shadow-md`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-800">{t.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>


      </div>
    </section>
  );
}
