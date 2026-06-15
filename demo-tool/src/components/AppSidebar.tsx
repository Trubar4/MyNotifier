import { Bell, FileText, Users, Settings } from 'lucide-react';
import type { ComponentType } from 'react';

type Page = 'notifications' | 'machines' | 'reports' | 'users' | 'settings';

interface AppSidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

function CraneLwnIcon({ size = 22 }: { size?: number }) {
  return (
    <img
      src={import.meta.env.BASE_URL + 'crane-lwn.svg'}
      alt=""
      width={size}
      height={size}
      style={{ display: 'block' }}
    />
  );
}

const NAV_ITEMS: { id: Page; icon?: ComponentType<{ size: number }>; customIcon?: boolean; label: string }[] = [
  { id: 'notifications', icon: Bell, label: 'Benachrichtigungen' },
  { id: 'machines', customIcon: true, label: 'Maschinen' },
  { id: 'reports', icon: FileText, label: 'Berichte' },
  { id: 'users', icon: Users, label: 'Benutzer' },
  { id: 'settings', icon: Settings, label: 'Einstellungen' },
];

export function AppSidebar({ activePage, onNavigate }: AppSidebarProps) {
  return (
    <nav className="app-sidebar">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={`sidebar-btn ${activePage === item.id ? 'sidebar-btn--active' : ''}`}
            onClick={() => onNavigate(item.id)}
            aria-label={item.label}
            title={item.label}
          >
            {item.customIcon ? (
              <CraneLwnIcon size={22} />
            ) : Icon ? (
              <Icon size={22} />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

export type { Page };
