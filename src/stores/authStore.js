import { create } from 'zustand';

// Lấy token từ localStorage khi khởi động
const getInitialToken = () => localStorage.getItem('token') || null;
const getInitialRoleId = () => {
    const roleId = localStorage.getItem('roleId');
    return roleId ? parseInt(roleId) : null;
};
const getInitialUser = () => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return null;
    try {
        return JSON.parse(rawUser);
    } catch {
        localStorage.removeItem('user');
        return null;
    }
};

export const useAuthStore = create((set) => ({
    token: getInitialToken(),
    roleId: getInitialRoleId(),  // 1 = STUDENT, 2 = TEACHER, 3 = ADMIN
    roleName: localStorage.getItem('roleName') || null,
    user: getInitialUser(),

    // Lưu token và role sau khi đăng nhập thành công
    setToken: (token) => {
        localStorage.setItem('token', token);
        set({ token });
    },

    // Lưu role thông tin
    setRole: (roleId, roleName) => {
        localStorage.setItem('roleId', roleId);
        localStorage.setItem('roleName', roleName);
        set({ roleId, roleName });
    },

    // Lưu thông tin user
    setUser: (user) => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
        }
        set({ user });
    },

    // Đăng xuất
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('roleId');
        localStorage.removeItem('roleName');
        localStorage.removeItem('user');
        set({ token: null, roleId: null, roleName: null, user: null });
    },
}));