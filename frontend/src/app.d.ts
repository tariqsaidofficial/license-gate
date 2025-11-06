// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
}

declare module '$env/static/public' {
	export const PUBLIC_BACKEND_URL: string
	export const PUBLIC_RECAPTCHA_SITE_KEY: string
	export const PUBLIC_GOOGLE_AUTH_CLIENT_ID: string
	export const PUBLIC_GITHUB_CLIENT_ID: string
	export const PUBLIC_DISABLE_RECAPTCHA: string
	export const PUBLIC_DISABLE_SIGN_UP: string
}

export { }

