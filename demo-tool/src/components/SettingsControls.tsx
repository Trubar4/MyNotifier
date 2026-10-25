import type { NotifyPrefs, WeekDay } from '../data/types';
import { WEEKDAYS, PROGNOSE_STEPS, REPEAT_STEPS } from '../data/types';
import { useLang } from '../i18n';
import { InfoPopover } from './InfoPopover';

const DAY_LABELS_DE: Record<WeekDay, string> = {
  MO: 'MO', TU: 'DI', WE: 'MI', TH: 'DO', FR: 'FR', SA: 'SA', SU: 'SO',
};
const DAY_LABELS_EN: Record<WeekDay, string> = {
  MO: 'MO', TU: 'TU', WE: 'WE', TH: 'TH', FR: 'FR', SA: 'SA', SU: 'SU',
};

/**
 * Stepped slider matching the Liebherr PatternLib `patternlib-slider`
 * (showStepDots): evenly-spaced step dots + a round handle. Snaps to the
 * list of allowed `steps`; the dots sit at even index positions so the
 * track reads cleanly regardless of the underlying (possibly non-uniform)
 * values. The native range input is overlaid invisibly for a11y/keyboard.
 */
export function StepSlider({ steps, value, onChange }: {
  steps: number[];
  value: number;
  onChange: (v: number) => void;
}) {
  const n = steps.length;
  const idxRaw = steps.indexOf(value);
  const idx = idxRaw < 0 ? 0 : idxRaw;
  const posOf = (i: number) => (n > 1 ? (i / (n - 1)) * 100 : 0);
  const pct = posOf(idx);

  return (
    <div className="m-slider">
      <div className="m-slider__track" aria-hidden>
        <div className="m-slider__fill" style={{ width: `${pct}%` }} />
        {steps.map((s, i) => (
          <span
            key={s}
            className={`m-slider__dot ${i <= idx ? 'm-slider__dot--on' : ''}`}
            style={{ left: `${posOf(i)}%` }}
          />
        ))}
        <span className="m-slider__handle" style={{ left: `${pct}%` }} />
      </div>
      <input
        type="range"
        min={0}
        max={n - 1}
        step={1}
        value={idx}
        onChange={(e) => onChange(steps[parseInt(e.target.value, 10)])}
      />
    </div>
  );
}

/**
 * Continuous Liebherr slider (track + fill + handle, no step dots) for
 * values that adjust in fine increments, e.g. the Vorwarnschwelle in 1 %.
 */
export function RangeSlider({ min, max, step = 1, value, onChange }: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <div className="m-slider">
      <div className="m-slider__track" aria-hidden>
        <div className="m-slider__fill" style={{ width: `${pct}%` }} />
        <span className="m-slider__handle" style={{ left: `${pct}%` }} />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
      />
    </div>
  );
}

export function DayPills({ value, onChange }: {
  value: WeekDay[];
  onChange: (days: WeekDay[]) => void;
}) {
  const { lang } = useLang();
  const dayLabels = lang === 'en' ? DAY_LABELS_EN : DAY_LABELS_DE;
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
          {dayLabels[d]}
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
  const { t, fmtSpeed } = useLang();
  const set = (patch: Partial<NotifyPrefs>) => onChange({ ...prefs, ...patch });
  const warnAt = thresholdMs != null ? (thresholdMs * prefs.vorwarnPercent) / 100 : null;

  return (
    <>
      <section className="m-settings-group">
        <h2 className="m-settings-group__title">{t('Warnungszeitraum', 'Warning period')}</h2>

        <div className="m-settings-field">
          <div className="m-settings-field__labelrow">
            <span className="m-settings-field__label">{t('Prognosefenster', 'Forecast window')}</span>
            <span className="m-settings-field__range">
              {t('min.', 'min.')} {PROGNOSE_STEPS[0]} h · {t('max.', 'max.')} {PROGNOSE_STEPS[PROGNOSE_STEPS.length - 1]} h
            </span>
          </div>
          <StepSlider steps={PROGNOSE_STEPS} value={prefs.prognoseWindowH} onChange={(v) => set({ prognoseWindowH: v })} />
          <span className="m-settings-field__value">{prefs.prognoseWindowH} h</span>
          <span className="m-settings-field__hint">{t('Prognosefenster, in welchem Zeitraum Warnungen und Benachrichtigungen verschickt werden', 'Forecast window within which warnings and notifications are sent')}</span>
        </div>

        <div className="m-settings-field">
          <span className="m-settings-field__label">{t('Benachrichtigungstage', 'Notification days')}</span>
          <DayPills value={prefs.notifyDays} onChange={(d) => set({ notifyDays: d })} />
          <span className="m-settings-field__hint">{t('Zeitraum, in dem Benachrichtigungen versendet werden', 'Period during which notifications are sent')}</span>
        </div>
      </section>

      <section className="m-settings-group">
        <h2 className="m-settings-group__title">{t('Schwellenwerte', 'Thresholds')}</h2>

        <div className="m-settings-field">
          <div className="m-settings-field__labelrow">
            <span className="m-settings-field__label">{t('Vorwarnschwelle', 'Early-warning threshold')}</span>
            <InfoPopover>
              {t(
                'In Regionen, in denen die Prognose weniger zuverlässig ist, kann bereits bei vorhergesagten Werten unterhalb der Grenze alarmiert werden. Die Vorwarnschwelle legt fest, ab welchem Anteil der zulässigen Windgeschwindigkeit gewarnt wird.',
                'In regions where the forecast is less reliable, an alert can be issued already at predicted values below the limit. The early-warning threshold defines at which share of the permissible wind speed a warning is triggered.'
              )}
            </InfoPopover>
          </div>
          <RangeSlider min={50} max={100} step={1} value={prefs.vorwarnPercent} onChange={(v) => set({ vorwarnPercent: v })} />
          <span className="m-settings-field__value">
            {t('Warnung bei', 'Warning at')} {prefs.vorwarnPercent} %{warnAt != null ? ` · ${t('ab', 'from')} ${fmtSpeed(warnAt)}` : ''}
          </span>
          <span className="m-settings-field__hint">{t('Höchstwerte für Ausleger — Unterschreitung der Vorgaben', 'Maximum values for the boom — falling below the specifications')}</span>
        </div>
      </section>

      {showChannels && (
        <>
          <section className="m-settings-group">
            <h2 className="m-settings-group__title">{t('Benachrichtigungswiederholung', 'Notification repeat')}</h2>
            <div className="m-settings-field">
              <StepSlider steps={REPEAT_STEPS} value={prefs.repeatMin} onChange={(v) => set({ repeatMin: v })} />
              <span className="m-settings-field__value">{t('nach', 'after')} {prefs.repeatMin} min</span>
              <span className="m-settings-field__hint">{t('Benachrichtigungen werden erneut gesendet', 'Notifications are sent again')}</span>
            </div>
          </section>

          <section className="m-settings-group">
            <h2 className="m-settings-group__title">{t('Benachrichtigungstyp', 'Notification type')}</h2>
            <div className="settings-row">
              <span className="settings-row__label">{t('SMS Benachrichtigungen', 'SMS notifications')}</span>
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
              <span className="settings-row__label">{t('E-Mail Benachrichtigungen', 'E-mail notifications')}</span>
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
