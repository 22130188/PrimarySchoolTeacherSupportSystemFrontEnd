import { Menu, Search, Bell, ChevronRight } from 'lucide-react';
import { useAdminStore } from '../../../stores/adminStore';
import { ADMIN_MENU } from '../../../data/adminDashboardData';

export default function AdminHeader() {
  const { activePage, searchQuery, setSearchQuery, toggleMobileSidebar } = useAdminStore();

  const currentPage = ADMIN_MENU.find((m) => m.key === activePage);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200/80">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">

        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileSidebar}
            className="lg:hidden p-2 -ml-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-400 hidden sm:inline">Admin</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 hidden sm:inline" />
            <span className="font-semibold text-gray-800">{currentPage?.label || 'Tổng quan'}</span>
          </nav>
        </div>


        <div className="flex items-center gap-2 sm:gap-3">

          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-52 lg:w-64 pl-9 pr-4 py-2 text-sm bg-gray-100 border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all duration-200 placeholder-gray-400"
            />
          </div>


          <button className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>


          <button className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
              A
            </div>
            <span className="text-sm font-medium text-gray-700 hidden md:inline">Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
}
