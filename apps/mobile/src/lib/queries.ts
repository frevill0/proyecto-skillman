/**
 * Consultas a Supabase. Las políticas RLS del servidor deciden qué filas llegan:
 * un cliente solo recibe su organización y sus secciones visibles.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { ActivityEntry, Client, DocumentRow, Section } from '@/lib/types';

const SECTION_FIELDS = 'id, client_id, number, name, visible, sort_order, documents(count)';
const DOCUMENT_FIELDS =
  'id, section_id, client_id, name, original_ext, storage_path_original, storage_path_pdf, size_bytes, doc_date, subfolder_label';

export function useClients(enabled = true) {
  return useQuery({
    queryKey: ['clients'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('id, name').order('name');
      if (error) throw error;
      return data as Client[];
    },
  });
}

export function useClient(clientId: string | null) {
  return useQuery({
    queryKey: ['client', clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('id, name').eq('id', clientId!).single();
      if (error) throw error;
      return data as Client;
    },
  });
}

/** Secciones del cliente. Con onlyVisible, también el admin ve solo lo que ve el cliente. */
export function useSections(clientId: string | null, onlyVisible = true) {
  return useQuery({
    queryKey: ['sections', clientId, onlyVisible],
    enabled: !!clientId,
    queryFn: async () => {
      let query = supabase.from('sections').select(SECTION_FIELDS).eq('client_id', clientId!);
      if (onlyVisible) query = query.eq('visible', true);
      const { data, error } = await query.order('sort_order');
      if (error) throw error;
      return data as Section[];
    },
  });
}

export function useSection(sectionId: string) {
  return useQuery({
    queryKey: ['section', sectionId],
    queryFn: async () => {
      const { data, error } = await supabase.from('sections').select(SECTION_FIELDS).eq('id', sectionId).maybeSingle();
      if (error) throw error;
      return data as Section | null;
    },
  });
}

export function useDocuments(sectionId: string) {
  return useQuery({
    queryKey: ['documents', sectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select(DOCUMENT_FIELDS)
        .eq('section_id', sectionId)
        .order('subfolder_label', { nullsFirst: true })
        .order('name');
      if (error) throw error;
      return data as DocumentRow[];
    },
  });
}

export function useDocument(documentId: string) {
  return useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select(`${DOCUMENT_FIELDS}, sections(number, name)`)
        .eq('id', documentId)
        .maybeSingle();
      if (error) throw error;
      return data as (DocumentRow & { sections: { number: number; name: string } | null }) | null;
    },
  });
}

export type SearchResult = DocumentRow & { sections: { number: number; name: string; visible: boolean } | null };

export function useDocumentSearch(clientId: string | null, text: string) {
  const q = text.trim();
  return useQuery({
    queryKey: ['search', clientId, q],
    enabled: !!clientId && q.length >= 2,
    queryFn: async () => {
      const pattern = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
      const { data, error } = await supabase
        .from('documents')
        .select(`${DOCUMENT_FIELDS}, sections!inner(number, name, visible)`)
        .eq('client_id', clientId!)
        .eq('sections.visible', true)
        .ilike('name', pattern)
        .order('name')
        .limit(50);
      if (error) throw error;
      return data as unknown as SearchResult[];
    },
  });
}

export function useActivity(enabled: boolean) {
  return useQuery({
    queryKey: ['activity'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_log')
        .select('id, action, at, profiles(full_name, email), documents(name)')
        .order('at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as unknown as ActivityEntry[];
    },
  });
}

export function useToggleSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, visible }: { id: string; visible: boolean }) => {
      const { error } = await supabase.from('sections').update({ visible }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sections'] }),
  });
}
