import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { getMeAPI } from '../../../services/userApi';
import PersonalInfo from '../../ProfilePage/components/PersonalInfo';
import SchoolInfo from '../../ProfilePage/components/SchoolInfo';
import ClassInfo from '../../ProfilePage/components/ClassInfo';
import AvatarInfo from '../../ProfilePage/components/AvatarInfo';
import ChangePassword from '../../ProfilePage/components/ChangePassword';

export default function AdminProfile() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const roleId = useAuthStore((s) => s.roleId);
  const storeUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const [activeTab, setActiveTab] = useState('personal');
  const [user, setLocalUser] = useState(storeUser);
  const [loading, setLoading] = useState(!storeUser);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (!storeUser) {
      getMeAPI()
        .then((data) => {
          setLocalUser(data);
          setUser(data);
        })
        .catch(() => {
          logout();
          navigate('/login');
        })
        .finally(() => setLoading(false));
    }
  }, [token, storeUser, setUser, logout, navigate]);

  const handleUserUpdate = (updated) => {
    setLocalUser((prev) => ({ ...prev, ...updated }));
    setUser({ ...user, ...updated });
  };

  // const handleLogout = () => {
  //   logout();
  //   navigate('/login');
  // };

  if (loading) return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <h1 className="text-2xl font-bold text-gray-800">Hồ sơ cá nhân</h1>
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-200"
          >
            <option value="personal">Cá nhân</option>
            <option value="school">Trường học</option>
            {roleId === 2 && <option value="class">Lớp học</option>}
            <option value="avatar">Ảnh đại diện</option>
            <option value="password">Đổi mật khẩu</option>
          </select>
        </div>

        <div className="p-4 bg-gray-50 rounded-2xl">
          {activeTab === 'personal' && <PersonalInfo user={user} onUpdate={handleUserUpdate} />}
          {activeTab === 'school' && <SchoolInfo user={user} onUpdate={handleUserUpdate} />}
          {activeTab === 'class' && roleId === 2 && <ClassInfo user={user} onUpdate={handleUserUpdate} />}
          {activeTab === 'avatar' && <AvatarInfo user={user} onUpdate={handleUserUpdate} />}
          {activeTab === 'password' && <ChangePassword />}
        </div>

        <div className="mt-6 text-right">
          {/*<button*/}
          {/*  onClick={handleLogout}*/}
          {/*  className="px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition"*/}
          {/*>*/}
          {/*  Đăng xuất*/}
          {/*</button>*/}
        </div>
      </div>
    </div>
  );
}
