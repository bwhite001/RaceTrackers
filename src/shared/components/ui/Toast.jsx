import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext(null);

let _idCounter = 0;

// ─── ToastProvider ────────────────────────────────────────────────────────────

/**
 * ToastProvider — wrap your app root with this to enable useToast()
 *
 * @example
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback(
    ({ message, variant = 'info', duration }) => {
      const id = ++_idCounter;
      const autoDismiss = duration !== undefined ? duration : variant === 'error' ? 0 : 3500;

      setToasts((prev) => [...prev, { id, message, variant }]);

      if (autoDismiss > 0) {
        setTimeout(() => dismiss(id), autoDismiss);
      }

      return id;
    },
    [dismiss]
  );

  const toast = {
    success: (message, opts) => add({ message, variant: 'success', ...opts }),
    error: (message, opts) => add({ message, variant: 'error', ...opts }),
    info: (message, opts) => add({ message, variant: 'info', ...opts }),
    warning: (message, opts) => add({ message, variant: 'warning', ...opts }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

// ─── useToast hook ────────────────────────────────────────────────────────────

/**
 * useToast — call toast.success / .error / .info / .warning to show notifications
 *
 * @example
 * const toast = useToast();
 * toast.success('Runner 42 marked off');
 * toast.error('Failed to save — try again');
 */
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

// ─── Visual config ────────────────────────────────────────────────────────────

const VARIANT_CONFIG = {
  success: {
    icon: CheckCircleIcon,
    bar: 'bg-green-500',
    iconColor: 'text-green-500',
    label: 'Success',
  },
  error: {
    icon: ExclamationCircleIcon,
    bar: 'bg-accent-red-500',
    iconColor: 'text-accent-red-500',
    label: 'Error',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bar: 'bg-accent-gold-500',
    iconColor: 'text-accent-gold-500',
    label: 'Warning',
  },
  info: {
    icon: InformationCircleIcon,
    bar: 'bg-navy-600',
    iconColor: 'text-navy-600 dark:text-navy-400',
    label: 'Info',
  },
};

// ─── ToastItem ────────────────────────────────────────────────────────────────

const ToastItem = ({ id, message, variant, onDismiss }) => {
  const config = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.info;
  const Icon = config.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-toast-enter flex items-start w-full max-w-sm bg-white dark:bg-gray-800
                 rounded-xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden"
    >
      {/* Left colour bar */}
      <div className={`w-1 flex-shrink-0 self-stretch ${config.bar}`} />

      <div className="flex items-start gap-3 flex-1 px-4 py-3.5">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} aria-hidden="true" />
        <p className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">
          {message}
        </p>
        <button
          onClick={() => onDismiss(id)}
          className="flex-shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600
                     dark:text-gray-500 dark:hover:text-gray-300 transition-colors
                     focus-visible:ring-2 focus-visible:ring-navy-500"
          aria-label="Dismiss notification"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ─── ToastContainer ───────────────────────────────────────────────────────────

const ToastContainer = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0
                 md:right-4 z-[9999] flex flex-col gap-2 w-[calc(100vw-2rem)] md:w-auto"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default ToastProvider;
