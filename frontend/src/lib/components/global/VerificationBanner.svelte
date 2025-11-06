<script lang="ts">
	import { onMount } from 'svelte'
	import { userEmail } from '../../stores/auth'
	import { logError, logSuccess } from '../../stores/alerts'
	import { trpc } from '../../trpcClient'
	import Button from '../basics/Button.svelte'

	let isVerified = true
	let isResending = false
	let showBanner = false

	onMount(async () => {
		if ($userEmail) {
			try {
				const status = await trpc.verification.checkVerificationStatus.query({ 
					email: $userEmail 
				})
				
				if (status.exists && !status.verified) {
					isVerified = false
					showBanner = true
				}
			} catch (error) {
				console.error('Failed to check verification status:', error)
			}
		}
	})

	async function resendVerificationEmail() {
		if (!$userEmail) return
		
		try {
			isResending = true
			const result = await trpc.verification.resendVerification.mutate({ 
				email: $userEmail 
			})
			
			if (result.success) {
				logSuccess(`Verification email sent to ${$userEmail}`)
			} else {
				logError('Failed to send verification email')
			}
		} catch (error) {
			logError('Failed to send verification email')
		} finally {
			isResending = false
		}
	}

	function dismissBanner() {
		showBanner = false
		// Store in localStorage to prevent showing again in this session
		localStorage.setItem('verification-banner-dismissed', 'true')
	}

	// Check if banner was dismissed in this session
	onMount(() => {
		const wasDismissed = localStorage.getItem('verification-banner-dismissed')
		if (wasDismissed && wasDismissed === new Date().toDateString()) {
			// Only keep dismissed for the current day
			showBanner = false
		}
	})
</script>

{#if showBanner && !isVerified}
	<div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
		<div class="flex items-start">
			<div class="flex-shrink-0">
				<span class="material-icons text-yellow-400">warning</span>
			</div>
			<div class="ml-3 flex-1">
				<h3 class="text-sm font-medium text-yellow-800">
					Please verify your email address
				</h3>
				<div class="mt-2 text-sm text-yellow-700">
					<p>
						Your email address hasn't been verified yet. Please check your inbox and click the verification link.
						If you don't see the email, check your spam folder.
					</p>
				</div>
				<div class="mt-4 flex flex-wrap gap-2">
					<Button 
						size="sm" 
						on:click={resendVerificationEmail} 
						loading={isResending}
						class="bg-yellow-800 text-white hover:bg-yellow-900"
					>
						Resend verification email
					</Button>
					<Button 
						size="sm" 
						text 
						on:click={dismissBanner}
						class="text-yellow-800 hover:text-yellow-900"
					>
						Dismiss
					</Button>
				</div>
			</div>
			<div class="flex-shrink-0 ml-auto">
				<button
					type="button"
					class="inline-flex rounded-md bg-yellow-50 p-1.5 text-yellow-400 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
					on:click={dismissBanner}
				>
					<span class="sr-only">Close</span>
					<span class="material-icons text-sm">close</span>
				</button>
			</div>
		</div>
	</div>
{/if}
