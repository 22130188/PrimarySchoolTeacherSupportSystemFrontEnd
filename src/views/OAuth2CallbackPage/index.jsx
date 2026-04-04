import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getMeAPI } from '../../services/userApi';

export default function OAuth2CallbackPage() {
    const navigate = useNavigate();
    const setToken = useAuthStore((s) => s.setToken);
    const setRole = useAuthStore((s) => s.setRole);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token  = params.get('token');
        
        if (token) {
            setToken(token);

            // Chờ một chút để đảm bảo token được lưu vào localStorage
            setTimeout(async () => {
                try {
                    // Lấy dữ liệu người dùng để xác định vai trò và chuyển hướng tương ứng
                    const user = await getMeAPI();
                    // Phân tích vai trò từ phản hồi của người dùng
                    const roleName = user.role?.toUpperCase();
                    let roleId;
                    
                    if (roleName === 'ADMIN') roleId = 3;
                    else if (roleName === 'TEACHER') roleId = 2;
                    else roleId = 1;
                    
                    setRole(roleId, roleName);

                    // Chuyển hướng dựa trên vai trò
                    if (roleId === 3) {
                        navigate('/admin', { replace: true });
                    } else if (roleId === 2) {
                        navigate('/dashboard', { replace: true });
                    } else {
                        navigate('/profile', { replace: true });
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    // Nếu getMeAPI thất bại, hãy chuyển hướng đến trang hồ sơ và để trang đó xử lý xác thực.
                    navigate('/profile', { replace: true });
                }
            }, 100); // Trì hoãn nhỏ để đảm bảo mã thông báo được lưu
        } else {
            navigate('/login', { replace: true });
        }
    }, [navigate, setToken, setRole]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-teal-50">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Đang xử lý đăng nhập...</p>
            </div>
        </div>
    );
}