import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    build: {
        target: 'chrome120'
    },
    base: './',
    plugins: [
        VitePWA()
    ]
})