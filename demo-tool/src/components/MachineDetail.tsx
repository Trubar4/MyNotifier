import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Wifi,
  WifiOff,
  CloudSun,
  AlertTriangle,
  CheckCircle,
  MapPin,
  ExternalLink,
  Bell,
} from 'lucide-react';
import type { MachineConfig, BoomPosition, Notification, NotificationSettings } from '../data/types';
import { BOOM_POSITION_LABELS, BOOM_THRESHOLDS } from '../data/types';
import { InfoPopover } from './InfoPopover';
import { PositionSelector } from './PositionSelector';

const BASE = import.meta.env.BASE_URL;

interface MachineDetailProps {
  machine: MachineConfig;
  notifications: Notification[];
  notifSettings: NotificationSettings;
  onBack: () => void;
  onUpdateMachine: (updated: MachineConfig) => void;
  onUpdateNotifSettings: (updated: NotificationSettings) => void;
  initialPositionSelectorOpen?: boolean;
  onPositionSelectorOpened?: () => void;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'jetzt';
  if (diffMin < 60) return `vor ${diffMin} Min.`;

  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
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

export function MachineDetail({ machine, notifications, notifSettings, onBack, onUpdateMachine, onUpdateNotifSettings, initialPositionSelectorOpen, onPositionSelectorOpened }: MachineDetailProps) {
  const [showPositionSelector, setShowPositionSelector] = useState(false);
  const [showLargeMap, setShowLargeMap] = useState(false);

  useEffect(() => {
    if (initialPositionSelectorOpen) {
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

  function handleSetPosition(pos: BoomPosition) {
    onUpdateMachine({
      ...machine,
      position: {
        ...machine.position,
        position: pos,
        timestamp: new Date(),
        manuallySet: true,
      },
    });
    setShowPositionSelector(false);
  }

  function handleToggleAutoUpdate() {
    onUpdateMachine({
      ...machine,
      position: {
        ...machine.position,
        autoUpdate: !machine.position.autoUpdate,
      },
    });
  }

  function handleFixedUntilChange(value: string) {
    onUpdateMachine({
      ...machine,
      position: {
        ...machine.position,
        fixedUntil: value ? new Date(value) : null,
      },
    });
  }

  return (
    <div className="detail">
      {/* Breadcrumb / Back */}
      <button className="detail__back" onClick={onBack}>
        <ArrowLeft size={16} />
        Zurück zur Übersicht
      </button>

      {/* Machine Header */}
      <div className="detail__header">
        <div className="detail__header-icon">
          <img src={BASE + 'crane-lwn.svg'} alt="" width={32} height={32} />
        </div>
        <div className="detail__header-info">
          <h1 className="detail__title">
            {machine.name} - {machine.serialNumber}
          </h1>
          <span className="detail__title-accent" />
          <div className="detail__meta">
            <span className={`detail__status-badge ${isOnline ? 'detail__status-badge--online' : 'detail__status-badge--offline'}`}>
              <span className={`status-dot ${isOnline ? 'status-dot--online' : 'status-dot--offline'}`} />
              {isOnline ? 'Online' : 'Offline'}
            </span>
            {hasLicense ? (
              <span className="detail__license-badge detail__license-badge--active">Lizenz aktiv</span>
            ) : (
              <span className="license-badge license-badge--none">Keine Lizenz</span>
            )}
            {(machine.notifications.critical + machine.notifications.warning) > 0 && (
              <span className="detail__notification-count">
                {machine.notifications.critical + machine.notifications.warning} {(machine.notifications.critical + machine.notifications.warning) === 1 ? 'Benachrichtigung' : 'Benachrichtigungen'}
              </span>
            )}
          </div>
        </div>
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
        <div className="detail__grid">
          {/* Machine Status Section — top left */}
          <div className="detail__section detail__section--status">
            <div className="detail__section-header">
              {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
              <h2 className="detail__section-title">Maschinenstatus</h2>
              <InfoPopover>
                <div>
                  <strong>Online</strong> = Master ein + Datenverbindung<br />
                  <strong>Offline</strong> = Master aus UND/ODER keine Datenverbindung
                </div>
              </InfoPopover>
            </div>

            <div className="status-detail">
              <div className="status-detail__indicator">
                <span className={`status-dot ${isOnline ? 'status-dot--online' : 'status-dot--offline'}`} style={{ width: 12, height: 12 }} />
                <span className="status-detail__text">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              {!isOnline && (
                <span className="status-detail__since">
                  Seit {formatTimestamp(machine.wind.timestamp)}
                </span>
              )}
            </div>
          </div>

          {/* Location Section — top right */}
          <div className="detail__section detail__section--location">
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
                <iframe
                  className="location-detail__map"
                  src={mapEmbedUrl}
                  title="Standort auf Karte"
                  loading="lazy"
                />
                <div className="location-detail__map-overlay">
                  <ExternalLink size={16} />
                  <span>Karte vergrößern</span>
                </div>
              </div>
            </div>
          </div>

          {/* Wind Section */}
          <div className="detail__section detail__section--wind">
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
              {/* Nadelausleger */}
              <div className="wind-detail-card">
                <div className="wind-detail-card__header">
                  <img src={BASE + 'sensor-jib.svg'} alt="Nadelausleger" width={24} height={24} className="wind-detail-card__icon" />
                  <span className="wind-detail-card__label">Nadelausleger</span>
                </div>
                <span className={`wind-detail-card__value wind-detail-card__value--${needleLevel}`}>
                  {machine.wind.needleBoom.toFixed(1)}
                  <span className="wind-detail-card__unit">m/s</span>
                </span>
                {threshold !== null && (
                  <div className="wind-threshold">
                    <div className="wind-threshold__bar">
                      <div
                        className={`wind-threshold__fill wind-threshold__fill--${needleLevel}`}
                        style={{ width: `${Math.min((machine.wind.needleBoom / threshold) * 100, 100)}%` }}
                      />
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

              {/* Hauptausleger */}
              <div className="wind-detail-card">
                <div className="wind-detail-card__header">
                  <img src={BASE + 'sensor-boom.svg'} alt="Hauptausleger" width={24} height={24} className="wind-detail-card__icon" />
                  <span className="wind-detail-card__label">Hauptausleger</span>
                </div>
                <span className={`wind-detail-card__value wind-detail-card__value--${mainLevel}`}>
                  {machine.wind.mainBoom.toFixed(1)}
                  <span className="wind-detail-card__unit">m/s</span>
                </span>
                {threshold !== null && (
                  <div className="wind-threshold">
                    <div className="wind-threshold__bar">
                      <div
                        className={`wind-threshold__fill wind-threshold__fill--${mainLevel}`}
                        style={{ width: `${Math.min((machine.wind.mainBoom / threshold) * 100, 100)}%` }}
                      />
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
                    <>
                      <AlertTriangle size={16} />
                      <span>Windgeschwindigkeit überschreitet den Schwellenwert für die aktuelle Auslegerposition ({BOOM_POSITION_LABELS[machine.position.position]}: {threshold} m/s)</span>
                    </>
                  ) : needleLevel === 'warning' || mainLevel === 'warning' ? (
                    <>
                      <AlertTriangle size={16} />
                      <span>Windgeschwindigkeit nähert sich dem Schwellenwert ({BOOM_POSITION_LABELS[machine.position.position]}: {threshold} m/s)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>Windgeschwindigkeit im sicheren Bereich ({BOOM_POSITION_LABELS[machine.position.position]}: Schwellenwert {threshold} m/s)</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Position Section */}
          <div className="detail__section detail__section--position">
            <div className="detail__section-header">
              <img src={BASE + 'boom-angle.svg'} alt="" width={20} height={20} className="detail__section-header-icon" />
              <h2 className="detail__section-title">Auslegerposition</h2>
            </div>

            <div className="position-detail">
              <span className="position-detail__value">
                {BOOM_POSITION_LABELS[machine.position.position]}
              </span>
              {machine.position.manuallySet && (
                <span className="position-detail__manual">
                  Manuell gesetzt am {formatTimestamp(machine.position.timestamp)}
                </span>
              )}
              {!isOnline && !machine.position.manuallySet && (
                <span className="position-detail__stale">
                  Wert von {formatTimestamp(machine.position.timestamp)}
                </span>
              )}

              {threshold !== null && (
                <div className="position-detail__threshold">
                  <span className="position-detail__threshold-label">Windschwellenwert:</span>
                  <span className="position-detail__threshold-value">{threshold} m/s</span>
                </div>
              )}

              {/* Position fixation */}
              <div className="position-fixation">
                <div className="position-fixation__row">
                  <label className="position-fixation__label" htmlFor="fixedUntil">
                    Manuelle Position fixieren bis
                  </label>
                  <InfoPopover>
                    In diesem Zeitraum wird die Position nicht mehr überschrieben, auch wenn die Maschine kurz online ist.
                  </InfoPopover>
                </div>
                <input
                  id="fixedUntil"
                  type="datetime-local"
                  className="position-fixation__input"
                  value={machine.position.fixedUntil ? formatDateTimeLocal(machine.position.fixedUntil) : ''}
                  onChange={(e) => handleFixedUntilChange(e.target.value)}
                />
              </div>

              {/* Auto-update toggle */}
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

              <button
                className="lds-btn lds-btn--primary lds-btn--sm"
                onClick={() => setShowPositionSelector(true)}
              >
                Position manuell setzen
              </button>
            </div>
          </div>

          {/* Forecast Section */}
          <div className="detail__section detail__section--forecast">
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
                    <div
                      className={`forecast-threshold-bar__fill forecast-threshold-bar__fill--${getWindLevel(machine.forecast.max72h, threshold)}`}
                      style={{ width: `${Math.min((machine.forecast.max72h / threshold) * 100, 100)}%` }}
                    />
                    <div className="forecast-threshold-bar__limit" style={{ left: '100%' }} />
                  </div>
                  <div className="forecast-threshold-bar__label">
                    Schwellenwert: {threshold} m/s
                  </div>
                </div>
              )}

              {machine.forecast.max72h > (threshold ?? Infinity) && (
                <div className="forecast-warning">
                  <AlertTriangle size={14} />
                  <span>
                    Die vorhergesagte Windgeschwindigkeit überschreitet den aktuellen Schwellenwert.
                    Überprüfen Sie die Auslegerposition und planen Sie gegebenenfalls Maßnahmen.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notification Settings for this machine */}
          <div className="detail__section">
            <div className="detail__section-header">
              <Bell size={18} />
              <h2 className="detail__section-title">Benachrichtigungen</h2>
            </div>
            <div className="settings-row">
              <div className="settings-row__info">
                <span className="settings-row__label">Benachrichtigungen für diese Maschine</span>
                <span className="settings-row__hint">
                  {machine.id in notifSettings.machineOverrides ? 'Individuell gesetzt' : 'Global-Einstellung'}
                </span>
              </div>
              <button
                className={`toggle-switch ${(machine.id in notifSettings.machineOverrides ? notifSettings.machineOverrides[machine.id] : notifSettings.globalEnabled) ? 'toggle-switch--on' : ''}`}
                onClick={() => {
                  const current = machine.id in notifSettings.machineOverrides
                    ? notifSettings.machineOverrides[machine.id]
                    : notifSettings.globalEnabled;
                  onUpdateNotifSettings({
                    ...notifSettings,
                    machineOverrides: { ...notifSettings.machineOverrides, [machine.id]: !current },
                  });
                }}
                role="switch"
                aria-checked={machine.id in notifSettings.machineOverrides ? notifSettings.machineOverrides[machine.id] : notifSettings.globalEnabled}
              >
                <span className="toggle-switch__thumb" />
              </button>
            </div>
            {notifications.length > 0 && (
              <div className="detail-notif-summary">
                <span>{notifications.filter(n => !n.read).length} offene Benachrichtigungen für diese Maschine</span>
              </div>
            )}
          </div>
        </div>
      )}

      {showPositionSelector && (
        <PositionSelector
          currentPosition={machine.position.position}
          onSelect={handleSetPosition}
          onClose={() => setShowPositionSelector(false)}
        />
      )}

      {/* Large map overlay */}
      {showLargeMap && (
        <div className="config-overlay" onClick={(e) => e.target === e.currentTarget && setShowLargeMap(false)}>
          <div className="map-modal">
            <div className="map-modal__header">
              <h2 className="config-modal__title">{machine.location.address}</h2>
              <button className="config-modal__close" onClick={() => setShowLargeMap(false)}>
                &times;
              </button>
            </div>
            <iframe
              className="map-modal__iframe"
              src={mapEmbedUrl}
              title="Standort auf Karte"
              loading="lazy"
            />
            <div className="map-modal__footer">
              <a href={mapLargeUrl} target="_blank" rel="noopener noreferrer" className="lds-btn lds-btn--primary lds-btn--sm">
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
