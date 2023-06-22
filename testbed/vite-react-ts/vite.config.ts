import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { macrostyles } from '@macrostyles/core/vite';

export default defineConfig({
  plugins: [react(), macrostyles()],
});
