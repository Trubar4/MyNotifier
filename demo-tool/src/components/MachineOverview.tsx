import { useState } from 'react';
import type { MachineConfig, Notification } from '../data/types';
import { MachineCard } from './MachineCard';
import { ScenarioConfig } from './ScenarioConfig';

interface MachineOverviewProps {
  machines: MachineConfig[];
  notifications: Notification[];
  onUpdateMachine: (updated: MachineConfig) => void;
  onOpenMachine: (id: string, withPositionSelector?: boolean) => void;
  onMachineNotifClick: (machineId: string) => void;
}

export function MachineOverview({ machines, notifications, onUpdateMachine, onOpenMachine, onMachineNotifClick }: MachineOverviewProps) {
  const [configMachineId, setConfigMachineId] = useState<string | null>(null);

  const configMachine = machines.find((m) => m.id === configMachineId);

  function getMachineNotifInfo(machineId: string) {
    const machineNotifs = notifications.filter((n) => n.machineId === machineId && !n.read);
    const critical = machineNotifs.filter((n) => n.level === 1).length;
    const warning = machineNotifs.filter((n) => n.level === 2).length;
    const assignedUser = machineNotifs.find((n) => n.assignedTo)?.assignedTo ?? null;
    return { critical, warning, assignedUser };
  }

  return (
    <>
      <h1 className="page-title">Maschinen</h1>
      <div className="machine-grid">
        {machines.map((machine) => {
          const notifInfo = getMachineNotifInfo(machine.id);
          return (
            <MachineCard
              key={machine.id}
              machine={machine}
              notifCritical={notifInfo.critical}
              notifWarning={notifInfo.warning}
              assignedUser={notifInfo.assignedUser}
              onOpenConfig={() => setConfigMachineId(machine.id)}
              onOpen={() => onOpenMachine(machine.id)}
              onOpenPositionSelector={() => onOpenMachine(machine.id, true)}
              onNotifClick={() => onMachineNotifClick(machine.id)}
            />
          );
        })}
      </div>

      {configMachine && (
        <ScenarioConfig
          machine={configMachine}
          onSave={onUpdateMachine}
          onClose={() => setConfigMachineId(null)}
        />
      )}
    </>
  );
}
