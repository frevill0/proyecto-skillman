import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';

import { ListRow, NumberBadge } from '@/components/list-row';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { ORGANIZATION } from '@/data/demo';
import { useTheme } from '@/hooks/use-theme';
import { useDemo } from '@/state/demo-store';

function countLabel(n: number) {
  if (!n) return 'Sin documentos aún';
  return n === 1 ? '1 documento' : `${n} documentos`;
}

export default function HomeScreen() {
  const theme = useTheme();
  const { visibleSections } = useDemo();
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const list = visibleSections.filter((s) => !q || `${s.id} ${s.name}`.toLowerCase().includes(q));
  const totalDocs = visibleSections.reduce((sum, s) => sum + s.documents.length, 0);

  const header = (
    <View style={styles.header}>
      <View style={[styles.hero, { backgroundColor: theme.brand }]}>
        <ThemedText type="label" style={[styles.heroLabel, { color: theme.brandInk }]}>
          Tu organización
        </ThemedText>
        <ThemedText type="title" style={{ color: theme.brandInk }}>
          {ORGANIZATION}
        </ThemedText>
        <View style={styles.stats}>
          <Stat value={visibleSections.length} label="secciones" color={theme.brandInk} />
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
      ListHeaderComponent={header}
      ListEmptyComponent={
        <ThemedText themeColor="textSecondary" style={styles.empty}>
          {visibleSections.length
            ? 'No hay secciones con ese nombre.'
            : 'Esta organización aún no tiene carpetas publicadas.'}
        </ThemedText>
      }
      renderItem={({ item }) => (
        <ListRow
          leading={<NumberBadge value={item.id} />}
          title={item.name}
          subtitle={countLabel(item.documents.length)}
          muted={!item.documents.length}
          onPress={() => router.push({ pathname: '/seccion/[id]', params: { id: item.id } })}
        />
      )}
    />
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
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.five,
  },
});
