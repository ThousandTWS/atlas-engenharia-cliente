import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './core/styles/global.css'
import { AppProvider } from './core/providers/AppProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider />
  </StrictMode>,
)
