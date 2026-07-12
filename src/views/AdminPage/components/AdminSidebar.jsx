import { BookOpen, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { ADMIN_MENU } from '../../../data/adminDashboardData';
import { useAdminStore } from '../../../stores/adminStore';
export default function AdminSidebar() {
  const {
    activePage, setActivePage,
    sidebarCollapsed, toggleSidebar,
    mobileSidebarOpen, setMobileSidebarOpen,
  } = useAdminStore();

  const sidebarContent = (
    <div className="flex flex-col h-full">

      <div className={`flex items-center gap-2.5 px-5 pt-6 pb-8 ${sidebarCollapsed ? 'justify-center px-3' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 flex-shrink-0">
          <BookOpen className="w-[18px] h-[18px] text-white" />
        </div>
        {!sidebarCollapsed && (
          <span className="text-base font-bold bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent whitespace-nowrap">
            TeachPrimary Admin
          </span>
        )}

        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="ml-auto lg:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>


      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
        {ADMIN_MENU.map((item) => {
          const Icon = item.icon;
          const routePath = item.key === 'dashboard' ? '/admin' : `/admin/${item.key}`;
          
          return (
            <NavLink
              key={item.key}
              to={routePath}
              end={item.key === 'dashboard'}
              onClick={() => setMobileSidebarOpen(false)}
              className={({ isActive }) => `
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${sidebarCollapsed ? 'justify-center px-2' : ''}
                ${isActive
                  ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/25'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>


      <div className="px-3 space-y-2 shrink-0" style={{ paddingBottom: 24 }}>

        <button
          onClick={toggleSidebar}
          className="hidden lg:flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200"
          style={{ justifyContent: sidebarCollapsed ? 'center' : undefined }}
        >
          {sidebarCollapsed
            ? <ChevronRight className="w-5 h-5" />
            : <><ChevronLeft className="w-5 h-5 flex-shrink-0" /><span>Thu gọn</span></>
          }
        </button>


      </div>
    </div>
  );

  return (
    <>

      <aside
        className={`
          hidden lg:flex flex-col fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-40
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-[72px]' : 'w-64'}
        `}
      >
        {sidebarContent}
      </aside>


      {mobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}


      <aside
        className={`
          lg:hidden fixed top-0 left-0 h-screen w-72 bg-white border-r border-gray-200 z-50
          transition-transform duration-300 ease-in-out
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
