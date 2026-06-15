import type { MachineConfig } from './types';

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function hoursFromNow(h: number): Date {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

export const DEFAULT_MACHINES: MachineConfig[] = [
  {
    id: 'lr1130-137187',
    name: 'LR 1130.1 UNPLUGGED',
    serialNumber: '137187',
    type: 'LR 1130.1',
    status: 'online',
    license: 'active',
    position: {
      position: 'parkposition',
      timestamp: new Date(),
      manuallySet: false,
      fixedUntil: null,
      autoUpdate: true,
      reportedPosition: null,
      reportedAt: null,
    },
    wind: {
      needleBoom: 5.5,
      mainBoom: 4.2,
      timestamp: new Date(),
    },
    forecast: {
      max72h: 8.0,
      timestamp: hoursAgo(2),
    },
    location: {
      lat: 47.6292,
      lng: 9.8965,
      address: 'Hans-Liebherr-Straße 45, 88400 Biberach an der Riß',
      shortAddress: '88400 Biberach',
    },
    notifications: { critical: 1, warning: 1 },
  },
  {
    id: 'lr1250-135350',
    name: 'LR 1250.1 UNPLUGGED',
    serialNumber: '135350',
    type: 'LR 1250.1',
    status: 'offline',
    license: 'active',
    position: {
      position: 'withoutNeedle',
      timestamp: hoursAgo(1),
      manuallySet: true,
      fixedUntil: hoursFromNow(12),
      autoUpdate: false,
      reportedPosition: 'withNeedle',
      reportedAt: hoursAgo(0.5),
    },
    wind: {
      needleBoom: 6.1,
      mainBoom: 5.0,
      timestamp: hoursAgo(1),
    },
    forecast: {
      max72h: 12.5,
      timestamp: hoursAgo(2),
    },
    location: {
      lat: 48.7758,
      lng: 9.1829,
      address: 'Hauptstätter Straße 12, 70173 Stuttgart',
      shortAddress: '70173 Stuttgart',
    },
    notifications: { critical: 0, warning: 0 },
  },
  {
    id: 'lr1110-133188',
    name: 'LR 1110',
    serialNumber: '133188',
    type: 'LR 1110',
    status: 'offline',
    license: 'active',
    position: {
      position: 'withoutNeedle',
      timestamp: hoursAgo(48),
      manuallySet: false,
      fixedUntil: null,
      autoUpdate: true,
      reportedPosition: null,
      reportedAt: null,
    },
    wind: {
      needleBoom: 56.3,
      mainBoom: 52.1,
      timestamp: hoursAgo(48),
    },
    forecast: {
      max72h: 62.0,
      timestamp: hoursAgo(2),
    },
    location: {
      lat: 48.1351,
      lng: 11.5820,
      address: 'Arnulfstraße 60, 80335 München',
      shortAddress: '80335 München',
    },
    notifications: { critical: 1, warning: 0 },
  },
  {
    id: 'lr1300-142501',
    name: 'LR 1300 SX',
    serialNumber: '142501',
    type: 'LR 1300',
    status: 'offline',
    license: 'none',
    position: {
      position: 'boomDown',
      timestamp: hoursAgo(0.5),
      manuallySet: false,
      fixedUntil: null,
      autoUpdate: true,
      reportedPosition: null,
      reportedAt: null,
    },
    wind: {
      needleBoom: 0,
      mainBoom: 0,
      timestamp: hoursAgo(0.5),
    },
    forecast: {
      max72h: 0,
      timestamp: hoursAgo(0.5),
    },
    location: {
      lat: 47.3769,
      lng: 8.5417,
      address: 'Europaallee 21, 8004 Zürich, Schweiz',
      shortAddress: '8004 Zürich',
    },
    notifications: { critical: 0, warning: 0 },
  },
];
