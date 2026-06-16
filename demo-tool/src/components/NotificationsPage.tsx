import { useState } from 'react';
import { ArrowLeft, AlertTriangle, XCircle, CheckCircle, Filter, ChevronDown, ChevronUp, MessageSquare, ExternalLink } from 'lucide-react';
import type { Notification, MachineConfig } from '../data/types';
import { DEMO_USER } from '../data/types';
import { AssignModal } from './AssignModal';

interface NotificationsPageProps {
  notifications: Notification[];
  machines: MachineConfig[];
  filterMachineId: string | null;
  onUpdateNotification: (updated: Notification) => void;
  onClearFilter: () => void;
  onBack?: () => void;
  highlightNotifId?: string | null;
  onOpenMachine?: (machineId: string) => void;
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

export function NotificationsPage({ notifications, machines, filterMachineId, onUpdateNotification, onClearFilter, onBack, highlightNotifId, onOpenMachine }: NotificationsPageProps) {
  const [filter, setFilter] = useState<FilterMode>(filterMachineId ? 'all' : 'open');
  const [expandedMachines, setExpandedMachines] = useState<Set<string>>(new Set());
  const [assigningNotif, setAssigningNotif] = useState<Notification | null>(null);
  const [focusNotifId, setFocusNotifId] = useState<string | null>(highlightNotifId ?? null);

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

  function handleAssignConfirm(comment: string) {
    if (!assigningNotif) return;
    onUpdateNotification({
      ...assigningNotif,
      assignedTo: DEMO_USER,
      assignedAt: new Date(),
      assignedComment: comment || null,
    });
    setAssigningNotif(null);
  }

  function handleUnassign(notification: Notification) {
    onUpdateNotification({
      ...notification,
      assignedTo: null,
      assignedAt: null,
      assignedComment: null,
    });
  }

  function handleMarkRead(notification: Notification) {
    onUpdateNotification({ ...notification, read: !notification.read });
  }

  function toggleMachineExpand(machineId: string) {
    setExpandedMachines(prev => {
      const next = new Set(prev);
      if (next.has(machineId)) next.delete(machineId);
      else next.add(machineId);
      return next;
    });
  }

  function getAssignedNotifForMachine(machineId: string): Notification | null {
    return notifications.find(n => n.machineId === machineId && n.assignedTo !== null) ?? null;
  }

  const filterMachine = filterMachineId ? machineMap.get(filterMachineId) : null;

  function renderNotification(n: Notification, showMachine = true) {
    const machine = machineMap.get(n.machineId);
    const isAssigned = n.assignedTo !== null;
    const isHighlighted = n.id === focusNotifId;

    const assignedSibling = !isAssigned ? getAssignedNotifForMachine(n.machineId) : null;

    return (
      <div
        key={n.id}
        id={`notif-${n.id}`}
        className={`notif-card notif-card--level-${n.level} ${n.read ? 'notif-card--read' : ''} ${isAssigned ? 'notif-card--assigned' : ''} ${isHighlighted ? 'notif-card--highlight' : ''}`}
      >
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
          {showMachine && machine && (
            <span className="notif-card__machine">{machine.name} - {machine.serialNumber}</span>
          )}
          <p className="notif-card__body">{n.body}</p>

          {isAssigned && (
            <div className="notif-card__assigned">
              <CheckCircle size={14} />
              <span>{n.assignedTo} hat die Aufgabe übernommen</span>
            </div>
          )}

          {isAssigned && n.assignedComment && (
            <div className="notif-card__comment">
              <MessageSquare size={12} />
              <span>{n.assignedComment}</span>
            </div>
          )}

          {!isAssigned && assignedSibling && (
            <div
              className="notif-card__cross-ref"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedMachines(prev => new Set([...prev, assignedSibling.machineId]));
                if (assignedSibling.read && filter === 'open') setFilter('all');
                setFocusNotifId(assignedSibling.id);
                requestAnimationFrame(() => {
                  const el = document.getElementById(`notif-${assignedSibling.id}`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
              }}
              role="button"
              tabIndex={0}
            >
              <CheckCircle size={12} />
              <span>
                {assignedSibling.assignedTo} hat für <strong>{assignedSibling.title}</strong> die Aufgabe übernommen
              </span>
            </div>
          )}

          <div className="notif-card__actions">
            <button
              className={`lds-btn lds-btn--sm ${isAssigned ? 'lds-btn--ghost' : 'lds-btn--primary'}`}
              onClick={() => isAssigned ? handleUnassign(n) : setAssigningNotif(n)}
            >
              {isAssigned ? 'Abgeben' : 'Übernehmen'}
            </button>
            <button
              className="lds-btn lds-btn--ghost lds-btn--sm"
              onClick={() => handleMarkRead(n)}
            >
              {n.read ? 'Als ungelesen markieren' : 'Als gelesen markieren'}
            </button>
            {onOpenMachine && (
              <button
                className="lds-btn lds-btn--ghost lds-btn--sm"
                onClick={() => onOpenMachine(n.machineId)}
              >
                <ExternalLink size={12} />
                Zur Maschine
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderAccordion() {
    const groups = new Map<string, Notification[]>();
    for (const n of filtered) {
      const list = groups.get(n.machineId) || [];
      list.push(n);
      groups.set(n.machineId, list);
    }

    return Array.from(groups.entries()).map(([machineId, notifs]) => {
      const machine = machineMap.get(machineId);
      const hasCritical = notifs.some((n) => n.level === 1);
      const newest = notifs[0];
      const rest = notifs.slice(1);
      const isExpanded = expandedMachines.has(machineId);

      return (
        <div key={machineId} className="notif-accordion">
          <div className={`notif-accordion__header ${hasCritical ? 'notif-accordion__header--critical' : 'notif-accordion__header--warning'}`}>
            <span className="notif-accordion__machine">
              {machine ? `${machine.name} - ${machine.serialNumber}` : machineId}
            </span>
            <span className="notif-accordion__count">
              {notifs.length} {notifs.length === 1 ? 'Benachrichtigung' : 'Benachrichtigungen'}
            </span>
          </div>

          {renderNotification(newest, false)}

          {rest.length > 0 && (
            <>
              {isExpanded && (
                <div className="notif-accordion__rest">
                  {rest.map(n => renderNotification(n, false))}
                </div>
              )}
              <button
                className="notif-accordion__toggle"
                onClick={() => toggleMachineExpand(machineId)}
              >
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {isExpanded ? 'Weniger anzeigen' : `${rest.length} weitere anzeigen`}
              </button>
            </>
          )}
        </div>
      );
    });
  }

  return (
    <div>
      {onBack && (
        <button className="notif-back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          Zurück zur Übersicht
        </button>
      )}
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
      </div>

      <div className="notif-list">
        {filtered.length === 0 ? (
          <div className="notif-empty">
            <CheckCircle size={32} />
            <span>Keine Benachrichtigungen{filter === 'open' ? ' offen' : filter === 'read' ? ' gelesen' : ''}.</span>
          </div>
        ) : (
          renderAccordion()
        )}
      </div>

      {assigningNotif && (
        <AssignModal
          notificationTitle={assigningNotif.title}
          onConfirm={handleAssignConfirm}
          onCancel={() => setAssigningNotif(null)}
        />
      )}
    </div>
  );
}
