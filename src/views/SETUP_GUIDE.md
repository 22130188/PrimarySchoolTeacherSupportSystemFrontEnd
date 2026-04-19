# TTS Page - React Component Setup Guide

## 📁 Files Created

```
src/
├── views/
│   └── TTSPage/
│       └── index.jsx     # Main TTS component
├── services/
│   └── TTSService.js     # API service layer
└── stores/
    └── authStore.js      # (Already exists) Zustand auth store
```

## 🚀 Installation Steps

### 1. Copy Component Files

The React component files are already created. Just ensure your project structure matches:

```bash
# Navigate to project root
cd PrimarySchoolTeacherSupportSystemFrontEnd

# Verify files exist
ls -la src/views/TTSPage
ls -la src/services/TTSService.js
```

### 2. Add Routes

Update your router configuration to include the TTS page:

**File:** `src/routers/AppRouter.jsx` (or your routing file)

```jsx
import TTSPage from '../views/TTSPage';

// Inside your routes configuration:
{
  path: '/tts',
  element: <TTSPage />,
  // Optional: Add role-based protection
  // requiresAuth: true
}
```

### 3. Update Navigation

Add a link to TTS page in your navigation menu:

**File:** `src/components/Navbar.jsx`

```jsx
import { Volume2 } from 'lucide-react';
import { Link } from 'react-router-dom';

// Inside your navbar component:
<Link to="/tts" className="nav-link">
  <Volume2 size={20} />
  <span>Chuyển Text thành Giọng nói</span>
</Link>
```

Or in **File:** `src/components/DashboardSidebar.jsx`

```jsx
<nav className="menu">
  {/* Other menu items */}
  <Link to="/tts" className="menu-item">
    <Volume2 size={18} />
    <span>TTS - Text to Speech</span>
  </Link>
</nav>
```

### 4. Environment Configuration

**File:** `.env` (in project root)

```env
VITE_API_URL=http://localhost:8080/api
# Or for development with separate services:
# VITE_API_URL=http://localhost:8084/api
```

If different from the default, create `.env.local`:

```env
VITE_API_URL=http://your-api-gateway:8080/api
```

### 5. Install Dependencies (if needed)

All required dependencies should already be in your `package.json`:

```bash
npm install
# or
yarn install
```

If any packages are missing, add them individually:

```bash
npm install lucide-react axios
```

### 6. Build and Run

```bash
# Development mode
npm run dev

# Access the application
# http://localhost:5173

# Navigate to TTS page
# http://localhost:5173/tts
```

## 🎨 Customization

### Change Colors

Update Tailwind class names in **src/views/TTSPage/index.jsx** to match your theme. Example:

```jsx
<button className="inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-violet-600 to-teal-500 ...">
  ...
</button>
```

Or adjust Tailwind config / utility classes if you want a different color palette.


### Change Text Labels

Edit **TTSPage.jsx** to update Vietnamese labels:

```jsx
// Example: Change button text
<button className="btn btn-primary">
  {isLoading ? 'Đang xử lý...' : 'Chuyển đổi'}
  {/* Change to your preference */}
</button>
```

### Adjust Maximum Text Length

Edit **TTSPage.jsx** validation:

```jsx
if (text.length > 5000) {  // Change 5000 to your preference
  setError('Văn bản không được vượt quá 5000 ký tự');
  return false;
}
```

### Modify UI Layout

The layout uses Tailwind CSS classes. Key sections:

- **Main Content:** `.tts-main-section` (grid column 1)
- **Sidebar:** `.tts-sidebar` (grid column 2, sticky)
- **Responsive:** Changes to single column on screens < 1024px

To change layout, edit Tailwind classes in `src/views/TTSPage/index.jsx`. For example, update the grid container:

```jsx
<div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
  ...
</div>
```

Adjust the `xl:grid-cols-[1.8fr_1fr]` or `gap-6` values to change proportions and spacing.


## 🔌 API Integration

### Service Methods Available

**TTSService.js** provides these methods:

