import { useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { AppFooter } from './components/AppFooter';
import { AppSidebar } from './components/AppSidebar';
import type { Page } from './components/AppSidebar';
import { MachineOverview } from './components/MachineOverview';
import { MachineDetail } from './components/MachineDetail';
import type { MachineConfig } from './data/types';
import { DEFAULT_MACHINES } from './data/machines';
import './styles/app.css';

export default function App() {
  const [activePage, setActivePage] = useState<Page>('machines');
  const [machines, setMachines] = useState<MachineConfig[]>(DEFAULT_MACHINES);
  const [detailMachineId, setDetailMachineId] = useState<string | null>(null);

  const totalNotifications = machines.reduce((sum, m) => sum + m.notificationCount, 0);
  const detailMachine = detailMachineId ? machines.find((m) => m.id === detailMachineId) : null;

  function handleUpdateMachine(updated: MachineConfig) {
    setMachines((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m))
    );
  }

  function handleNavigate(page: Page) {
    setActivePage(page);
    setDetailMachineId(null);
  }

  return (
    <div className="app-layout">
      <AppHeader totalNotifications={totalNotifications} />
      <AppSidebar activePage={activePage} onNavigate={handleNavigate} />
      <main className="app-content">
        {activePage === 'machines' && !detailMachine && (
          <MachineOverview
            machines={machines}
            onUpdateMachine={handleUpdateMachine}
            onOpenMachine={(id) => setDetailMachineId(id)}
          />
        )}
        {activePage === 'machines' && detailMachine && (
          <MachineDetail
            machine={detailMachine}
            onBack={() => setDetailMachineId(null)}
            onUpdateMachine={handleUpdateMachine}
          />
        )}
        {activePage !== 'machines' && (
          <div style={{ padding: 'var(--s-6)', color: 'var(--r-on-surface-muted)' }}>
            <h1 className="page-title">
              {activePage === 'notifications' && 'Benachrichtigungen'}
              {activePage === 'reports' && 'Berichte'}
              {activePage === 'users' && 'Benutzer'}
              {activePage === 'settings' && 'Einstellungen'}
            </h1>
            <p style={{ font: '400 14px/20px var(--font-text)' }}>
              Diese Seite ist im Demonstrator nicht verfügbar.
            </p>
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
