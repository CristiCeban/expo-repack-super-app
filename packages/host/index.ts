import { ScriptManager } from '@callstack/repack/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import App from './src/App';

// Keep the native splash screen until the auth state and navigation are ready.
SplashScreen.preventAutoHideAsync();

if (!__DEV__) {
  // Cache downloaded mini app scripts between launches in release builds.
  ScriptManager.shared.setStorage(AsyncStorage);
}

registerRootComponent(App);
