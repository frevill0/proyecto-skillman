import { useQuery } from '@tanstack/react-query';

import { supabase } from './supabase';
import type { ActivityEntry, Client, ClientSummary, DocumentRow, Profile, Section } from './types';

/** Sin tipos generados de la base, supabase-js infiere las relaciones como arreglos: el tipo lo damos aquí. */
function unwrap<T>({ data, error }: { data: unknown; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export const keys = {
  clients: ['clients'] as const,
  client: (id: string) => ['client', id] as const,
  sections: (clientId: string) => ['sections', clientId] as const,
  documents: (clientId: string) => ['documents', clientId] as const,
  profiles: ['profiles'] as const,
  activity: (clientId?: string) => ['activity', clientId ?? 'all'] as const,
};

export function useClients() {
  return useQuery({
    queryKey: keys.clients,
    queryFn: async () =>
      unwrap<ClientSummary[]>(
        await supabase
          .from('clients')
          .select('id, name, created_at, access_until, sections(count), documents(count), profiles(count)')
          .order('name'),
      ),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: keys.client(id),
    queryFn: async () =>
      unwrap<Client | null>(
        await supabase.from('clients').select('id, name, created_at, access_until').eq('id', id).maybeSingle(),
      ),
  });
}

export function useSections(clientId: string) {
  return useQuery({
    queryKey: keys.sections(clientId),
    queryFn: async () =>
      unwrap<Section[]>(
        await supabase
          .from('sections')
          .select('id, client_id, number, name, visible, sort_order')
          .eq('client_id', clientId)
          .order('sort_order')
          .order('number'),
      ),
  });
}

/** Todos los documentos del cliente; se agrupan por sección en la pantalla. */
export function useDocuments(clientId: string) {
  return useQuery({
    queryKey: keys.documents(clientId),
    queryFn: async () =>
      unwrap<DocumentRow[]>(
        await supabase.from('documents').select('*').eq('client_id', clientId).order('subfolder_label', { nullsFirst: true }).order('name'),
      ),
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: keys.profiles,
    queryFn: async () =>
      unwrap<Profile[]>(
        await supabase
          .from('profiles')
          .select('id, client_id, full_name, email, role, active, created_at, clients(name)')
          .order('role')
          .order('email'),
      ),
  });
}

export function useActivity(clientId?: string) {
  return useQuery({
    queryKey: keys.activity(clientId),
    queryFn: async () => {
      let query = supabase
        .from('access_log')
        .select(
          clientId
            ? 'id, action, at, profiles(full_name, email), documents!inner(name, client_id, clients(name))'
            : 'id, action, at, profiles(full_name, email), documents(name, clients(name))',
        )
        .order('at', { ascending: false })
        .limit(300);
      if (clientId) query = query.eq('documents.client_id', clientId);
      return unwrap<ActivityEntry[]>(await query);
    },
  });
}
