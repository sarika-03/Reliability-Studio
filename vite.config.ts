import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/module.tsx'),
      name: 'plugin',
      formats: ['umd'], // Grafana requires UMD format
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
      output: {
        // UMD globals for dependencies
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@grafana/data': 'grafanaData',
          '@grafana/ui': 'grafanaUI',
          '@grafana/runtime': 'grafanaRuntime',
          lodash: '_',
          moment: 'moment',
        },
      },
    },
  },

  define: {
    'process.env': {},
  },
});
