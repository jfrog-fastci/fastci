import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://jfrog-fastci.github.io',
  base: '/fastci',
  integrations: [react(), tailwind()],
  output: 'static',
});
