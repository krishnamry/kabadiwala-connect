import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.kabadiwalaconnect.app',
  appName: 'Kabadiwala Connect',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1B2624'
    }
  }
};

export default config;
