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
import CreateTestPage     from '../views/TestsPage/CreateTestPage';
import QuestionManagement from '../pages/QuestionManagement';
import AIToolsPage        from '../views/AIToolsPage';
import ClassroomsPage     from '../views/ClassroomsPage';
import TTSPage            from '../views/TTSPage';
import TextbooksPage      from '../views/TextbooksPage';
import TextbookReaderPage from '../views/TextbooksPage/TextbookReaderPage';
import ImagePage          from '../views/ImagePage';
import AIImagePage        from '../views/AIImagePage';
import DocxEditorPage     from '../views/DocxEditorPage';
import PptxEditorPage     from '../views/PptxEditorPage';
import CollaboraEditorPage from '../views/CollaboraEditorPage';
import PronunciationPage  from '../views/PronunciationPage';
import TranslatePage      from '../views/TranslatePage';
import ClassroomDetail    from '../views/ClassroomsPage/ClassroomDetail';
import JoinByLinkPage     from '../views/JoinClassroom/JoinByLinkPage';
import JoinByInvitationPage from '../views/JoinClassroom/JoinByInvitationPage';
import HelpPage from '../views/HelpPage/ManagedHelpPage';
import SupportWidget from '../components/SupportWidget';
import { useAuthStore } from '../stores/authStore';

// Admin nested components
import DashboardOverview from '../views/AdminPage/components/DashboardOverview';
import AdminProfile from '../views/AdminPage/components/AdminProfile';
import UserManagement from '../views/AdminPage/components/UserManagement';
import ClassroomManagement from '../views/AdminPage/components/ClassroomManagement';
import SubjectManagement from '../views/AdminPage/components/SubjectManagement';
import AdminTestManagement from '../views/AdminPage/components/TestManagement';
import AdminLessonManagement from '../views/AdminPage/components/LessonManagement';
import LessonTemplateManagement from '../views/AdminPage/components/LessonTemplateManagement';
import LessonContentManagement from '../views/AdminPage/components/LessonContentManagement';
import ResourceManagement from '../views/AdminPage/components/ResourceManagement';
import CategoryManagement from '../views/AdminPage/components/CategoryManagement';
import AccessManagement from '../views/AdminPage/components/AccessManagement';
import SystemSettings from '../views/AdminPage/components/SystemSettings';
import FeedbackManagement from '../views/AdminPage/components/FeedbackManagement';
import GuideManagement from '../views/AdminPage/components/GuideManagement';

export default function AppRouter() {
    const token = useAuthStore((s) => s.token);
    const storedRoleId = useAuthStore((s) => s.roleId);
    const roleId = Number(storedRoleId);

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
                <Route path="/help"            element={<HelpPage />} />
                <Route path="/login"           element={renderPublicRoute(<LoginPage />)} />
                <Route path="/register"        element={renderPublicRoute(<RegisterPage />)} />
                <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />
                <Route path="/profile"         element={renderPrivateRoute(<ProfilePage />, [1, 2])} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={renderPrivateRoute(<AdminPage />, [3])}>
                    <Route index element={<DashboardOverview />} />
                    <Route path="profile" element={<AdminProfile />} />
                    
                    {/* Users CRUD */}
                    <Route path="users" element={<UserManagement />} />
                    <Route path="users/create" element={<UserManagement />} />
                    <Route path="users/:id/edit" element={<UserManagement />} />

                    {/* Classrooms CRUD */}
                    <Route path="classrooms" element={<ClassroomManagement />} />
                    <Route path="classrooms/create" element={<ClassroomManagement />} />
                    <Route path="classrooms/:id/edit" element={<ClassroomManagement />} />

                    {/* Subjects CRUD */}
                    <Route path="subjects" element={<SubjectManagement />} />
                    <Route path="subjects/create" element={<SubjectManagement />} />
                    <Route path="subjects/:id/edit" element={<SubjectManagement />} />

                    <Route path="categories" element={<CategoryManagement />} />
                    <Route path="lesson_content" element={<LessonContentManagement />} />
                    <Route path="tests" element={<AdminTestManagement />} />
                    <Route path="lessons" element={<AdminLessonManagement />} />
                    <Route path="lesson_templates" element={<LessonTemplateManagement />} />
                    <Route path="resources" element={<ResourceManagement />} />
                    <Route path="feedback" element={<FeedbackManagement />} />
                    <Route path="guides" element={<GuideManagement />} />
                    <Route path="access" element={<AccessManagement />} />
                    <Route path="settings" element={<SystemSettings />} />
                    {/* Fallback for admin pages */}
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                </Route>

                <Route path="/dashboard"       element={renderPrivateRoute(<DashboardPage />, [1, 2])} />
                <Route path="/tts"             element={renderPrivateRoute(<TTSPage />, [1, 2])} />
                <Route path="/image"           element={<ImagePage />} />
                <Route path="/ai-image"        element={renderPrivateRoute(<AIImagePage />, [1, 2])} />
                <Route path="/pronunciation"   element={renderPrivateRoute(<PronunciationPage />, [1, 2])} />
                <Route path="/translate"       element={renderPrivateRoute(<TranslatePage />, [1, 2])} />
                <Route path="/lessons"         element={renderPrivateRoute(<LessonsPage />, [2])} />
                <Route path="/lessons/docx-editor" element={renderPrivateRoute(<DocxEditorPage />, [1, 2])} />
                <Route path="/lessons/pptx-editor" element={renderPrivateRoute(<PptxEditorPage />, [1, 2])} />
                <Route path="/lessons/collabora-editor" element={renderPrivateRoute(<CollaboraEditorPage />, [1, 2])} />
                <Route path="/tests"           element={renderPrivateRoute(<TestsPage />, [2])} />
                <Route path="/tests/create"    element={renderPrivateRoute(<CreateTestPage />, [2])} />
                <Route path="/tests/:id/edit"  element={renderPrivateRoute(<CreateTestPage />, [2])} />
                <Route path="/questions/manage" element={renderPrivateRoute(<QuestionManagement />, [2])} />
                <Route path="/ai-tools"        element={renderPrivateRoute(<AIToolsPage />, [2])} />
                <Route path="/classrooms"      element={renderPrivateRoute(<ClassroomsPage />, [1, 2])} />
                <Route path="/classrooms/:id"  element={renderPrivateRoute(<ClassroomDetail />, [1, 2])} />
                <Route path="/join/link"        element={<JoinByLinkPage />} />
                <Route path="/join/invitation"  element={<JoinByInvitationPage />} />
                <Route path="/textbooks"        element={renderPrivateRoute(<TextbooksPage />, [1, 2])} />
                <Route path="/textbooks/:slugId" element={renderPrivateRoute(<TextbookReaderPage />, [1, 2])} />
                <Route path="*"                element={<Navigate to={token ? defaultAuthenticatedPath : '/'} replace />} />
            </Routes>
            <SupportWidget />
        </BrowserRouter>
    );
}
