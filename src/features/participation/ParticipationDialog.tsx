import { useEffect, useRef, type ReactNode } from 'react';

export function ParticipationDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    if (dialog?.showModal) dialog.showModal();
    else dialog?.setAttribute('open', '');
    return () => {
      dialog?.close?.();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="participation-dialog"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <header className="participation-dialog-header">
        <h2>{title}</h2>
        <button
          type="button"
          className="participation-dialog-close"
          aria-label="Kapat"
          onClick={onClose}
        >
          ×
        </button>
      </header>
      <div className="participation-dialog-content">{children}</div>
    </dialog>
  );
}
