import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-success-600" />,
    error: <XCircle className="h-5 w-5 text-error-600" />,
    warning: <AlertCircle className="h-5 w-5 text-warning-600" />,
    info: <Info className="h-5 w-5 text-primary-600" />,
  };

  const borders = {
    success: 'border-success-200',
    error: 'border-error-200',
    warning: 'border-warning-200',
    info: 'border-primary-200',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 rounded-xl border ${borders[t.type]} bg-white px-4 py-3 shadow-lg animate-slide-up max-w-sm`}
          >
            {icons[t.type]}
            <p className="flex-1 text-sm font-medium text-earth-900">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-earth-400 hover:text-earth-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
