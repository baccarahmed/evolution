import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/geist';
import App from './App';
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
import './style.css';

ReactDOM.createRoot(document.getElementById('root') || document.getElementById('app')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
