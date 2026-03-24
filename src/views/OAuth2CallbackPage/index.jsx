import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function OAuth2CallbackPage() {
    const navigate = useNavigate();
    const setToken = useAuthStore((s) => s.setToken);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token  = params.get('token');
        if (token) {
            setToken(token);
            navigate('/profile', { replace: true });
        } else {
            navigate('/login', { replace: true });
        }
    }, [navigate, setToken]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-teal-50">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Đang xử lý đăng nhập...</p>
            </div>
        </div>
    );
}