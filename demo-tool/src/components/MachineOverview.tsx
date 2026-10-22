import { useState } from 'react';
import { Check } from 'lucide-react';

const BASE = import.meta.env.BASE_URL;
import type { MachineConfig, Notification } from '../data/types';
import { configHasNeedle, forecastPeakTime } from '../data/types';
import { useLang } from '../i18n';
import { MachineCard } from './MachineCard';
import { PositionSelector } from './PositionSelector';
import { CheckoutModal } from './CheckoutModal';

type SortMode = 'recent' | 'name';
type FilterMode = 'offlineNoManual' | 'offline' | 'warnings' | null;

interface MachineOverviewProps {
  machines: MachineConfig[];
  notifications: Notification[];
  onUpdateMachine: (updated: MachineConfig) => void;
  onOpenMachine: (id: string) => void;
  onMachineNotifClick: (machineId: string) => void;
}

export function MachineOverview({ machines, notifications, onUpdateMachine, onOpenMachine, onMachineNotifClick }: MachineOverviewProps) {
  const { t } = useLang();
  const [positionSelectorMachineId, setPositionSelectorMachineId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('recent');
  const [filter, setFilter] = useState<FilterMode>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

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
      <h1 className="page-title">{t('Maschinen', 'Machines')}</h1>

      <div className="m-toolbar">
        <div className="m-search">
          <img src={BASE + 'search.svg'} alt="" width={20} height={20} className="m-search__icon" />
          <input
            type="text"
            className="m-search__input"
            placeholder={t('Suchen...', 'Search...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="m-filterwrap">
          <button
            className={`m-toolbar__btn ${showFilters || filter !== null ? 'm-toolbar__btn--active' : ''}`}
            onClick={() => setShowFilters((s) => !s)}
            aria-label={t('Filter', 'Filter')}
            aria-expanded={showFilters}
          >
            <img src={BASE + 'icon-filter.svg'} alt="" width={20} height={19} className="m-icon" />
            {filter !== null && <span className="m-toolbar__dot" />}
          </button>

          {showFilters && (
            <>
              <div className="m-filterdrop__backdrop" onClick={() => setShowFilters(false)} />
              <div className="m-filterdrop" role="menu">
                {([
                  ['offlineNoManual', t('Ohne Positionsangabe', 'Without position')],
                  ['offline', t('Offline', 'Offline')],
                  ['warnings', t('Mit Warnungen', 'With warnings')],
                ] as [FilterMode, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    className={`m-filterdrop__item ${filter === key ? 'm-filterdrop__item--active' : ''}`}
                    onClick={() => setFilter((f) => (f === key ? null : key))}
                    role="menuitemcheckbox"
                    aria-checked={filter === key}
                  >
                    <span>{label}</span>
                    {filter === key && <Check size={16} />}
                  </button>
                ))}
                <div className="m-filterdrop__sort">
                  <button className={`m-filterdrop__item ${sort === 'recent' ? 'm-filterdrop__item--active' : ''}`} onClick={() => setSort('recent')}>
                    <span>{t('Sortierung: Neueste', 'Sort: Most recent')}</span>{sort === 'recent' && <Check size={16} />}
                  </button>
                  <button className={`m-filterdrop__item ${sort === 'name' ? 'm-filterdrop__item--active' : ''}`} onClick={() => setSort('name')}>
                    <span>{t('Sortierung: A–Z', 'Sort: A–Z')}</span>{sort === 'name' && <Check size={16} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button
          className="m-toolbar__btn m-toolbar__btn--primary"
          onClick={() => setShowCheckout(true)}
          aria-label={t('Check-Out durchführen', 'Perform check-out')}
          title={t('Check-Out durchführen', 'Perform check-out')}
        >
          <img src={BASE + 'checkout.svg'} alt="" width={20} height={20} />
        </button>
      </div>

      <div className="machine-grid">
        {sorted.length === 0 ? (
          <div className="machine-empty">
            {query
              ? t(`Keine Maschinen gefunden für "${search}"`, `No machines found for "${search}"`)
              : t('Keine Maschinen entsprechen dem aktiven Filter.', 'No machines match the active filter.')}
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
                onOpen={() => onOpenMachine(machine.id)}
                onOpenPositionSelector={() => setPositionSelectorMachineId(machine.id)}
                onNotifClick={() => onMachineNotifClick(machine.id)}
              />
            );
          })
        )}
      </div>

      {positionSelectorMachine && (
        <PositionSelector
          currentPosition={positionSelectorMachine.position.position}
          forecastMax={positionSelectorMachine.forecast.max72h}
          forecastPeakAt={forecastPeakTime(positionSelectorMachine)}
          hasNeedle={configHasNeedle(positionSelectorMachine.specs.boomConfiguration)}
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

      {showCheckout && (
        <CheckoutModal
          machines={machines}
          getNotifInfo={getMachineNotifInfo}
          onClose={() => setShowCheckout(false)}
          onOpen={(id) => { setShowCheckout(false); onOpenMachine(id); }}
          onOpenPositionSelector={(id) => setPositionSelectorMachineId(id)}
          onNotifClick={(id) => { setShowCheckout(false); onMachineNotifClick(id); }}
        />
      )}
    </>
  );
}
