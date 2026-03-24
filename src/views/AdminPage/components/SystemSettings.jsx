import { useState } from 'react';
import { Save } from 'lucide-react';
import { SETTINGS_SECTIONS, SETTINGS_TAB_ICON } from '../../../data/adminDashboardData';
import Toggle from '../../../common/Toggle';
import SettingRow from '../../../common/SettingRow';



export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    siteName: 'TeachAI',
    siteUrl: 'https://teachai.edu.vn',
    language: 'vi',
    maxUpload: '10',
    maintenance: false,
    twoFactor: true,
    sessionTimeout: '30',
    passwordMinLength: '8',
    emailNotif: true,
    pushNotif: false,
    weeklyReport: true,
    loginAlert: true,
  });

  const update = (key, value) => setSettings((s) => ({ ...s, [key]: value }));



  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý cấu hình chung của hệ thống</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-200">
          <Save className="w-4 h-4" />
          Lưu thay đổi
        </button>
      </div>


      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = SETTINGS_TAB_ICON[section.key];
          return (
            <button
              key={section.key}
              onClick={() => setActiveTab(section.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                ${activeTab === section.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {section.label}
            </button>
          );
        })}
      </div>


      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        {activeTab === 'general' && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cài đặt chung</h3>
            <p className="text-sm text-gray-500 mb-6">Cấu hình thông tin cơ bản của hệ thống</p>

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên hệ thống</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => update('siteName', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">URL</label>
                  <input
                    type="text"
                    value={settings.siteUrl}
                    onChange={(e) => update('siteUrl', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngôn ngữ mặc định</label>
                  <select
                    value={settings.language}
                    onChange={(e) => update('language', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all text-gray-700"
                  >
                    <option value="vi">🇻🇳 Tiếng Việt</option>
                    <option value="en">🇬🇧 English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Giới hạn upload (MB)</label>
                  <input
                    type="number"
                    value={settings.maxUpload}
                    onChange={(e) => update('maxUpload', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all"
                  />
                </div>
              </div>

              <SettingRow label="Chế độ bảo trì" description="Bật để chặn truy cập tạm thời vào hệ thống">
                <Toggle enabled={settings.maintenance} onToggle={() => update('maintenance', !settings.maintenance)} />
              </SettingRow>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Bảo mật</h3>
            <p className="text-sm text-gray-500 mb-6">Quản lý chính sách bảo mật hệ thống</p>

            <div>
              <SettingRow label="Xác thực 2 lớp (2FA)" description="Yêu cầu xác thực 2 lớp cho tất cả admin">
                <Toggle enabled={settings.twoFactor} onToggle={() => update('twoFactor', !settings.twoFactor)} />
              </SettingRow>

              <div className="py-4 border-b border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Thời gian hết phiên (phút)</label>
                    <input
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => update('sessionTimeout', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu tối thiểu (ký tự)</label>
                    <input
                      type="number"
                      value={settings.passwordMinLength}
                      onChange={(e) => update('passwordMinLength', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Thông báo</h3>
            <p className="text-sm text-gray-500 mb-6">Cấu hình cách nhận thông báo từ hệ thống</p>

            <div>
              <SettingRow label="Thông báo email" description="Nhận thông báo quan trọng qua email">
                <Toggle enabled={settings.emailNotif} onToggle={() => update('emailNotif', !settings.emailNotif)} />
              </SettingRow>
              <SettingRow label="Thông báo đẩy" description="Nhận thông báo trên trình duyệt">
                <Toggle enabled={settings.pushNotif} onToggle={() => update('pushNotif', !settings.pushNotif)} />
              </SettingRow>
              <SettingRow label="Báo cáo tuần" description="Nhận email tổng hợp hoạt động hàng tuần">
                <Toggle enabled={settings.weeklyReport} onToggle={() => update('weeklyReport', !settings.weeklyReport)} />
              </SettingRow>
              <SettingRow label="Cảnh báo đăng nhập" description="Thông báo khi có đăng nhập từ thiết bị lạ">
                <Toggle enabled={settings.loginAlert} onToggle={() => update('loginAlert', !settings.loginAlert)} />
              </SettingRow>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
