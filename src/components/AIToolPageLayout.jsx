import Navbar from './Navbar';
import DashboardSidebar from './DashboardSidebar';

export default function AIToolPageLayout({
  icon,
  iconBgClass = 'bg-violet-100',
  iconTextClass = 'text-violet-600',
  title,
  description,
  children,
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="flex pt-16">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)] ml-[72px]">
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-6xl mx-auto">
              <section className="rounded-[28px] border border-gray-200 bg-white shadow-sm p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-5 mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${iconBgClass} ${iconTextClass} flex items-center justify-center shadow-sm`}>
                      {icon}
                    </div>
                    <div>
                      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
                      <p className="text-sm text-slate-500">{description}</p>
                    </div>
                  </div>
                </div>

                {children}
              </section>
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}
