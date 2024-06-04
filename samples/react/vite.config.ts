import { defineConfig } from 'vite'
import { esbuildCommonjs, viteCommonjs } from "@originjs/vite-plugin-commonjs";
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills({
      globals: {
        Buffer: true,
      },
      overrides: {
        stream: 'stream-browserify',
      }
    }),
    viteCommonjs(),
    react()
  ],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        esbuildCommonjs(["typed-rest-client/HttpClient", "typed-rest-client/RestClient"]),
      ]
    }
  },
})
