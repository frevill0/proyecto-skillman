import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';

type SupabaseExtra = { supabaseUrl?: string; supabasePublishableKey?: string };
const extra = (Constants.expoConfig?.extra ?? {}) as SupabaseExtra;

// La clave publicable es pública por diseño: la seguridad la dan las políticas RLS del servidor.
export const supabase = createClient(extra.supabaseUrl ?? '', extra.supabasePublishableKey ?? '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Renueva el token solo mientras la app está en primer plano.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export const BUCKET = 'documentos';
/** Los enlaces firmados caducan a los 5 minutos. */
export const SIGNED_URL_SECONDS = 300;
