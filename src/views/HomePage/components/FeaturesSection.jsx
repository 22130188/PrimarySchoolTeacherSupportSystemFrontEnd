import { FEATURES } from '../../../data/homePageData';

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-violet-100 text-violet-700 text-sm font-semibold rounded-full mb-4">
            Tính năng nổi bật
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            Mọi thứ giáo viên cần
            <span className="block mt-3 text-violet-600">trong một nền tảng</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Không còn phải dùng nhiều phần mềm rời rạc. TeachAI hợp nhất soạn bài, kiểm tra và quản lý lớp học.
          </p>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((feat, i) => (
            <div
              key={i}
              className="group flex gap-6 bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                {feat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className={`text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br ${feat.color}`}>
                  {feat.stat}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{feat.statLabel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
