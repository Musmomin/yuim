import { HashRouter, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import Layout from './components/Layout';
import { NAV } from './components/nav';
import About from './pages/About';
import Agreements from './pages/Agreements';
import ApplicationDetail from './pages/ApplicationDetail';
import Applications from './pages/Applications';
import Audit from './pages/Audit';
import Dashboard from './pages/Dashboard';
import Distribution from './pages/Distribution';
import Investors from './pages/Investors';
import Login from './pages/Login';
import Monitoring from './pages/Monitoring';
import NewApplication from './pages/NewApplication';
import Policy from './pages/Policy';
import Tasks from './pages/Tasks';
import { StoreProvider, useStore } from './store';

function Guard({ path, el }: { path: string; el: ReactElement }) {
  const { role } = useStore();
  const item = NAV.find((n) => n.to === path);
  if (item && role && !item.roles.includes(role)) return <Navigate to="/" replace />;
  return el;
}

function Shell() {
  const { role, ready } = useStore();
  if (!ready) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Yuklanmoqda…</div>;
  if (!role) return <Login />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/vazifalar" element={<Guard path="/vazifalar" el={<Tasks />} />} />
        <Route path="/arizalar" element={<Guard path="/arizalar" el={<Applications />} />} />
        <Route path="/arizalar/yangi" element={<Guard path="/arizalar/yangi" el={<NewApplication />} />} />
        {/* Ko'rish huquqi serverda tekshiriladi: ruxsat bo'lmasa 404 qaytadi */}
        <Route path="/arizalar/:id" element={<ApplicationDetail />} />
        <Route path="/arizalar/:id/tahrir" element={<NewApplication />} />
        <Route path="/shartnomalar" element={<Guard path="/shartnomalar" el={<Agreements />} />} />
        <Route path="/monitoring" element={<Guard path="/monitoring" el={<Monitoring />} />} />
        <Route path="/taqsimot" element={<Guard path="/taqsimot" el={<Distribution />} />} />
        <Route path="/investorlar" element={<Guard path="/investorlar" el={<Investors />} />} />
        <Route path="/siyosat" element={<Guard path="/siyosat" el={<Policy />} />} />
        <Route path="/loyiha" element={<About />} />
        <Route path="/audit" element={<Guard path="/audit" el={<Audit />} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

// Artifact (claude.ai) ichida URL hash'iga tayanib bo'lmaydi — u yerda xotiradagi router ishlatiladi
const Router = import.meta.env.MODE === 'artifact' ? MemoryRouter : HashRouter;

export default function App() {
  return (
    <StoreProvider>
      <Router>
        <Shell />
      </Router>
    </StoreProvider>
  );
}
