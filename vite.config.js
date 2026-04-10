import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true, 
    cors: true 
  },
  build: {
    lib: {
      entry: 'src/italy-energy-bill-card.js',
      name: 'ItalyEnergyBillCard',
      fileName: () => 'italy-energy-bill-card.js',
      formats: ['es']
    },
    outDir: 'dist',
  },
});