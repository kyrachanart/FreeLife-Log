import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker for offline & iOS install capability
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

// Suppress benign Vite WebSocket / HMR disconnection console noise
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args: any[]) => {
    const firstArgStr = String(args[0] || '');
    if (
      firstArgStr.includes('[vite]') ||
      firstArgStr.includes('WebSocket') ||
      firstArgStr.includes('failed to connect to websocket')
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    const firstArgStr = String(args[0] || '');
    if (
      firstArgStr.includes('[vite]') ||
      firstArgStr.includes('WebSocket') ||
      firstArgStr.includes('failed to connect to websocket')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || String(reason || '');
    if (
      msg.includes('WebSocket closed without opened') ||
      msg.includes('[vite]') ||
      msg.includes('failed to connect to websocket') ||
      msg.includes('WebSocket')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (
      msg.includes('WebSocket') ||
      msg.includes('[vite]') ||
      msg.includes('WebSocket closed without opened')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
