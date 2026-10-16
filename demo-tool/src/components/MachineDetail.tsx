import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  CloudSun,
  AlertTriangle,
  CheckCircle,
  MapPin,
  ExternalLink,
  Settings,
  Wifi,
} from 'lucide-react';
import type { MachineConfig, BoomPosition, Notification, NotificationSettings, NotifyPrefs } from '../data/types';
import { BOOM_POSITION_LABELS, BOOM_THRESHOLDS } from '../data/types';
import { InfoPopover } from './InfoPopover';
import { PositionSelector } from './PositionSelector';
import { NotifyPrefsControls } from './SettingsControls';

const BASE = import.meta.env.BASE_URL;

type DetailTab = 'wind' | 'details' | 'standort' | 'settings';

interface MachineDetailProps {
  machine: MachineConfig;
  notifications: Notification[];
  notifSettings: NotificationSettings;
  onBack: () => void;
  onUpdateMachine: (updated: MachineConfig) => void;
  onUpdateNotification: (updated: Notification) => void;
  onUpdateNotifSettings: (updated: NotificationSettings) => void;
  initialPositionSelectorOpen?: boolean;
  onPositionSelectorOpened?: () => void;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMin < 1) return 'jetzt';
  if (diffMin < 60) return `vor ${diffMin} Min.`;
  return date.toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function formatFull(date: Date): string {
  return date.toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isLive(date: Date): boolean {
  return Date.now() - date.getTime() < 60000;
}

function getWindLevel(speed: number, threshold: number | null): 'safe' | 'warning' | 'danger' {
  if (threshold === null) return 'safe';
  if (speed >= threshold) return 'danger';
  if (speed >= threshold * 0.8) return 'warning';
  return 'safe';
}

const TABS: { id: DetailTab; label: string }[] = [
  { id: 'wind', label: 'Wind' },
  { id: 'details', label: 'Details' },
  { id: 'standort', label: 'Standort' },
  { id: 'settings', label: 'Settings' },
];

export function MachineDetail({
  machine, notifSettings, onBack, onUpdateMachine, onUpdateNotifSettings,
  initialPositionSelectorOpen, onPositionSelectorOpened,
}: MachineDetailProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('wind');
  const [showPositionSelector, setShowPositionSelector] = useState(false);
  const [showLargeMap, setShowLargeMap] = useState(false);
  const [forecastExpanded, setForecastExpanded] = useState(false);
  const histogramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPositionSelectorOpen) {
      setActiveTab('details');
      setShowPositionSelector(true);
      onPositionSelectorOpened?.();
    }
  }, [initialPositionSelectorOpen, onPositionSelectorOpened]);

  const hasLicense = machine.license === 'active';
  const isOnline = machine.status === 'online';
  const threshold = BOOM_THRESHOLDS[machine.position.position];
  const needleLevel = getWindLevel(machine.wind.needleBoom, threshold);
  const mainLevel = getWindLevel(machine.wind.mainBoom, threshold);

  const hasPositionMismatch =
    !machine.position.autoUpdate &&
    machine.position.reportedPosition !== null &&
    machine.position.reportedPosition !== machine.position.position;

  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${machine.location.lng - 0.01},${machine.location.lat - 0.006},${machine.location.lng + 0.01},${machine.location.lat + 0.006}&layer=mapnik&marker=${machine.location.lat},${machine.location.lng}`;
  const mapLargeUrl = `https://www.openstreetmap.org/?mlat=${machine.location.lat}&mlon=${machine.location.lng}#map=15/${machine.location.lat}/${machine.location.lng}`;

  const machineEnabled = machine.id in notifSettings.machineOverrides
    ? notifSettings.machineOverrides[machine.id]
    : notifSettings.globalEnabled;

  function handleSetPosition(pos: BoomPosition) {
    onUpdateMachine({
      ...machine,
      position: { ...machine.position, position: pos, timestamp: new Date(), manuallySet: true },
    });
    setShowPositionSelector(false);
  }

  function handleToggleAutoUpdate() {
    onUpdateMachine({ ...machine, position: { ...machine.position, autoUpdate: !machine.position.autoUpdate } });
  }

  function handleFixedUntilChange(value: string) {
    onUpdateMachine({ ...machine, position: { ...machine.position, fixedUntil: value ? new Date(value) : null } });
  }

  function setMachineEnabled(enabled: boolean) {
    onUpdateNotifSettings({
      ...notifSettings,
      machineOverrides: { ...notifSettings.machineOverrides, [machine.id]: enabled },
    });
  }

  const overridePrefs: NotifyPrefs | null = notifSettings.machinePrefs[machine.id] ?? null;
  const overrideOn = overridePrefs !== null;

  function setOverrideOn(on: boolean) {
    const next = { ...notifSettings.machinePrefs };
    if (on) next[machine.id] = { ...notifSettings.prefs };
    else delete next[machine.id];
    onUpdateNotifSettings({ ...notifSettings, machinePrefs: next });
  }

  function updateOverridePrefs(prefs: NotifyPrefs) {
    onUpdateNotifSettings({
      ...notifSettings,
      machinePrefs: { ...notifSettings.machinePrefs, [machine.id]: prefs },
    });
  }

  return (
    <div className="mdetail">
      <button className="detail__back" onClick={onBack}>
        <ArrowLeft size={16} />
        Zurück zur Übersicht
      </button>

      {/* Figma header: status · name · sub */}
      <div className="mdetail__head">
        <div className="mdetail__status">
          <span className={`m-card__dot ${isOnline ? 'm-card__dot--online' : 'm-card__dot--offline'}`} />
          <span>
            {isOnline ? 'Online' : `Zuletzt aktualisiert: ${formatFull(machine.wind.timestamp)} Uhr`}
          </span>
        </div>
        <h1 className="mdetail__name">{machine.name} - {machine.serialNumber}</h1>
        <div className="mdetail__sub">SN: {machine.serialNumber} • {machine.location.address}</div>
      </div>

      {!hasLicense ? (
        <div className="detail__no-license">
          <AlertTriangle size={24} />
          <div>
            <strong>Keine aktive Lizenz</strong>
            <p>Für diese Maschine ist keine MyNotifier WIND Lizenz aktiv. Kontaktieren Sie Ihren Liebherr Ansprechpartner.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Tab bar */}
          <div className="mdetail__tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={activeTab === t.id}
                className={`mdetail__tab ${activeTab === t.id ? 'mdetail__tab--active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mdetail__panel">
            {/* ========================= WIND ========================= */}
            {activeTab === 'wind' && (
              <>
                {/* Aktuelle Windgeschwindigkeit */}
                <section className="mdetail__section">
                  <div className="detail__section-header">
                    <h2 className="detail__section-title">Aktuelle Windgeschwindigkeit</h2>
                    <InfoPopover>
                      Die Windgeschwindigkeit wird am Nadelausleger und Hauptausleger gemessen. Die Schwellenwerte hängen von der aktuellen Auslegerposition ab.
                    </InfoPopover>
                  </div>
                  {!isLive(machine.wind.timestamp) ? (
                    <span className="detail__freshness detail__freshness--stale">
                      Wert von {formatTimestamp(machine.wind.timestamp)}
                    </span>
                  ) : (
                    <span className="detail__freshness detail__freshness--live">Live</span>
                  )}

                  <div className="wind-detail-grid">
                    <div className="wind-detail-card">
                      <div className="wind-detail-card__header">
                        <img src={BASE + 'sensor-jib.svg'} alt="" width={24} height={24} className="wind-detail-card__icon" />
                        <span className="wind-detail-card__label">Nadelausleger</span>
                      </div>
                      <span className={`wind-detail-card__value wind-detail-card__value--${needleLevel}`}>
                        {machine.wind.needleBoom.toFixed(1)}
                        <span className="wind-detail-card__unit">m/s</span>
                      </span>
                      {threshold !== null && (
                        <div className="wind-threshold">
                          <div className="wind-threshold__bar">
                            <div className={`wind-threshold__fill wind-threshold__fill--${needleLevel}`} style={{ width: `${Math.min((machine.wind.needleBoom / threshold) * 100, 100)}%` }} />
                            <div className="wind-threshold__marker" style={{ left: '80%' }} />
                            <div className="wind-threshold__marker wind-threshold__marker--limit" style={{ left: '100%' }} />
                          </div>
                          <div className="wind-threshold__labels">
                            <span>0</span>
                            <span className="wind-threshold__warn-label">{(threshold * 0.8).toFixed(0)}</span>
                            <span className="wind-threshold__limit-label">{threshold} m/s</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="wind-detail-card">
                      <div className="wind-detail-card__header">
                        <img src={BASE + 'sensor-boom.svg'} alt="" width={24} height={24} className="wind-detail-card__icon" />
                        <span className="wind-detail-card__label">Hauptausleger</span>
                      </div>
                      <span className={`wind-detail-card__value wind-detail-card__value--${mainLevel}`}>
                        {machine.wind.mainBoom.toFixed(1)}
                        <span className="wind-detail-card__unit">m/s</span>
                      </span>
                      {threshold !== null && (
                        <div className="wind-threshold">
                          <div className="wind-threshold__bar">
                            <div className={`wind-threshold__fill wind-threshold__fill--${mainLevel}`} style={{ width: `${Math.min((machine.wind.mainBoom / threshold) * 100, 100)}%` }} />
                            <div className="wind-threshold__marker" style={{ left: '80%' }} />
                            <div className="wind-threshold__marker wind-threshold__marker--limit" style={{ left: '100%' }} />
                          </div>
                          <div className="wind-threshold__labels">
                            <span>0</span>
                            <span className="wind-threshold__warn-label">{(threshold * 0.8).toFixed(0)}</span>
                            <span className="wind-threshold__limit-label">{threshold} m/s</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {threshold !== null && (
                    <div className="wind-threshold-info">
                      <div className={`wind-threshold-status wind-threshold-status--${needleLevel === 'danger' || mainLevel === 'danger' ? 'danger' : needleLevel === 'warning' || mainLevel === 'warning' ? 'warning' : 'safe'}`}>
                        {needleLevel === 'danger' || mainLevel === 'danger' ? (
                          <><AlertTriangle size={16} /><span>Windgeschwindigkeit überschreitet den Schwellenwert für die aktuelle Auslegerposition ({BOOM_POSITION_LABELS[machine.position.position]}: {threshold} m/s)</span></>
                        ) : needleLevel === 'warning' || mainLevel === 'warning' ? (
                          <><AlertTriangle size={16} /><span>Windgeschwindigkeit nähert sich dem Schwellenwert ({BOOM_POSITION_LABELS[machine.position.position]}: {threshold} m/s)</span></>
                        ) : (
                          <><CheckCircle size={16} /><span>Windgeschwindigkeit im sicheren Bereich ({BOOM_POSITION_LABELS[machine.position.position]}: Schwellenwert {threshold} m/s)</span></>
                        )}
                      </div>
                    </div>
                  )}
                </section>

                {/* Vorhersage 72h */}
                <section className="mdetail__section">
                  <div className="detail__section-header">
                    <CloudSun size={18} />
                    <h2 className="detail__section-title">Vorhersage 72h</h2>
                    <InfoPopover>
                      Die Vorhersagen stammen von Meteomatics aufgrund der Höhe der Auslegerposition des Maschinenstandorts.
                    </InfoPopover>
                  </div>
                  <span className="detail__freshness detail__freshness--stale">
                    Vorhersage von {formatTimestamp(machine.forecast.timestamp)}
                  </span>

                  <div className="forecast-detail">
                    <div className="forecast-detail__max">
                      <span className="forecast-detail__max-label">Maximale Windgeschwindigkeit (72h)</span>
                      <span className={`forecast-detail__max-value forecast-detail__max-value--${getWindLevel(machine.forecast.max72h, threshold)}`}>
                        {machine.forecast.max72h.toFixed(1)}
                        <span className="forecast-detail__max-unit">m/s</span>
                      </span>
                    </div>

                    {threshold !== null && (
                      <div className="forecast-threshold-bar">
                        <div className="forecast-threshold-bar__track">
                          <div className={`forecast-threshold-bar__fill forecast-threshold-bar__fill--${getWindLevel(machine.forecast.max72h, threshold)}`} style={{ width: `${Math.min((machine.forecast.max72h / threshold) * 100, 100)}%` }} />
                          <div className="forecast-threshold-bar__limit" style={{ left: '100%' }} />
                        </div>
                        <div className="forecast-threshold-bar__label">Schwellenwert: {threshold} m/s</div>
                      </div>
                    )}

                    {(() => {
                      const exceedanceHour = threshold !== null
                        ? machine.forecast.hourly.find(h => h.speed >= threshold) ?? null
                        : null;
                      return exceedanceHour ? (
                        <div className="forecast-warning">
                          <AlertTriangle size={14} />
                          <span>
                            Erwartete Überschreitung am <strong>{formatFull(exceedanceHour.timestamp)}</strong>
                            {' '}— Überprüfen Sie die Auslegerposition und planen Sie gegebenenfalls Maßnahmen.
                          </span>
                        </div>
                      ) : machine.forecast.max72h > (threshold ?? Infinity) ? (
                        <div className="forecast-warning">
                          <AlertTriangle size={14} />
                          <span>Die vorhergesagte Windgeschwindigkeit überschreitet den aktuellen Schwellenwert.</span>
                        </div>
                      ) : null;
                    })()}

                    <button
                      className="forecast-histogram-toggle"
                      onClick={() => {
                        setForecastExpanded(v => !v);
                        if (!forecastExpanded) setTimeout(() => histogramRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
                      }}
                      aria-expanded={forecastExpanded}
                    >
                      <CloudSun size={14} />
                      {forecastExpanded ? 'Stundenprognose ausblenden' : 'Stundenprognose anzeigen'}
                      <span className={`forecast-histogram-toggle__chevron${forecastExpanded ? ' forecast-histogram-toggle__chevron--open' : ''}`}>▾</span>
                    </button>

                    {forecastExpanded && (
                      <div className="forecast-histogram" ref={histogramRef}>
                        {(() => {
                          const maxSpeed = Math.max(...machine.forecast.hourly.map(h => h.speed), threshold ?? 0, 1);
                          const displayHours = machine.forecast.hourly;
                          const thresholdPct = threshold !== null ? (threshold / maxSpeed) * 100 : null;
                          const warningPct = threshold !== null ? ((threshold * 0.8) / maxSpeed) * 100 : null;
                          const labelHours = displayHours.filter((_, i) => i % 6 === 0);
                          return (
                            <>
                              <div className="forecast-histogram__chart">
                                <div className="forecast-histogram__bars">
                                  {displayHours.map((h, i) => {
                                    const level = getWindLevel(h.speed, threshold);
                                    const heightPct = (h.speed / maxSpeed) * 100;
                                    return (
                                      <div
                                        key={i}
                                        className={`forecast-histogram__bar forecast-histogram__bar--${level}`}
                                        style={{ height: `${heightPct}%` }}
                                        title={`${h.timestamp.toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}: ${h.speed.toFixed(1)} m/s`}
                                      />
                                    );
                                  })}
                                </div>
                                {thresholdPct !== null && (
                                  <div className="forecast-histogram__threshold-line" style={{ bottom: `${thresholdPct}%` }}>
                                    <span className="forecast-histogram__threshold-label">{threshold} m/s</span>
                                  </div>
                                )}
                                {warningPct !== null && (
                                  <div className="forecast-histogram__warning-line" style={{ bottom: `${warningPct}%` }} />
                                )}
                              </div>
                              <div className="forecast-histogram__time-labels">
                                {labelHours.map((h, i) => (
                                  <span key={i} className="forecast-histogram__label">
                                    {h.timestamp.toLocaleString('de-DE', { weekday: 'short', hour: '2-digit' })}
                                  </span>
                                ))}
                              </div>
                              <div className="forecast-histogram__legend">
                                <span className="forecast-histogram__legend-item forecast-histogram__legend-item--safe">Sicher</span>
                                <span className="forecast-histogram__legend-item forecast-histogram__legend-item--warning">80% Schwelle</span>
                                <span className="forecast-histogram__legend-item forecast-histogram__legend-item--danger">Überschritten</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}

            {/* ======================== DETAILS ======================== */}
            {activeTab === 'details' && (
              <>
                {/* Auslegerposition */}
                <section className="mdetail__section">
                  <div className="detail__section-header">
                    <img src={BASE + 'boom-angle.svg'} alt="" width={20} height={20} className="detail__section-header-icon" />
                    <h2 className="detail__section-title">Auslegerposition</h2>
                  </div>
                  <div className="position-detail">
                    <span className="position-detail__value">{BOOM_POSITION_LABELS[machine.position.position]}</span>
                    {machine.position.manuallySet && (
                      <span className="position-detail__manual">Manuell gesetzt am {formatTimestamp(machine.position.timestamp)}</span>
                    )}
                    {!isOnline && !machine.position.manuallySet && (
                      <span className="position-detail__stale">Wert von {formatTimestamp(machine.position.timestamp)}</span>
                    )}
                    {threshold !== null && (
                      <div className="position-detail__threshold">
                        <span className="position-detail__threshold-label">Windschwellenwert:</span>
                        <span className="position-detail__threshold-value">{threshold} m/s</span>
                      </div>
                    )}

                    <div className="position-fixation">
                      <div className="position-fixation__row">
                        <label className="position-fixation__label" htmlFor="fixedUntil">Manuelle Position fixieren bis</label>
                        <InfoPopover>In diesem Zeitraum wird die Position nicht mehr überschrieben, auch wenn die Maschine kurz online ist.</InfoPopover>
                      </div>
                      <input
                        id="fixedUntil"
                        type="datetime-local"
                        className="position-fixation__input"
                        value={machine.position.fixedUntil ? formatDateTimeLocal(machine.position.fixedUntil) : ''}
                        onChange={(e) => handleFixedUntilChange(e.target.value)}
                      />
                    </div>

                    <div className="position-toggle">
                      <div className="position-toggle__row">
                        <span className="position-toggle__label">Position aktualisieren, falls Maschine online ist</span>
                        <button
                          className={`toggle-switch ${machine.position.autoUpdate ? 'toggle-switch--on' : ''}`}
                          onClick={handleToggleAutoUpdate}
                          role="switch"
                          aria-checked={machine.position.autoUpdate}
                        >
                          <span className="toggle-switch__thumb" />
                        </button>
                      </div>
                      {hasPositionMismatch && (
                        <div className="position-mismatch-warning">
                          <AlertTriangle size={16} />
                          <span>
                            Maschine war nach manueller Auswahl online am{' '}
                            {machine.position.reportedAt ? formatTimestamp(machine.position.reportedAt) : '—'}{' '}
                            und hat Position <strong>{BOOM_POSITION_LABELS[machine.position.reportedPosition!]}</strong> gemeldet.
                          </span>
                        </div>
                      )}
                    </div>

                    <button className="m-btn m-btn--primary" onClick={() => setShowPositionSelector(true)}>
                      Position manuell setzen
                    </button>
                  </div>
                </section>

                {/* Maschinendaten */}
                <section className="mdetail__section">
                  <div className="detail__section-header">
                    <h2 className="detail__section-title">Maschinendaten</h2>
                  </div>
                  <dl className="specs-grid">
                    <div className="specs-grid__row">
                      <dt className="specs-grid__label">Außentemperatur</dt>
                      <dd className="specs-grid__value">{machine.specs.outsideTemperature !== null ? `${machine.specs.outsideTemperature.toFixed(1)} °C` : '—'}</dd>
                    </div>
                    <div className="specs-grid__row">
                      <dt className="specs-grid__label">Auslegerkonfiguration</dt>
                      <dd className="specs-grid__value">{machine.specs.boomConfiguration}</dd>
                    </div>
                    <div className="specs-grid__row">
                      <dt className="specs-grid__label">Hauptausleger</dt>
                      <dd className="specs-grid__value">{machine.specs.mainBoomLength !== null ? `${machine.specs.mainBoomLength} m` : '—'}</dd>
                    </div>
                    <div className="specs-grid__row">
                      <dt className="specs-grid__label">Nadelausleger</dt>
                      <dd className="specs-grid__value">{machine.specs.jibLength !== null ? `${machine.specs.jibLength} m` : '—'}</dd>
                    </div>
                    <div className="specs-grid__row">
                      <dt className="specs-grid__label">Auslegerkopfhöhe</dt>
                      <dd className="specs-grid__value">{machine.specs.boomHeadHeight !== null ? `${machine.specs.boomHeadHeight} m` : '—'}</dd>
                    </div>
                    <div className="specs-grid__row">
                      <dt className="specs-grid__label">Windlogger-IMEI</dt>
                      <dd className="specs-grid__value specs-grid__value--mono">{machine.specs.windloggerImei}</dd>
                    </div>
                  </dl>
                </section>
              </>
            )}

            {/* ======================= STANDORT ======================= */}
            {activeTab === 'standort' && (
              <section className="mdetail__section">
                <div className="detail__section-header">
                  <MapPin size={18} />
                  <h2 className="detail__section-title">Standort</h2>
                </div>
                <div className="location-detail">
                  <span className="location-detail__address">{machine.location.address}</span>
                  <div
                    className="location-detail__map-container"
                    onClick={() => setShowLargeMap(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setShowLargeMap(true)}
                  >
                    <iframe className="location-detail__map" src={mapEmbedUrl} title="Standort auf Karte" loading="lazy" />
                    <div className="location-detail__map-overlay">
                      <ExternalLink size={16} />
                      <span>Karte vergrößern</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ======================= SETTINGS ======================= */}
            {activeTab === 'settings' && (
              <>
                <section className="mdetail__section">
                  <div className="settings-row">
                    <div className="settings-row__info">
                      <span className="settings-row__label">Benachrichtigungen für diese Maschine empfangen</span>
                      <span className="settings-row__hint">
                        {machine.id in notifSettings.machineOverrides ? 'Individuell gesetzt' : 'Global-Einstellung'}
                      </span>
                    </div>
                    <button
                      className={`toggle-switch ${machineEnabled ? 'toggle-switch--on' : ''}`}
                      onClick={() => setMachineEnabled(!machineEnabled)}
                      role="switch"
                      aria-checked={machineEnabled}
                    >
                      <span className="toggle-switch__thumb" />
                    </button>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row__info">
                      <span className="settings-row__label">Globale Einstellung überschreiben</span>
                      <span className="settings-row__hint">
                        {overrideOn ? 'Eigene Werte für diese Maschine' : 'Nutzt die globalen Einstellungen'}
                      </span>
                    </div>
                    <button
                      className={`toggle-switch ${overrideOn ? 'toggle-switch--on' : ''}`}
                      onClick={() => setOverrideOn(!overrideOn)}
                      role="switch"
                      aria-checked={overrideOn}
                    >
                      <span className="toggle-switch__thumb" />
                    </button>
                  </div>
                </section>

                {overrideOn && overridePrefs && (
                  <NotifyPrefsControls
                    prefs={overridePrefs}
                    onChange={updateOverridePrefs}
                    thresholdMs={threshold}
                  />
                )}

                {/* Maschinen Konfiguration (read-only) */}
                <section className="mdetail__section">
                  <div className="detail__section-header">
                    <Wifi size={18} />
                    <h2 className="detail__section-title">Maschinen Konfiguration</h2>
                  </div>
                  <span className="detail__freshness detail__freshness--stale">
                    Zuletzt aktualisiert: {formatTimestamp(machine.position.timestamp)}
                  </span>
                  <dl className="specs-grid">
                    <div className="specs-grid__row">
                      <dt className="specs-grid__label">Konfigurationstyp des Hauptauslegers</dt>
                      <dd className="specs-grid__value">{machine.specs.boomConfiguration}</dd>
                    </div>
                    <div className="specs-grid__row">
                      <dt className="specs-grid__label">Auslegerposition</dt>
                      <dd className="specs-grid__value">{BOOM_POSITION_LABELS[machine.position.position]}</dd>
                    </div>
                    {threshold !== null && (
                      <div className="specs-grid__row">
                        <dt className="specs-grid__label">Maximal zulässige Windgeschwindigkeit</dt>
                        <dd className="specs-grid__value">{threshold} m/s</dd>
                      </div>
                    )}
                  </dl>
                </section>

                <button
                  className="m-btn m-btn--danger m-btn--block"
                  onClick={() => setMachineEnabled(false)}
                  disabled={!machineEnabled}
                >
                  <Settings size={18} />
                  Benachrichtigung deaktivieren
                </button>
              </>
            )}
          </div>
        </>
      )}

      {showPositionSelector && (
        <PositionSelector
          currentPosition={machine.position.position}
          onSelect={handleSetPosition}
          onClose={() => setShowPositionSelector(false)}
        />
      )}

      {showLargeMap && (
        <div className="config-overlay" onClick={(e) => e.target === e.currentTarget && setShowLargeMap(false)}>
          <div className="map-modal">
            <div className="map-modal__header">
              <h2 className="config-modal__title">{machine.location.address}</h2>
              <button className="config-modal__close" onClick={() => setShowLargeMap(false)}>&times;</button>
            </div>
            <iframe className="map-modal__iframe" src={mapEmbedUrl} title="Standort auf Karte" loading="lazy" />
            <div className="map-modal__footer">
              <a href={mapLargeUrl} target="_blank" rel="noopener noreferrer" className="m-btn m-btn--primary">
                <ExternalLink size={14} />
                In OpenStreetMap öffnen
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
