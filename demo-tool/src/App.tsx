import { useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { AppFooter } from './components/AppFooter';
import { AppSidebar } from './components/AppSidebar';
import type { Page } from './components/AppSidebar';
import { MachineOverview } from './components/MachineOverview';
import { MachineDetail } from './components/MachineDetail';
import { NotificationsPage } from './components/NotificationsPage';
import { SettingsPage } from './components/SettingsPage';
import type { MachineConfig, Notification, NotificationSettings } from './data/types';
import { DEFAULT_MACHINES } from './data/machines';
import { DEFAULT_NOTIFICATIONS, DEFAULT_NOTIFICATION_SETTINGS } from './data/notifications';
import './styles/app.css';

export default function App() {
  const [activePage, setActivePage] = useState<Page>('machines');
  const [machines, setMachines] = useState<MachineConfig[]>(DEFAULT_MACHINES);
  const [notifications, setNotifications] = useState<Notification[]>(DEFAULT_NOTIFICATIONS);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [detailMachineId, setDetailMachineId] = useState<string | null>(null);
  const [openPositionSelector, setOpenPositionSelector] = useState(false);
  const [notifFilterMachineId, setNotifFilterMachineId] = useState<string | null>(null);

  const unreadNotifications = notifications.filter((n) => !n.read);
  const hasCriticalUnread = unreadNotifications.some((n) => n.level === 1);
  const detailMachine = detailMachineId ? machines.find((m) => m.id === detailMachineId) : null;

  function handleUpdateMachine(updated: MachineConfig) {
    setMachines((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m))
    );
  }

  function handleUpdateNotification(updated: Notification) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === updated.id ? updated : n))
    );
  }

  function handleNavigate(page: Page) {
    setActivePage(page);
    setDetailMachineId(null);
    setOpenPositionSelector(false);
    if (page !== 'notifications') {
      setNotifFilterMachineId(null);
    }
  }

  function handleOpenMachine(id: string, withPositionSelector = false) {
    setDetailMachineId(id);
    setOpenPositionSelector(withPositionSelector);
  }

  function handleBellClick() {
    setActivePage('notifications');
    setDetailMachineId(null);
    setNotifFilterMachineId(null);
  }

  function handleMachineNotifClick(machineId: string) {
    setActivePage('notifications');
    setDetailMachineId(null);
    setNotifFilterMachineId(machineId);
  }

  return (
    <div className="app-layout">
      <AppHeader
        unreadCount={unreadNotifications.length}
        hasCritical={hasCriticalUnread}
        onBellClick={handleBellClick}
      />
      <AppSidebar activePage={activePage} onNavigate={handleNavigate} />
      <main className="app-content">
        {activePage === 'machines' && !detailMachine && (
          <MachineOverview
            machines={machines}
            notifications={notifications}
            onUpdateMachine={handleUpdateMachine}
            onOpenMachine={handleOpenMachine}
            onMachineNotifClick={handleMachineNotifClick}
          />
        )}
        {activePage === 'machines' && detailMachine && (
          <MachineDetail
            machine={detailMachine}
            notifications={notifications.filter((n) => n.machineId === detailMachine.id)}
            notifSettings={notifSettings}
            onBack={() => { setDetailMachineId(null); setOpenPositionSelector(false); }}
            onUpdateMachine={handleUpdateMachine}
            onUpdateNotifSettings={setNotifSettings}
            initialPositionSelectorOpen={openPositionSelector}
            onPositionSelectorOpened={() => setOpenPositionSelector(false)}
          />
        )}
        {activePage === 'notifications' && (
          <NotificationsPage
            notifications={notifications}
            machines={machines}
            filterMachineId={notifFilterMachineId}
            onUpdateNotification={handleUpdateNotification}
            onClearFilter={() => setNotifFilterMachineId(null)}
          />
        )}
        {activePage === 'settings' && (
          <SettingsPage
            settings={notifSettings}
            machines={machines}
            onUpdateSettings={setNotifSettings}
          />
        )}
        {activePage !== 'machines' && activePage !== 'notifications' && activePage !== 'settings' && (
          <div style={{ padding: 'var(--s-6)', color: 'var(--r-on-surface-muted)' }}>
            <h1 className="page-title">
              {activePage === 'reports' && 'Berichte'}
              {activePage === 'users' && 'Benutzer'}
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
