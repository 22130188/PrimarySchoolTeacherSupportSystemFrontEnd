export default function SuccessModal({ name, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
             style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl px-10 py-10 max-w-sm w-full mx-4 text-center"
                 onClick={(e) => e.stopPropagation()}>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Đăng ký thành công!</h3>
                <p className="text-gray-500 mb-1">
                    Chào mừng <span className="font-semibold text-violet-600">{name || 'bạn'}</span>
                </p>
                <p className="text-gray-400 text-sm mb-8">Tài khoản của bạn đã được tạo.</p>
                <button onClick={onClose}
                        className="w-full py-3 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white font-semibold rounded-xl transition active:scale-95">
                    Đăng nhập ngay
                </button>
            </div>
        </div>
    );
}