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

	<Button {loading} on:click={login} class="mt-4 oauth-button-base !bg-blue-500 !text-white border-none">Login</Button>

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
					class="oauth-button-base google-signin-button"
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
					class="oauth-button-base github-signin-button"
				>
					<svg fill="#ffffff" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
						<g stroke-width="0" id="SVGRepo_bgCarrier"></g>
						<g stroke-linejoin="round" stroke-linecap="round" id="SVGRepo_tracerCarrier"></g>
						<g id="SVGRepo_iconCarrier">
							<title>github</title>
							<rect fill="none" height="24" width="24"></rect>
							<path d="M12,2A10,10,0,0,0,8.84,21.5c.5.08.66-.23.66-.5V19.31C6.73,19.91,6.14,18,6.14,18A2.69,2.69,0,0,0,5,16.5c-.91-.62.07-.6.07-.6a2.1,2.1,0,0,1,1.53,1,2.15,2.15,0,0,0,2.91.83,2.16,2.16,0,0,1,.63-1.34C8,16.17,5.62,15.31,5.62,11.5a3.87,3.87,0,0,1,1-2.71,3.58,3.58,0,0,1,.1-2.64s.84-.27,2.75,1a9.63,9.63,0,0,1,5,0c1.91-1.29,2.75-1,2.75-1a3.58,3.58,0,0,1,.1,2.64,3.87,3.87,0,0,1,1,2.71c0,3.82-2.34,4.66-4.57,4.91a2.39,2.39,0,0,1,.69,1.85V21c0,.27.16.59.67.5A10,10,0,0,0,12,2Z"></path>
						</g>
					</svg>
					Continue with Github
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
		border: 1px solid rgba(0, 0, 0, 0.25);
		color: rgb(65, 63, 63);
		background-color: #fff;
	}
	
	.github-signin-button {
		background-color: rgb(24, 23, 23);
		color: #ffffff;
		border: none;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}
	
	.github-signin-button:hover {
		box-shadow: none;
	}
</style>
