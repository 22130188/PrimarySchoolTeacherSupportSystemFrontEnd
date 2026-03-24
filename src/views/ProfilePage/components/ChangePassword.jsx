import { useState } from 'react';
import { changePasswordAPI } from '../../../services/userApi';

function PassField({ label, value, onChange, placeholder }) {
    const [show, setShow] = useState(false);
    return (
        <div className="w-full max-w-sm">
            <label className="text-sm font-medium text-gray-700 mb-1 block text-left">
                {label} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
                <input
                    type={show ? 'text' : 'password'}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition bg-white"
                />
                <button type="button" onClick={() => setShow(!show)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {show ? '🙈' : '👁️'}
                </button>
            </div>
        </div>
    );
}

export default function ChangePassword() {
    const [current, setCurrent] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error,   setError]   = useState('');

    const mismatch = confirm && confirm !== newPass;
    const isValid  = current && newPass && confirm === newPass;

    const handleSubmit = async () => {
        if (!isValid || loading) return;
        setLoading(true); setSuccess(''); setError('');
        try {
            await changePasswordAPI({ currentPassword: current, newPassword: newPass });
            setSuccess('Đổi mật khẩu thành công!');
            setCurrent(''); setNewPass(''); setConfirm('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center text-center">

            <h2 className="text-2xl font-bold text-violet-600 mb-8">Đổi mật khẩu</h2>

            {success && (
                <div className="w-full max-w-sm bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-5">
                    {success}
                </div>
            )}
            {error && (
                <div className="w-full max-w-sm bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-5 items-center w-full">
                <PassField
                    label="Mật khẩu hiện tại"
                    value={current}
                    onChange={setCurrent}
                    placeholder="Nhập mật khẩu hiện tại"
                />
                <PassField
                    label="Mật khẩu mới"
                    value={newPass}
                    onChange={setNewPass}
                    placeholder="Nhập mật khẩu mới"
                />
                <div className="w-full max-w-sm">
                    <PassField
                        label="Xác nhận mật khẩu mới"
                        value={confirm}
                        onChange={setConfirm}
                        placeholder="Nhập lại mật khẩu mới"
                    />
                    {mismatch && (
                        <p className="text-red-500 text-xs mt-1 text-left">Mật khẩu không khớp</p>
                    )}
                </div>
            </div>

            <button onClick={handleSubmit} disabled={!isValid || loading}
                    className={`mt-8 w-full max-w-sm py-3.5 rounded-xl font-bold text-white transition flex items-center justify-center gap-2
          ${isValid && !loading
                        ? 'bg-violet-500 hover:bg-violet-600 active:scale-95'
                        : 'bg-violet-300 cursor-not-allowed'}`}>
                {loading && (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                        <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                )}
                {loading ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
        </div>
    );
}