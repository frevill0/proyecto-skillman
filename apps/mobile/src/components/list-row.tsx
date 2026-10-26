import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ListRowProps = {
  leading: ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  muted?: boolean;
  onPress: () => void;
};

/** Fila tocable con icono a la izquierda, título, subtítulo y chevron. */
export function ListRow({ leading, title, subtitle, badge, muted, onPress }: ListRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.line, backgroundColor: pressed ? theme.backgroundSelected : 'transparent' },
      ]}>
      {leading}
      <View style={styles.text}>
        <ThemedText
          type="smallBold"
          themeColor={muted ? 'textSecondary' : 'text'}
          style={muted && styles.mutedTitle}>
          {title}
          {badge ? '  ' : ''}
          {badge ? (
            <ThemedText type="label" themeColor="accent">
              {badge}
            </ThemedText>
          ) : null}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {subtitle}
        </ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

export function NumberBadge({ value }: { value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: theme.brandSoft }]}>
      <ThemedText type="code" themeColor="brand">
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: Spacing.one,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  mutedTitle: {
    fontWeight: 500,
  },
  badge: {
    minWidth: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
