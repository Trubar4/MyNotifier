import { useState } from 'react';
import { Search } from 'lucide-react';
import type { MachineConfig, Notification } from '../data/types';
import { MachineCard } from './MachineCard';
import { ScenarioConfig } from './ScenarioConfig';

type SortMode = 'recent' | 'name';

interface MachineOverviewProps {
  machines: MachineConfig[];
  notifications: Notification[];
  onUpdateMachine: (updated: MachineConfig) => void;
  onOpenMachine: (id: string, withPositionSelector?: boolean) => void;
  onMachineNotifClick: (machineId: string) => void;
}

export function MachineOverview({ machines, notifications, onUpdateMachine, onOpenMachine, onMachineNotifClick }: MachineOverviewProps) {
  const [configMachineId, setConfigMachineId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('recent');

  const configMachine = machines.find((m) => m.id === configMachineId);

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

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'name') {
      return a.name.localeCompare(b.name, 'de');
    }
    return b.wind.timestamp.getTime() - a.wind.timestamp.getTime();
  });

  return (
    <>
      <h1 className="page-title">Maschinen</h1>

      <div className="machine-toolbar">
        <div className="machine-search">
          <Search size={16} className="machine-search__icon" />
          <input
            type="text"
            className="machine-search__input"
            placeholder="Name, Seriennummer oder Standort suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="machine-sort">
          <span className="machine-sort__label">Sortierung:</span>
          <button
            className={`config-chip ${sort === 'recent' ? 'config-chip--active' : ''}`}
            onClick={() => setSort('recent')}
          >
            Neueste Meldung
          </button>
          <button
            className={`config-chip ${sort === 'name' ? 'config-chip--active' : ''}`}
            onClick={() => setSort('name')}
          >
            Alphabetisch
          </button>
        </div>
      </div>

      <div className="machine-grid">
        {sorted.length === 0 ? (
          <div className="machine-empty">
            Keine Maschinen gefunden für &ldquo;{search}&rdquo;
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
                onOpenPositionSelector={() => onOpenMachine(machine.id, true)}
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
    </>
  );
}
