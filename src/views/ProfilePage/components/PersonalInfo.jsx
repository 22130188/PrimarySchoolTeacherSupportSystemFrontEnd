import { useState } from 'react';
import { updatePersonalAPI } from '../../../services/userApi';

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition bg-white';
const selectCls = `${inputCls} appearance-none cursor-pointer`;

const GENDERS  = ['Nam', 'Nữ', 'Khác'];
const POSITIONS = ['Giáo viên', 'Hiệu trưởng', 'Hiệu phó', 'Khác'];

export default function PersonalInfo({ user, onUpdate }) {
    const [form, setForm]     = useState({
        fullName:    user?.username   || '',
        dateOfBirth: user?.dateOfBirth || '',
        gender:      user?.gender     || '',
        position:    user?.position   || 'Giáo viên',
        email:       user?.email      || '',
        phone:       user?.phone      || '',
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error,   setError]   = useState('');

    const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

    const handleSubmit = async () => {
        setLoading(true); setSuccess(''); setError('');
        try {
            const updated = await updatePersonalAPI(form);
            onUpdate(updated);
            setSuccess('Cập nhật thành công!');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-violet-600 mb-6">Cá nhân</h2>

            {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">{success}</div>}
            {error   && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

            <div className="grid grid-cols-2 gap-5">
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Họ và tên <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="Nhập họ và tên" value={form.fullName} onChange={set('fullName')} className={inputCls} />
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Ngày tháng năm sinh <span className="text-red-500">*</span></label>
                    <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} className={inputCls} />
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Giới tính <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <select value={form.gender} onChange={set('gender')} className={`${selectCls} pr-10`}>
                            <option value="">Vui lòng chọn giới tính</option>
                            {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▾</div>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Chức vụ <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <select value={form.position} onChange={set('position')} className={`${selectCls} pr-10`}>
                            {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▾</div>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                    <input type="email" value={form.email} readOnly className={`${inputCls} bg-gray-50 text-gray-500 cursor-not-allowed`} />
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Số điện thoại <span className="text-red-500">*</span></label>
                    <input type="tel" placeholder="Nhập số điện thoại" value={form.phone} onChange={set('phone')} className={inputCls} />
                </div>
            </div>

            <div className="flex justify-between mt-8">
                <button onClick={() => setForm({ fullName: user?.username || '', dateOfBirth: user?.dateOfBirth || '', gender: '', position: 'Giáo viên', email: user?.email || '', phone: user?.phone || '' })}
                        className="px-6 py-3 rounded-xl border-2 border-violet-400 text-violet-600 font-semibold hover:bg-violet-50 transition">
                    Hủy
                </button>
                <button onClick={handleSubmit} disabled={loading}
                        className={`px-8 py-3 rounded-xl font-semibold text-white transition flex items-center gap-2
            ${loading ? 'bg-violet-300 cursor-not-allowed' : 'bg-violet-500 hover:bg-violet-600 active:scale-95'}`}>
                    {loading && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/></svg>}
                    Gửi
                </button>
            </div>
        </div>
    );
}