import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './icons';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Sticky footer (keeps confirm buttons visible). */
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

/** Accessible dialog built on the native <dialog>: focus trap, Escape to close, focus restored. */
export function Modal({ open, title, onClose, children, footer, size = 'md' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      lastFocus.current = document.activeElement as HTMLElement | null;
      try {
        d.showModal();
      } catch {
        d.setAttribute('open', '');
      }
    } else if (!open && d.open) {
      d.close();
      lastFocus.current?.focus?.();
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    return () => {
      if (d?.open) d.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={`modal modal--${size}`}
      aria-labelledby="modal-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="modal__box">
          <header className="modal__head">
            <h2 id="modal-title">{title}</h2>
            <button type="button" className="hs-iconbtn" onClick={onClose} aria-label="סגירה">
              <Icon name="close" />
            </button>
          </header>
          <div className="modal__body">{children}</div>
          {footer && <footer className="modal__foot">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
