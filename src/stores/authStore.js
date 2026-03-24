import { create } from 'zustand';

// Lấy token từ localStorage khi khởi động
const getInitialToken = () => localStorage.getItem('token') || null;

export const useAuthStore = create((set) => ({
    token: getInitialToken(),
    user: null,

    // Lưu token sau khi đăng nhập thành công
    setToken: (token) => {
        localStorage.setItem('token', token);
        set({ token });
    },

    // Lưu thông tin user
    setUser: (user) => set({ user }),

    // Đăng xuất
    logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null });
    },
}));