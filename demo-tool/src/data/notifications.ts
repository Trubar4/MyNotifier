import type { Notification, NotificationSettings } from './types';

function minutesAgo(m: number): Date {
  return new Date(Date.now() - m * 60 * 1000);
}

function hoursFromNow(h: number): Date {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

// In the (i) texts, {{ts}} is replaced with the notification's own timestamp.
export const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    machineId: 'lr1130-137187',
    level: 1,
    kind: 'exceedance',
    forecastDisplay: 22.0,
    title: 'Hohe Windwarnung',
    body: 'Die am {{ts}} Uhr gemessene Windgeschwindigkeit überschreitet am Standort 88400 Biberach die für die Parkposition max. zulässige Windgeschwindigkeit von 20 m/s um 2,0 m/s.',
    actionText: 'Ausleger in sichere Position bringen. Empfehlung: Klappmesserposition (Vmax. = 24 m/s).',
    timestamp: minutesAgo(35),
    read: false,
    assignedTo: null,
    assignedAt: null,
    assignedComment: null,
  },
  {
    id: 'n2',
    machineId: 'lr1130-137187',
    level: 2,
    kind: 'forecast',
    title: 'Windwarnung — Bestätigung erforderlich',
    body: 'Die für {{ts}} Uhr prognostizierte Windgeschwindigkeit am Standort 88400 Biberach wird für die Parkposition (max. zulässige Windgeschwindigkeit: 20 m/s) nicht überschritten. Durch den gesetzten Schwellenwert von 50% erfolgt dennoch eine Warnung.',
    actionText: 'Windentwicklung beobachten oder Ausleger vorsorglich in Parkposition bringen (Vmax. = 24 m/s).',
    timestamp: minutesAgo(55),
    read: false,
    assignedTo: null,
    assignedAt: null,
    assignedComment: null,
  },
  {
    id: 'n3',
    machineId: 'lr1110-133188',
    level: 2,
    kind: 'exceedance',
    title: 'Kritische Windwarnung',
    body: 'Die für {{ts}} Uhr prognostizierte Windgeschwindigkeit überschreitet am Standort 80335 München die für die Arbeitsposition max. zulässige Windgeschwindigkeit von 15 m/s um 3,5 m/s.',
    actionText: 'Windentwicklung beobachten oder Ausleger vorsorglich in Parkposition bringen (Vmax. = 20 m/s).\nBitte die Ausleger-Position aktualisieren, falls sie von der angezeigten abweicht. Diese Maschine ist offline.',
    timestamp: minutesAgo(10),
    read: false,
    assignedTo: null,
    assignedAt: null,
    assignedComment: null,
  },
  {
    id: 'n4',
    machineId: 'lr1110-133188',
    level: 2,
    kind: 'noData',
    title: 'Keine Daten des Windloggers',
    body: 'Der Windlogger der Maschine LR 1110 - 133188 hat seit 48 Stunden keine Daten mehr gesendet. Bitte prüfen Sie die Verbindung.',
    timestamp: minutesAgo(60),
    read: true,
    assignedTo: null,
    assignedAt: null,
    assignedComment: null,
  },
  {
    id: 'n5',
    machineId: 'lr1250-135350',
    level: 2,
    kind: 'positionDeviation',
    forecastDisplay: 22.0,
    forecastPeakAt: hoursFromNow(31),
    title: 'Positionsabweichung erkannt',
    body: 'Die Maschine ist offline. Die zuletzt gemeldete Auslegerposition ist "Arbeitsposition".',
    actionText: 'Bitte die Ausleger-Position aktualisieren, falls sie von der angezeigten abweicht. Diese Maschine ist offline.',
    timestamp: minutesAgo(20),
    read: false,
    assignedTo: null,
    assignedAt: null,
    assignedComment: null,
  },
];

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  email: 'max.mustermann@liebherr.com',
  phone: '+49 170 1234567',
  globalEnabled: true,
  machineOverrides: {},
  prefs: {
    prognoseWindowH: 48,
    notifyDays: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
    vorwarnPercent: 50,
    repeatMin: 15,
    sms: false,
    email: true,
  },
  machinePrefs: {},
};
