<script lang="ts">
	import { goto } from '$app/navigation'
	import { PUBLIC_DISABLE_SIGN_UP, PUBLIC_GITHUB_CLIENT_ID, PUBLIC_GOOGLE_AUTH_CLIENT_ID } from '$env/static/public'
	import { onMount } from 'svelte'
	import Button from '../../../lib/components/basics/Button.svelte'
	import { logSuccess } from '../../../lib/stores/alerts'
	import { setLoggedIn } from '../../../lib/stores/auth'
	import { trpc } from '../../../lib/trpcClient'

	let email = ''
	let password = ''

	let inputIssue = ''
	let showIssue = false
	$: {
		if (email === '' || !isValidEmail()) {
			inputIssue = 'Email is required'
		} else if (password === '') {
			inputIssue = 'Password is required'
		} else {
			inputIssue = ''
		}
	}

	function isValidEmail() {
		// https://stackoverflow.com/a/46181/2715716
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
	}

	onMount(async () => {
		// Get token from url
		const urlParams = new URLSearchParams(window.location.search)
		const token = urlParams.get('token')
		const urlEmail = urlParams.get('email')

		if (token && urlEmail) {
			email = urlEmail
			await trpc.auth.verifyEmail.mutate({ token, email: urlEmail })
			logSuccess('Your email address has been verified.')

			// Clear url params
			window.history.replaceState({}, document.title, '/')
		}

		// Register signInWithGoogle callback as global function
		// @ts-ignore
		window.signInWithGoogleCallback = signInWithGoogle

		return () => {
			// @ts-ignore
			delete window.signInWithGoogleCallback
		}
	})

	let loading = false

	async function login() {
		if (inputIssue) {
			showIssue = true
			return
		}

		loading = true
		const { userId } = await trpc.auth.loginWithPassword.mutate({ email, password }).finally(() => {
			loading = false
		})
		setLoggedIn(userId, email.toLowerCase())

		goto('/dashboard')
	}

	async function signInWithGoogle(response: any) {
		loading = true
		const { userId, email } = await trpc.auth.loginWithGoogle
			.mutate({ token: response.credential, createAccountIfNotFound: false })
			.finally(() => {
				loading = false
			})
		setLoggedIn(userId, email)

		goto('/dashboard')
	}

	async function signInWithGitHub() {
		if (!PUBLIC_GITHUB_CLIENT_ID || PUBLIC_GITHUB_CLIENT_ID === 'none') return

		// Redirect to GitHub OAuth
		const redirectUri = `${window.location.origin}/auth/github/callback`
		const githubUrl = `https://github.com/login/oauth/authorize?client_id=${PUBLIC_GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`
		
		window.location.href = githubUrl
	}
</script>

<svelte:head>
	<script src="https://accounts.google.com/gsi/client" async defer></script>
</svelte:head>

<form class="flex flex-col w-[350px] max-w-full" on:submit|preventDefault={login}>
	<h1 class="text-3xl font-semibold text-slate-700">Sign in</h1>
	<span class="text-orange-400">
		{inputIssue && showIssue ? inputIssue : ''}&nbsp;
	</span>
	<input
		type="email"
		placeholder="Email"
		name="email"
		autocomplete="username"
		class="mt-2"
		bind:value={email}
	/>
	<input
		type="password"
		placeholder="Password"
		name="password"
		class="mt-2"
		bind:value={password}
		on:keypress={(e) => e.key === 'Enter' && login()}
	/>

	<Button {loading} on:click={login} class="mt-4">Login</Button>

	{#if PUBLIC_GOOGLE_AUTH_CLIENT_ID != 'none' || (PUBLIC_GITHUB_CLIENT_ID && PUBLIC_GITHUB_CLIENT_ID != 'none')}
		<div class="my-2 text-sm text-center text-gray-500">or</div>

		<div class="flex flex-col gap-3">
			{#if PUBLIC_GOOGLE_AUTH_CLIENT_ID != 'none'}
				<div
					id="g_id_onload"
					data-client_id={PUBLIC_GOOGLE_AUTH_CLIENT_ID}
					data-context="signin"
					data-ux_mode="popup"
					data-callback="signInWithGoogleCallback"
					data-itp_support="true"
				/>

				<button 
					type="button"
					aria-label="Continue with Google"
					disabled={loading}
					class="google-signin-button"
					on:click={() => {
						// Trigger Google Sign-In programmatically
						const googleButton = document.querySelector('.g_id_signin');
						if (googleButton) {
							googleButton.click();
						}
					}}
				>
					<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" viewBox="0 0 256 262">
						<path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"></path>
						<path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"></path>
						<path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"></path>
						<path fill="#EB4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"></path>
					</svg>
					Continue with Google
				</button>

				<!-- Hidden Google button for programmatic trigger -->
				<div class="hidden">
					<div
						class="g_id_signin"
						data-type="standard"
						data-shape="rectangular"
						data-theme="outline"
						data-text="signin_with"
						data-size="large"
						data-logo_alignment="center"
					/>
				</div>
			{/if}

			{#if PUBLIC_GITHUB_CLIENT_ID && PUBLIC_GITHUB_CLIENT_ID != 'none'}
				<button
					type="button"
					aria-label="Continue with GitHub"
					on:click={signInWithGitHub}
					disabled={loading}
					class="flex items-center justify-center gap-[0.75em] px-[1.25em] py-[0.75em] rounded-lg font-semibold text-[0.9rem] transition-all border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 shadow-sm w-full sm:w-auto"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						class="w-[1.5em] h-[1.5em] flex-shrink-0"
						aria-hidden="true"
						fill="currentColor"
					>
						<path
							d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.84 10.93c.57.1.78-.25.78-.56v-2.06c-3.18.7-3.85-1.53-3.85-1.53-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.54-.3-5.22-1.27-5.22-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.52-1.45.11-3.02 0 0 .97-.31 3.18 1.18a10.95 10.95 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.57.23 2.73.11 3.02.74.8 1.17 1.82 1.17 3.07 0 4.4-2.68 5.36-5.24 5.66.41.35.77 1.03.77 2.08v3.08c0 .31.21.67.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z"
						></path>
					</svg>
					<span>Continue with GitHub</span>
				</button>
			{/if}
		</div>
	{/if}

	<div class="mt-4">
		<a href="/auth/reset-password" class="text-blue-500">Forgot your password?</a>
	</div>
	{#if PUBLIC_DISABLE_SIGN_UP !== 'true'}
		<div>
			<span>Don't have an account?</span>
			<a href="/auth/signup" class="text-blue-500">Sign up</a>
		</div>
	{/if}
</form>

<style>
	.google-signin-button {
		max-width: 320px;
		display: flex;
		padding: 0.5rem 1.4rem;
		font-size: 0.875rem;
		line-height: 1.25rem;
		font-weight: 700;
		text-align: center;
		text-transform: uppercase;
		vertical-align: middle;
		align-items: center;
		border-radius: 0.5rem;
		border: 1px solid rgba(0, 0, 0, 0.25);
		gap: 0.75rem;
		color: rgb(65, 63, 63);
		background-color: #fff;
		cursor: pointer;
		transition: all .6s ease;
		width: 100%;
	}
	
	.google-signin-button svg {
		height: 24px;
	}
	
	.google-signin-button:hover {
		transform: scale(1.02);
	}
	
	.google-signin-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}
</style>
