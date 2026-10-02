import React from 'react';
import { X } from 'lucide-react';
import '../desks/heldFile.css';
import './ywcHeld.css';

/** Red X parks a Y.W.C. panel so the charts can use the space. */
export function YwcClosable({
  id,
  held,
  onClose,
  children,
  className = '',
}: {
  id: string;
  held: boolean;
  onClose: (id: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  if (held) return null;
  return (
    <div className={`relative ${className}`} data-ywc-panel={id}>
      <div className="ywc-close-dock">
        <button
          type="button"
          className="rt-bento-x"
          data-ywc-close={id}
          aria-label={`Close ${id.replace(/-/g, ' ')}`}
          title="Close this panel. Bring it back from the held file."
          onClick={() => onClose(id)}
        >
          <X size={11} strokeWidth={2.75} aria-hidden="true" />
        </button>
      </div>
      {children}
    </div>
  );
}
