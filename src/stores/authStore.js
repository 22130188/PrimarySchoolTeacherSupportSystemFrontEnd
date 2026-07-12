import { create } from 'zustand';

const normalizeToken = (token) => {
    if (!token) return null;
    const trimmed = token.toString().trim();
    if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return null;
    if (trimmed.toLowerCase().startsWith('bearer ')) {
        return trimmed.substring(7).trim();
    }
    return trimmed;
};

const getInitialToken = () => normalizeToken(localStorage.getItem('token'));
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
    roleId: getInitialRoleId(),  
    roleName: localStorage.getItem('roleName') || null,
    user: getInitialUser(),

    setToken: (token) => {
        const normalized = normalizeToken(token);
        if (normalized) {
            localStorage.setItem('token', normalized);
            set({ token: normalized });
        } else {
            localStorage.removeItem('token');
            set({ token: null });
        }
    },

    setRole: (roleId, roleName) => {
        const normalizedRoleId = Number(roleId);
        localStorage.setItem('roleId', normalizedRoleId);
        localStorage.setItem('roleName', roleName);
        set({ roleId: normalizedRoleId, roleName });
    },

    setUser: (user) => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
        }
        set({ user });
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('roleId');
        localStorage.removeItem('roleName');
        localStorage.removeItem('user');
        set({ token: null, roleId: null, roleName: null, user: null });
    },
}));
