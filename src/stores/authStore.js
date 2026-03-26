import { create } from 'zustand';

// Lấy token từ localStorage khi khởi động
const getInitialToken = () => localStorage.getItem('token') || null;
const getInitialRoleId = () => {
    const roleId = localStorage.getItem('roleId');
    return roleId ? parseInt(roleId) : null;
};

export const useAuthStore = create((set) => ({
    token: getInitialToken(),
    roleId: getInitialRoleId(),  // 1 = STUDENT, 2 = TEACHER, 3 = ADMIN
    roleName: localStorage.getItem('roleName') || null,
    user: null,

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
    setUser: (user) => set({ user }),

    // Đăng xuất
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('roleId');
        localStorage.removeItem('roleName');
        set({ token: null, roleId: null, roleName: null, user: null });
    },
}));