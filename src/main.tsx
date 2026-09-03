import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles.css';
import './public-content.css';
import { AuthProvider } from './features/auth/AuthContext';
import { AppErrorBoundary } from './app/AppErrorBoundary';
import { AppConfigProvider } from './features/appConfig/AppConfigContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <AppConfigProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </AppConfigProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
