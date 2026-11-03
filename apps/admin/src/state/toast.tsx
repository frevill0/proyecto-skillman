import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type Toast = (message: string, kind?: 'ok' | 'error') => void;

const ToastContext = createContext<Toast>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<{ message: string; kind: 'ok' | 'error' } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback<Toast>((message, kind = 'ok') => {
    window.clearTimeout(timer.current);
    setCurrent({ message, kind });
    timer.current = window.setTimeout(() => setCurrent(null), kind === 'error' ? 6000 : 3000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div role="status" aria-live="polite" className={`toast ${current ? 'show' : ''} ${current?.kind ?? ''}`}>
        {current?.message}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/** Mensaje legible de cualquier error. */
export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Ocurrió un error inesperado.');
