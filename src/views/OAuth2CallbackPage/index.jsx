import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getMeAPI } from '../../services/userApi';

export default function OAuth2CallbackPage() {
    const navigate = useNavigate();
    const setToken = useAuthStore((s) => s.setToken);
    const setRole = useAuthStore((s) => s.setRole);
    const setUser = useAuthStore((s) => s.setUser);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token  = params.get('token');
        
        if (token) {
            setToken(token);
            console.log('[OAuth2CallbackPage] stored token in auth store/localStorage');

            (async () => {
                try {
                    // Lấy dữ liệu người dùng để xác định vai trò và chuyển hướng tương ứng
                    const user = await getMeAPI();
                    if (user?.isActive === false) {
                        throw new Error('Tài khoản đã bị khóa');
                    }
                    const roleName = user.role?.toUpperCase();
                    let roleId;
                    
                    if (roleName === 'ADMIN') roleId = 3;
                    else if (roleName === 'TEACHER') roleId = 2;
                    else roleId = 1;
                    
                    setUser(user);
                    setRole(roleId, roleName);

                    // Chuyển hướng dựa trên vai trò
                    if (roleId === 3) {
                        navigate('/admin', { replace: true });
                    } else {
                        navigate('/dashboard', { replace: true });
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    useAuthStore.getState().logout();
                    const msg = error?.message || 'Đăng nhập thất bại';
                    navigate(`/login?error=${encodeURIComponent(msg)}`, { replace: true });
                }
            })();
        } else {
            const oauthError = params.get('error');
            navigate(oauthError ? `/login?error=${encodeURIComponent(oauthError)}` : '/login', { replace: true });
        }
    }, [navigate, setToken, setRole, setUser]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-teal-50">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Đang xử lý đăng nhập...</p>
            </div>
        </div>
    );
}