import type { NotifyPrefs, WeekDay } from '../data/types';
import { WEEKDAYS, PROGNOSE_STEPS, VORWARN_STEPS, REPEAT_STEPS } from '../data/types';
import { InfoPopover } from './InfoPopover';

const DAY_LABELS: Record<WeekDay, string> = {
  MO: 'MO', TU: 'TU', WE: 'WE', TH: 'TH', FR: 'FR', SA: 'SA', SU: 'SU',
};

function nearestStep(v: number, steps: number[]): number {
  return steps.reduce((best, s) => (Math.abs(s - v) < Math.abs(best - v) ? s : best), steps[0]);
}

/**
 * Value-based slider snapping to a list of allowed step values.
 * `domain` sets the visual track range (default: first/last step).
 * `minSelectable` forbids values below it (the left zone is greyed).
 */
export function StepSlider({ steps, value, onChange, domain, minSelectable }: {
  steps: number[];
  value: number;
  onChange: (v: number) => void;
  domain?: [number, number];
  minSelectable?: number;
}) {
  const [dMin, dMax] = domain ?? [steps[0], steps[steps.length - 1]];
  const pct = dMax > dMin ? ((value - dMin) / (dMax - dMin)) * 100 : 0;
  const lockPct = minSelectable != null && dMax > dMin ? ((minSelectable - dMin) / (dMax - dMin)) * 100 : null;

  return (
    <div className="m-slider">
      {lockPct != null && <div className="m-slider__lock" style={{ width: `${lockPct}%` }} aria-hidden />}
      <input
        type="range"
        min={dMin}
        max={dMax}
        step={1}
        value={value}
        onChange={(e) => {
          let v = parseInt(e.target.value, 10);
          if (minSelectable != null) v = Math.max(minSelectable, v);
          onChange(nearestStep(v, steps));
        }}
        style={{ ['--pct' as string]: `${pct}%` }}
      />
    </div>
  );
}

export function DayPills({ value, onChange }: {
  value: WeekDay[];
  onChange: (days: WeekDay[]) => void;
}) {
  function toggle(d: WeekDay) {
    onChange(value.includes(d) ? value.filter((x) => x !== d) : [...WEEKDAYS].filter((x) => value.includes(x) || x === d));
  }
  return (
    <div className="m-daypills">
      {WEEKDAYS.map((d) => (
        <button
          key={d}
          className={`m-daypill ${value.includes(d) ? 'm-daypill--on' : ''}`}
          onClick={() => toggle(d)}
          aria-pressed={value.includes(d)}
        >
          {DAY_LABELS[d]}
        </button>
      ))}
    </div>
  );
}

/**
 * Shared warn/notification preference controls.
 * `thresholdMs` (optional) shows the resulting absolute warning value for a machine.
 * `showChannels` adds the repeat slider + SMS/E-Mail toggles (global screen).
 */
export function NotifyPrefsControls({ prefs, onChange, thresholdMs, showChannels }: {
  prefs: NotifyPrefs;
  onChange: (next: NotifyPrefs) => void;
  thresholdMs?: number | null;
  showChannels?: boolean;
}) {
  const set = (patch: Partial<NotifyPrefs>) => onChange({ ...prefs, ...patch });
  const warnAt = thresholdMs != null ? (thresholdMs * prefs.vorwarnPercent) / 100 : null;

  return (
    <>
      <section className="m-settings-group">
        <h2 className="m-settings-group__title">Warnungszeitraum</h2>

        <div className="m-settings-field">
          <span className="m-settings-field__label">Prognosefenster</span>
          <StepSlider steps={PROGNOSE_STEPS} value={prefs.prognoseWindowH} onChange={(v) => set({ prognoseWindowH: v })} />
          <span className="m-settings-field__value">{prefs.prognoseWindowH} h</span>
          <span className="m-settings-field__hint">Prognosefenster, in welchem Zeitraum Warnungen und Benachrichtigungen verschickt werden</span>
        </div>

        <div className="m-settings-field">
          <span className="m-settings-field__label">Benachrichtigungstage</span>
          <DayPills value={prefs.notifyDays} onChange={(d) => set({ notifyDays: d })} />
          <span className="m-settings-field__hint">Zeitraum, in dem Benachrichtigungen versendet werden</span>
        </div>
      </section>

      <section className="m-settings-group">
        <h2 className="m-settings-group__title">Schwellenwerte</h2>

        <div className="m-settings-field">
          <div className="m-settings-field__labelrow">
            <span className="m-settings-field__label">Vorwarnschwelle</span>
            <InfoPopover>
              In Regionen, in denen die Prognose weniger zuverlässig ist, kann bereits bei vorhergesagten Werten
              unterhalb der Grenze alarmiert werden. Die Vorwarnschwelle legt fest, ab welchem Anteil der zulässigen
              Windgeschwindigkeit gewarnt wird.
            </InfoPopover>
          </div>
          <StepSlider steps={VORWARN_STEPS} value={prefs.vorwarnPercent} onChange={(v) => set({ vorwarnPercent: v })} domain={[0, 100]} minSelectable={50} />
          <span className="m-settings-field__value">
            Warnung bei {prefs.vorwarnPercent} %{warnAt != null ? ` · ab ${warnAt.toFixed(1)} m/s` : ''}
          </span>
          <span className="m-settings-field__hint">Höchstwerte für Ausleger — Unterschreitung der Vorgaben</span>
        </div>
      </section>

      {showChannels && (
        <>
          <section className="m-settings-group">
            <h2 className="m-settings-group__title">Benachrichtigungswiederholung</h2>
            <div className="m-settings-field">
              <StepSlider steps={REPEAT_STEPS} value={prefs.repeatMin} onChange={(v) => set({ repeatMin: v })} />
              <span className="m-settings-field__value">nach {prefs.repeatMin} min</span>
              <span className="m-settings-field__hint">Benachrichtigungen werden erneut gesendet</span>
            </div>
          </section>

          <section className="m-settings-group">
            <h2 className="m-settings-group__title">Benachrichtigungstyp</h2>
            <div className="settings-row">
              <span className="settings-row__label">SMS Benachrichtigungen</span>
              <button
                className={`toggle-switch ${prefs.sms ? 'toggle-switch--on' : ''}`}
                onClick={() => set({ sms: !prefs.sms })}
                role="switch"
                aria-checked={prefs.sms}
              >
                <span className="toggle-switch__thumb" />
              </button>
            </div>
            <div className="settings-row">
              <span className="settings-row__label">E-Mail Benachrichtigungen</span>
              <button
                className={`toggle-switch ${prefs.email ? 'toggle-switch--on' : ''}`}
                onClick={() => set({ email: !prefs.email })}
                role="switch"
                aria-checked={prefs.email}
              >
                <span className="toggle-switch__thumb" />
              </button>
            </div>
          </section>
        </>
      )}
    </>
  );
}
