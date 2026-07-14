import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { loginAPI } from '../../services/authApi';
import { getMeAPI } from '../../services/userApi';
import GoogleLoginButton from '../../components/GoogleLoginButton';
import { useAuthStore } from '../../stores/authStore';
import IllustratedBackground from '../../components/IllustratedBackground';

export default function LoginPage() {
    const setToken = useAuthStore((s) => s.setToken);
    const setRole = useAuthStore((s) => s.setRole);
    const setUser = useAuthStore((s) => s.setUser);
    const logout = useAuthStore((s) => s.logout);
    const [searchParams] = useSearchParams();
    const [account, setAccount] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const oauthError = searchParams.get('error');
        if (oauthError) {
            setError(oauthError);
            logout();
        }
    }, [searchParams, logout]);

    const isValid = account.trim() && password.trim();

    const handleLogin = async () => {
        if (!isValid || loading) return;
        setLoading(true);
        setError('');
        try {
            const loginResult = await loginAPI(account.trim(), password);
            const { token, roleId, roleName } = loginResult;
            const normalizedRoleId = Number(roleId);

            setToken(token);
            setRole(normalizedRoleId, roleName);

            const userProfile = await getMeAPI();
            if (userProfile?.isActive === false) {
                logout();
                throw new Error('Tài khoản đã bị khóa');
            }
            setUser(userProfile);

            window.location.replace(normalizedRoleId === 3 ? '/admin' : '/dashboard');
        } catch (err) {
            setError(err.message || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    const inputCls =
        'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition';

    return (
        <IllustratedBackground className="flex items-center justify-center px-4">
            <div
                className="relative z-10 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-violet-200/30 w-full max-w-md px-8 py-10 border border-white/60"
                style={{ animation: 'authCardIn 0.8s ease-out both' }}
            >
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center shadow-lg">
                        <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-teal-500 bg-clip-text text-transparent">
                        TeachPrimary
                    </span>
                </div>

                <h2 className="text-2xl font-bold text-gray-800 text-center mb-1">Đăng nhập</h2>
                <p className="text-sm text-gray-400 text-center mb-6">Chào mừng bạn trở lại! 👋</p>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
                        {error}
                    </div>
                )}

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tài khoản <span className="text-red-500">*</span>
                    </label>
                    <input type="text" placeholder="Nhập tên đăng nhập"
                        value={account} onChange={(e) => setAccount(e.target.value)} className={inputCls} />
                </div>

                <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input type={showPass ? 'text' : 'password'} placeholder="Nhập mật khẩu"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            className={`${inputCls} pr-11`} />
                        <button onClick={() => setShowPass(!showPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showPass ? '🙈' : '👁️'}
                        </button>
                    </div>
                </div>

                <div className="flex justify-end mb-6">
                    <button className="text-sm text-gray-500 underline hover:text-violet-600 transition">
                        Quên mật khẩu?
                    </button>
                </div>

                <button onClick={handleLogin} disabled={!isValid || loading}
                    className={`w-full py-3.5 rounded-xl font-bold text-base transition-all mb-4 flex items-center justify-center gap-2
            ${isValid && !loading
                            ? 'bg-gradient-to-r from-violet-600 to-violet-500 text-white hover:from-violet-700 hover:to-violet-600 shadow-md active:scale-95'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                    {loading && (
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                            <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                    )}
                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>

                <p className="text-center text-sm text-gray-600 mb-4">
                    Bạn chưa có tài khoản?{' '}
                    <Link to="/register" className="text-violet-600 font-semibold hover:underline">Đăng ký ngay</Link>
                </p>

                <p className="text-center text-xs text-gray-400 mb-5 leading-relaxed">
                    Bằng việc đăng nhập, bạn đồng ý với{' '}
                    <span className="underline cursor-pointer hover:text-violet-500">điều khoản dịch vụ</span>
                    {' '}và{' '}
                    <span className="underline cursor-pointer hover:text-violet-500">chính sách bảo mật</span>
                </p>

                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-gray-400 text-xs whitespace-nowrap">Hoặc đăng nhập bằng</span>
                    <div className="flex-1 h-px bg-gray-200" />
                </div>

                <GoogleLoginButton label="Google" />

                <div className="text-center mt-5">
                    <Link to="/" className="text-xs text-gray-400 hover:text-violet-500 transition">
                        ← Quay về trang chủ
                    </Link>
                </div>
            </div>
        </IllustratedBackground>
    );
}
