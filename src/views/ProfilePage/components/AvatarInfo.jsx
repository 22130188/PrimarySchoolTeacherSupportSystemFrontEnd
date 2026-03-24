import { useState, useRef } from 'react';
import { UserCircle } from 'lucide-react';
import { updateAvatarUrlAPI } from '../../../services/userApi';

const CLOUDINARY = {
    cloudName:    'dlyhvdonu',
    uploadPreset: 'App_chat',
    assetFolder:  'Img_chat',
};

async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file',          file);
    formData.append('upload_preset', CLOUDINARY.uploadPreset);
    formData.append('asset_folder',  CLOUDINARY.assetFolder);

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`,
        { method: 'POST', body: formData }
    );
    if (!res.ok) throw new Error('Upload ảnh thất bại');
    const data = await res.json();
    return data.secure_url;
}

export default function AvatarInfo({ user, onUpdate }) {
    const [preview, setPreview] = useState(user?.avatarUrl || null);
    const [file,    setFile]    = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error,   setError]   = useState('');
    const inputRef = useRef();

    const handleFileChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (f.size > 5 * 1024 * 1024) { setError('Dung lượng tối đa 5 MB'); return; }
        if (!['image/png','image/jpeg','image/jpg'].includes(f.type)) {
            setError('Chỉ chấp nhận .png, .jpeg, .jpg'); return;
        }
        setFile(f); setError('');
        setPreview(URL.createObjectURL(f));
    };

    const handleSubmit = async () => {
        if (!file) return;
        setLoading(true); setSuccess(''); setError('');
        try {
            const imageUrl = await uploadToCloudinary(file);
            await updateAvatarUrlAPI(imageUrl);
            onUpdate({ avatarUrl: imageUrl });
            setPreview(imageUrl);
            setSuccess('Cập nhật ảnh thành công!');
            setFile(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setPreview(user?.avatarUrl || null);
        setFile(null); setError(''); setSuccess('');
    };

    return (
        <div className="flex flex-col items-center text-center">

            <h2 className="text-2xl font-bold text-violet-600 mb-8">Ảnh đại diện</h2>

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

            <div className="w-36 h-36 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center overflow-hidden mb-5 shadow-md">
                {preview
                    ? <img src={preview} alt="avatar" className="w-full h-full object-cover" />
                    : <UserCircle className="w-20 h-20 text-gray-400" />}
            </div>

            <button onClick={() => inputRef.current?.click()} disabled={loading}
                    className="px-6 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-700 hover:border-violet-400 hover:text-violet-600 transition mb-4 disabled:opacity-50">
                Chọn ảnh mới
            </button>
            <input ref={inputRef} type="file" accept=".png,.jpeg,.jpg" className="hidden" onChange={handleFileChange} />

            <p className="text-xs text-gray-400 mb-1">Định dạng: *.png, *.jpeg, *.jpg</p>
            <p className="text-xs text-gray-400 mb-8">Dung lượng tối đa: 5 MB</p>

            {loading && (
                <div className="flex items-center gap-2 text-sm text-violet-600 mb-4">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Đang tải ảnh lên Cloudinary...
                </div>
            )}

            <div className="flex gap-3">
                <button onClick={handleSubmit} disabled={!file || loading}
                        className={`px-8 py-3 rounded-xl font-semibold text-white transition
            ${file && !loading ? 'bg-violet-500 hover:bg-violet-600 active:scale-95' : 'bg-violet-300 cursor-not-allowed'}`}>
                    Cập nhật
                </button>
                <button onClick={handleCancel} disabled={loading}
                        className="px-6 py-3 rounded-xl border-2 border-violet-400 text-violet-600 font-semibold hover:bg-violet-50 transition disabled:opacity-50">
                    Hủy
                </button>
            </div>
        </div>
    );
}