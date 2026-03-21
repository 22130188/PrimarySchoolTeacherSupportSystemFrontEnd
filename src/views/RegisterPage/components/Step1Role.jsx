export default function Step1Role({ selected, onSelect, onNext }) {
    const roles = [
        { id: 'teacher', label: 'Giáo viên', emoji: '👨‍🏫', color: 'from-violet-100 to-violet-50' },
        { id: 'student', label: 'Học sinh',  emoji: '👧',    color: 'from-teal-100 to-teal-50' },
    ];

    return (
        <div className="w-full max-w-lg text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-12">Bạn là ai?</h2>

            <div className="flex gap-6 justify-center mb-12">
                {roles.map((role) => (
                    <button key={role.id} onClick={() => onSelect(role.id)}
                            className={`w-52 rounded-2xl border-2 py-8 px-6 flex flex-col items-center gap-4 transition-all duration-200 cursor-pointer
              ${selected === role.id
                                ? 'border-violet-500 shadow-lg scale-105 bg-violet-50'
                                : 'border-gray-200 bg-white hover:border-violet-300 hover:shadow-md'}`}>
                        <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${role.color} flex items-center justify-center text-5xl shadow-inner`}>
                            {role.emoji}
                        </div>
                        <span className="text-gray-700 font-medium text-base">{role.label}</span>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
              ${selected === role.id ? 'border-violet-500' : 'border-gray-300'}`}>
                            {selected === role.id && <div className="w-3 h-3 rounded-full bg-violet-500" />}
                        </div>
                    </button>
                ))}
            </div>

            <button onClick={onNext} disabled={!selected}
                    className={`w-full max-w-sm py-4 rounded-xl text-base font-semibold transition-all duration-200
          ${selected
                        ? 'bg-gradient-to-r from-violet-600 to-violet-500 text-white hover:from-violet-700 hover:to-violet-600 shadow-md active:scale-95'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                Tiếp theo
            </button>
        </div>
    );
}