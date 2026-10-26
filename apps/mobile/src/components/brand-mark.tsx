import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/** Logo provisional: escudo con check sobre verde de marca. */
export function BrandMark({ size = 32 }: { size?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: theme.brand,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Ionicons name="shield-checkmark-outline" size={size * 0.55} color={theme.brandInk} />
    </View>
  );
}
