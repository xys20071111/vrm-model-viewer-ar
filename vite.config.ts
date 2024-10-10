import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    build: {
        target: 'chrome120'
    },
    base: './',
    plugins: [
        VitePWA({
            includeAssets: ['vite.svg'],
            manifest: {
                name: '使用AR的VRM模型查看器',
                short_name: 'ar-dance',
                description: '使用AR的VRM模型查看器',
                theme_color: '#ffffff',
                icons: [
                    {
                        src: 'vite.svg',
                        sizes: '192x192',
                        type: 'image/svg'
                    },
                    {
                        src: 'vite.svg',
                        sizes: '512x512',
                        type: 'image/svg'
                    }
                ]
            }
        })
    ]
})