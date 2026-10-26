import { useState } from 'react';
import {
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
import { DEMO_PASSWORD, DEMO_USER } from '@/data/demo';
import { useTheme } from '@/hooks/use-theme';
import { useDemo } from '@/state/demo-store';

export default function LoginScreen() {
  const theme = useTheme();
  const { signIn } = useDemo();
  const [email, setEmail] = useState(DEMO_USER.email);
  const [password, setPassword] = useState(DEMO_PASSWORD);

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
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => signIn(email)}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.brand, opacity: pressed ? 0.85 : 1 },
            ]}>
            <ThemedText style={[styles.buttonText, { color: theme.brandInk }]}>Ingresar</ThemedText>
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary">
            Cada cliente ve únicamente sus propias carpetas. Versión de demostración con datos de
            ejemplo.
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
  },
  buttonText: {
    fontWeight: 600,
  },
});
