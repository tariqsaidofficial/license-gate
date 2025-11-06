<script lang="ts">
	import { goto } from '$app/navigation'
	import { PUBLIC_GITHUB_CLIENT_ID, PUBLIC_GOOGLE_AUTH_CLIENT_ID } from '$env/static/public'
	import { onMount } from 'svelte'
	import ConsentCheckBoxes from '../../../lib/components/auth/ConsentCheckBoxes.svelte'
	import Button from '../../../lib/components/basics/Button.svelte'
	import { setLoggedIn } from '../../../lib/stores/auth'
	import { trpc } from '../../../lib/trpcClient'

	let agreedToTerms = false
	let agreedToMarketing = false

	let loading = false

	let googleToken: string | null = null

	async function signUpWithGoogle(response: any) {
		googleToken = response.credential
	}

	async function signUpWithGitHub() {
		if (!PUBLIC_GITHUB_CLIENT_ID || PUBLIC_GITHUB_CLIENT_ID === 'none') return

		// Store the agreement status for the callback
		sessionStorage.setItem('github_signup_terms', agreedToTerms.toString())
		sessionStorage.setItem('github_signup_marketing', agreedToMarketing.toString())

		// Redirect to GitHub OAuth
		const redirectUri = `${window.location.origin}/auth/github/signup-callback`
		const githubUrl = `https://github.com/login/oauth/authorize?client_id=${PUBLIC_GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`
		
		window.location.href = githubUrl
	}

	async function completeSignup() {
		loading = true
		const { userId, email } = await trpc.auth.loginWithGoogle
			.mutate({
				token: googleToken!,
				createAccountIfNotFound: true,
				marketingEmails: agreedToMarketing,
			})
			.finally(() => {
				loading = false
			})
		setLoggedIn(userId, email)

		goto('/dashboard')
	}

	onMount(() => {
		// @ts-ignore
		window.signUpWithGoogleCallback = signUpWithGoogle

		return () => {
			// @ts-ignore
			delete window.signInWithGoogleCallback
		}
	})
</script>

<svelte:head>
	<script src="https://accounts.google.com/gsi/client" async defer></script>
</svelte:head>

<div class="flex flex-col w-[350px]">
	<h1 class="text-3xl font-semibold text-slate-700">Sign up</h1>

	{#if !googleToken}
		<Button href="/auth/signup-password" gray class="mt-8">Sign up using email</Button>

		{#if PUBLIC_GOOGLE_AUTH_CLIENT_ID != 'none'}
			<div class="my-2 text-sm text-center text-gray-500">or</div>

			<div
				id="g_id_onload"
				data-client_id={PUBLIC_GOOGLE_AUTH_CLIENT_ID}
				data-context="signup"
				data-ux_mode="popup"
				data-callback="signUpWithGoogleCallback"
				data-auto_prompt="false"
			/>

			<div class="flex justify-center">
				<div
					class="g_id_signin"
					data-type="standard"
					data-shape="rectangular"
					data-theme="outline"
					data-text="signup_with"
					data-size="large"
					data-logo_alignment="center"
				/>
			</div>
		{/if}

		{#if PUBLIC_GITHUB_CLIENT_ID != 'none'}
			<div class="my-2 text-sm text-center text-gray-500">or</div>

			<Button
				class="flex justify-center"
				on:click={signUpWithGitHub}
				disabled={loading}
				gray
			>
				{#if loading}
					<svg
						class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						/>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8v16a8 8 0 01-8-8z"
						/>
					</svg>
				{/if}
				<span class="text-sm font-medium">Sign up with GitHub</span>
			</Button>
		{/if}
	{:else}
		<ConsentCheckBoxes bind:agreedToTerms bind:agreedToMarketing />
		<Button class="mt-4" on:click={completeSignup} {loading} disabled={!agreedToTerms}>
			Complete sign up
		</Button>
	{/if}

	<div class="mt-4">
		<a href="/auth/login" class="text-blue-500">Already have an account?</a>
	</div>
</div>
