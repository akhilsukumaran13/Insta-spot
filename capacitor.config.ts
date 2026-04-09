import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.instaspot.app',
  appName: 'InstaSpot Parking',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
