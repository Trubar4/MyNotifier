import { useState, useRef, useEffect } from 'react';
import { Info, AlertTriangle } from 'lucide-react';

interface InfoPopoverProps {
  children: React.ReactNode;
  variant?: 'info' | 'warning';
}

export function InfoPopover({ children, variant = 'info' }: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const Icon = variant === 'warning' ? AlertTriangle : Info;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        className={`info-btn ${variant === 'warning' ? 'info-btn--warning' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label="Information"
      >
        <Icon size={10} />
      </button>
      {open && <div className="info-popover">{children}</div>}
    </div>
  );
}
