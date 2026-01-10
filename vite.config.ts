import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/module.tsx'),
      name: 'plugin',
      formats: ['amd'], // AMD format for Grafana
      fileName: () => 'module.js',
    },
    outDir: 'dist',
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        '@grafana/data',
        '@grafana/ui',
        '@grafana/runtime',
        'lodash',
        'moment',
      ],
    },
  },

  define: {
    'process.env': {},
  },
});
