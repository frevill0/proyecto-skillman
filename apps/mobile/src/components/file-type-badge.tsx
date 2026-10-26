import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { ThemeColor } from '@/constants/theme';
import { TYPE_LABEL, type DocType } from '@/data/demo';
import { useTheme } from '@/hooks/use-theme';

const TYPE_COLOR: Record<DocType, ThemeColor> = {
  pdf: 'danger',
  xlsx: 'ok',
  docx: 'brand',
  pptx: 'accent',
  jpg: 'textSecondary',
};

export function FileTypeBadge({ type }: { type: DocType }) {
  const theme = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: theme.backgroundElement, borderColor: theme.line }]}>
      <ThemedText type="code" themeColor={TYPE_COLOR[type]}>
        {TYPE_LABEL[type]}
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
