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

		<div class="flex flex-col gap-2">
			{#if PUBLIC_GOOGLE_AUTH_CLIENT_ID != 'none'}
				<div
					id="g_id_onload"
					data-client_id={PUBLIC_GOOGLE_AUTH_CLIENT_ID}
					data-context="signin"
					data-ux_mode="popup"
					data-callback="signInWithGoogleCallback"
					data-itp_support="true"
				/>

				<div class="flex justify-center">
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
					on:click={signInWithGitHub}
					disabled={loading}
					class="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
						<path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd"></path>
					</svg>
					Continue with GitHub
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
