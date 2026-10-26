import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { ORGANIZATION } from '@/data/demo';
import { useTheme } from '@/hooks/use-theme';
import { useDemo } from '@/state/demo-store';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, signOut } = useDemo();
  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.identity}>
        <View style={[styles.avatar, { backgroundColor: theme.brandSoft }]}>
          <ThemedText type="title" themeColor="brand">
            {initials}
          </ThemedText>
        </View>
        <ThemedText type="title">{user.name}</ThemedText>
        <ThemedText themeColor="textSecondary">{user.email}</ThemedText>
      </View>

      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <InfoRow label="Organización" value={ORGANIZATION} />
        <InfoRow label="Rol" value={user.role} />
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Los documentos llevan una marca de agua con tu correo. Cada apertura y descarga queda
        registrada.
      </ThemedText>

      <Pressable
        accessibilityRole="button"
        onPress={signOut}
        style={({ pressed }) => [
          styles.button,
          { borderColor: theme.line, opacity: pressed ? 0.7 : 1 },
        ]}>
        <Ionicons name="log-out-outline" size={18} color={theme.danger} />
        <ThemedText type="smallBold" themeColor="danger">
          Cerrar sesión
        </ThemedText>
      </Pressable>

      {/* Acceso discreto a la vista del consultor, solo para la demostración. */}
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/admin')}
        style={({ pressed }) => [styles.adminLink, { opacity: pressed ? 0.6 : 1 }]}>
        <ThemedText type="label" themeColor="textSecondary">
          Vista de administrador (demo)
        </ThemedText>
      </Pressable>

      <ThemedText type="small" themeColor="textSecondary" style={styles.version}>
        Portal PDP · versión {Constants.expoConfig?.version ?? '1.0.0'} · datos de ejemplo
      </ThemedText>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <ThemedText type="label" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  identity: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  card: {
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  infoRow: {
    gap: Spacing.half,
  },
  button: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  adminLink: {
    alignSelf: 'center',
    padding: Spacing.two,
    marginTop: Spacing.four,
  },
  version: {
    textAlign: 'center',
  },
});
