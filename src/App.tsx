import { HashRouter, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import Layout from './components/Layout';
import { NAV } from './components/nav';
import About from './pages/About';
import Agreements from './pages/Agreements';
import ApplicationDetail from './pages/ApplicationDetail';
import Applications from './pages/Applications';
import Audit from './pages/Audit';
import Calendar from './pages/Calendar';
import Inbox from './pages/Inbox';
import Stats from './pages/Stats';
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
  const { role } = useStore();
  if (!role) return <Login />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/vazifalar" element={<Guard path="/vazifalar" el={<Tasks />} />} />
        <Route path="/hujjatlar" element={<Guard path="/hujjatlar" el={<Inbox />} />} />
        <Route path="/kalendar" element={<Guard path="/kalendar" el={<Calendar />} />} />
        <Route path="/statistika" element={<Guard path="/statistika" el={<Stats />} />} />
        <Route path="/arizalar" element={<Guard path="/arizalar" el={<Applications />} />} />
        <Route path="/arizalar/yangi" element={<Guard path="/arizalar/yangi" el={<NewApplication />} />} />
        <Route path="/arizalar/:id" element={<ApplicationDetail />} />
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
