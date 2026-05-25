import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Registro do Service Worker para suporte a PWA e Notificações Mobile
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[Service Worker] Registro bem-sucedido no escopo:', reg.scope);
      })
      .catch((err) => {
        console.error('[Service Worker] Falha no registro:', err);
      });
  });
}
