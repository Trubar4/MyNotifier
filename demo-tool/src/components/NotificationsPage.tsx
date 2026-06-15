import { useState } from 'react';
import { AlertTriangle, XCircle, CheckCircle, Filter } from 'lucide-react';
import type { Notification, MachineConfig } from '../data/types';
import { DEMO_USER } from '../data/types';

interface NotificationsPageProps {
  notifications: Notification[];
  machines: MachineConfig[];
  filterMachineId: string | null;
  onUpdateNotification: (updated: Notification) => void;
  onClearFilter: () => void;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'gerade eben';
  if (diffMin < 60) return `vor ${diffMin} Min.`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `vor ${diffH} Std.`;

  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type FilterMode = 'open' | 'read' | 'all';
type GroupMode = 'all' | 'machine';

export function NotificationsPage({ notifications, machines, filterMachineId, onUpdateNotification, onClearFilter }: NotificationsPageProps) {
  const [filter, setFilter] = useState<FilterMode>(filterMachineId ? 'all' : 'open');
  const [groupBy, setGroupBy] = useState<GroupMode>(filterMachineId ? 'machine' : 'all');

  const machineMap = new Map(machines.map((m) => [m.id, m]));

  let filtered = [...notifications];

  if (filterMachineId) {
    filtered = filtered.filter((n) => n.machineId === filterMachineId);
  }

  if (filter === 'open') {
    filtered = filtered.filter((n) => !n.read);
  } else if (filter === 'read') {
    filtered = filtered.filter((n) => n.read);
  }

  filtered.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  function handleAssign(notification: Notification) {
    onUpdateNotification({
      ...notification,
      assignedTo: notification.assignedTo ? null : DEMO_USER,
      assignedAt: notification.assignedTo ? null : new Date(),
    });
  }

  function handleMarkRead(notification: Notification) {
    onUpdateNotification({ ...notification, read: !notification.read });
  }

  const filterMachine = filterMachineId ? machineMap.get(filterMachineId) : null;

  function renderNotification(n: Notification) {
    const machine = machineMap.get(n.machineId);
    const isAssigned = n.assignedTo !== null;

    return (
      <div key={n.id} className={`notif-card notif-card--level-${n.level} ${n.read ? 'notif-card--read' : ''} ${isAssigned ? 'notif-card--assigned' : ''}`}>
        <div className="notif-card__icon">
          {n.level === 1 ? <XCircle size={20} /> : <AlertTriangle size={20} />}
        </div>
        <div className="notif-card__content">
          <div className="notif-card__header">
            <span className={`notif-card__level notif-card__level--${n.level}`}>
              {n.level === 1 ? 'Kritisch' : 'Warnung'}
            </span>
            <span className="notif-card__time">{formatTimestamp(n.timestamp)}</span>
          </div>
          <h3 className="notif-card__title">{n.title}</h3>
          {machine && (
            <span className="notif-card__machine">{machine.name} - {machine.serialNumber}</span>
          )}
          <p className="notif-card__body">{n.body}</p>

          {isAssigned && (
            <div className="notif-card__assigned">
              <CheckCircle size={14} />
              <span>{n.assignedTo} hat die Aufgabe übernommen</span>
            </div>
          )}

          <div className="notif-card__actions">
            <button
              className={`lds-btn lds-btn--sm ${isAssigned ? 'lds-btn--ghost' : 'lds-btn--primary'}`}
              onClick={() => handleAssign(n)}
            >
              {isAssigned ? 'Abgeben' : 'Übernehmen'}
            </button>
            <button
              className="lds-btn lds-btn--ghost lds-btn--sm"
              onClick={() => handleMarkRead(n)}
            >
              {n.read ? 'Als ungelesen markieren' : 'Als gelesen markieren'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderGrouped() {
    if (groupBy === 'all') {
      return filtered.map(renderNotification);
    }

    const groups = new Map<string, Notification[]>();
    for (const n of filtered) {
      const list = groups.get(n.machineId) || [];
      list.push(n);
      groups.set(n.machineId, list);
    }

    return Array.from(groups.entries()).map(([machineId, notifs]) => {
      const machine = machineMap.get(machineId);
      const hasCritical = notifs.some((n) => n.level === 1);
      return (
        <div key={machineId} className="notif-group">
          <div className={`notif-group__header ${hasCritical ? 'notif-group__header--critical' : 'notif-group__header--warning'}`}>
            <span className="notif-group__machine">
              {machine ? `${machine.name} - ${machine.serialNumber}` : machineId}
            </span>
            <span className="notif-group__count">{notifs.length} {notifs.length === 1 ? 'Benachrichtigung' : 'Benachrichtigungen'}</span>
          </div>
          <div className="notif-group__list">
            {notifs.map(renderNotification)}
          </div>
        </div>
      );
    });
  }

  return (
    <div>
      <h1 className="page-title">Benachrichtigungen</h1>

      {filterMachine && (
        <div className="notif-filter-banner">
          <Filter size={14} />
          <span>Gefiltert nach: <strong>{filterMachine.name} - {filterMachine.serialNumber}</strong></span>
          <button className="notif-filter-banner__clear" onClick={onClearFilter}>Filter aufheben</button>
        </div>
      )}

      <div className="notif-toolbar">
        <div className="notif-toolbar__group">
          <span className="notif-toolbar__label">Filter:</span>
          {(['open', 'read', 'all'] as FilterMode[]).map((f) => (
            <button
              key={f}
              className={`config-chip ${filter === f ? 'config-chip--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'open' ? 'Offen' : f === 'read' ? 'Gelesen' : 'Alle'}
            </button>
          ))}
        </div>
        <div className="notif-toolbar__group">
          <span className="notif-toolbar__label">Gruppierung:</span>
          {(['all', 'machine'] as GroupMode[]).map((g) => (
            <button
              key={g}
              className={`config-chip ${groupBy === g ? 'config-chip--active' : ''}`}
              onClick={() => setGroupBy(g)}
            >
              {g === 'all' ? 'Alle' : 'Je Maschine'}
            </button>
          ))}
        </div>
      </div>

      <div className="notif-list">
        {filtered.length === 0 ? (
          <div className="notif-empty">
            <CheckCircle size={32} />
            <span>Keine Benachrichtigungen{filter === 'open' ? ' offen' : filter === 'read' ? ' gelesen' : ''}.</span>
          </div>
        ) : (
          renderGrouped()
        )}
      </div>
    </div>
  );
}
