import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getMeAPI } from '../../services/userApi';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Sidebar from './components/Sidebar';
import PersonalInfo from './components/PersonalInfo';
import SchoolInfo from './components/SchoolInfo';
import ClassInfo from './components/ClassInfo';
import AvatarInfo from './components/AvatarInfo';
import ChangePassword from './components/ChangePassword';

export default function ProfilePage() {
    const navigate = useNavigate();
    const token = useAuthStore((s) => s.token);
    const roleId = useAuthStore((s) => s.roleId);
    const setUser = useAuthStore((s) => s.setUser);
    const logout = useAuthStore((s) => s.logout);

    const [activeTab, setActiveTab] = useState('personal');
    const [user, setLocalUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Kiểm tra xem người dùng đã đăng nhập hay chưa
        if (!token) {
            navigate('/login');
            return;
        }

        if (roleId && roleId !== 1 && roleId !== 2) {
            navigate('/admin');
            return;
        }

        getMeAPI()
            .then((data) => { setLocalUser(data); setUser(data); })
            .catch(() => { logout(); navigate('/login'); })
            .finally(() => setLoading(false));
    }, [token, roleId]);

    const handleUserUpdate = (updated) => {
        setLocalUser((prev) => ({ ...prev, ...updated }));
        setUser({ ...user, ...updated });
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="pt-24 pb-10 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <Footer />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-1 pt-24 pb-10">
                <div className="max-w-5xl mx-auto px-4 flex gap-6">

                    <Sidebar
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        onLogout={() => { logout(); navigate('/'); }}
                    />

                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        {activeTab === 'personal' && <PersonalInfo user={user} onUpdate={handleUserUpdate} />}
                        {activeTab === 'school' && <SchoolInfo user={user} onUpdate={handleUserUpdate} />}
                        {activeTab === 'class' && roleId === 2 && <ClassInfo user={user} onUpdate={handleUserUpdate} />}
                        {activeTab === 'avatar' && <AvatarInfo user={user} onUpdate={handleUserUpdate} />}
                        {activeTab === 'password' && <ChangePassword />}
                    </div>
                </div>
            </main>


        </div>
    );
}