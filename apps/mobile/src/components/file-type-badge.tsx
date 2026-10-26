import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { typeLabel } from '@/utils/format';

const LABEL_COLOR: Record<string, ThemeColor> = {
  PDF: 'danger',
  XLS: 'ok',
  DOC: 'brand',
  PPT: 'accent',
};

export function FileTypeBadge({ ext }: { ext: string }) {
  const theme = useTheme();
  const label = typeLabel(ext);
  return (
    <View style={[styles.badge, { backgroundColor: theme.backgroundElement, borderColor: theme.line }]}>
      <ThemedText type="code" themeColor={LABEL_COLOR[label] ?? 'textSecondary'}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
