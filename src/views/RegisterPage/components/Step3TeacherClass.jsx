import { useCategories } from '../../../hooks/useCategories';

const selectCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-white text-gray-600 transition appearance-none cursor-pointer';

function ClassRow({ entry, index, total, onChange, onRemove, classrooms = [], subjects = [] }) {
    return (
        <div>
            {index > 0 && <hr className="border-violet-200 mb-5" />}
            <div className="flex flex-col gap-4">
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Lớp học <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <select value={entry.grade} onChange={(e) => onChange(index, 'grade', e.target.value)} className={selectCls}>
                            <option value="">Vui lòng chọn lớp</option>
                            {classrooms.length > 0 ? (
                                classrooms.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)
                            ) : (
                                <option value="" disabled>Không có dữ liệu lớp</option>
                            )}
                        </select>
                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▾</div>
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Môn học <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <select value={entry.subject} onChange={(e) => onChange(index, 'subject', e.target.value)} className={selectCls}>
                            <option value="">Vui lòng chọn môn học</option>
                            {subjects.length > 0 ? (
                                subjects.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)
                            ) : (
                                <option value="" disabled>Không có dữ liệu môn học</option>
                            )}
                        </select>
                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▾</div>
                    </div>
                </div>
                {total > 1 && (
                    <div className="flex justify-end">
                        <button onClick={() => onRemove(index)}
                                className="text-violet-500 hover:text-violet-700 transition text-xl" title="Xoá lớp này">
                            🗑️
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Step3TeacherClass({ classes, setClasses, onFinish, onBack, loading }) {
    const { homeroomClasses, subjects } = useCategories();
    const handleChange = (index, field, value) =>
        setClasses((prev) => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
    const handleAdd    = () => setClasses((prev) => [...prev, { grade: '', subject: '' }]);
    const handleRemove = (index) => setClasses((prev) => prev.filter((_, i) => i !== index));
    const isValid = classes.every((c) => c.grade && c.subject);

    return (
        <div className="w-full max-w-xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-10 text-center">Thông tin lớp học</h2>

            <div className="flex flex-col gap-6">
                {classes.map((entry, i) => (
                    <ClassRow key={i} entry={entry} index={i} total={classes.length}
                              onChange={handleChange} onRemove={handleRemove}
                              classrooms={homeroomClasses.map((item) => ({ ...item, value: item.label }))} subjects={subjects} />
                ))}
            </div>

            <button onClick={handleAdd}
                    className="flex items-center gap-2 text-violet-600 hover:text-violet-700 font-semibold text-sm mt-6 transition">
                <span className="text-xl leading-none">⊕</span> Chọn thêm lớp
            </button>

            <div className="flex gap-3 mt-10">
                <button onClick={onBack}
                        className="flex-1 py-4 rounded-xl border-2 border-violet-500 text-violet-600 font-semibold hover:bg-violet-50 transition">
                    Quay lại
                </button>
                <button onClick={() => onFinish(classes)} disabled={!isValid || loading}
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
                    {loading ? 'Đang xử lý...' : 'Hoàn thành'}
                </button>
            </div>
        </div>
    );
}
