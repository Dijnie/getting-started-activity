import {defineConfig} from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  envDir: '../../',
  server: {
    proxy: {
      '/api': {
        target: 'https://8080.dijnie.dev',
        changeOrigin: true,
        ws: true,
      },
    },
    hmr: {
      clientPort: 443,
    },
    allowedHosts: true,
  },
});
