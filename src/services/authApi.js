const BASE_URL = 'http://localhost:8080/api/auth';

// GỬI OTP
export async function sendOtpAPI(email) {
    const res = await fetch(`${BASE_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Gửi OTP thất bại' }));
        throw new Error(err.message || 'Gửi OTP thất bại');
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
        const err = await res.json().catch(() => ({ message: 'OTP không đúng hoặc đã hết hạn' }));
        throw new Error(err.message || 'OTP không hợp lệ');
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
        const err = await res.json().catch(() => ({ message: 'Đăng ký thất bại' }));
        throw new Error(err.message || JSON.stringify(err));
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
        const err = await res.json().catch(() => ({ message: 'Đăng nhập thất bại' }));
        throw new Error(err.message || 'Đăng nhập thất bại');
    }
    const data = await res.json();
    return data.token;
}