import { Bell, Globe } from 'lucide-react';

interface AppHeaderProps {
  unreadCount: number;
  hasCritical: boolean;
  onBellClick: () => void;
}

export function AppHeader({ unreadCount, hasCritical, onBellClick }: AppHeaderProps) {
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
        <button className="header__icon-btn" aria-label="Benachrichtigungen" onClick={onBellClick}>
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className={`header__badge ${hasCritical ? '' : 'header__badge--warning'}`}>
              {unreadCount}
            </span>
          )}
        </button>
        <div className="header__avatar">MM</div>
      </div>
    </header>
  );
}
