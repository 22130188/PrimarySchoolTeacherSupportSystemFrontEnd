import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../views/HomePage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
