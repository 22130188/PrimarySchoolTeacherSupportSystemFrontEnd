import { useState } from 'react';
import { updateSchoolAPI } from '../../../services/userApi';

const PROVINCES = [
    'TP. Hồ Chí Minh','Hà Nội','Đà Nẵng','Cần Thơ','Hải Phòng',
    'Bình Dương','Đồng Nai','Long An','Tiền Giang','Bà Rịa - Vũng Tàu',
    'Bình Phước','Tây Ninh','Bến Tre','Trà Vinh','Vĩnh Long',
    'Đồng Tháp','An Giang','Kiên Giang','Hậu Giang','Sóc Trăng',
    'Bạc Liêu','Cà Mau','Nghệ An','Thanh Hóa','Hà Tĩnh',
    'Quảng Bình','Quảng Trị','Thừa Thiên Huế','Quảng Nam','Quảng Ngãi',
    'Bình Định','Phú Yên','Khánh Hòa','Ninh Thuận','Bình Thuận',
    'Lâm Đồng','Đắk Lắk','Đắk Nông','Gia Lai','Kon Tum',
    'Hà Giang','Cao Bằng','Lào Cai','Bắc Kạn','Lạng Sơn',
    'Tuyên Quang','Thái Nguyên','Yên Bái','Sơn La','Lai Châu',
    'Điện Biên','Hòa Bình','Phú Thọ','Vĩnh Phúc','Bắc Giang',
    'Quảng Ninh','Hải Dương','Hưng Yên','Thái Bình','Hà Nam',
    'Nam Định','Ninh Bình','Khác',
];

// Xã/phường theo tỉnh (mẫu — thực tế có thể gọi API hành chính)
const WARDS_BY_PROVINCE = {
    'TP. Hồ Chí Minh': ['Phường Bến Nghé','Phường Cầu Kho','Phường Đa Kao','Phường Bến Thành','Phường Nguyễn Thái Bình','Phường Tân Định','Phường Phạm Ngũ Lão','Khác'],
    'Hà Nội':          ['Phường Hàng Bạc','Phường Hàng Buồm','Phường Cửa Đông','Phường Lý Thái Tổ','Phường Trần Hưng Đạo','Khác'],
    'Đà Nẵng':         ['Phường Hải Châu I','Phường Hải Châu II','Phường Thanh Bình','Phường Thuận Phước','Khác'],
    'Cần Thơ':         ['Phường An Hòa','Phường An Lạc','Phường Xuân Khánh','Phường Tân An','Khác'],
};
const DEFAULT_WARDS = ['Xã/Phường 1','Xã/Phường 2','Xã/Phường 3','Khác'];

const SCHOOLS_BY_PROVINCE = {
    'TP. Hồ Chí Minh': ['TH Nguyễn Du','TH Lê Văn Tám','TH Trần Hưng Đạo','TH Đinh Tiên Hoàng','Khác'],
    'Hà Nội':          ['TH Đống Đa','TH Hoàn Kiếm','TH Cầu Giấy','TH Ba Đình','Khác'],
    'Đà Nẵng':         ['TH Hải Châu','TH Thanh Khê','TH Sơn Trà','Khác'],
};
const DEFAULT_SCHOOLS = ['Trường Tiểu Học 1','Trường Tiểu Học 2','Khác'];

function parseSchoolName(raw) {
    if (!raw) return { province: '', ward: '', school: '' };
    const parts = raw.split(' / ').map((s) => s.trim());
    return {
        province: parts[0] || '',
        ward:     parts[1] || '',
        school:   parts[2] || '',
    };
}

const inputCls  = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition bg-white';
const selectCls = `${inputCls} appearance-none cursor-pointer pr-10`;

