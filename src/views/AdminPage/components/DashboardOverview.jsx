import { TrendingUp, TrendingDown, Plus, BookOpen, Users, School } from 'lucide-react';
import { STAT_CARDS, MONTHLY_DATA, RECENT_ACTIVITIES } from '../../../data/adminDashboardData';

export default function DashboardOverview() {
  const maxSessions = Math.max(...MONTHLY_DATA.map((d) => d.sessions));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="group relative bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                  <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${card.trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {card.trend === 'up'
                      ? <TrendingUp className="w-3.5 h-3.5" />
                      : <TrendingDown className="w-3.5 h-3.5" />
                    }
                    <span>{card.change} so với tháng trước</span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className={`absolute bottom-0 left-4 right-4 h-1 rounded-full bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            </div>
          );
        })}
      </div>


      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        <div className="xl:col-span-3 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Hoạt động theo tháng</h3>
              <p className="text-sm text-gray-500 mt-0.5">Lượt truy cập và người dùng mới trong năm</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
                <span className="text-gray-500">Lượt truy cập</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400" />
                <span className="text-gray-500">Người dùng mới</span>
              </div>
            </div>
          </div>


          <div className="flex items-end gap-2 sm:gap-3 h-48">
            {MONTHLY_DATA.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group/bar">
                <span className="text-[10px] font-semibold text-gray-500 opacity-0 group-hover/bar:opacity-100 transition-opacity">
                  {d.sessions}
                </span>
                <div className="w-full flex gap-0.5 items-end" style={{ height: '100%' }}>

                  <div
                    className="flex-1 bg-gradient-to-t from-violet-500 to-indigo-400 rounded-t-md hover:from-violet-600 hover:to-indigo-500 transition-all duration-200"
                    style={{ height: `${(d.sessions / maxSessions) * 100}%`, minHeight: '4px' }}
                  />

                  <div
                    className="flex-1 bg-gradient-to-t from-teal-400 to-cyan-300 rounded-t-md hover:from-teal-500 hover:to-cyan-400 transition-all duration-200"
                    style={{ height: `${(d.users / maxSessions) * 100}%`, minHeight: '4px' }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 font-medium">{d.month}</span>
              </div>
            ))}
          </div>
        </div>


        <div className="xl:col-span-2 space-y-6">

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Thao tác nhanh</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Plus,     label: 'Thêm người dùng',   gradient: 'from-violet-500 to-indigo-600' },
                { icon: BookOpen, label: 'Quản lý môn học',    gradient: 'from-teal-500 to-cyan-600' },
                { icon: School,   label: 'Tạo lớp học',       gradient: 'from-rose-500 to-pink-600' },
                { icon: Users,    label: 'Quản lý quyền',     gradient: 'from-amber-500 to-orange-600' },
              ].map((action) => {
                const AIcon = action.icon;
                return (
                  <button
                    key={action.label}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all duration-200 group"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200`}>
                      <AIcon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-600 text-center">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>


      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Hoạt động gần đây</h3>
          <button className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors">
            Xem tất cả
          </button>
        </div>
        <div className="space-y-4">
          {RECENT_ACTIVITIES.map((act) => (
            <div
              key={act.id}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200"
            >
              <div className={`w-10 h-10 rounded-full ${act.color} flex items-center justify-center text-lg flex-shrink-0`}>
                {act.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">
                  <span className="font-semibold">{act.user}</span>{' '}
                  <span className="text-gray-500">{act.action}</span>{' '}
                  {act.subject && <span className="font-medium text-violet-600">{act.subject}</span>}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{act.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
