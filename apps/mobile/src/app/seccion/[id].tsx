import { router, Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';

import { FileTypeBadge } from '@/components/file-type-badge';
import { ListRow } from '@/components/list-row';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useDemo } from '@/state/demo-store';

export default function SectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { visibleSections } = useDemo();
  const section = visibleSections.find((s) => s.id === id);

  if (!section) {
    return (
      <ThemedText themeColor="textSecondary" style={styles.empty}>
        Esta sección no está disponible.
      </ThemedText>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: `${section.id} · ${section.name}` }} />
      <FlatList
        data={section.documents}
        keyExtractor={(_, index) => String(index)}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            Aún no hay documentos en esta sección.{'\n'}Te avisaremos cuando se publique algo nuevo.
          </ThemedText>
        }
        renderItem={({ item, index }) => (
          <ListRow
            leading={<FileTypeBadge type={item.type} />}
            title={item.name}
            subtitle={`${item.size} · ${item.date}`}
            badge={item.isNew ? 'Nuevo' : undefined}
            onPress={() =>
              router.push({
                pathname: '/documento/[sec]/[doc]',
                params: { sec: section.id, doc: String(index) },
              })
            }
          />
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.three,
  },
});
