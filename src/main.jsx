import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.jsx'
import GlobalConfirmDialog from './components/GlobalConfirmDialog.jsx'
import { installAlertToastBridge } from './utils/toastNotifications.js'

installAlertToastBridge()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <GlobalConfirmDialog />
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      duration={3500}
      visibleToasts={4}
    />
  </StrictMode>,
)
