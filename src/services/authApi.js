import API_CONFIG from '../config/api.config';

const BASE_URL = `${API_CONFIG.GATEWAY_URL}/api/auth`;

async function getErrorMessage(res, fallback) {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        const data = await res.json().catch(() => null);
        if (data?.message) return data.message;
        if (data && typeof data === 'object') {
            const firstMessage = Object.values(data).find((value) => typeof value === 'string');
            if (firstMessage) return firstMessage;
        }
    }
    const message = await res.text().catch(() => '');
    return message || fallback;
}

// GỬI OTP
export async function sendOtpAPI(email) {
    const res = await fetch(`${BASE_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    if (!res.ok) {
        throw new Error(await getErrorMessage(res, 'Gửi OTP thất bại'));
    }
    return await res.text();
}

// XÁC THỰC OTP
export async function verifyOtpAPI(email, otp) {
    const res = await fetch(`${BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
    });
    if (!res.ok) {
        throw new Error(await getErrorMessage(res, 'OTP không đúng hoặc đã hết hạn'));
    }
    return await res.text();
}

// ĐĂNG KÝ
export async function registerAPI(payload) {
    const res = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        throw new Error(await getErrorMessage(res, 'Đăng ký thất bại'));
    }
    return await res.text();
}

// ĐĂNG NHẬP
export async function loginAPI(username, password) {
    const res = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
        throw new Error(await getErrorMessage(res, 'Đăng nhập thất bại'));
    }
    const data = await res.json();
    return {
        token: data.token,
        roleId: Number(data.roleId),
        roleName: data.roleName
    };
}

export async function requestPasswordResetAPI(email) {
    const res = await fetch(`${BASE_URL}/forgot-password/request`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error(await getErrorMessage(res, 'Không thể gửi mã xác thực'));
    return res.json();
}

export async function verifyPasswordResetOtpAPI(email, otp) {
    const res = await fetch(`${BASE_URL}/forgot-password/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp }),
    });
    if (!res.ok) throw new Error(await getErrorMessage(res, 'Mã OTP không đúng hoặc đã hết hạn'));
    return res.json();
}

export async function resetPasswordAPI(email, resetToken, newPassword) {
    const res = await fetch(`${BASE_URL}/forgot-password/reset`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, resetToken, newPassword }),
    });
    if (!res.ok) throw new Error(await getErrorMessage(res, 'Không thể cập nhật mật khẩu'));
    return res.json();
}
