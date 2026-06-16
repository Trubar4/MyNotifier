import { useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { AppFooter } from './components/AppFooter';
import { AppSidebar } from './components/AppSidebar';
import type { Page } from './components/AppSidebar';
import { MachineOverview } from './components/MachineOverview';
import { MachineDetail } from './components/MachineDetail';
import { NotificationsPage } from './components/NotificationsPage';
import { SettingsPage } from './components/SettingsPage';
import { DailyCheckPage } from './components/DailyCheckPage';
import { ReportsPage } from './components/ReportsPage';
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
  const [notifCameFromMachines, setNotifCameFromMachines] = useState(false);
  const [highlightNotifId, setHighlightNotifId] = useState<string | null>(null);

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
    setHighlightNotifId(null);
    if (page !== 'notifications') {
      setNotifFilterMachineId(null);
    }
    setNotifCameFromMachines(false);
  }

  function handleOpenMachine(id: string) {
    setDetailMachineId(id);
  }

  function handleBellClick() {
    setNotifCameFromMachines(activePage === 'machines');
    setActivePage('notifications');
    setDetailMachineId(null);
    setNotifFilterMachineId(null);
    setHighlightNotifId(null);
  }

  function handleMachineNotifClick(machineId: string) {
    setNotifCameFromMachines(true);
    setActivePage('notifications');
    setDetailMachineId(null);
    setNotifFilterMachineId(machineId);
    setHighlightNotifId(null);
  }

  function handleNotifBack() {
    setActivePage('machines');
    setNotifFilterMachineId(null);
    setNotifCameFromMachines(false);
    setHighlightNotifId(null);
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
            onUpdateNotification={handleUpdateNotification}
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
            onBack={notifCameFromMachines ? handleNotifBack : undefined}
            highlightNotifId={highlightNotifId}
            onOpenMachine={(machineId) => {
              setActivePage('machines');
              setDetailMachineId(machineId);
              setNotifFilterMachineId(null);
              setNotifCameFromMachines(false);
            }}
          />
        )}
        {activePage === 'settings' && (
          <SettingsPage
            settings={notifSettings}
            machines={machines}
            onUpdateSettings={setNotifSettings}
          />
        )}
        {activePage === 'dailycheck' && (
          <DailyCheckPage
            machines={machines}
            notifications={notifications}
            onUpdateMachine={handleUpdateMachine}
          />
        )}
        {activePage === 'reports' && (
          <ReportsPage machines={machines} />
        )}
        {activePage !== 'machines' && activePage !== 'notifications' && activePage !== 'settings' && activePage !== 'dailycheck' && activePage !== 'reports' && (
          <div style={{ padding: 'var(--s-6)', color: 'var(--r-on-surface-muted)' }}>
            <h1 className="page-title">
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
