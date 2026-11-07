import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { kapMiddleware } from './server/kap-service.mjs'
import { stockMiddleware } from './server/stock-service.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), {
    name: 'bestbrands-kap',
    configureServer(server) {
      server.middlewares.use('/api/kap-disclosures', kapMiddleware)
      server.middlewares.use('/api/stock-quote', stockMiddleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/kap-disclosures', kapMiddleware)
      server.middlewares.use('/api/stock-quote', stockMiddleware)
    },
  }],
})
