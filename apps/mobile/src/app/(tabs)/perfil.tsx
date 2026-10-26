import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useClient } from '@/lib/queries';
import { useSession } from '@/state/session';

export default function ProfileScreen() {
  const theme = useTheme();
  const { profile, session, isAdmin, signOut } = useSession();
  const client = useClient(isAdmin ? null : (profile?.client_id ?? null));
  if (!profile) return null;

  const name = profile.full_name || profile.email || '';
  const email = profile.email ?? session?.user.email ?? '';
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.identity}>
        <View style={[styles.avatar, { backgroundColor: theme.brandSoft }]}>
          <ThemedText type="title" themeColor="brand">
            {initials}
          </ThemedText>
        </View>
        <ThemedText type="title">{name}</ThemedText>
        <ThemedText themeColor="textSecondary">{email}</ThemedText>
      </View>

      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <InfoRow label="Organización" value={isAdmin ? 'Todas (administrador)' : (client.data?.name ?? '…')} />
        <InfoRow label="Rol" value={isAdmin ? 'Administrador' : 'Cliente'} />
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Los documentos llevan marca de agua y los enlaces caducan a los pocos minutos. Cada apertura y
        descarga queda registrada.
      </ThemedText>

      {isAdmin && (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/admin')}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.brand, opacity: pressed ? 0.85 : 1 },
          ]}>
          <Ionicons name="settings-outline" size={18} color={theme.brandInk} />
          <ThemedText type="smallBold" themeColor="brandInk">
            Administración
          </ThemedText>
        </Pressable>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={signOut}
        style={({ pressed }) => [
          styles.button,
          { borderWidth: 1, borderColor: theme.line, opacity: pressed ? 0.7 : 1 },
        ]}>
        <Ionicons name="log-out-outline" size={18} color={theme.danger} />
        <ThemedText type="smallBold" themeColor="danger">
          Cerrar sesión
        </ThemedText>
      </Pressable>

      <ThemedText type="small" themeColor="textSecondary" style={styles.version}>
        Portal PDP · versión {Constants.expoConfig?.version ?? ''}
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
    borderRadius: 12,
    paddingVertical: 12,
  },
  version: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
});
