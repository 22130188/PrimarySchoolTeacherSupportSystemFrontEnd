import { User, Building2, Users, UserCircle, Lock, LogOut } from 'lucide-react';

const MENU = [
    { id: 'personal', icon: User,        label: 'Cá nhân' },
    { id: 'school',   icon: Building2,   label: 'Trường học' },
    { id: 'class',    icon: Users,       label: 'Lớp học' },
    { id: 'avatar',   icon: UserCircle,  label: 'Ảnh đại diện' },
    { id: 'password', icon: Lock,        label: 'Đổi mật khẩu' },
];

export default function Sidebar({ activeTab, onTabChange, onLogout }) {
    return (
        <div className="w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {MENU.map((item, i) => {
                    const Icon    = item.icon;
                    const active  = activeTab === item.id;
                    return (
                        <button key={item.id} onClick={() => onTabChange(item.id)}
                                className={`w-full flex items-center gap-3 px-5 py-4 text-sm font-medium transition-all
                ${i < MENU.length - 1 ? 'border-b border-gray-100' : ''}
                ${active
                                    ? 'text-violet-600 bg-violet-50'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-violet-500'}`}>
                            <Icon className={`w-4 h-4 ${active ? 'text-violet-500' : 'text-gray-400'}`} />
                            {item.label}
                        </button>
                    );
                })}

                <button onClick={onLogout}
                        className="w-full flex items-center gap-3 px-5 py-4 text-sm font-medium text-red-500 hover:bg-red-50 border-t border-gray-100 transition">
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                </button>
            </div>
        </div>
    );
}