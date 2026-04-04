import { useState, useEffect } from 'react';
import { Menu, X, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NAV_LINKS } from '../data/homePageData';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { getMeAPI } from '../services/userApi';

export default function Navbar() {
  const navigate = useNavigate();
  const { isMobileMenuOpen, toggleMobileMenu, setMobileMenuOpen } = useUIStore();
  const token = useAuthStore((s) => s.token);
  const roleId = useAuthStore((s) => s.roleId);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!token || roleId === 3 || user) return;

    let cancelled = false;
    getMeAPI()
      .then((profile) => {
        if (!cancelled) setUser(profile);
      })
      .catch(() => {
        // Keep navbar usable even when profile API is temporarily unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [token, roleId, user, setUser]);

  const isAuthenticatedUser = Boolean(token && (roleId === 1 || roleId === 2));
  const roleLabel = roleId === 2 ? 'Giáo viên' : 'Học sinh';
  const displayName = user?.username || 'Người dùng';
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const logoHref = !token
    ? '/'
    : roleId === 3
      ? '/admin'
      : roleId === 2
        ? '/dashboard'
        : '/profile';

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <a href={logoHref} className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center shadow-lg">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-teal-500 bg-clip-text text-transparent">
              TeachAI
            </span>
          </a>


          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-violet-600 rounded-lg hover:bg-violet-50 transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>


          <div className="hidden md:flex items-center gap-3">
            {isAuthenticatedUser ? (
              <div className="relative group">
                <a
                  href="/profile"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-violet-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 font-semibold text-sm">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      avatarInitial
                    )}
                  </div>
                  <div className="leading-tight">
                    <p className="text-sm font-semibold text-gray-800 max-w-[150px] truncate">{displayName}</p>
                    <p className="text-xs text-violet-600">{roleLabel}</p>
                  </div>
                </a>

                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 pointer-events-none translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0">
                  <div className="w-48 bg-white border border-gray-100 rounded-2xl shadow-xl p-2">
                    <a
                      href="/profile"
                      className="block px-3.5 py-2.5 text-sm font-medium text-gray-700 rounded-xl hover:bg-violet-50 hover:text-violet-600 transition-colors"
                    >
                      Hồ sơ cá nhân
                    </a>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3.5 py-2.5 text-sm font-medium text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <a
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-violet-600 transition-colors duration-200"
                >
                  Đăng nhập
                </a>
                <a
                  href="/register"
                  className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 rounded-full hover:from-violet-700 hover:to-violet-600 shadow-md hover:shadow-violet-300 transition-all duration-200"
                >
                  Đăng ký
                </a>
              </>
            )}
          </div>


          <button
            id="navbar-mobile-toggle"
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>


      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              {isAuthenticatedUser ? (
                <>
                  <div className="px-3 py-2 rounded-lg bg-violet-50 border border-violet-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 font-semibold text-sm">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        avatarInitial
                      )}
                    </div>
                    <div className="leading-tight">
                      <p className="text-sm font-semibold text-gray-800">{displayName}</p>
                      <p className="text-xs text-violet-600">{roleLabel}</p>
                    </div>
                  </div>
                  <a
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2.5 text-sm font-semibold text-center text-gray-700 border border-gray-200 rounded-lg hover:border-violet-400 transition-colors"
                  >
                    Hồ sơ cá nhân
                  </a>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2.5 text-sm font-semibold text-center text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <a href="/login" className="px-4 py-2.5 text-sm font-semibold text-center text-gray-700 border border-gray-200 rounded-lg hover:border-violet-400 transition-colors">
                    Đăng nhập
                  </a>
                  <a href="/register" className="px-4 py-2.5 text-sm font-semibold text-center text-white bg-gradient-to-r from-violet-600 to-violet-500 rounded-lg">
                    Đăng ký
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
