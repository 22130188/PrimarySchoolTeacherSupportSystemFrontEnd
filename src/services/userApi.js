const BASE_URL = 'http://localhost:8080/api';

const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

// LẤY THÔNG TIN USER
export async function getMeAPI() {
    const res = await fetch(`${BASE_URL}/user/me`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Không thể lấy thông tin người dùng');
    return await res.json();
}

// CẬP NHẬT THÔNG TIN CÁ NHÂN
export async function updatePersonalAPI(payload) {
    const res = await fetch(`${BASE_URL}/user/personal`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Cập nhật thất bại' }));
        throw new Error(err.message || 'Cập nhật thất bại');
    }
    return await res.json();
}

// CẬP NHẬT TRƯỜNG HỌC
export async function updateSchoolAPI(payload) {
    const res = await fetch(`${BASE_URL}/user/school`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Cập nhật thất bại' }));
        throw new Error(err.message || 'Cập nhật thất bại');
    }
    return await res.json();
}

// CẬP NHẬT LỚP HỌC
export async function updateClassesAPI(classes) {
    const res = await fetch(`${BASE_URL}/user/classes`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ classes }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Cập nhật thất bại' }));
        throw new Error(err.message || 'Cập nhật thất bại');
    }
    return await res.json();
}

// CẬP NHẬT ẢNH ĐẠI DIỆN
export async function updateAvatarUrlAPI(avatarUrl) {
    const res = await fetch(`${BASE_URL}/user/avatar-url`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ avatarUrl }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Lưu ảnh thất bại' }));
        throw new Error(err.message || 'Lưu ảnh thất bại');
    }
    return await res.json();
}

// ĐỔI MẬT KHẨU
export async function changePasswordAPI(payload) {
    const res = await fetch(`${BASE_URL}/user/change-password`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Đổi mật khẩu thất bại' }));
        throw new Error(err.message || 'Đổi mật khẩu thất bại');
    }
    return await res.text();
}