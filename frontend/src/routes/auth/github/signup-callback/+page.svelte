<script lang="ts">
	import { goto } from '$app/navigation'
	import { onMount } from 'svelte'
	import { logSuccess } from '../../../../lib/stores/alerts'
	import { setLoggedIn } from '../../../../lib/stores/auth'
	import { trpc } from '../../../../lib/trpcClient'

	let loading = true
	let error = ''

	onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search)
		const code = urlParams.get('code')
		const errorParam = urlParams.get('error')

		if (errorParam) {
			error = 'GitHub authentication was cancelled or failed'
			loading = false
			return
		}

		if (!code) {
			error = 'No authorization code received from GitHub'
			loading = false
			return
		}

		// Get consent data from sessionStorage
		const agreedToTerms = sessionStorage.getItem('github_signup_terms') === 'true'
		const agreedToMarketing = sessionStorage.getItem('github_signup_marketing') === 'true'

		// Clear the stored data
		sessionStorage.removeItem('github_signup_terms')
		sessionStorage.removeItem('github_signup_marketing')

		if (!agreedToTerms) {
			error = 'You must agree to the terms and conditions to sign up.'
			loading = false
			return
		}

		try {
			const { userId, email } = await trpc.auth.loginWithGitHub.mutate({
				code,
				createAccountIfNotFound: true,
				marketingEmails: agreedToMarketing
			})

			setLoggedIn(userId, email)
			logSuccess('Successfully signed up with GitHub!')
			goto('/dashboard')
		} catch (err: any) {
			console.error('GitHub signup error:', err)
			
			if (err.data?.code === 'email-already-in-use') {
				error = 'An account with this GitHub email already exists. Please sign in instead.'
			} else if (err.data?.code === 'github-auth-error') {
				error = 'GitHub authentication failed. Please try again.'
			} else {
				error = 'An error occurred during GitHub authentication'
			}
			
			loading = false
		}
	})

	function goToSignUp() {
		goto('/auth/signup')
	}

	function goToLogin() {
		goto('/auth/login')
	}
</script>

<svelte:head>
	<title>GitHub OAuth Signup - LicenseGate</title>
</svelte:head>

<div class="flex flex-col items-center justify-center min-h-screen p-4">
	<div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
		{#if loading}
			<div class="text-center">
				<div class="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
				<h2 class="mt-4 text-xl font-semibold text-gray-700">Completing GitHub Sign Up...</h2>
				<p class="mt-2 text-gray-500">Please wait while we create your account.</p>
			</div>
		{:else if error}
			<div class="text-center">
				<div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
					<svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</div>
				<h2 class="mt-4 text-xl font-semibold text-gray-700">Sign Up Failed</h2>
				<p class="mt-2 text-gray-500">{error}</p>
				
				<div class="flex gap-3 mt-6">
					<button
						on:click={goToSignUp}
						class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						Back to Sign Up
					</button>
					<button
						on:click={goToLogin}
						class="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						Sign In
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
