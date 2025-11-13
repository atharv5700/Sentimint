import { CapacitorConfig } from '@capacitor/cli';

// FIX: The 'bundledWebRuntime' property is deprecated and has been removed from the config object below to resolve the type error.
const config: CapacitorConfig = {
  appId: 'com.sentimint.app',
  appName: 'Sentimint',
  webDir: 'build',
};

export default config;
