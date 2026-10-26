import { Alert, Platform, ToastAndroid } from 'react-native';

/** Mensaje breve: toast nativo en Android, alerta en iOS y web. */
export function notify(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert(message);
  }
}
