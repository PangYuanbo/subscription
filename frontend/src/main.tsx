import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import './styles/animations.css'
import App from './App.tsx'
import { AuthProvider } from './components/AuthProvider'
import { AuthGuard } from './components/AuthGuard'
import { AuthCallback } from './components/AuthCallback'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/callback" element={<AuthCallback />} />
          <Route path="/*" element={
            <AuthGuard>
              <App />
            </AuthGuard>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
