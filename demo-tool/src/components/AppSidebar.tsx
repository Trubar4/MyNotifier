import { Bell, Construction, FileText, Users, Settings } from 'lucide-react';

type Page = 'notifications' | 'machines' | 'reports' | 'users' | 'settings';

interface AppSidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { id: Page; icon: typeof Bell; label: string }[] = [
  { id: 'notifications', icon: Bell, label: 'Benachrichtigungen' },
  { id: 'machines', icon: Construction, label: 'Maschinen' },
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
            <Icon size={22} />
          </button>
        );
      })}
    </nav>
  );
}

export type { Page };
