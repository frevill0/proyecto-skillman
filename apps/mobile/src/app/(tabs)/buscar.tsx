import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, TextInput } from 'react-native';

import { FileTypeBadge } from '@/components/file-type-badge';
import { ListRow } from '@/components/list-row';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDemo } from '@/state/demo-store';

/** Busca documentos por nombre en todas las secciones visibles. */
export default function SearchScreen() {
  const theme = useTheme();
  const { visibleSections } = useDemo();
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const results = q
    ? visibleSections.flatMap((s) =>
        s.documents
          .map((d, index) => ({ section: s, document: d, index }))
          .filter(({ document }) => document.name.toLowerCase().includes(q)),
      )
    : [];

  return (
    <FlatList
      data={results}
      keyExtractor={(r) => `${r.section.id}-${r.index}`}
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
      ListEmptyComponent={
        <ThemedText themeColor="textSecondary" style={styles.empty}>
          {q ? 'No encontré documentos con ese nombre.' : 'Escribe para buscar en todos tus documentos.'}
        </ThemedText>
      }
      renderItem={({ item }) => (
        <ListRow
          leading={<FileTypeBadge type={item.document.type} />}
          title={item.document.name}
          subtitle={`Sección ${item.section.id} · ${item.section.name}`}
          onPress={() =>
            router.push({
              pathname: '/documento/[sec]/[doc]',
              params: { sec: item.section.id, doc: String(item.index) },
            })
          }
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
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.five,
  },
});
