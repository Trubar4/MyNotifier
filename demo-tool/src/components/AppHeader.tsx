import { Bell, Globe } from 'lucide-react';

interface AppHeaderProps {
  totalNotifications: number;
}

export function AppHeader({ totalNotifications }: AppHeaderProps) {
  return (
    <header className="header app-header">
      <span className="header__logo">LIEBHERR</span>
      <span className="header__product">MyNotifier</span>
      <div className="header__spacer" />
      <div className="header__actions">
        <button className="header__icon-btn" aria-label="Sprache">
          <Globe size={20} />
          <span style={{ fontSize: 12, marginLeft: 4 }}>DE</span>
        </button>
        <button className="header__icon-btn" aria-label="Benachrichtigungen">
          <Bell size={20} />
          {totalNotifications > 0 && (
            <span className="header__badge">{totalNotifications}</span>
          )}
        </button>
        <div className="header__avatar">PT</div>
      </div>
    </header>
  );
}
