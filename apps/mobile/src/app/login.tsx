import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

function loginErrorMessage(message: string) {
  if (/invalid login credentials/i.test(message)) return 'Correo o contraseña incorrectos.';
  if (/network|fetch/i.test(message)) return 'Sin conexión. Revisa tu internet e inténtalo de nuevo.';
  return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
}

export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    if (!email.trim() || !password) {
      setError('Escribe tu correo y tu contraseña.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setBusy(false);
    if (authError) setError(loginErrorMessage(authError.message));
  };

  const inputStyle = [
    styles.input,
    { borderColor: theme.line, backgroundColor: theme.backgroundElement, color: theme.text },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.form}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <BrandMark size={56} />
          <ThemedText type="subtitle" style={styles.title}>
            Tu documentación de protección de datos
          </ThemedText>
          <ThemedText themeColor="textSecondary">Acceso solo para clientes autorizados.</ThemedText>

          <View style={styles.field}>
            <ThemedText type="label" themeColor="textSecondary">
              Correo
            </ThemedText>
            <TextInput
              style={inputStyle}
              value={email}
              onChangeText={setEmail}
              placeholder="correo@empresa.ec"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholderTextColor={theme.textSecondary}
            />
          </View>
          <View style={styles.field}>
            <ThemedText type="label" themeColor="textSecondary">
              Contraseña
            </ThemedText>
            <TextInput
              style={inputStyle}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              onSubmitEditing={signIn}
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          {error && (
            <ThemedText type="small" themeColor="danger">
              {error}
            </ThemedText>
          )}

          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={signIn}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.brand, opacity: pressed || busy ? 0.75 : 1 },
            ]}>
            {busy ? (
              <ActivityIndicator color={theme.brandInk} />
            ) : (
              <ThemedText style={[styles.buttonText, { color: theme.brandInk }]}>Ingresar</ThemedText>
            )}
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary">
            Cada cliente ve únicamente las carpetas de su organización. Si no tienes acceso, pídeselo a
            tu consultor.
          </ThemedText>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  form: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    marginTop: Spacing.two,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.two,
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: 600,
  },
});
