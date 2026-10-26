import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View, type ColorValue } from 'react-native';

import { Loading } from '@/components/states';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/state/session';

type IconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(active: IconName, inactive: IconName) {
  return function TabIcon({ focused, color, size }: { focused: boolean; color: ColorValue; size: number }) {
    return <Ionicons name={focused ? active : inactive} color={color as string} size={size} />;
  };
}

export default function TabLayout() {
  const theme = useTheme();
  const { profile, profileLoading } = useSession();

  if (profileLoading) return <Loading />;
  if (!profile?.active) return <NoAccess />;

  const firstName = profile.full_name?.split(' ')[0];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.brand,
        tabBarInactiveTintColor: theme.textSecondary,
        headerShadowVisible: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          headerTitle: firstName ? `Hola, ${firstName}` : 'Inicio',
          tabBarIcon: tabIcon('home', 'home-outline'),
        }}
      />
      <Tabs.Screen
        name="buscar"
        options={{ title: 'Buscar', tabBarIcon: tabIcon('search', 'search-outline') }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: tabIcon('person', 'person-outline') }}
      />
    </Tabs>
  );
}

/** El usuario existe en Auth pero no tiene perfil activo (revocado o sin asignar). */
function NoAccess() {
  const theme = useTheme();
  const { signOut } = useSession();
  return (
    <View style={[styles.center, { backgroundColor: theme.background }]}>
      <Ionicons name="lock-closed-outline" size={40} color={theme.textSecondary} />
      <ThemedText type="smallBold">Tu acceso no está activo</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.text}>
        Pídele a tu consultor que revise tu usuario.
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        onPress={signOut}
        style={[styles.button, { borderColor: theme.line }]}>
        <ThemedText type="smallBold">Cerrar sesión</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  text: {
    textAlign: 'center',
  },
  button: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.three,
  },
});
