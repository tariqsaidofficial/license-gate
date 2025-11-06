<script lang="ts">
	import { goto } from '$app/navigation'
	import { onMount } from 'svelte'
	import Button from '../../lib/components/basics/Button.svelte'
	import Skeleton from '../../lib/components/basics/Skeleton.svelte'
	import { logError } from '../../lib/stores/alerts'
	import { showError, showVerificationSent, showVerificationSuccess } from '../../lib/stores/toast'
	import { trpc } from '../../lib/trpcClient'

	let verificationState: 'loading' | 'success' | 'invalid-token' | 'expired-token' | 'server-error' = 'loading'
	let isResending = false
	let email = ''
	let token = ''

	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search)
		token = urlParams.get('token') || ''
		email = urlParams.get('email') || ''

		if (token) {
			verifyEmail()
		} else {
			verificationState = 'invalid-token'
		}
	})

	async function verifyEmail() {
		try {
			verificationState = 'loading'
			const result = await trpc.verification.verifyEmail.mutate({ token })
			
			if (result.success) {
				verificationState = 'success'
				showVerificationSuccess()
				
				// Redirect to dashboard after 3 seconds
				setTimeout(() => {
					goto('/dashboard')
				}, 3000)
			} else {
				verificationState = 'invalid-token'
			}
		} catch (error: any) {
			console.error('Email verification failed:', error)
			
			if (error.message?.includes('expired')) {
				verificationState = 'expired-token'
			} else if (error.message?.includes('invalid')) {
				verificationState = 'invalid-token'
			} else {
				verificationState = 'server-error'
				logError('An error occurred during email verification')
			}
		}
	}

	async function resendEmail() {
		if (!email) return
		
		try {
			isResending = true
			const result = await trpc.verification.resendVerification.mutate({ email })
			
			if (result.success) {
				showVerificationSent(email)
			} else {
				showError('Failed to send verification email')
			}
		} catch (error) {
			showError('Failed to send verification email')
		} finally {
			isResending = false
		}
	}
</script>

<svelte:head>
	<title>Email Verification - LicenseGate</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div>
			<div class="mx-auto h-12 w-auto flex justify-center">
				<img class="h-12" src="/logo.svg" alt="LicenseGate" />
			</div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				Email Verification
			</h2>
		</div>

		<div class="mt-8 space-y-6">
			<div class="rounded-md bg-white shadow-sm p-6">
				{#if verificationState === 'loading'}
					<div class="text-center">
						<div class="mb-4">
							<Skeleton class="h-16 w-16 rounded-full mx-auto" />
						</div>
						<h3 class="text-lg font-medium text-gray-900 mb-2">Verifying...</h3>
						<p class="text-sm text-gray-600">Please wait while we verify your email address</p>
					</div>
				{:else if verificationState === 'success'}
					<div class="text-center">
						<div class="mb-4">
							<div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
								<span class="material-icons text-green-600 text-2xl">check_circle</span>
							</div>
						</div>
						<h3 class="text-lg font-medium text-gray-900 mb-2">Email Verified!</h3>
						<p class="text-sm text-gray-600 mb-4">
							Your email address has been successfully verified. You will be redirected to the dashboard shortly...
						</p>
						<Button on:click={() => goto('/dashboard')}>
							Go to Dashboard
						</Button>
					</div>
				{:else if verificationState === 'invalid-token'}
					<div class="text-center">
						<div class="mb-4">
							<div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
								<span class="material-icons text-red-600 text-2xl">error</span>
							</div>
						</div>
						<h3 class="text-lg font-medium text-gray-900 mb-2">Invalid Link</h3>
						<p class="text-sm text-gray-600 mb-4">
							The verification link is invalid or corrupted. Please check the link or request a new verification email.
						</p>
						{#if email}
							<Button on:click={resendEmail} loading={isResending} class="mb-2">
								Resend verification email
							</Button>
						{/if}
						<Button text on:click={() => goto('/auth/login')}>
							Back to Login
						</Button>
					</div>
				{:else if verificationState === 'expired-token'}
					<div class="text-center">
						<div class="mb-4">
							<div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
								<span class="material-icons text-yellow-600 text-2xl">schedule</span>
							</div>
						</div>
						<h3 class="text-lg font-medium text-gray-900 mb-2">Link Expired</h3>
						<p class="text-sm text-gray-600 mb-4">
							The verification link has expired. Please request a new verification email.
						</p>
						{#if email}
							<Button on:click={resendEmail} loading={isResending} class="mb-2">
								Resend verification email
							</Button>
						{/if}
						<Button text on:click={() => goto('/auth/login')}>
							Back to Login
						</Button>
					</div>
				{:else if verificationState === 'server-error'}
					<div class="text-center">
						<div class="mb-4">
							<div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
								<span class="material-icons text-red-600 text-2xl">error_outline</span>
							</div>
						</div>
						<h3 class="text-lg font-medium text-gray-900 mb-2">Server Error</h3>
						<p class="text-sm text-gray-600 mb-4">
							An unexpected error occurred. Please try again or contact support.
						</p>
						<Button on:click={verifyEmail} class="mb-2">
							Try Again
						</Button>
						<Button text on:click={() => goto('/auth/login')}>
							Back to Login
						</Button>
					</div>
				{/if}
			</div>

			{#if email}
				<div class="text-center">
					<p class="text-sm text-gray-500">
						Email: <span class="font-medium">{email}</span>
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
