import { useState } from 'react';
import { ArrowLeft, Clock, ChevronDown, ChevronUp, Filter, Check, MessageSquare } from 'lucide-react';
import type { Notification, MachineConfig, BoomPosition } from '../data/types';
import { DEMO_USER, BOOM_POSITION_LABELS, BOOM_THRESHOLDS } from '../data/types';
import { AssignModal } from './AssignModal';
import { ManuellAnpassenModal } from './ManuellAnpassenModal';
import { recommendPosition } from './PositionSelector';

const BASE = import.meta.env.BASE_URL;

interface NotificationsPageProps {
  notifications: Notification[];
  machines: MachineConfig[];
  filterMachineId: string | null;
  onUpdateNotification: (updated: Notification) => void;
  onUpdateMachine: (updated: MachineConfig) => void;
  onClearFilter: () => void;
  onBack?: () => void;
  highlightNotifId?: string | null;
  onOpenMachine?: (machineId: string) => void;
}

function hoursSince(date: Date): number {
  return Math.max(0, Math.round((Date.now() - date.getTime()) / 3_600_000));
}

type TabId = 'offen' | 'angenommen' | 'erledigt';

function formatFull(date: Date): string {
  const p = (n: number) => n.toString().padStart(2, '0');
  return `${p(date.getDate())}.${p(date.getMonth() + 1)}.${date.getFullYear()} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}

export function NotificationsPage({
  notifications, machines, filterMachineId, onUpdateNotification, onUpdateMachine,
  onClearFilter, onBack, highlightNotifId,
}: NotificationsPageProps) {
  const [tab, setTab] = useState<TabId>('offen');
  const [expandedId, setExpandedId] = useState<string | null>(highlightNotifId ?? null);
  const [assigningNotif, setAssigningNotif] = useState<Notification | null>(null);
  const [anpassenNotif, setAnpassenNotif] = useState<Notification | null>(null);

  const machineMap = new Map(machines.map((m) => [m.id, m]));
  const allPositions = Object.keys(BOOM_POSITION_LABELS) as BoomPosition[];

  function handleAnpassenConfirm(pos: BoomPosition | null) {
    if (!anpassenNotif) return;
    const machine = machineMap.get(anpassenNotif.machineId);
    if (machine && pos) {
      onUpdateMachine({
        ...machine,
        position: { ...machine.position, position: pos, timestamp: new Date(), manuallySet: true },
      });
    }
    // position handled → mark notification done (Erledigt), keep who handled it
    onUpdateNotification({ ...anpassenNotif, read: true });
    setAnpassenNotif(null);
  }
  const filterMachine = filterMachineId ? machineMap.get(filterMachineId) : null;

  const scoped = filterMachineId
    ? notifications.filter((n) => n.machineId === filterMachineId)
    : notifications;

  const buckets: Record<TabId, Notification[]> = {
    offen: scoped.filter((n) => !n.read && !n.assignedTo),
    angenommen: scoped.filter((n) => !n.read && n.assignedTo),
    erledigt: scoped.filter((n) => n.read),
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'offen', label: `Offen (${buckets.offen.length})` },
    { id: 'angenommen', label: `Angenommen (${buckets.angenommen.length})` },
    { id: 'erledigt', label: `Erledigt (${buckets.erledigt.length})` },
  ];

  const list = [...buckets[tab]].sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  function handleAssignConfirm(comment: string) {
    if (!assigningNotif) return;
    onUpdateNotification({ ...assigningNotif, assignedTo: DEMO_USER, assignedAt: new Date(), assignedComment: comment || null });
    setAssigningNotif(null);
  }

  function renderCard(n: Notification) {
    const machine = machineMap.get(n.machineId);
    const isExpanded = expandedId === n.id;
    const levelClass = n.level === 1 ? 'kritisch' : 'warnung';
    const threshold = machine ? BOOM_THRESHOLDS[machine.position.position] : null;
    const isOnline = machine?.status === 'online';
    const recommended = machine ? recommendPosition(allPositions, machine.forecast.max72h) : null;
    const lastPosHours = machine ? hoursSince(machine.position.timestamp) : 0;

    return (
      <div key={n.id} className={`notif2 notif2--${levelClass}`}>
        <div className="notif2__pillrow">
          <div className="notif2__pillleft">
            <span className={`notif2__pill notif2__pill--${levelClass}`}>
              {n.level === 1 ? 'Kritisch' : 'Warnung'}
            </span>
            {machine && <span className="notif2__machine">{machine.name} - {machine.serialNumber}</span>}
          </div>
          {machine && (
            <div className="notif2__status">
              <span className={`m-card__dot ${isOnline ? 'm-card__dot--online' : 'm-card__dot--offline'}`} />
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          )}
        </div>

        <div className="notif2__time">
          <Clock size={14} />
          <span>{formatFull(n.timestamp)}</span>
        </div>

        <h3 className="notif2__title">{n.title}</h3>

        {machine && (
          <div className="notif2__facts">
            {threshold !== null && (
              <span>Position akt. bis: <strong>{threshold} m/s</strong></span>
            )}
            <span>Prognose max.: <strong>{machine.forecast.max72h.toFixed(1)} m/s</strong></span>
          </div>
        )}

        {isExpanded && (
          <div className="notif2__detail">
            <p className="notif2__body">{n.body}</p>

            {n.assignedTo && (
              <div className="notif2__field">
                <span className="notif2__field-label">Übernommen durch:</span>
                <span className="notif2__field-value">{n.assignedTo}</span>
              </div>
            )}
            {n.assignedTo && n.assignedComment && (
              <div className="notif2__comment">
                <MessageSquare size={12} />
                <span>{n.assignedComment}</span>
              </div>
            )}

            {/* Offen: aktuelle Position + max. Wind */}
            {tab === 'offen' && machine && (
              <>
                <div className="notif2__field">
                  <span className="notif2__field-label">Aktuelle Position:</span>
                  <span className="notif2__field-value">{BOOM_POSITION_LABELS[machine.position.position]}</span>
                </div>
                {threshold !== null && (
                  <div className="notif2__field">
                    <span className="notif2__field-label">Max. zulässiger Wind:</span>
                    <span className="notif2__field-value">{threshold} m/s</span>
                  </div>
                )}
              </>
            )}

            {/* Angenommen: letzte + empfohlene Position */}
            {tab === 'angenommen' && machine && (
              <>
                <div className="notif2__field">
                  <span className="notif2__field-label">Letzte Position (seit {lastPosHours} Std.):</span>
                  <span className="notif2__field-value">{BOOM_POSITION_LABELS[machine.position.position]}</span>
                </div>
                {recommended && (
                  <div className="notif2__field">
                    <span className="notif2__field-label">Empfohlene Position:</span>
                    <span className="notif2__field-value">
                      {BOOM_POSITION_LABELS[recommended]}
                      {BOOM_THRESHOLDS[recommended] !== null ? ` (${BOOM_THRESHOLDS[recommended]} m/s)` : ''}
                    </span>
                  </div>
                )}
              </>
            )}

            <div className="notif2__actions">
              {tab === 'offen' && (
                <>
                  <button className="m-btn m-btn--primary" onClick={() => setAssigningNotif(n)}>Übernehmen</button>
                  <button className="m-btn m-btn--outline" onClick={() => onUpdateNotification({ ...n, read: true })}>
                    <Check size={16} /> Erledigt
                  </button>
                </>
              )}
              {tab === 'angenommen' && (
                <>
                  <button className="m-btn m-btn--primary" onClick={() => setAnpassenNotif(n)}>
                    <img src={BASE + 'boom-angle.svg'} alt="" width={18} height={18} />
                    Position anpassen
                  </button>
                  <button className="m-btn m-btn--outline" onClick={() => onUpdateNotification({ ...n, assignedTo: null, assignedAt: null, assignedComment: null })}>Abgeben</button>
                </>
              )}
              {tab === 'erledigt' && (
                <button className="m-btn m-btn--outline" onClick={() => onUpdateNotification({ ...n, read: false })}>Wieder öffnen</button>
              )}
            </div>
          </div>
        )}

        <button className="notif2__toggle" onClick={() => setExpandedId(isExpanded ? null : n.id)}>
          <span>{isExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
    );
  }

  return (
    <div className="notif2-page">
      {onBack && (
        <button className="notif-back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          Zurück zur Übersicht
        </button>
      )}
      <h1 className="page-title">Benachrichtigung</h1>

      {filterMachine && (
        <div className="notif-filter-banner">
          <Filter size={14} />
          <span>Gefiltert: <strong>{filterMachine.name} - {filterMachine.serialNumber}</strong></span>
          <button className="notif-filter-banner__clear" onClick={onClearFilter}>Aufheben</button>
        </div>
      )}

      <div className="notif2-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`notif2-tab ${tab === t.id ? 'notif2-tab--active' : ''}`}
            onClick={() => { setTab(t.id); setExpandedId(null); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="notif2-list">
        {list.length === 0 ? (
          <div className="notif-empty">
            <Check size={28} />
            <span>Keine Benachrichtigungen in „{tabs.find(t => t.id === tab)?.label.replace(/ \(\d+\)/, '')}".</span>
          </div>
        ) : (
          list.map(renderCard)
        )}
      </div>

      {assigningNotif && (
        <AssignModal
          notificationTitle={assigningNotif.title}
          onConfirm={handleAssignConfirm}
          onCancel={() => setAssigningNotif(null)}
        />
      )}

      {anpassenNotif && machineMap.get(anpassenNotif.machineId) && (
        <ManuellAnpassenModal
          machine={machineMap.get(anpassenNotif.machineId)!}
          onConfirm={handleAnpassenConfirm}
          onClose={() => setAnpassenNotif(null)}
        />
      )}
    </div>
  );
}
