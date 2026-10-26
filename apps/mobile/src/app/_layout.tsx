import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { DemoProvider, useDemo } from '@/state/demo-store';

function navigationTheme(scheme: 'light' | 'dark'): Theme {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const c = Colors[scheme];
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: c.brand,
      background: c.background,
      card: c.background,
      text: c.text,
      border: c.line,
      notification: c.accent,
    },
  };
}

function RootStack() {
  const { user } = useDemo();
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal', headerShadowVisible: false }}>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="seccion/[id]" options={{ title: '' }} />
        <Stack.Screen name="documento/[sec]/[doc]" options={{ title: '' }} />
        <Stack.Screen name="admin" options={{ title: 'Vista de administrador' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return (
    <ThemeProvider value={navigationTheme(scheme)}>
      <DemoProvider>
        <StatusBar style="auto" />
        <RootStack />
      </DemoProvider>
    </ThemeProvider>
  );
}
