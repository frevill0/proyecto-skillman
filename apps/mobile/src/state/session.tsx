/**
 * Sesión del usuario: Supabase Auth + su perfil (rol y cliente).
 * Un administrador puede elegir qué cliente mira; un cliente siempre ve el suyo.
 */

import type { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

type SessionState = {
  /** true mientras se recupera la sesión guardada al abrir la app. */
  restoring: boolean;
  session: Session | null;
  profile: Profile | null;
  profileLoading: boolean;
  isAdmin: boolean;
  clientId: string | null;
  setAdminClientId: (id: string) => void;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [restoring, setRestoring] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [adminClientId, setAdminClientId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setRestoring(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId!).maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });

  const profile = profileQuery.data ?? null;
  const isAdmin = profile?.role === 'admin' && profile.active;

  const value: SessionState = {
    restoring,
    session,
    profile,
    profileLoading: !!userId && profileQuery.isPending,
    isAdmin,
    clientId: isAdmin ? adminClientId : (profile?.client_id ?? null),
    setAdminClientId,
    signOut: async () => {
      await supabase.auth.signOut();
      setAdminClientId(null);
      queryClient.clear();
    },
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de <SessionProvider>');
  return ctx;
}
