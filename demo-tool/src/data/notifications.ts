import type { Notification, NotificationSettings } from './types';

function minutesAgo(m: number): Date {
  return new Date(Date.now() - m * 60 * 1000);
}

export const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    machineId: 'lr1130-137187',
    level: 1,
    title: 'Hohe Windwarnung',
    body: 'Windvorhersage bis zu 12.0 m/s am Standort 88400 Biberach. Aktuelle Position: Parkposition. Schwellenwert: 20 m/s. Bitte Auslegerposition prüfen und ggf. Maßnahmen einleiten.',
    timestamp: minutesAgo(15),
    read: false,
    assignedTo: null,
    assignedAt: null,
    assignedComment: null,
  },
  {
    id: 'n2',
    machineId: 'lr1130-137187',
    level: 2,
    title: 'Windwarnung — Bestätigung erforderlich',
    body: 'Windvorhersage bis zu 12.0 m/s. Letzte bekannte Position: Parkposition (aktuell). Bitte bestätigen Sie, dass sich der Kran in einer sicheren Position befindet.',
    timestamp: minutesAgo(35),
    read: false,
    assignedTo: null,
    assignedAt: null,
    assignedComment: null,
  },
  {
    id: 'n3',
    machineId: 'lr1110-133188',
    level: 1,
    title: 'Kritische Windwarnung',
    body: 'Windgeschwindigkeit 16.8 m/s am Standort 80335 München. Schwellenwert 15 m/s überschritten. Letzte bekannte Position: Arbeitsposition ohne Nadelausleger (vor 48 Stunden). SOFORTIGE MASSNAHME ERFORDERLICH: Bitte prüfen und aktualisieren Sie die Kranposition dringend.',
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
    title: 'Positionsabweichung erkannt',
    body: 'Maschine LR 1250.1 UNPLUGGED - 135350 hat nach manueller Positionsauswahl die Position "Arbeitsposition mit Nadelausleger" gemeldet (manuell gesetzt: Arbeitsposition ohne Nadelausleger). Bitte Auslegerposition prüfen.',
    timestamp: minutesAgo(30),
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
};
