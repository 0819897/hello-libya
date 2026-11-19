import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

// Clips from earlier voices (v1: old WAV, v2: British bf_emma) were cached under these names; free that space.
if (typeof caches !== 'undefined') {
  for (const old of ['hello-libya-audio-v1', 'hello-libya-audio-v2']) caches.delete(old).catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><HashRouter><App /></HashRouter></StrictMode>,
);
