import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initStatusBar } from './utils/statusBar';

// Initialize native Android/iOS status bar styling and inset calculations
initStatusBar();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
