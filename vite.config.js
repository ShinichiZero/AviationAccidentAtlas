import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],

  build: {
    // Target modern mobile browsers
    target: ['es2020', 'chrome87', 'safari14'],

    // Optimise chunk splitting for mobile networks (rolldown)
    rolldownOptions: {
      output: {
        codeSplitting: {
          strategy: 'by-size',
          minSize: 20_000
        }
      }
    },

    // Increase inline limit for small assets to reduce HTTP requests on mobile
    assetsInlineLimit: 4096,

    // Enable minification via Oxc (Vite 8 default, no separate install needed)
    minify: 'oxc',

    // Raise warning limit (MapTiler SDK is inherently large; gzip ~358 kB)
    chunkSizeWarningLimit: 1500
  },

  // Optimise dev server for faster HMR
  server: {
    host: true,
    port: 5173
  },

  // Pre-bundle heavy deps to speed up dev & reduce mobile load
  optimizeDeps: {
    include: ['@maptiler/sdk', 'd3', 'supercluster']
  }
});
