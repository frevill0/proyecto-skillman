import { router, Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';

import { FileTypeBadge } from '@/components/file-type-badge';
import { ListRow } from '@/components/list-row';
import { EmptyText, ErrorState, Loading } from '@/components/states';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDocuments, useSection } from '@/lib/queries';
import { formatDate, formatSize, sectionNumber } from '@/utils/format';

export default function SectionScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const section = useSection(id);
  const documents = useDocuments(id);

  if (section.isPending || documents.isPending) return <Loading />;
  if (section.isError || documents.isError) {
    return (
      <ErrorState
        onRetry={() => {
          section.refetch();
          documents.refetch();
        }}
      />
    );
  }
  if (!section.data) return <EmptyText>Esta sección no está disponible.</EmptyText>;

  return (
    <>
      <Stack.Screen options={{ title: `${sectionNumber(section.data.number)} · ${section.data.name}` }} />
      <FlatList
        data={documents.data}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={documents.isRefetching}
            onRefresh={() => void documents.refetch()}
            tintColor={theme.brand}
            colors={[theme.brand]}
          />
        }
        ListEmptyComponent={
          <EmptyText>{'Aún no hay documentos en esta sección.\nTe avisaremos cuando se publique algo nuevo.'}</EmptyText>
        }
        renderItem={({ item }) => (
          <ListRow
            leading={<FileTypeBadge ext={item.storage_path_pdf ? 'pdf' : item.original_ext} />}
            title={item.name}
            subtitle={[formatSize(item.size_bytes), formatDate(item.doc_date), item.subfolder_label]
              .filter(Boolean)
              .join(' · ')}
            onPress={() => router.push({ pathname: '/documento/[id]', params: { id: item.id } })}
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
});
