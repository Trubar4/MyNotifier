import { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import type { Notification, MachineConfig, BoomPosition } from '../data/types';
import { DEMO_USER, configHasNeedle } from '../data/types';
import { useLang } from '../i18n';
import { AssignModal } from './AssignModal';
import { PositionSelector } from './PositionSelector';
import { NotificationCard } from './NotificationCard';

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

type TabId = 'offen' | 'angenommen' | 'erledigt';

export function NotificationsPage({
  notifications, machines, filterMachineId, onUpdateNotification, onUpdateMachine,
  onClearFilter, onBack, highlightNotifId,
}: NotificationsPageProps) {
  const { lang, t: tr } = useLang();
  const [tab, setTab] = useState<TabId>('offen');
  const [expandedId, setExpandedId] = useState<string | null>(highlightNotifId ?? null);
  const [assigningNotif, setAssigningNotif] = useState<Notification | null>(null);
  const [anpassenNotif, setAnpassenNotif] = useState<Notification | null>(null);

  const machineMap = new Map(machines.map((m) => [m.id, m]));

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
    { id: 'offen', label: `${tr('Offen', 'Open')} (${buckets.offen.length})` },
    { id: 'angenommen', label: `${tr('Angenommen', 'Accepted')} (${buckets.angenommen.length})` },
    { id: 'erledigt', label: `${tr('Erledigt', 'Done')} (${buckets.erledigt.length})` },
  ];

  const list = [...buckets[tab]].sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  function handleAssignConfirm(comment: string) {
    if (!assigningNotif) return;
    const id = assigningNotif.id;
    onUpdateNotification({ ...assigningNotif, assignedTo: DEMO_USER, assignedAt: new Date(), assignedComment: comment || null });
    setAssigningNotif(null);
    // Jump straight to the Angenommen tab, open this card, scroll to it —
    // so the user can immediately hit "Position anpassen".
    setTab('angenommen');
    setExpandedId(id);
    setTimeout(() => {
      document.querySelector(`[data-notif-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  }

  return (
    <div className="notif2-page">
      {onBack && (
        <button className="notif-back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          {tr('Zurück zur Übersicht', 'Back to overview')}
        </button>
      )}
      <h1 className="page-title">{tr('Benachrichtigung', 'Notifications')}</h1>

      {filterMachine && (
        <div className="notif-filter-banner">
          <img src={BASE + 'icon-filter.svg'} alt="" width={14} height={13} className="m-icon" />
          <span>{tr('Gefiltert:', 'Filtered:')} <strong>{filterMachine.name} - {filterMachine.serialNumber}</strong></span>
          <button className="notif-filter-banner__clear" onClick={onClearFilter}>{tr('Aufheben', 'Clear')}</button>
        </div>
      )}

      <div className="notif2-tabs" role="tablist">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            role="tab"
            aria-selected={tab === tb.id}
            className={`notif2-tab ${tab === tb.id ? 'notif2-tab--active' : ''}`}
            onClick={() => { setTab(tb.id); setExpandedId(null); }}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div className="notif2-list">
        {list.length === 0 ? (
          <div className="notif-empty">
            <Check size={28} />
            <span>{tr('Keine Benachrichtigungen in', 'No notifications in')} „{tabs.find((x) => x.id === tab)?.label.replace(/ \(\d+\)/, '')}".</span>
          </div>
        ) : (
          list.map((n) => (
            <NotificationCard
              key={n.id}
              n={n}
              machine={machineMap.get(n.machineId)}
              expanded={expandedId === n.id}
              onToggle={() => setExpandedId(expandedId === n.id ? null : n.id)}
              onAssign={(x) => setAssigningNotif(x)}
              onDone={(x) => onUpdateNotification({ ...x, read: true })}
              onAdjust={(x) => setAnpassenNotif(x)}
              onRelease={(x) => onUpdateNotification({ ...x, assignedTo: null, assignedAt: null, assignedComment: null })}
              onReopen={(x) => onUpdateNotification({ ...x, read: false })}
            />
          ))
        )}
      </div>

      {assigningNotif && (
        <AssignModal
          notificationTitle={lang === 'en' ? (assigningNotif.titleEn ?? assigningNotif.title) : assigningNotif.title}
          onConfirm={handleAssignConfirm}
          onCancel={() => setAssigningNotif(null)}
        />
      )}

      {anpassenNotif && machineMap.get(anpassenNotif.machineId) && (
        <PositionSelector
          title={tr('Manuell anpassen', 'Adjust manually')}
          subtitle={tr(
            `Auslegerposition für ${machineMap.get(anpassenNotif.machineId)!.name} - ${machineMap.get(anpassenNotif.machineId)!.serialNumber}`,
            `Boom position for ${machineMap.get(anpassenNotif.machineId)!.name} - ${machineMap.get(anpassenNotif.machineId)!.serialNumber}`,
          )}
          currentPosition={machineMap.get(anpassenNotif.machineId)!.position.position}
          forecastMax={machineMap.get(anpassenNotif.machineId)!.forecast.max72h}
          hasNeedle={configHasNeedle(machineMap.get(anpassenNotif.machineId)!.specs.boomConfiguration)}
          allowNoAction
          onSelect={(p) => handleAnpassenConfirm(p)}
          onNoAction={() => handleAnpassenConfirm(null)}
          onClose={() => setAnpassenNotif(null)}
        />
      )}
    </div>
  );
}
