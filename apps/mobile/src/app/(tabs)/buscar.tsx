import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, TextInput } from 'react-native';

import { FileTypeBadge } from '@/components/file-type-badge';
import { ListRow } from '@/components/list-row';
import { EmptyText, Loading } from '@/components/states';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDocumentSearch } from '@/lib/queries';
import { useSession } from '@/state/session';
import { sectionNumber } from '@/utils/format';

/** Busca documentos por nombre en todas las secciones visibles del cliente. */
export default function SearchScreen() {
  const theme = useTheme();
  const { clientId } = useSession();
  const [query, setQuery] = useState('');
  const search = useDocumentSearch(clientId, query);
  const q = query.trim();

  let empty = 'Escribe al menos 2 letras para buscar en todos tus documentos.';
  if (q.length >= 2) empty = search.isError ? 'No se pudo buscar. Revisa tu conexión.' : 'No encontré documentos con ese nombre.';

  return (
    <FlatList
      data={q.length >= 2 ? (search.data ?? []) : []}
      keyExtractor={(d) => d.id}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar documento"
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="Buscar documento"
          autoFocus
          style={[
            styles.search,
            { borderColor: theme.line, backgroundColor: theme.backgroundElement, color: theme.text },
          ]}
        />
      }
      ListEmptyComponent={q.length >= 2 && search.isFetching ? <Loading /> : <EmptyText>{empty}</EmptyText>}
      renderItem={({ item }) => (
        <ListRow
          leading={<FileTypeBadge ext={item.storage_path_pdf ? 'pdf' : item.original_ext} />}
          title={item.name}
          subtitle={item.sections ? `Sección ${sectionNumber(item.sections.number)} · ${item.sections.name}` : ''}
          onPress={() => router.push({ pathname: '/documento/[id]', params: { id: item.id } })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
  },
  search: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
    marginVertical: Spacing.two,
  },
});
