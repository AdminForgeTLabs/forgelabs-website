import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/static';

export default defineConfig({
  site: 'https://forgetlabs.com',
  output: 'static',
  adapter: vercel(),
  build: { format: 'file' }
});
