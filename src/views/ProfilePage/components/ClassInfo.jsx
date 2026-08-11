import { useState } from 'react';
import { updateClassesAPI } from '../../../services/userApi';
import { useCategories } from '../../../hooks/useCategories';

const selectCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-white text-gray-600 transition appearance-none cursor-pointer';

function ClassRow({ entry, index, total, onChange, onRemove, grades = [], subjects = [] }) {
    const toggleSubject = (sub) => {
        const current = entry.subjects || [];
        const updated  = current.includes(sub) ? current.filter((s) => s !== sub) : [...current, sub];
        onChange(index, 'subjects', updated);
    };

    return (
        <div>
            {index > 0 && <hr className="border-violet-100 mb-5" />}
            <div className="flex flex-col gap-4">
                {/* Lớp học */}
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Lớp học</label>
                    <div className="relative">
                        <select value={entry.grade} onChange={(e) => onChange(index, 'grade', e.target.value)} className={selectCls}>
                            <option value="">Chọn lớp</option>
                            {grades.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                        </select>
                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▾</div>
                    </div>
                </div>

                {/* Môn học – multi select dạng tag */}
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Môn học</label>
                    <div className="relative border border-gray-200 rounded-xl px-3 py-2 min-h-[48px] flex items-center flex-wrap gap-2 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 bg-white">
                        {/* Tags đã chọn */}
                        {(entry.subjects || []).map((s) => (
                            <span key={s} className="flex items-center gap-1 bg-violet-50 text-violet-700 text-xs font-medium px-2.5 py-1 rounded-full border border-violet-200">
                {s}
                                <button onClick={() => toggleSubject(s)} className="text-violet-400 hover:text-violet-600 ml-0.5 leading-none">×</button>
              </span>
                        ))}
                        {/* Dropdown chọn thêm */}
                        <select
                            value=""
                            onChange={(e) => { if (e.target.value) toggleSubject(e.target.value); }}
                            className="flex-1 min-w-[120px] text-sm text-gray-400 outline-none bg-transparent cursor-pointer">
                            <option value="">Chọn môn học ▾</option>
                            {subjects.filter((s) => !(entry.subjects || []).includes(s.value)).map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Nút xóa */}
                {total > 1 && (
                    <div className="flex justify-end">
                        <button onClick={() => onRemove(index)} className="text-violet-400 hover:text-violet-600 transition text-xl" title="Xóa lớp">🗑️</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ClassInfo({ user, onUpdate }) {
    const { subjects, homeroomClasses } = useCategories();
    const initialClasses = user?.teacherClasses?.length
        ? user.teacherClasses.map((tc) => ({ grade: tc.grade, subjects: [tc.subject] }))
        : [{ grade: '', subjects: [] }];

    const [classes, setClasses] = useState(initialClasses);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error,   setError]   = useState('');

    const handleChange = (index, field, value) =>
        setClasses((prev) => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
    const handleAdd    = () => setClasses((prev) => [...prev, { grade: '', subjects: [] }]);
    const handleRemove = (index) => setClasses((prev) => prev.filter((_, i) => i !== index));

    const handleSubmit = async () => {
        setLoading(true); setSuccess(''); setError('');
        try {
            // Flatten: mỗi lớp + môn thành 1 entry
            const payload = classes.flatMap((c) =>
                (c.subjects.length ? c.subjects : ['']).map((sub) => ({ grade: c.grade, subject: sub }))
            );
            const updated = await updateClassesAPI(payload);
            onUpdate(updated);
            setSuccess('Cập nhật lớp học thành công!');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-violet-600 mb-6">Lớp học</h2>

            {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">{success}</div>}
            {error   && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

            <div className="flex flex-col gap-6">
                {classes.map((entry, i) => (
                    <ClassRow key={i} entry={entry} index={i} total={classes.length}
                              onChange={handleChange} onRemove={handleRemove}
                              grades={homeroomClasses.map((item) => ({ ...item, value: item.label }))} subjects={subjects} />
                ))}
            </div>

            <button onClick={handleAdd}
                    className="flex items-center gap-2 text-violet-600 hover:text-violet-700 font-semibold text-sm mt-5 transition">
                <span className="text-lg">⊕</span> Thêm lớp
            </button>

            <div className="flex justify-end mt-8">
                <button onClick={handleSubmit} disabled={loading}
                        className={`px-8 py-3 rounded-xl font-semibold text-white transition flex items-center gap-2
            ${loading ? 'bg-violet-300 cursor-not-allowed' : 'bg-violet-500 hover:bg-violet-600 active:scale-95'}`}>
                    {loading && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/></svg>}
                    Cập nhật
                </button>
            </div>
        </div>
    );
}
