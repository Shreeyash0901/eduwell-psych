import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen?: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  maxWidth?: string;
  children: React.ReactNode;
  ariaLabelledBy?: string;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen = true,
  onClose,
  title,
  description,
  icon,
  maxWidth = 'max-w-2xl',
  children,
  ariaLabelledBy = 'modal-title',
  className = '',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      closeButtonRef.current?.focus();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className={`bg-white rounded-2xl w-full ${maxWidth} p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6 my-8 animate-in fade-in zoom-in duration-150 ${className}`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100 shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h2 id={ariaLabelledBy} className="text-xl font-bold text-slate-900 tracking-tight">
                {title}
              </h2>
              {description && (
                <p className="text-xs text-slate-500 font-medium">{description}</p>
              )}
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div>{children}</div>
      </div>
    </div>
  );
};
