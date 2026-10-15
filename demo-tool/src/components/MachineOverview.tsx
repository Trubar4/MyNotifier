import { useState } from 'react';
import { Search, SlidersHorizontal, ClipboardCheck, X } from 'lucide-react';
import type { MachineConfig, Notification } from '../data/types';
import { MachineCard } from './MachineCard';
import { ScenarioConfig } from './ScenarioConfig';
import { PositionSelector } from './PositionSelector';

type SortMode = 'recent' | 'name';
type FilterMode = 'offlineNoManual' | 'offline' | 'warnings' | null;

interface MachineOverviewProps {
  machines: MachineConfig[];
  notifications: Notification[];
  onUpdateMachine: (updated: MachineConfig) => void;
  onOpenMachine: (id: string) => void;
  onMachineNotifClick: (machineId: string) => void;
  onDailyCheck?: () => void;
}

export function MachineOverview({ machines, notifications, onUpdateMachine, onOpenMachine, onMachineNotifClick, onDailyCheck }: MachineOverviewProps) {
  const [configMachineId, setConfigMachineId] = useState<string | null>(null);
  const [positionSelectorMachineId, setPositionSelectorMachineId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('recent');
  const [filter, setFilter] = useState<FilterMode>(null);
  const [showFilters, setShowFilters] = useState(false);

  const configMachine = machines.find((m) => m.id === configMachineId);
  const positionSelectorMachine = machines.find((m) => m.id === positionSelectorMachineId);

  function getMachineNotifInfo(machineId: string) {
    const machineNotifs = notifications.filter((n) => n.machineId === machineId && !n.read);
    const critical = machineNotifs.filter((n) => n.level === 1).length;
    const warning = machineNotifs.filter((n) => n.level === 2).length;
    const assignedUser = machineNotifs.find((n) => n.assignedTo)?.assignedTo ?? null;
    return { critical, warning, assignedUser };
  }

  const query = search.toLowerCase().trim();
  let filtered = machines;
  if (query) {
    filtered = machines.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.serialNumber.toLowerCase().includes(query) ||
        m.location.shortAddress.toLowerCase().includes(query) ||
        m.location.address.toLowerCase().includes(query)
    );
  }
  if (filter === 'offline') {
    filtered = filtered.filter((m) => m.status === 'offline' && m.license === 'active');
  } else if (filter === 'offlineNoManual') {
    filtered = filtered.filter((m) => m.status === 'offline' && m.license === 'active' && !m.position.manuallySet);
  } else if (filter === 'warnings') {
    filtered = filtered.filter((m) => {
      const { critical, warning } = getMachineNotifInfo(m.id);
      return critical > 0 || warning > 0;
    });
  }

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'name') {
      return a.name.localeCompare(b.name, 'de');
    }
    return b.wind.timestamp.getTime() - a.wind.timestamp.getTime();
  });

  return (
    <>
      <h1 className="page-title">Maschinen</h1>

      <div className="m-toolbar">
        <div className="m-search">
          <Search size={20} className="m-search__icon" />
          <input
            type="text"
            className="m-search__input"
            placeholder="Suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className={`m-toolbar__btn ${showFilters || filter !== null ? 'm-toolbar__btn--active' : ''}`}
          onClick={() => setShowFilters((s) => !s)}
          aria-label="Filter und Sortierung"
          aria-expanded={showFilters}
        >
          <SlidersHorizontal size={20} />
          {filter !== null && <span className="m-toolbar__dot" />}
        </button>
        <button
          className="m-toolbar__btn m-toolbar__btn--primary"
          onClick={onDailyCheck}
          aria-label="Check für Auslegerposition außerhalb Betrieb"
          title="Check für Auslegerposition außerhalb Betrieb"
        >
          <ClipboardCheck size={20} />
        </button>
      </div>

      {showFilters && (
        <div className="m-filtersheet">
          <div className="m-filtersheet__row">
            <span className="m-filtersheet__label">Sortierung</span>
            <div className="m-filtersheet__chips">
              <button className={`config-chip ${sort === 'recent' ? 'config-chip--active' : ''}`} onClick={() => setSort('recent')}>Neueste Meldung</button>
              <button className={`config-chip ${sort === 'name' ? 'config-chip--active' : ''}`} onClick={() => setSort('name')}>Alphabetisch</button>
            </div>
          </div>
          <div className="m-filtersheet__row">
            <span className="m-filtersheet__label">Filter</span>
            <div className="m-filtersheet__chips">
              <button className={`config-chip ${filter === 'offlineNoManual' ? 'config-chip--active' : ''}`} onClick={() => setFilter(f => f === 'offlineNoManual' ? null : 'offlineNoManual')}>Offline, Position unbekannt</button>
              <button className={`config-chip ${filter === 'offline' ? 'config-chip--active' : ''}`} onClick={() => setFilter(f => f === 'offline' ? null : 'offline')}>Alle Offline</button>
              <button className={`config-chip ${filter === 'warnings' ? 'config-chip--active' : ''}`} onClick={() => setFilter(f => f === 'warnings' ? null : 'warnings')}>Mit Warnungen</button>
              {filter !== null && (
                <button className="m-filtersheet__clear" onClick={() => setFilter(null)}>
                  <X size={14} /> Filter aufheben
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="machine-grid">
        {sorted.length === 0 ? (
          <div className="machine-empty">
            {query
              ? `Keine Maschinen gefunden für "${search}"`
              : 'Keine Maschinen entsprechen dem aktiven Filter.'}
          </div>
        ) : (
          sorted.map((machine) => {
            const notifInfo = getMachineNotifInfo(machine.id);
            return (
              <MachineCard
                key={machine.id}
                machine={machine}
                notifCritical={notifInfo.critical}
                notifWarning={notifInfo.warning}
                assignedUser={notifInfo.assignedUser}
                onOpenConfig={() => setConfigMachineId(machine.id)}
                onOpen={() => onOpenMachine(machine.id)}
                onOpenPositionSelector={() => setPositionSelectorMachineId(machine.id)}
                onNotifClick={() => onMachineNotifClick(machine.id)}
              />
            );
          })
        )}
      </div>

      {configMachine && (
        <ScenarioConfig
          machine={configMachine}
          onSave={onUpdateMachine}
          onClose={() => setConfigMachineId(null)}
        />
      )}

      {positionSelectorMachine && (
        <PositionSelector
          currentPosition={positionSelectorMachine.position.position}
          onSelect={(pos) => {
            onUpdateMachine({
              ...positionSelectorMachine,
              position: {
                ...positionSelectorMachine.position,
                position: pos,
                manuallySet: true,
                timestamp: new Date(),
              },
            });
            setPositionSelectorMachineId(null);
          }}
          onClose={() => setPositionSelectorMachineId(null)}
        />
      )}
    </>
  );
}
