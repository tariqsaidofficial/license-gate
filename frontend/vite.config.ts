import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
	plugins: [
		sveltekit(),
		nodePolyfills({
			include: ['buffer', 'crypto'],
		}),
	],

	css: {
		preprocessorOptions: {
			scss: {
				additionalData: '@use "src/variables.scss" as *;',
				api: 'modern-compiler',
				silenceDeprecations: ['legacy-js-api'],
			},
		},
	},

	// Suppress A11y warnings in development (should be fixed in production)
	server: {
		fs: {
			strict: false,
		},
	},
})
