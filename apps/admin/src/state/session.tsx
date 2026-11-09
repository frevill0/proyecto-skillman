import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';

interface SessionState {
  restoring: boolean;
  session: Session | null;
  /** Mensaje cuando la cuenta no es de administrador (o fue revocada). */
  denied: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);

/** El panel solo admite perfiles admin activos; cualquier otra cuenta se cierra al instante. */
async function checkAdmin(session: Session | null): Promise<string | null> {
  if (!session) return null;
  const { data } = await supabase.from('profiles').select('role, active').eq('id', session.user.id).maybeSingle();
  if (data?.role === 'admin' && data.active) return null;
  return 'Esta cuenta no tiene acceso al panel de administración. Los clientes entran desde la app.';
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [restoring, setRestoring] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [denied, setDenied] = useState<string | null>(null);

  const accept = useCallback(async (next: Session | null) => {
    const problem = await checkAdmin(next);
    if (problem) {
      setDenied(problem);
      setSession(null);
      await supabase.auth.signOut();
    } else {
      setSession(next);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      await accept(data.session);
      setRestoring(false);
    });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'SIGNED_OUT') setSession(null);
      else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') setSession(next);
    });
    return () => data.subscription.unsubscribe();
  }, [accept]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setDenied(null);
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        throw new Error(
          error.message.includes('Invalid login credentials')
            ? 'Correo o contraseña incorrectos.'
            : 'No pude iniciar sesión. Revisa tu conexión e inténtalo de nuevo.',
        );
      }
      await accept(data.session);
    },
    [accept],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  }, [queryClient]);

  return (
    <SessionContext.Provider value={{ restoring, session, denied, signIn, signOut }}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession fuera de SessionProvider');
  return ctx;
}
