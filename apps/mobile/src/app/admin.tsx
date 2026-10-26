import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { NumberBadge } from '@/components/list-row';
import { EmptyText, ErrorState, Loading } from '@/components/states';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useActivity, useClients, useSections, useToggleSection } from '@/lib/queries';
import { useSession } from '@/state/session';
import { formatDateTime, sectionNumber } from '@/utils/format';
import { notify } from '@/utils/notify';

type Tab = 'folders' | 'log';

/**
 * Administración mínima desde el celular: elegir cliente, ocultar o mostrar secciones y ver la actividad.
 * Importar carpetas y crear usuarios se hace con los scripts de la raíz (luego, con el panel web).
 */
export default function AdminScreen() {
  const theme = useTheme();
  const { isAdmin, clientId, setAdminClientId } = useSession();
  const clients = useClients(isAdmin);
  const sections = useSections(clientId, false);
  const activity = useActivity(isAdmin);
  const toggle = useToggleSection();
  const [tab, setTab] = useState<Tab>('folders');

  if (!isAdmin) return <EmptyText>Solo el administrador puede ver esta pantalla.</EmptyText>;
  if (clients.isPending) return <Loading />;
  if (clients.isError) return <ErrorState onRetry={() => clients.refetch()} />;

  const list = sections.data ?? [];
  const visible = list.filter((s) => s.visible).length;
  const docs = list.reduce((sum, s) => sum + (s.documents[0]?.count ?? 0), 0);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedText type="label" themeColor="textSecondary">
        Cliente
      </ThemedText>
      <View style={styles.chips}>
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
      </View>

      <View style={styles.kpis}>
        <Kpi value={`${visible}/${list.length}`} label="secciones visibles" />
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

      {tab === 'folders' &&
        (sections.isPending ? (
          <Loading />
        ) : (
          list.map((s) => (
            <View key={s.id} style={[styles.row, { borderBottomColor: theme.line }]}>
              <NumberBadge value={sectionNumber(s.number)} />
              <View style={styles.rowText}>
                <ThemedText type="smallBold">{s.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {s.documents[0]?.count ?? 0} docs · {s.visible ? 'visible' : 'oculta'} para el cliente
                </ThemedText>
              </View>
              <Switch
                value={s.visible}
                disabled={toggle.isPending}
                onValueChange={(value) =>
                  toggle.mutate(
                    { id: s.id, visible: value },
                    {
                      onSuccess: () => notify(value ? 'Ahora el cliente la ve' : 'Oculta para el cliente'),
                      onError: () => notify('No se pudo guardar el cambio'),
                    },
                  )
                }
                trackColor={{ true: theme.brand, false: theme.line }}
                thumbColor={theme.background}
                accessibilityLabel={`Mostrar ${s.name} al cliente`}
              />
            </View>
          ))
        ))}

      {tab === 'log' &&
        (activity.isPending ? (
          <Loading />
        ) : !activity.data?.length ? (
          <EmptyText>Todavía no hay aperturas ni descargas registradas.</EmptyText>
        ) : (
          activity.data.map((entry) => (
            <View key={entry.id} style={[styles.row, { borderBottomColor: theme.line }]}>
              <ThemedText type="code" themeColor="textSecondary" style={styles.time}>
                {formatDateTime(entry.at)}
              </ThemedText>
              <ThemedText type="small" style={styles.rowText}>
                {entry.profiles?.full_name ?? entry.profiles?.email ?? 'Usuario'}{' '}
                {entry.action === 'open' ? 'abrió' : 'descargó'} «{entry.documents?.name ?? 'documento eliminado'}»
              </ThemedText>
            </View>
          ))
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    minWidth: 92,
  },
});
