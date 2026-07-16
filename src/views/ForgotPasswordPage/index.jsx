import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Check, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import IllustratedBackground from '../../components/IllustratedBackground';
import { requestPasswordResetAPI, resetPasswordAPI, verifyPasswordResetOtpAPI } from '../../services/authApi';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[@#$%^&+=!]).{6,}$/;
const STEP_LABELS = ['Email', 'Xác thực', 'Mật khẩu mới'];
const inputClass = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition';

function Spinner() {
    return <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden="true" />;
}

function PasswordField({ label, value, onChange, placeholder, onEnter }) {
    const [visible, setVisible] = useState(false);
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={visible ? 'text' : 'password'} value={value}
                    onChange={(event) => onChange(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && onEnter()}
                    placeholder={placeholder} autoComplete="new-password"
                    className={`${inputClass} pl-10 pr-11`} />
                <button type="button" onClick={() => setVisible((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-violet-600 transition"
                    aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                    {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [resendSeconds, setResendSeconds] = useState(0);

    useEffect(() => {
        if (resendSeconds <= 0) return undefined;
        const timer = window.setInterval(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
        return () => window.clearInterval(timer);
    }, [resendSeconds]);

    const normalizedEmail = email.trim().toLowerCase();
    const emailValid = EMAIL_PATTERN.test(normalizedEmail);
    const otpValid = /^\d{6}$/.test(otp);
    const passwordValid = PASSWORD_PATTERN.test(password);
    const passwordsMatch = password === confirmPassword;

    const execute = async (action) => {
        if (loading) return;
        setLoading(true); setError(''); setMessage('');
        try { await action(); }
        catch (err) { setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.'); }
        finally { setLoading(false); }
    };

    const requestOtp = (isResend = false) => execute(async () => {
        if (!emailValid) return setError('Vui lòng nhập địa chỉ email hợp lệ.');
        const result = await requestPasswordResetAPI(normalizedEmail);
        setStep(2); setOtp(''); setResendSeconds(60);
        setMessage(isResend ? 'Mã OTP mới đã được gửi.' : result.message);
    });

    const verifyOtp = () => execute(async () => {
        if (!otpValid) return setError('Mã OTP phải gồm đúng 6 chữ số.');
        const result = await verifyPasswordResetOtpAPI(normalizedEmail, otp);
        setResetToken(result.resetToken); setStep(3);
    });

    const updatePassword = () => execute(async () => {
        if (!passwordValid) return setError('Mật khẩu cần ít nhất 6 ký tự, có chữ hoa và ký tự đặc biệt.');
        if (!passwordsMatch) return setError('Mật khẩu xác nhận chưa khớp.');
        await resetPasswordAPI(normalizedEmail, resetToken, password);
        setStep(4);
    });

    const goBack = () => {
        setError(''); setMessage('');
        if (step === 2) { setStep(1); setOtp(''); }
        else if (step === 3) { setStep(2); setResetToken(''); setPassword(''); setConfirmPassword(''); }
        else navigate('/login');
    };

    const mainButton = (enabled) => `mt-6 w-full py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2 ${enabled && !loading
        ? 'bg-gradient-to-r from-violet-600 to-violet-500 text-white hover:from-violet-700 hover:to-violet-600 shadow-md active:scale-[0.98]'
        : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`;

    return (
        <IllustratedBackground className="flex items-center justify-center px-4 py-8">
            <main className="relative z-10 bg-white/85 backdrop-blur-xl rounded-2xl shadow-2xl shadow-violet-200/30 w-full max-w-lg px-6 sm:px-9 py-8 border border-white/60"
                style={{ animation: 'authCardIn 0.8s ease-out both' }}>
                <div className="flex items-center justify-center gap-2 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center shadow-lg">
                        <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-teal-500 bg-clip-text text-transparent">TeachPrimary</span>
                </div>

                {step < 4 && <div className="flex items-start justify-center mb-7" aria-label={`Bước ${step} trên 3`}>
                    {STEP_LABELS.map((label, index) => {
                        const number = index + 1; const completed = number < step; const active = number === step;
                        return <div key={label} className="flex items-start last:flex-none">
                            <div className="flex flex-col items-center w-20 sm:w-24">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition ${completed
                                    ? 'bg-violet-500 border-violet-500 text-white' : active
                                        ? 'bg-white border-violet-500 text-violet-600 shadow-sm' : 'bg-white/70 border-gray-200 text-gray-400'}`}>
                                    {completed ? <Check className="w-4 h-4" /> : number}
                                </div>
                                <span className={`mt-1.5 text-[11px] ${active ? 'text-violet-600 font-semibold' : 'text-gray-400'}`}>{label}</span>
                            </div>
                            {index < 2 && <div className={`w-8 sm:w-12 h-0.5 mt-4 -mx-3 ${completed ? 'bg-violet-400' : 'bg-gray-200'}`} />}
                        </div>;
                    })}
                </div>}

                {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
                {message && step !== 4 && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 mb-4">{message}</div>}

                {step === 1 && <section>
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4"><Mail className="w-7 h-7" /></div>
                    <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">Quên mật khẩu?</h1>
                    <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">Nhập email đã đăng ký. Chúng tôi sẽ gửi mã OTP để xác thực tài khoản của bạn.</p>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email đăng ký</label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)}
                            onKeyDown={(event) => event.key === 'Enter' && requestOtp()} placeholder="vidu@gmail.com"
                            autoComplete="email" autoFocus className={`${inputClass} pl-10`} />
                    </div>
                    <button type="button" onClick={() => requestOtp()} disabled={!emailValid || loading} className={mainButton(emailValid)}>
                        {loading && <Spinner />}{loading ? 'Đang gửi mã...' : 'Gửi mã xác thực'}
                    </button>
                </section>}

                {step === 2 && <section>
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4"><ShieldCheck className="w-7 h-7" /></div>
                    <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">Nhập mã OTP</h1>
                    <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">Mã gồm 6 chữ số đã được gửi đến<br /><strong className="text-gray-700">{normalizedEmail}</strong></p>
                    <input type="text" inputMode="numeric" value={otp}
                        onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                        onKeyDown={(event) => event.key === 'Enter' && verifyOtp()} placeholder="000000"
                        autoComplete="one-time-code" autoFocus
                        className={`${inputClass} py-3.5 text-center text-xl font-bold tracking-[0.45em]`} />
                    <p className="text-xs text-gray-400 text-center mt-3">Mã OTP có hiệu lực trong 5 phút.</p>
                    <button type="button" onClick={verifyOtp} disabled={!otpValid || loading} className={mainButton(otpValid)}>
                        {loading && <Spinner />}{loading ? 'Đang xác thực...' : 'Xác thực OTP'}
                    </button>
                    <div className="text-center mt-4 text-sm text-gray-500">Chưa nhận được mã?{' '}
                        <button type="button" onClick={() => requestOtp(true)} disabled={resendSeconds > 0 || loading}
                            className="font-semibold text-violet-600 hover:underline disabled:text-gray-400 disabled:no-underline">
                            {resendSeconds > 0 ? `Gửi lại sau ${resendSeconds}s` : 'Gửi lại mã'}
                        </button>
                    </div>
                </section>}

                {step === 3 && <section>
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4"><KeyRound className="w-7 h-7" /></div>
                    <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">Tạo mật khẩu mới</h1>
                    <p className="text-sm text-gray-500 text-center mb-6">Hãy chọn mật khẩu an toàn và khác mật khẩu bạn đã dùng trước đây.</p>
                    <div className="space-y-4">
                        <PasswordField label="Mật khẩu mới" value={password} onChange={setPassword} placeholder="Nhập mật khẩu mới" onEnter={updatePassword} />
                        <PasswordField label="Xác nhận mật khẩu mới" value={confirmPassword} onChange={setConfirmPassword} placeholder="Nhập lại mật khẩu mới" onEnter={updatePassword} />
                    </div>
                    <div className="mt-3 text-xs space-y-1.5">
                        <p className={password.length >= 6 ? 'text-emerald-600' : 'text-gray-400'}>• Ít nhất 6 ký tự</p>
                        <p className={/[A-Z]/.test(password) ? 'text-emerald-600' : 'text-gray-400'}>• Có ít nhất một chữ hoa</p>
                        <p className={/[@#$%^&+=!]/.test(password) ? 'text-emerald-600' : 'text-gray-400'}>• Có ít nhất một ký tự đặc biệt</p>
                        {confirmPassword && !passwordsMatch && <p className="text-red-500">• Mật khẩu xác nhận chưa khớp</p>}
                    </div>
                    <button type="button" onClick={updatePassword} disabled={!passwordValid || !passwordsMatch || loading}
                        className={mainButton(passwordValid && passwordsMatch)}>
                        {loading && <Spinner />}{loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                    </button>
                </section>}

                {step === 4 && <section className="text-center py-2">
                    <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5"><CheckCircle2 className="w-10 h-10" /></div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Đổi mật khẩu thành công!</h1>
                    <p className="text-sm text-gray-500 mb-7 leading-relaxed">Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập bằng mật khẩu mới.</p>
                    <Link to="/login" className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-violet-500 text-white hover:from-violet-700 hover:to-violet-600 shadow-md transition flex items-center justify-center">Đăng nhập ngay</Link>
                </section>}

                {step < 4 && <button type="button" onClick={goBack}
                    className="mx-auto mt-5 flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 transition">
                    <ArrowLeft className="w-4 h-4" />{step === 1 ? 'Quay lại đăng nhập' : 'Quay lại bước trước'}
                </button>}
            </main>
        </IllustratedBackground>
    );
}