```javascript
// Convert text to speech
TTSService.convertTextToSpeech(text)
  .then(response => console.log(response.audioUrl))
  .catch(error => console.error(error));

// Save audio to database
TTSService.saveAudio({ text, audioUrl, userId })
  .then(response => console.log(response))
  .catch(error => console.error(error));

// Get saved audios
TTSService.getSavedAudios(userId)
  .then(audios => console.log(audios))
  .catch(error => console.error(error));

// Delete audio
TTSService.deleteAudio(audioId)
  .then(response => console.log(response))
  .catch(error => console.error(error));

// Download audio file
TTSService.downloadAudio(audioUrl, filename);
```

## 🔐 Authentication Integration

The component automatically uses JWT token from localStorage:

```javascript
// The token is automatically added to all requests
const token = localStorage.getItem('token');
// Authorization: Bearer {token}
```

Make sure your auth store (`authStore.js`) provides:
- `user.id` - User ID for saving audios
- JWT token stored in localStorage

## 📱 Responsive Design

The component is fully responsive:

- **Desktop** (≥1024px): 2-column layout with sidebar
- **Tablet** (640px-1024px): Single column layout
- **Mobile** (<640px): Full-width buttons and adjusted spacing

## 🧪 Testing the Component

### Manual Testing Checklist

- [ ] Navigate to `/tts` route
- [ ] Enter Vietnamese text in textarea
- [ ] Click "Chuyển đổi" button
- [ ] Wait for audio conversion
- [ ] Audio appears in player
- [ ] Click "Tải xuống" to download audio
- [ ] Click "Lưu âm thanh" to save
- [ ] Audio appears in "Lịch sử âm thanh" sidebar
- [ ] Click delete button next to saved audio
- [ ] Audio removed from list
- [ ] Test on mobile (responsive design)
- [ ] Test with maximum 5000 characters
- [ ] Test validation with empty input

### Example Test Data

```javascript
const testTexts = [
  "Đây là một quả táo đỏ",
  "Xin chào, tôi là một giáo viên",
  "Hôm nay thời tiết rất đẹp",
  "Các em học sinh hãy nghe kỹ lời thầy cô",
  "Đây là một bài kiểm tra đọc hiểu tiếng Việt"
];
```

## 🐛 Troubleshooting

### Issue: "Not found" when accessing `/tts`

**Solution:** Ensure the route is added to your router configuration

```jsx
// Check AppRouter.jsx or similar
{
  path: '/tts',
  element: <TTSPage />,
}
```

### Issue: "Authorization required" error

**Solution:** Ensure JWT token is stored in localStorage

```javascript
// In your login/auth code
localStorage.setItem('token', jwtToken);
```

### Issue: API returns 404

**Solution:** Check API URL in environment variables

```env
VITE_API_URL=http://localhost:8080/api  # or correct gateway URL
```

### Issue: Styling looks broken

**Solution:** Ensure Tailwind CSS is properly configured

```bash
npm run dev
# Should include Tailwind CSS build process
```

### Issue: "Failed to convert text to speech"

**Solution:** Check backend services are running:

1. TTS Service: `http://localhost:8084/api/tts/health`
2. Python API: `http://localhost:8000/health`
3. MySQL Database: Connected and initialized

## 📚 Additional Resources

- [TTSPage Component](./TTSPage/index.jsx)
- [TTSService API Layer](../../services/TTSService.js)
- [TTS Backend Integration Guide](../../backend/tts-service/INTEGRATION_GUIDE.md)
- [Database Setup](../../backend/tts-service/database/DATABASE_SETUP.md)

## 💡 Tips

1. **Performance:** Audio files are cached by browser. Users can replay without regenerating.
2. **Storage:** Cloudinary handles all file storage. Frontend only stores references.
3. **Security:** Always use Bearer token authentication for API calls.
4. **UX:** Consider adding a loading skeleton for better perceived performance.
5. **Accessibility:** HTML5 audio player has built-in accessibility features.

---

**Last Updated:** April 2026  
**Component Version:** 1.0.0
