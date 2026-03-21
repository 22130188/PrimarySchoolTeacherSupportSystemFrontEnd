const BASE_URL = 'http://localhost:8080/api/auth';


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
    return await res.text();
}