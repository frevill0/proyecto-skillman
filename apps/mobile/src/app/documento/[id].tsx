import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { FileTypeBadge } from '@/components/file-type-badge';
import { EmptyText, ErrorState, Loading } from '@/components/states';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDocument } from '@/lib/queries';
import { SIGNED_URL_SECONDS } from '@/lib/supabase';
import type { DocumentRow } from '@/lib/types';
import { useSession } from '@/state/session';
import { formatDate, formatSize, IMAGE_EXTENSIONS, OFFICE_EXTENSIONS, sectionNumber } from '@/utils/format';
import { notify } from '@/utils/notify';
import { downloadDocument, logAccess, servedFile, signedUrl, viewDocument } from '@/utils/open-document';

export default function DocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const document = useDocument(id);
  const [busy, setBusy] = useState<'view' | 'download' | null>(null);

  if (document.isPending) return <Loading />;
  if (document.isError) return <ErrorState onRetry={() => document.refetch()} />;
  const doc = document.data;
  if (!doc) return <EmptyText>Este documento no está disponible.</EmptyText>;

  const { ext } = servedFile(doc);
  const isImage = IMAGE_EXTENSIONS.includes(ext);

  const run = async (kind: 'view' | 'download') => {
    setBusy(kind);
    try {
      if (kind === 'view') await viewDocument(doc);
      else await downloadDocument(doc);
    } catch {
      notify('No se pudo abrir el documento. Revisa tu conexión.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: doc.name }} />

      <View style={styles.titleRow}>
        <FileTypeBadge ext={ext} />
        <View style={styles.titleText}>
          <ThemedText type="smallBold">{doc.name}</ThemedText>
          {doc.sections && (
            <ThemedText type="small" themeColor="textSecondary">
              Sección {sectionNumber(doc.sections.number)} · {doc.sections.name}
            </ThemedText>
          )}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <Info label="Tamaño" value={formatSize(doc.size_bytes)} />
        {doc.doc_date && <Info label="Fecha" value={formatDate(doc.doc_date)} />}
        {doc.subfolder_label && <Info label="Carpeta" value={doc.subfolder_label} />}
        {doc.storage_path_pdf && OFFICE_EXTENSIONS.includes(doc.original_ext) && (
          <Info label="Formato" value={`Convertido a PDF desde ${doc.original_ext.toUpperCase()}`} />
        )}
      </View>

      {isImage && <ImagePreview doc={doc} />}

      <View style={styles.actions}>
        {!isImage && (
          <ActionButton primary label="Ver documento" busy={busy === 'view'} onPress={() => run('view')} />
        )}
        <ActionButton
          primary={isImage}
          label="Descargar"
          busy={busy === 'download'}
          onPress={() => run('download')}
        />
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Uso confidencial. El enlace caduca a los {SIGNED_URL_SECONDS / 60} minutos y cada apertura queda
        registrada.
      </ThemedText>
    </ScrollView>
  );
}

/** Imagen dentro de la app con marca de agua del correo del usuario. */
function ImagePreview({ doc }: { doc: DocumentRow }) {
  const theme = useTheme();
  const { session } = useSession();
  const url = useQuery({
    queryKey: ['signed-url', doc.id],
    staleTime: (SIGNED_URL_SECONDS - 30) * 1000,
    queryFn: async () => {
      await logAccess(doc, 'open');
      return signedUrl(doc);
    },
  });

  return (
    <View style={[styles.preview, { borderColor: theme.line, backgroundColor: theme.backgroundElement }]}>
      {url.data ? (
        <Image source={{ uri: url.data }} style={styles.image} contentFit="contain" />
      ) : (
        <ActivityIndicator color={theme.brand} />
      )}
      <View pointerEvents="none" style={styles.watermark}>
        <ThemedText type="code" themeColor="textSecondary" style={styles.watermarkText}>
          {session?.user.email}
          {'\n'}Uso confidencial
        </ThemedText>
      </View>
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <ThemedText type="label" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="small">{value}</ThemedText>
    </View>
  );
}

function ActionButton({
  label,
  primary,
  busy,
  onPress,
}: {
  label: string;
  primary?: boolean;
  busy: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary
          ? { backgroundColor: theme.brand }
          : { borderWidth: 1, borderColor: theme.line },
        { opacity: pressed || busy ? 0.75 : 1 },
      ]}>
      {busy ? (
        <ActivityIndicator color={primary ? theme.brandInk : theme.brand} />
      ) : (
        <ThemedText type="smallBold" themeColor={primary ? 'brandInk' : 'text'}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  titleText: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  info: {
    gap: Spacing.half,
  },
  preview: {
    borderWidth: 1,
    borderRadius: 12,
    height: 360,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  watermark: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-24deg' }],
    opacity: 0.35,
  },
  watermarkText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    borderRadius: 12,
  },
});
