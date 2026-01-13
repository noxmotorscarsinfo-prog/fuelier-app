import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { initSentry } from './app/utils/sentry';
import './styles/index.css';

// Inicializar Sentry lo antes posible
initSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
