import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { OFFICE_TYPES, ORGANIZATION, type DemoDocument } from '@/data/demo';
import { useTheme } from '@/hooks/use-theme';
import { useDemo } from '@/state/demo-store';
import { notify } from '@/utils/notify';

/**
 * Visor de demostración: dibuja una página simulada con la marca de agua del usuario.
 * En la etapa 3 se reemplaza por el PDF real servido con una URL firmada.
 */
export default function DocumentScreen() {
  const { sec, doc } = useLocalSearchParams<{ sec: string; doc: string }>();
  const theme = useTheme();
  const { visibleSections, user, addLog } = useDemo();
  const section = visibleSections.find((s) => s.id === sec);
  const document = section?.documents[Number(doc)];

  const logged = useRef(false);
  useEffect(() => {
    if (document && user && !logged.current) {
      logged.current = true;
      addLog(`${user.name} abrió «${document.name}»`);
    }
  }, [document, user, addLog]);

  if (!section || !document || !user) {
    return (
      <ThemedText themeColor="textSecondary" style={styles.empty}>
        Este documento no está disponible.
      </ThemedText>
    );
  }

  const seed = [...document.name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const pages = 3 + (seed % 14);

  const download = () => {
    addLog(`${user.name} descargó «${document.name}»`);
    notify('Descarga registrada (demo)');
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: document.name }} />

      <View style={[styles.page, { backgroundColor: theme.backgroundElement, borderColor: theme.line }]}>
        <ThemedText type="label" themeColor="textSecondary">
          {ORGANIZATION} · Sección {section.id}
        </ThemedText>
        <ThemedText type="smallBold" style={styles.pageTitle}>
          {document.name}
        </ThemedText>
        <PageBody document={document} seed={seed} />

        <View pointerEvents="none" style={styles.watermark}>
          <ThemedText type="code" themeColor="textSecondary" style={styles.watermarkText}>
            {user.email}
            {'\n'}Uso confidencial
          </ThemedText>
        </View>
      </View>

      <View style={styles.chips}>
        <Chip text={`Página 1 de ${pages}`} />
        {OFFICE_TYPES.includes(document.type) && <Chip text="Convertido a PDF automáticamente" />}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={download}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.brand, opacity: pressed ? 0.85 : 1 },
          ]}>
          <ThemedText type="smallBold" themeColor="brandInk">
            Descargar
          </ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.button,
            { borderWidth: 1, borderColor: theme.line, opacity: pressed ? 0.7 : 1 },
          ]}>
          <ThemedText type="smallBold">Volver a la lista</ThemedText>
        </Pressable>
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Los documentos llevan una marca de agua con tu correo. Cada apertura queda registrada.
      </ThemedText>
    </ScrollView>
  );
}

function PageBody({ document, seed }: { document: DemoDocument; seed: number }) {
  const theme = useTheme();
  if (document.type === 'xlsx') {
    return (
      <View style={styles.grid}>
        {Array.from({ length: 35 }, (_, i) => (
          <View
            key={i}
            style={[styles.cell, { backgroundColor: i < 5 ? theme.brandSoft : theme.line }]}
          />
        ))}
      </View>
    );
  }
  if (document.type === 'jpg') {
    return (
      <View style={styles.boxes}>
        {Array.from({ length: 4 }, (_, i) => (
          <View key={i} style={[styles.box, { borderColor: theme.line }]} />
        ))}
      </View>
    );
  }
  return (
    <View>
      {Array.from({ length: 12 }, (_, k) => (
        <View
          key={k}
          style={[
            styles.bar,
            { backgroundColor: theme.line, width: `${55 + ((seed * (k + 3)) % 45)}%` },
          ]}
        />
      ))}
    </View>
  );
}

function Chip({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: theme.brandSoft }]}>
      <ThemedText type="code" themeColor="brand">
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  page: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    minHeight: 360,
    overflow: 'hidden',
  },
  pageTitle: {
    marginTop: Spacing.one,
    marginBottom: Spacing.three,
  },
  watermark: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-24deg' }],
    opacity: 0.3,
  },
  watermarkText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  bar: {
    height: 7,
    borderRadius: 4,
    marginVertical: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  cell: {
    width: '19%',
    height: 20,
    borderRadius: 3,
  },
  boxes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  box: {
    width: '47%',
    height: 90,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.five,
  },
});
