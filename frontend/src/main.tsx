import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Prevent animations during initial page load to avoid flickering
document.body.classList.add('preload');

// Remove preload class after page loads to enable animations
window.addEventListener('load', () => {
  // Small delay to ensure all content is rendered
  setTimeout(() => {
    document.body.classList.remove('preload');
  }, 100);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
