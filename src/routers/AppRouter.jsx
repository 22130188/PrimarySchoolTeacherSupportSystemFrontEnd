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

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/"                element={<HomePage />} />
                <Route path="/login"           element={<LoginPage />} />
                <Route path="/register"        element={<RegisterPage />} />
                <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />
                <Route path="/profile"         element={<ProfilePage />} />
                <Route path="/admin"           element={<AdminPage />} />
                <Route path="/dashboard"       element={<DashboardPage />} />
                <Route path="/lessons"         element={<LessonsPage />} />
                <Route path="/tests"           element={<TestsPage />} />
                <Route path="/ai-tools"        element={<AIToolsPage />} />
                <Route path="/classrooms"      element={<ClassroomsPage />} />
                <Route path="*"                element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}