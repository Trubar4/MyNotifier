import type { MachineConfig } from './types';

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function minutesAgo(m: number): Date {
  return new Date(Date.now() - m * 60 * 1000);
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
    notificationCount: 2,
  },
  {
    id: 'lr1250-135350',
    name: 'LR 1250.1 UNPLUGGED',
    serialNumber: '135350',
    type: 'LR 1250.1',
    status: 'online',
    license: 'active',
    position: {
      position: 'extended',
      timestamp: new Date(),
      manuallySet: false,
    },
    wind: {
      needleBoom: 6.1,
      mainBoom: 5.0,
      timestamp: new Date(),
    },
    forecast: {
      max72h: 12.5,
      timestamp: hoursAgo(2),
    },
    notificationCount: 0,
  },
  {
    id: 'lr1110-133188',
    name: 'LR 1110',
    serialNumber: '133188',
    type: 'LR 1110',
    status: 'offline',
    license: 'active',
    position: {
      position: 'parkposition',
      timestamp: hoursAgo(48),
      manuallySet: false,
    },
    wind: {
      needleBoom: 3.8,
      mainBoom: 3.1,
      timestamp: hoursAgo(48),
    },
    forecast: {
      max72h: 15.2,
      timestamp: hoursAgo(2),
    },
    notificationCount: 1,
  },
  {
    id: 'lr1300-142501',
    name: 'LR 1300 SX',
    serialNumber: '142501',
    type: 'LR 1300',
    status: 'offline',
    license: 'none',
    position: {
      position: 'unknown',
      timestamp: minutesAgo(30),
      manuallySet: false,
    },
    wind: {
      needleBoom: 0,
      mainBoom: 0,
      timestamp: minutesAgo(30),
    },
    forecast: {
      max72h: 0,
      timestamp: minutesAgo(30),
    },
    notificationCount: 0,
  },
];
