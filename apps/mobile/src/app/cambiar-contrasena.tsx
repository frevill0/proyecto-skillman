import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
import { useSession } from '@/state/session';
import { notify } from '@/utils/notify';

const MIN_LENGTH = 8;

function changeErrorMessage(error: { code?: string; message: string }) {
  if (error.code === 'same_password') return 'La nueva contraseña debe ser distinta de la actual.';
  if (error.code === 'weak_password') return 'Esa contraseña es muy débil. Usa una más larga o con números.';
  if (/network|fetch/i.test(error.message)) return 'Sin conexión. Revisa tu internet e inténtalo de nuevo.';
  return 'No se pudo cambiar la contraseña. Inténtalo de nuevo.';
}

/**
 * Cambio de contraseña. Es obligatorio cuando la contraseña es temporal (la creó o restableció el
 * consultor); en ese caso no se pide la actual porque se acaba de usar para entrar.
 */
export default function ChangePasswordScreen() {
  const theme = useTheme();
  const { session, mustChangePassword: forced, signOut } = useSession();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!forced && !current) return setError('Escribe tu contraseña actual.');
    if (password.length < MIN_LENGTH) return setError(`La nueva contraseña debe tener al menos ${MIN_LENGTH} caracteres.`);
    if (password !== confirm) return setError('Las dos contraseñas no coinciden.');

    setBusy(true);
    setError(null);
    if (!forced) {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: session?.user.email ?? '',
        password: current,
      });
      if (authError) {
        setBusy(false);
        return setError('La contraseña actual no es correcta.');
      }
    }
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    });
    setBusy(false);
    if (updateError) return setError(changeErrorMessage(updateError));

    notify('Contraseña actualizada');
    // Si era obligatoria, al actualizarse la sesión la app pasa sola al inicio.
    if (!forced && router.canGoBack()) router.back();
  };

  const inputStyle = [
    styles.input,
    { borderColor: theme.line, backgroundColor: theme.backgroundElement, color: theme.text },
  ];

  const form = (
    <>
      {!forced && (
        <Field label="Contraseña actual">
          <TextInput
            style={inputStyle}
            value={current}
            onChangeText={setCurrent}
            secureTextEntry
            autoComplete="current-password"
          />
        </Field>
      )}
      <Field label="Nueva contraseña">
        <TextInput
          style={inputStyle}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />
      </Field>
      <Field label="Repite la nueva contraseña">
        <TextInput
          style={inputStyle}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoComplete="new-password"
          onSubmitEditing={save}
        />
      </Field>
      <ThemedText type="small" themeColor="textSecondary">
        Al menos {MIN_LENGTH} caracteres. No la compartas: tu consultor tampoco la conoce.
      </ThemedText>

      {error && (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      )}

      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={save}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.brand, opacity: pressed || busy ? 0.75 : 1 },
        ]}>
        {busy ? (
          <ActivityIndicator color={theme.brandInk} />
        ) : (
          <ThemedText type="smallBold" themeColor="brandInk">
            Guardar contraseña
          </ThemedText>
        )}
      </Pressable>
    </>
  );

  if (!forced) {
    return (
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {form}
      </ScrollView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.forced} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.forcedContent} keyboardShouldPersistTaps="handled">
            <BrandMark size={56} />
            <ThemedText type="subtitle" style={styles.title}>
              Crea tu contraseña
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              Entraste con una contraseña temporal. Elige una propia para seguir.
            </ThemedText>
            {form}
            <Pressable accessibilityRole="button" onPress={signOut} style={styles.link}>
              <ThemedText type="small" themeColor="textSecondary">
                Cerrar sesión
              </ThemedText>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText type="label" themeColor="textSecondary">
        {label}
      </ThemedText>
      {children}
    </View>
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
  forced: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  forcedContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  content: {
    padding: Spacing.three,
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
  link: {
    alignSelf: 'center',
    padding: Spacing.two,
  },
});
