import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './styles/app.css'
import App from './App.jsx'
import './App.css'
import { AuthProvider } from './context/AuthProvider.jsx'
import { SignupProvider } from './context/SignupProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SignupProvider>
          <App />
        </SignupProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
