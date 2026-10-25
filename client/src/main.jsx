const saved = localStorage.getItem('tm_theme');
if (saved) document.documentElement.dataset.theme = saved;

import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './i18n';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './styles.css';

// Note: React.StrictMode is intentionally not used - it double-mounts effects in dev,
// which would open two camera streams / sockets in the consultation room.
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
