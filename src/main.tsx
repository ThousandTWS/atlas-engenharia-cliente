import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './core/styles/global.css'
import { AppProvider } from './core/providers/AppProvider'

console.log('Main: Starting application...');

window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global Error:', message, 'at', source, lineno, colno, error);
};

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Root element not found');

  createRoot(rootElement).render(
    <StrictMode>
      <AppProvider />
    </StrictMode>,
  )
  console.log('Main: Rendered AppProvider');
} catch (error) {
  console.error('Main: Critical rendering error:', error);
}
