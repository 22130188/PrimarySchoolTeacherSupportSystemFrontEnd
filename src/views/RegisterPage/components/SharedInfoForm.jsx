import { useState, useEffect, useRef } from 'react';
import { sendOtpAPI } from '../../../services/authApi';

const GRADES = ['1A','1B','1C','2A','2B','2C','3A','3B','3C','4A','4B','4C','5A','5B','5C','Khác'];

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
);

export default function SharedInfoForm({
                                           formData, onChange,
                                           onPrimary, primaryLabel,
                                           onBack,
                                           showGrade = false,
                                           loading = false,
                                       }) {
    const [showPass,     setShowPass]     = useState(false);
    const [showConfirm,  setShowConfirm]  = useState(false);
    const [otpLoading,   setOtpLoading]   = useState(false);
    const [otpSent,      setOtpSent]      = useState(false);
    const [otpError,     setOtpError]     = useState('');
    const [countdown,    setCountdown]    = useState(0); // đếm ngược giây
    const timerRef = useRef(null);

    //  timer khi unmount
    useEffect(() => () => clearInterval(timerRef.current), []);

    const startCountdown = () => {
        setCountdown(60);
        timerRef.current = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) { clearInterval(timerRef.current); return 0; }
                return c - 1;
            });
        }, 1000);
    };

    const handleSendOtp = async () => {
        if (!formData.email.trim()) {
            setOtpError('Vui lòng nhập email trước!');
            return;
        }
        setOtpError('');
        setOtpLoading(true);
        try {
            await sendOtpAPI(formData.email.trim());
            setOtpSent(true);
            startCountdown();
        } catch (err) {
            setOtpError(err.message);
        } finally {
            setOtpLoading(false);
        }
    };

    const canResend = otpSent && countdown === 0 && !otpLoading;

    const passwordMismatch = formData.confirmPassword && formData.confirmPassword !== formData.password;

    const isValid =
        formData.name.trim() &&
        formData.email.trim() &&
        formData.school.trim() &&
        formData.password &&
        formData.confirmPassword === formData.password &&
        formData.otp.trim() &&
        (!showGrade || formData.grade);

    const inputCls =
        'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition bg-white';

    return (
        <div className="w-full max-w-xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-1 text-center">Thông tin cá nhân</h2>

            <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-gray-400 text-sm whitespace-nowrap">Hoặc đăng ký bằng</span>
                <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="flex justify-center mb-5">
                <button className="inline-flex items-center gap-3 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition">
                    <GoogleIcon /> Google
                </button>
            </div>

            <div className="flex flex-col gap-4">
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Tên đăng nhập <span className="text-red-500">*</span>
                    </label>
                    <input type="text" placeholder="Nhập tên đăng nhập"
                           value={formData.name} onChange={(e) => onChange({ name: e.target.value })}
                           className={inputCls} />
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                        <input type="email" placeholder="example@gmail.com"
                               value={formData.email} onChange={(e) => { onChange({ email: e.target.value }); setOtpError(''); }}
                               className={`${inputCls} flex-1`} />
                        <button
                            onClick={handleSendOtp}
                            disabled={otpLoading || (otpSent && countdown > 0)}
                            className={`px-4 py-3 text-sm font-semibold rounded-xl whitespace-nowrap transition min-w-[90px] flex items-center justify-center gap-1
                ${otpLoading || (otpSent && countdown > 0)
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white'}`}>
                            {otpLoading ? (
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                </svg>
                            ) : (otpSent ? (canResend ? 'Gửi lại OTP' : `${countdown}s`) : 'Gửi OTP')}
                        </button>
                    </div>
                    {otpError && <p className="text-red-500 text-xs mt-1">{otpError}</p>}
                    {otpSent && !otpError && (
                        <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                            Mã OTP đã được gửi đến <strong>{formData.email}</strong>
                            {countdown > 0 && <span className="text-gray-400">— Gửi lại sau {countdown}s</span>}
                        </p>
                    )}
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Mã OTP <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder={otpSent ? 'Nhập mã OTP vừa gửi đến email của bạn' : 'Bấm "Gửi OTP" trước'}
                        value={formData.otp}
                        onChange={(e) => onChange({ otp: e.target.value })}
                        disabled={!otpSent}
                        maxLength={6}
                        className={`${inputCls} tracking-widest font-mono ${!otpSent ? 'bg-gray-50 text-gray-400' : ''}`}
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Tên trường <span className="text-red-500">*</span>
                    </label>
                    <input type="text" placeholder="Nhập tên trường tiểu học"
                           value={formData.school} onChange={(e) => onChange({ school: e.target.value })}
                           className={inputCls} />
                </div>

                {showGrade && (
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Lớp học <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select value={formData.grade} onChange={(e) => onChange({ grade: e.target.value })}
                                    className={`${inputCls} appearance-none cursor-pointer text-gray-600 pr-10`}>
                                <option value="">-- Vui lòng chọn lớp --</option>
                                {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                            </select>
                            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▾</div>
                        </div>
                    </div>
                )}

                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input type={showPass ? 'text' : 'password'}
                               placeholder="Ít nhất 6 ký tự, có chữ hoa và ký tự đặc biệt"
                               value={formData.password} onChange={(e) => onChange({ password: e.target.value })}
                               className={`${inputCls} pr-11`} />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showPass ? '🙈' : '👁️'}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Xác nhận mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input type={showConfirm ? 'text' : 'password'} placeholder="Nhập lại mật khẩu"
                               value={formData.confirmPassword} onChange={(e) => onChange({ confirmPassword: e.target.value })}
                               className={`${inputCls} pr-11`} />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showConfirm ? '🙈' : '👁️'}
                        </button>
                    </div>
                    {passwordMismatch && <p className="text-red-500 text-xs mt-1">Mật khẩu không khớp</p>}
                </div>
            </div>

            <div className="flex gap-3 mt-8">
                <button onClick={onBack}
                        className="flex-1 py-4 rounded-xl border-2 border-violet-500 text-violet-600 font-semibold hover:bg-violet-50 transition">
                    Quay lại
                </button>
                <button onClick={onPrimary} disabled={!isValid || loading}
                        className={`flex-1 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
            ${isValid && !loading
                            ? 'bg-gradient-to-r from-violet-600 to-violet-500 text-white hover:from-violet-700 hover:to-violet-600 shadow-md active:scale-95'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                    {loading && (
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                    )}
                    {loading ? 'Đang xử lý...' : primaryLabel}
                </button>
            </div>
        </div>
    );
}