function SelectField({ label, value, onChange, options, placeholder }) {
    return (
        <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
                {label} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
                <select value={value} onChange={onChange} className={selectCls}>
                    <option value="">{placeholder}</option>
                    {options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▾</div>
            </div>
        </div>
    );
}

export default function SchoolInfo({ user, onUpdate }) {
    const parsed = parseSchoolName(user?.schoolName);

    const [province,     setProvince]     = useState(parsed.province);
    const [ward,         setWard]         = useState(parsed.ward);
    const [school,       setSchool]       = useState(parsed.school);
    const [customWard,   setCustomWard]   = useState('');
    const [customSchool, setCustomSchool] = useState('');
    const [loading,      setLoading]      = useState(false);
    const [success,      setSuccess]      = useState('');
    const [error,        setError]        = useState('');

    const wardList   = WARDS_BY_PROVINCE[province]   || DEFAULT_WARDS;
    const schoolList = SCHOOLS_BY_PROVINCE[province] || DEFAULT_SCHOOLS;

    const handleProvinceChange = (e) => {
        setProvince(e.target.value);
        setWard(''); setCustomWard('');
        setSchool(''); setCustomSchool('');
    };

    const finalWard   = ward   === 'Khác' ? customWard   : ward;
    const finalSchool = school === 'Khác' ? customSchool : school;

    const isValid = province && finalWard.trim() && finalSchool.trim();

    const handleSubmit = async () => {
        if (!isValid) return;
        setLoading(true); setSuccess(''); setError('');

        const schoolName = `${province} / ${finalWard.trim()} / ${finalSchool.trim()}`;

        try {
            const updated = await updateSchoolAPI({ schoolName });
            onUpdate(updated);
            setSuccess('Cập nhật trường học thành công!');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setProvince(parsed.province);
        setWard(parsed.ward);
        setSchool(parsed.school);
        setCustomWard(''); setCustomSchool('');
        setSuccess(''); setError('');
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-violet-600 mb-6">Trường học</h2>

            {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">{success}</div>}
            {error   && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

            {user?.schoolName && (
                <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-2 mb-5 text-sm text-violet-700">
                    Hiện tại: <span className="font-medium">{user.schoolName}</span>
                </div>
            )}

            <div className="flex flex-col gap-5">
                <SelectField
                    label="Tỉnh / Thành phố"
                    value={province}
                    onChange={handleProvinceChange}
                    options={PROVINCES}
                    placeholder="Vui lòng chọn tỉnh / thành phố"
                />

                {province && (
                    <div>
                        <SelectField
                            label="Xã / Phường"
                            value={ward}
                            onChange={(e) => { setWard(e.target.value); setCustomWard(''); }}
                            options={wardList}
                            placeholder="Vui lòng chọn xã / phường"
                        />
                        {ward === 'Khác' && (
                            <input
                                type="text"
                                placeholder="Nhập tên xã / phường"
                                value={customWard}
                                onChange={(e) => setCustomWard(e.target.value)}
                                className={`${inputCls} mt-2`}
                            />
                        )}
                    </div>
                )}

                {province && (
                    <div>
                        <SelectField
                            label="Trường"
                            value={school}
                            onChange={(e) => { setSchool(e.target.value); setCustomSchool(''); }}
                            options={schoolList}
                            placeholder="Vui lòng chọn trường"
                        />
                        {school === 'Khác' && (
                            <input
                                type="text"
                                placeholder="Nhập tên trường"
                                value={customSchool}
                                onChange={(e) => setCustomSchool(e.target.value)}
                                className={`${inputCls} mt-2`}
                            />
                        )}
                    </div>
                )}

                {/* kết quả */}
                {/*{isValid && (*/}
                {/*    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600">*/}
                {/*        Sẽ lưu: <span className="font-medium text-gray-800">{province} / {finalWard} / {finalSchool}</span>*/}
                {/*    </div>*/}
                {/*)}*/}
            </div>

            {/* Buttons */}
            <div className="flex justify-between mt-8">
                <button onClick={handleCancel}
                        className="px-6 py-3 rounded-xl border-2 border-violet-400 text-violet-600 font-semibold hover:bg-violet-50 transition">
                    Hủy
                </button>
                <button onClick={handleSubmit} disabled={!isValid || loading}
                        className={`px-8 py-3 rounded-xl font-semibold text-white transition flex items-center gap-2
            ${isValid && !loading ? 'bg-violet-500 hover:bg-violet-600 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                    {loading && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/></svg>}
                    Gửi
                </button>
            </div>
        </div>
    );
}