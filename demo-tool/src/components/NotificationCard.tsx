import { Check, MessageSquare } from 'lucide-react';
import type { Notification, MachineConfig, BoomPosition } from '../data/types';
import { BOOM_POSITION_LABELS, machineThreshold, positionThreshold, configHasNeedle, forecastPeakTime } from '../data/types';
import { useLang, boomLabel } from '../i18n';
import { recommendPosition } from './PositionSelector';
import { InfoPopover } from './InfoPopover';

const BASE = import.meta.env.BASE_URL;
const allPositions = Object.keys(BOOM_POSITION_LABELS) as BoomPosition[];

function formatFull(date: Date): string {
  const p = (n: number) => n.toString().padStart(2, '0');
  return `${p(date.getDate())}.${p(date.getMonth() + 1)}.${date.getFullYear()} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}

function hoursSince(date: Date): number {
  return Math.max(0, Math.round((Date.now() - date.getTime()) / 3_600_000));
}

/** A notification's lifecycle state, derived from its own flags. */
export type NotifMode = 'offen' | 'angenommen' | 'erledigt';
export function notifMode(n: Notification): NotifMode {
  if (n.read) return 'erledigt';
  return n.assignedTo ? 'angenommen' : 'offen';
}

interface NotificationCardProps {
  n: Notification;
  machine?: MachineConfig;
  expanded: boolean;
  onToggle: () => void;
  showMachineName?: boolean;
  onAssign?: (n: Notification) => void;
  onDone?: (n: Notification) => void;
  onAdjust?: (n: Notification) => void;
  onRelease?: (n: Notification) => void;
  onReopen?: (n: Notification) => void;
}

export function NotificationCard({
  n, machine, expanded, onToggle, showMachineName = true,
  onAssign, onDone, onAdjust, onRelease, onReopen,
}: NotificationCardProps) {
  const { lang, t: tr, speedNum, speedUnit, fmtThreshold } = useLang();
  const mode = notifMode(n);
  const levelClass = n.level === 1 ? 'kritisch' : 'warnung';
  const machineHasNeedle = machine ? configHasNeedle(machine.specs.boomConfiguration) : false;
  const threshold = machine ? machineThreshold(machine) : null;
  const isOnline = machine?.status === 'online';
  const recommended = machine ? recommendPosition(allPositions, machine.forecast.max72h, machineHasNeedle) : null;
  const lastPosHours = machine ? hoursSince(machine.position.timestamp) : 0;

  function headline(): string {
    switch (n.kind) {
      case 'exceedance': {
        const fc = n.forecastDisplay ?? machine?.forecast.max72h ?? 0;
        const over = threshold != null ? Math.max(0, fc - threshold) : fc;
        return isOnline
          ? tr(`Überschreitung: ${speedNum(over)} ${speedUnit}`, `Exceedance: ${speedNum(over)} ${speedUnit}`)
          : tr(`Prognostizierte Überschreitung: ${speedNum(over)} ${speedUnit}`, `Forecast exceedance: ${speedNum(over)} ${speedUnit}`);
      }
      case 'forecast':
        return tr('Prognose über Schwellwert', 'Forecast above threshold');
      case 'positionDeviation':
        return tr('Maschine inaktiv - Auslegerposition setzen', 'Machine inactive - set boom position');
      case 'windloggerOffline':
        return tr(`Windlogger offline seit ${formatFull(n.timestamp)}`, `Wind logger offline since ${formatFull(n.timestamp)}`);
      case 'noForecast':
        return tr(`Keine Windprognose seit ${formatFull(n.timestamp)}`, `No wind forecast since ${formatFull(n.timestamp)}`);
      case 'windloggerFault':
        return tr(`Windlogger Sensor defekt seit ${formatFull(n.timestamp)}`, `Wind logger sensor faulty since ${formatFull(n.timestamp)}`);
      case 'noData':
      default:
        return lang === 'en' ? (n.titleEn ?? n.title) : n.title;
    }
  }

  return (
    <div
      data-notif-id={n.id}
      className={`notif2 notif2--${levelClass} notif2--clickable`}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggle()}
    >
      <div className="notif2__pillrow">
        <div className="notif2__pillleft">
          <span className={`notif2__pill notif2__pill--${levelClass}`}>
            {n.level === 1 ? tr('Kritisch', 'Critical') : tr('Warnung', 'Warning')}
          </span>
          {showMachineName && machine && <span className="notif2__machine">{machine.name} - {machine.serialNumber}</span>}
        </div>
        {machine && (
          <div className="notif2__status">
            <span className={`m-card__dot ${isOnline ? 'm-card__dot--online' : 'm-card__dot--offline'}`} />
            <span>{isOnline ? tr('Aktiv', 'Active') : tr('Inaktiv', 'Inactive')}</span>
          </div>
        )}
      </div>

      <div className="notif2__time">
        <img src={BASE + 'icon-clock.svg'} alt="" width={14} height={14} className="m-icon" />
        <span>{formatFull(n.timestamp)}</span>
      </div>

      <div className="notif2__titlerow">
        <h3 className="notif2__title">{headline()}</h3>
        <span className="notif2__info" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <InfoPopover>{(lang === 'en' ? (n.bodyEn ?? n.body) : n.body).replace('{{ts}}', formatFull(n.timestamp))}</InfoPopover>
        </span>
      </div>

      {expanded && (
        <div className="notif2__detail" onClick={(e) => e.stopPropagation()}>
          {n.assignedTo && (
            <div className="notif2__field">
              <span className="notif2__field-label">{tr('Übernommen durch:', 'Taken over by:')}</span>
              <span className="notif2__field-value">{n.assignedTo}</span>
            </div>
          )}
          {n.assignedTo && n.assignedComment && (
            <div className="notif2__comment">
              <MessageSquare size={12} />
              <span>{n.assignedComment}</span>
            </div>
          )}

          {mode === 'offen' && machine && (
            <>
              <div className="notif2__kv">
                <span className="notif2__kv-label">{tr('Akt. max. zulässige Windgeschw.:', 'Current max. permissible wind speed:')}</span>
                <span className="notif2__kv-value">{threshold !== null ? fmtThreshold(threshold) : '—'}</span>
              </div>
              {(() => {
                const currentWind = n.kind === 'exceedance' && isOnline;
                const peakAt = n.forecastPeakAt ?? forecastPeakTime(machine);
                const value = `${speedNum(n.forecastDisplay ?? machine.forecast.max72h)} ${speedUnit}${!currentWind && peakAt ? ` - ${formatFull(peakAt)}` : ''}`;
                // Source 3 is down → label the figure as the LAST available forecast + when it was received.
                if (n.kind === 'noForecast') {
                  return (
                    <div className="notif2__kv">
                      <span className="notif2__kv-label">
                        {tr(
                          `Letzte prognostizierte max. Windgeschwindigkeit von ${formatFull(machine.forecast.timestamp)}:`,
                          `Last forecast max. wind speed from ${formatFull(machine.forecast.timestamp)}:`,
                        )}
                      </span>
                      <span className="notif2__kv-value">{value}</span>
                    </div>
                  );
                }
                return (
                  <div className="notif2__kv">
                    <span className="notif2__kv-label">
                      {currentWind
                        ? tr('Aktuelle Windgeschwindigkeit:', 'Current wind speed:')
                        : tr('Prognostizierte max. Windgeschwindigkeit:', 'Forecast max. wind speed:')}
                    </span>
                    <span className="notif2__kv-value">{value}</span>
                  </div>
                );
              })()}
              <div className="notif2__field">
                <span className="notif2__field-label">
                  {isOnline
                    ? tr('Aktuelle Auslegerposition:', 'Current boom position:')
                    : tr('Letzte übertragene Auslegerposition:', 'Last transmitted boom position:')}
                </span>
                <span className="notif2__field-value">{boomLabel(machine.position.position, lang)}</span>
              </div>
              {(lang === 'en' ? (n.actionTextEn ?? n.actionText) : n.actionText) && (() => {
                const at = lang === 'en' ? (n.actionTextEn ?? n.actionText ?? '') : (n.actionText ?? '');
                const measures = at.split('\n').map((l) => l.trim()).filter(Boolean);
                return (
                  <div className="notif2__action">
                    <h3 className="notif2__action-title">
                      {measures.length > 1 ? tr('MASSNAHMEN ERFORDERLICH:', 'ACTION REQUIRED:') : tr('MASSNAHME ERFORDERLICH:', 'ACTION REQUIRED:')}
                    </h3>
                    {measures.length > 1 ? (
                      <ul className="notif2__action-list">
                        {measures.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    ) : (
                      <span className="notif2__action-text">{measures[0]}</span>
                    )}
                  </div>
                );
              })()}
            </>
          )}

          {mode === 'angenommen' && machine && (
            <>
              <div className="notif2__field">
                <span className="notif2__field-label">{tr(`Letzte Position (seit ${lastPosHours} Std.):`, `Last position (for ${lastPosHours} h):`)}</span>
                <span className="notif2__field-value">{boomLabel(machine.position.position, lang)}</span>
              </div>
              {recommended && (
                <div className="notif2__field">
                  <span className="notif2__field-label">{tr('Empfohlene Position:', 'Recommended position:')}</span>
                  <span className="notif2__field-value">
                    {boomLabel(recommended, lang)}
                    {positionThreshold(recommended, machineHasNeedle) !== null ? ` (${fmtThreshold(positionThreshold(recommended, machineHasNeedle)!)})` : ''}
                  </span>
                </div>
              )}
            </>
          )}

          <div className="notif2__actions">
            {mode === 'offen' && (
              <>
                <button className="m-btn m-btn--primary" onClick={() => onAssign?.(n)}>{tr('Übernehmen', 'Accept')}</button>
                <button className="m-btn m-btn--outline" onClick={() => onDone?.(n)}>
                  <Check size={16} /> {tr('Erledigt', 'Done')}
                </button>
              </>
            )}
            {mode === 'angenommen' && (
              <>
                <button className="m-btn m-btn--primary" onClick={() => onAdjust?.(n)}>
                  <img src={BASE + 'boom-angle.svg'} alt="" width={18} height={18} />
                  {tr('Position anpassen', 'Adjust position')}
                </button>
                <button className="m-btn m-btn--outline" onClick={() => onRelease?.(n)}>{tr('Abgeben', 'Release')}</button>
              </>
            )}
            {mode === 'erledigt' && (
              <button className="m-btn m-btn--outline" onClick={() => onReopen?.(n)}>{tr('Wieder öffnen', 'Reopen')}</button>
            )}
          </div>
        </div>
      )}

      <button className="notif2__toggle" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
        <span>{expanded ? tr('Weniger anzeigen', 'Show less') : tr('Mehr anzeigen', 'Show more')}</span>
        <img src={BASE + 'icon-chevron.svg'} alt="" width={12} height={7} className="m-icon" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />
      </button>
    </div>
  );
}
