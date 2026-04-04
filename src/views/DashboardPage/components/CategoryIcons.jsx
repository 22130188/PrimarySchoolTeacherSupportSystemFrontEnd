import { DASHBOARD_CATEGORIES } from '../../../data/homePageData';

export default function CategoryIcons() {
  return (
    <div className="px-6 py-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8">
          {DASHBOARD_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              id={`category-${cat.id}`}
              className="group flex flex-col items-center gap-2 w-16 sm:w-20 transition-transform duration-200 hover:-translate-y-1"
            >
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-sm group-hover:shadow-md transition-all duration-200 group-hover:scale-110"
                style={{ backgroundColor: cat.bgColor }}
              >
                {cat.icon}
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-gray-600 text-center leading-tight group-hover:text-violet-600 transition-colors duration-200">
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
