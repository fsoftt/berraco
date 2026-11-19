import './installPrompt';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { initI18n } from './i18n';
import { createContainer } from './infrastructure';
import { AppProvider } from './presentation/AppContext';
import { App } from './presentation/App';
import './presentation/styles/tokens.css';
import './presentation/styles/app.css';

initI18n();
registerSW({ immediate: true });
const container = createContainer();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider container={container}>
      <HashRouter><App /></HashRouter>
    </AppProvider>
  </StrictMode>,
);
