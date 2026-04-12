import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage           from '../views/HomePage';
import LoginPage          from '../views/LoginPage';
import RegisterPage       from '../views/RegisterPage';
import OAuth2CallbackPage from '../views/OAuth2CallbackPage';
import ProfilePage        from '../views/ProfilePage';
import AdminPage          from '../views/AdminPage';
import DashboardPage      from '../views/DashboardPage';
import LessonsPage        from '../views/LessonsPage';
import TestsPage          from '../views/TestsPage';
import AIToolsPage        from '../views/AIToolsPage';
import ClassroomsPage     from '../views/ClassroomsPage';
import TTSPage            from '../views/TTSPage';
import ImagePage          from '../views/ImagePage';
import ClassroomDetail    from '../views/ClassroomsPage/ClassroomDetail';
import JoinByLinkPage     from '../views/JoinClassroom/JoinByLinkPage';
import JoinByInvitationPage from '../views/JoinClassroom/JoinByInvitationPage';
import { useAuthStore } from '../stores/authStore';

export default function AppRouter() {
    const token = useAuthStore((s) => s.token);
    const roleId = useAuthStore((s) => s.roleId);

    const defaultAuthenticatedPath = !token
        ? '/'
        : roleId === 3
            ? '/admin'
            : '/dashboard';

    const renderPublicRoute = (element) => {
        if (token) return <Navigate to={defaultAuthenticatedPath} replace />;
        return element;
    };

    const renderPrivateRoute = (element, allowedRoles = null) => {
        if (!token) return <Navigate to="/login" replace />;
        if (allowedRoles && !allowedRoles.includes(roleId)) {
            return <Navigate to={defaultAuthenticatedPath} replace />;
        }
        return element;
    };

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/"                element={renderPublicRoute(<HomePage />)} />
                <Route path="/login"           element={renderPublicRoute(<LoginPage />)} />
                <Route path="/register"        element={renderPublicRoute(<RegisterPage />)} />
                <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />
                <Route path="/profile"         element={renderPrivateRoute(<ProfilePage />, [1, 2])} />
                <Route path="/admin"           element={renderPrivateRoute(<AdminPage />, [3])} />
                <Route path="/dashboard"       element={renderPrivateRoute(<DashboardPage />, [1, 2])} />
                <Route path="/tts"             element={renderPrivateRoute(<TTSPage />, [1, 2])} />
                <Route path="/image"           element={<ImagePage />} />
                <Route path="/lessons"         element={renderPrivateRoute(<LessonsPage />, [1, 2])} />
                <Route path="/tests"           element={renderPrivateRoute(<TestsPage />, [1, 2])} />
                <Route path="/ai-tools"        element={renderPrivateRoute(<AIToolsPage />, [1, 2])} />
                <Route path="/classrooms"      element={renderPrivateRoute(<ClassroomsPage />, [1, 2])} />
                <Route path="/classrooms/:id"  element={renderPrivateRoute(<ClassroomDetail />, [1, 2])} />
                <Route path="/join/link"        element={<JoinByLinkPage />} />
                <Route path="/join/invitation"  element={<JoinByInvitationPage />} />
                <Route path="*"                element={<Navigate to={token ? defaultAuthenticatedPath : '/'} replace />} />
            </Routes>
        </BrowserRouter>
    );
}