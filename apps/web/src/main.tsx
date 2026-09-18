import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initStatusBar } from './utils/statusBar';
import { initTTSPolyfill } from './utils/ttsPolyfill';

// Initialize native Android/iOS status bar styling and inset calculations
initStatusBar();

// Initialize native Android WebView TextToSpeech bridge polyfill
initTTSPolyfill();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
