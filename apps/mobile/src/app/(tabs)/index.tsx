import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ListRow, NumberBadge } from '@/components/list-row';
import { EmptyText, ErrorState, Loading } from '@/components/states';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useClient, useClients, useSections } from '@/lib/queries';
import { useSession } from '@/state/session';
import { documentCount, sectionNumber } from '@/utils/format';

export default function HomeScreen() {
  const theme = useTheme();
  const { clientId, isAdmin } = useSession();
  const client = useClient(clientId);
  const sections = useSections(clientId);
  const [query, setQuery] = useState('');

  if (isAdmin && !clientId) return <AdminClientPicker />;
  if (sections.isPending || client.isPending) return <Loading />;
  if (sections.isError || client.isError) {
    return (
      <ErrorState
        onRetry={() => {
          client.refetch();
          sections.refetch();
        }}
      />
    );
  }

  const q = query.trim().toLowerCase();
  const all = sections.data;
  const list = all.filter(
    (s) => !q || `${sectionNumber(s.number)} ${s.name}`.toLowerCase().includes(q),
  );
  const totalDocs = all.reduce((sum, s) => sum + (s.documents[0]?.count ?? 0), 0);

  const header = (
    <View style={styles.header}>
      {isAdmin && <AdminClientPicker compact />}
      <View style={[styles.hero, { backgroundColor: theme.brand }]}>
        <ThemedText type="label" style={[styles.heroLabel, { color: theme.brandInk }]}>
          {isAdmin ? 'Vista del cliente' : 'Tu organización'}
        </ThemedText>
        <ThemedText type="title" style={{ color: theme.brandInk }}>
          {client.data.name}
        </ThemedText>
        <View style={styles.stats}>
          <Stat value={all.length} label="secciones" color={theme.brandInk} />
          <Stat value={totalDocs} label="documentos" color={theme.brandInk} />
        </View>
      </View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar sección"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Buscar sección"
        style={[
          styles.search,
          { borderColor: theme.line, backgroundColor: theme.backgroundElement, color: theme.text },
        ]}
      />
    </View>
  );

  return (
    <FlatList
      data={list}
      keyExtractor={(s) => s.id}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={sections.isRefetching}
          onRefresh={() => void sections.refetch()}
          tintColor={theme.brand}
          colors={[theme.brand]}
        />
      }
      ListHeaderComponent={header}
      ListEmptyComponent={
        <EmptyText>
          {all.length ? 'No hay secciones con ese nombre.' : 'Esta organización aún no tiene carpetas publicadas.'}
        </EmptyText>
      }
      renderItem={({ item }) => {
        const count = item.documents[0]?.count ?? 0;
        return (
          <ListRow
            leading={<NumberBadge value={sectionNumber(item.number)} />}
            title={item.name}
            subtitle={documentCount(count)}
            muted={!count}
            onPress={() => router.push({ pathname: '/seccion/[id]', params: { id: item.id } })}
          />
        );
      }}
    />
  );
}

/** Para el administrador: elegir qué cliente ver como lo vería ese cliente. */
function AdminClientPicker({ compact = false }: { compact?: boolean }) {
  const theme = useTheme();
  const { clientId, setAdminClientId } = useSession();
  const clients = useClients();

  // Por defecto, el primer cliente.
  useEffect(() => {
    if (!clientId && clients.data?.length) setAdminClientId(clients.data[0].id);
  }, [clientId, clients.data, setAdminClientId]);

  if (clients.isPending) return compact ? null : <Loading />;
  if (clients.isError) return <ErrorState onRetry={() => clients.refetch()} />;
  if (!clients.data.length) {
    return <EmptyText>Aún no hay clientes. Importa la primera carpeta con el script del administrador.</EmptyText>;
  }
  if (!compact) return <Loading />;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {clients.data.map((c) => {
        const selected = c.id === clientId;
        return (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => setAdminClientId(c.id)}
            style={[
              styles.chip,
              { borderColor: selected ? theme.brand : theme.line },
              selected && { backgroundColor: theme.brandSoft },
            ]}>
            <ThemedText type="small" themeColor={selected ? 'brand' : 'textSecondary'}>
              {c.name}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View>
      <ThemedText type="title" style={{ color }}>
        {value}
      </ThemedText>
      <ThemedText type="small" style={{ color, opacity: 0.85 }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
  },
  header: {
    gap: Spacing.three,
    marginBottom: Spacing.two,
    paddingTop: Spacing.two,
  },
  hero: {
    borderRadius: 18,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  heroLabel: {
    opacity: 0.8,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.four,
    marginTop: Spacing.two,
  },
  search: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
  },
  chips: {
    gap: Spacing.two,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
