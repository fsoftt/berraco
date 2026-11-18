import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useApp } from './AppContext';
import { applyTheme } from './hooks/hooks';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { History } from './pages/History';
import { Stats } from './pages/Stats';
import { Weight } from './pages/Weight';
import { Settings } from './pages/Settings';

export function App() {
  const { ready, profile } = useApp();
  useEffect(() => { if (ready) applyTheme(profile.theme); }, [ready, profile.theme]);
  if (!ready) return <div className="splash" aria-busy="true" />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="history" element={<History />} />
        <Route path="stats" element={<Stats />} />
        <Route path="weight" element={<Weight />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
