/**
 * Estado en memoria para la demostración. No guarda nada: al cerrar la app vuelve al inicio.
 * En la etapa 1 esto se reemplaza por Supabase (Auth + tablas con RLS).
 */

import { createContext, useContext, useState, type ReactNode } from 'react';

import {
  buildSections,
  DEMO_USER,
  INITIAL_LOG,
  type DemoUser,
  type LogEntry,
  type Section,
} from '@/data/demo';

type DemoState = {
  user: DemoUser | null;
  sections: Section[];
  visibleSections: Section[];
  log: LogEntry[];
  signIn: (email: string) => void;
  signOut: () => void;
  toggleSection: (id: string) => void;
  addLog: (text: string) => void;
};

const DemoContext = createContext<DemoState | null>(null);

function now() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [sections, setSections] = useState(buildSections);
  const [log, setLog] = useState(INITIAL_LOG);

  const addLog = (text: string) => setLog((prev) => [{ at: now(), text }, ...prev]);

  const value: DemoState = {
    user,
    sections,
    visibleSections: sections.filter((s) => s.visible),
    log,
    signIn: (email) => {
      const signedIn = { ...DEMO_USER, email: email.trim() || DEMO_USER.email };
      setUser(signedIn);
      addLog(`${signedIn.name} inició sesión`);
    },
    signOut: () => setUser(null),
    toggleSection: (id) => {
      const target = sections.find((s) => s.id === id);
      if (!target) return;
      setSections((prev) => prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)));
      addLog(`Sección ${id} ${target.visible ? 'oculta' : 'visible'} para el cliente`);
    },
    addLog,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo debe usarse dentro de <DemoProvider>');
  return ctx;
}
