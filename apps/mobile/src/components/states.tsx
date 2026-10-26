import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Loading() {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.brand} />
    </View>
  );
}

export function EmptyText({ children }: { children: string }) {
  return (
    <ThemedText themeColor="textSecondary" style={styles.empty}>
      {children}
    </ThemedText>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <ThemedText themeColor="textSecondary" style={styles.empty}>
        No se pudo cargar la información. Revisa tu conexión a internet.
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={[styles.retry, { borderColor: theme.line }]}>
        <ThemedText type="smallBold">Reintentar</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.three,
  },
  retry: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: Spacing.four,
  },
});
