import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import DashboardSidebar from '../../components/DashboardSidebar';
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
    <div className="min-h-screen bg-[#eef2f7]">
      <Navbar />
      <div className="flex" style={{ paddingTop: '64px' }}>
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)]" style={{ marginLeft: '72px' }}>
          <main className="flex-1 px-3 pb-3 pt-0 md:px-4 md:pb-4 md:pt-0">
            <div className="mx-auto max-w-[1800px]">
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
