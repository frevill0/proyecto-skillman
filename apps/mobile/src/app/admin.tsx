import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { NumberBadge } from '@/components/list-row';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { ORGANIZATION } from '@/data/demo';
import { useTheme } from '@/hooks/use-theme';
import { useDemo } from '@/state/demo-store';
import { notify } from '@/utils/notify';

type Tab = 'folders' | 'log';

/**
 * Vista mínima del consultor para la demostración: ocultar o mostrar secciones y ver la actividad.
 * El panel completo (importar carpetas, usuarios) será la app web de apps/admin.
 */
export default function AdminScreen() {
  const theme = useTheme();
  const { sections, log, toggleSection } = useDemo();
  const [tab, setTab] = useState<Tab>('folders');

  const visible = sections.filter((s) => s.visible).length;
  const docs = sections.reduce((sum, s) => sum + s.documents.length, 0);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedText type="title">{ORGANIZATION}</ThemedText>

      <View style={styles.kpis}>
        <Kpi value={`${visible}/${sections.length}`} label="secciones visibles" />
        <Kpi value={String(docs)} label="documentos" />
      </View>

      <View style={[styles.tabs, { borderBottomColor: theme.line }]}>
        {(
          [
            ['folders', 'Carpetas'],
            ['log', 'Actividad'],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === key }}
            onPress={() => setTab(key)}
            style={[styles.tab, tab === key && { borderBottomColor: theme.brand }]}>
            <ThemedText type="smallBold" themeColor={tab === key ? 'text' : 'textSecondary'}>
              {label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {tab === 'folders'
        ? sections.map((s) => (
            <View key={s.id} style={[styles.row, { borderBottomColor: theme.line }]}>
              <NumberBadge value={s.id} />
              <View style={styles.rowText}>
                <ThemedText type="smallBold">{s.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {s.documents.length} docs · {s.visible ? 'visible' : 'oculta'} para el cliente
                </ThemedText>
              </View>
              <Switch
                value={s.visible}
                onValueChange={() => {
                  toggleSection(s.id);
                  notify(s.visible ? 'Oculta para el cliente' : 'Ahora el cliente la ve');
                }}
                trackColor={{ true: theme.brand, false: theme.line }}
                thumbColor={theme.background}
                accessibilityLabel={`Mostrar ${s.name} al cliente`}
              />
            </View>
          ))
        : log.map((entry, i) => (
            <View key={i} style={[styles.row, { borderBottomColor: theme.line }]}>
              <ThemedText type="code" themeColor="textSecondary" style={styles.time}>
                {entry.at}
              </ThemedText>
              <ThemedText type="small" style={styles.rowText}>
                {entry.text}
              </ThemedText>
            </View>
          ))}
    </ScrollView>
  );
}

function Kpi({ value, label }: { value: string; label: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.kpi, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="title">{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  kpis: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginVertical: Spacing.two,
  },
  kpi: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.four,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.one,
  },
  tab: {
    paddingVertical: Spacing.two,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  time: {
    minWidth: 46,
  },
});
