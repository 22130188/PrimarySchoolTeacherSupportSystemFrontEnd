import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import DashboardSidebar from '../../components/DashboardSidebar';
import { Image } from 'lucide-react';
import axios from 'axios';
import { API_CONFIG } from '../../config/api.config.js';
import { useAuthStore } from '../../stores/authStore';
import PillowImageEditor from '../../components/PillowImageEditor';

export default function ImagePage() {
  const [savedImages, setSavedImages] = useState([]);
  const { user } = useAuthStore();
  const IMAGE_API_URL = API_CONFIG.IMAGE_API_URL;

  const loadSavedImages = async () => {
    if (!user?.id) {
      setSavedImages([]);
      return;
    }
    try {
      const response = await axios.get(`${IMAGE_API_URL}/images/${user.id}`);
      if (response.data.success) {
        setSavedImages(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading images:', error);
    }
  };

  useEffect(() => {
    loadSavedImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Navbar />
      <div className="flex" style={{ paddingTop: '64px' }}>
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)]" style={{ marginLeft: '72px' }}>
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center shadow-lg">
                      <Image className="w-5 h-5 text-white" />
                    </div>
                    Tạo & Biên Tập Hình Ảnh
                  </h1>
                  <p className="text-sm text-gray-500 ml-[52px]">
                    Sử dụng Pillow để thiết kế, ghép ảnh, thêm icon và chỉnh sửa ảnh chuyên nghiệp
                  </p>
                </div>
              </div>

              <PillowImageEditor
                user={user}
                savedImages={savedImages}
                onSaveSuccess={loadSavedImages}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
