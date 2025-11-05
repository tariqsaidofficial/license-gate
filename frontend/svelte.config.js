import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/kit/vite'
import sveltePreprocess from 'svelte-preprocess'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: [
		vitePreprocess(),
		sveltePreprocess({
			scss: {
				api: 'modern-compiler'
			},
			sass: {
				api: 'modern-compiler'
			}
		})
	],

	kit: {
		adapter: adapter({
			fallback: 'index.html',
		}),
		prerender: { entries: [] },
	},
}

export default config
