import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage           from '../views/HomePage';
import LoginPage          from '../views/LoginPage';
import RegisterPage       from '../views/RegisterPage';
import OAuth2CallbackPage from '../views/OAuth2CallbackPage';
import ProfilePage        from '../views/ProfilePage';

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/"                element={<HomePage />} />
                <Route path="/login"           element={<LoginPage />} />
                <Route path="/register"        element={<RegisterPage />} />
                <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />
                <Route path="/profile"         element={<ProfilePage />} />
                <Route path="*"                element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}