import { useState } from 'react';
import type { MachineConfig } from '../data/types';
import { MachineCard } from './MachineCard';
import { ScenarioConfig } from './ScenarioConfig';

interface MachineOverviewProps {
  machines: MachineConfig[];
  onUpdateMachine: (updated: MachineConfig) => void;
  onOpenMachine: (id: string) => void;
}

export function MachineOverview({ machines, onUpdateMachine, onOpenMachine }: MachineOverviewProps) {
  const [configMachineId, setConfigMachineId] = useState<string | null>(null);

  const configMachine = machines.find((m) => m.id === configMachineId);

  return (
    <>
      <h1 className="page-title">Maschinen</h1>
      <div className="machine-grid">
        {machines.map((machine) => (
          <MachineCard
            key={machine.id}
            machine={machine}
            onOpenConfig={() => setConfigMachineId(machine.id)}
            onOpen={() => onOpenMachine(machine.id)}
          />
        ))}
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
