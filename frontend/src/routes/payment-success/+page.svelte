<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { onMount } from 'svelte'
	import Button from '../../lib/components/basics/Button.svelte'
	import Skeleton from '../../lib/components/basics/Skeleton.svelte'
	import VerificationBanner from '../../lib/components/global/VerificationBanner.svelte'
	import { userEmail } from '../../lib/stores/auth'
	import { showError, showPaymentSuccess, showVerificationSent } from '../../lib/stores/toast'
	import { trpc } from '../../lib/trpcClient'

	let paymentStatus: 'loading' | 'success' | 'failed' | 'not-found' = 'loading'
	let licenseInfo: any = null
	let isEmailVerified = true
	let isResendingEmail = false

	onMount(async () => {
		const paymentId = $page.url.searchParams.get('payment_id')
		const orderId = $page.url.searchParams.get('order_id')
		
		if (paymentId || orderId) {
			await checkPaymentStatus(paymentId || orderId || '')
		} else {
			paymentStatus = 'not-found'
		}

		// Check email verification status
		if ($userEmail) {
			await checkEmailVerificationStatus()
		}
	})

	async function checkPaymentStatus(id: string) {
		try {
			// For now, just simulate success since we don't have payment API
			// In real implementation, this would check actual payment status
			await new Promise(resolve => setTimeout(resolve, 2000))
			
			paymentStatus = 'success'
			showPaymentSuccess()
			licenseInfo = {
				licenseKey: 'DEMO-XXXX-XXXX-XXXX',
				expirationDate: null,
				scope: 'premium',
				status: 'active'
			}
		} catch (error) {
			console.error('Payment verification failed:', error)
			paymentStatus = 'failed'
		}
	}

	async function checkEmailVerificationStatus() {
		try {
			const status = await trpc.verification.checkVerificationStatus.query({ 
				email: $userEmail! 
			})
			
			isEmailVerified = status.verified
		} catch (error) {
			console.error('Failed to check email verification:', error)
		}
	}

	async function resendVerificationEmail() {
		if (!$userEmail) return
		
		try {
			isResendingEmail = true
			const result = await trpc.verification.resendVerification.mutate({ 
				email: $userEmail 
			})
			
			if (result.success) {
				showVerificationSent($userEmail!)
			}
		} catch (error) {
			showError('Failed to send verification email')
		} finally {
			isResendingEmail = false
		}
	}
</script>

<svelte:head>
	<title>Payment Successful - LicenseGate</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-3xl mx-auto">
		{#if paymentStatus === 'loading'}
			<div class="text-center">
				<div class="mb-8">
					<Skeleton class="h-16 w-16 rounded-full mx-auto" />
				</div>
				<h1 class="text-3xl font-bold text-gray-900 mb-4">Processing Payment...</h1>
				<p class="text-lg text-gray-600 mb-8">
					Please wait while we verify your payment status
				</p>
				<div class="bg-white rounded-lg shadow p-6">
					<div class="animate-pulse">
						<Skeleton class="h-4 mb-3" />
						<Skeleton class="h-4 w-3/4 mb-3" />
						<Skeleton class="h-4 w-1/2" />
					</div>
				</div>
			</div>
		{:else if paymentStatus === 'success'}
			<div class="text-center mb-8">
				<div class="mb-6">
					<div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
						<span class="material-icons text-green-600 text-3xl">check_circle</span>
					</div>
				</div>
				<h1 class="text-3xl font-bold text-gray-900 mb-4">Payment Successful! 🎉</h1>
				<p class="text-lg text-gray-600 mb-8">
					Congratulations! Your payment has been processed successfully and your license has been created.
				</p>
			</div>

			{#if !isEmailVerified}
				<VerificationBanner />
			{/if}

			{#if licenseInfo}
				<div class="bg-white rounded-lg shadow-lg p-6 mb-8">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">License Information</h2>
					
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
						<div class="bg-gray-50 rounded-lg p-4">
							<div class="text-sm font-medium text-gray-500">License Key</div>
							<div class="text-lg font-mono text-gray-900 mt-1 break-all">
								{licenseInfo.licenseKey}
							</div>
						</div>
						
						<div class="bg-gray-50 rounded-lg p-4">
							<div class="text-sm font-medium text-gray-500">Expiration Date</div>
							<div class="text-lg text-gray-900 mt-1">
								{licenseInfo.expirationDate ? new Date(licenseInfo.expirationDate).toLocaleDateString() : 'Never expires'}
							</div>
						</div>
						
						{#if licenseInfo.scope}
							<div class="bg-gray-50 rounded-lg p-4">
								<div class="text-sm font-medium text-gray-500">Scope</div>
								<div class="text-lg text-gray-900 mt-1">{licenseInfo.scope}</div>
							</div>
						{/if}
						
						<div class="bg-gray-50 rounded-lg p-4">
							<div class="text-sm font-medium text-gray-500">Status</div>
							<div class="flex items-center mt-1">
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
									Active
								</span>
							</div>
						</div>
					</div>

					{#if !isEmailVerified}
						<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
							<div class="flex items-start">
								<span class="material-icons text-yellow-600 mt-0.5 ml-2">info</span>
								<div>
									<h3 class="text-sm font-medium text-yellow-800 mb-1">
										Email Verification Required
									</h3>
									<p class="text-sm text-yellow-700">
										To receive license notifications and important updates, please verify your email address.
									</p>
								</div>
							</div>
						</div>
					{/if}

					<div class="flex flex-wrap gap-3">
						<Button on:click={() => goto('/licenses')}>
							View All Licenses
						</Button>
						<Button outlined on:click={() => goto('/dashboard')}>
							Go to Dashboard
						</Button>
					</div>
				</div>
			{/if}

			<div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
				<h3 class="text-lg font-medium text-blue-900 mb-3">Next Steps</h3>
				<ul class="space-y-2 text-sm text-blue-800">
					<li class="flex items-start">
						<span class="material-icons text-blue-600 text-sm mt-0.5 ml-2">check</span>
						Save your license key in a secure location
					</li>
					<li class="flex items-start">
						<span class="material-icons text-blue-600 text-sm mt-0.5 ml-2">integration_instructions</span>
						Review the <a href="/test" class="underline hover:no-underline">integration guide</a> to learn how to use your license
					</li>
					{#if !isEmailVerified}
						<li class="flex items-start">
							<span class="material-icons text-blue-600 text-sm mt-0.5 ml-2">email</span>
							Verify your email address to receive notifications and updates
						</li>
					{/if}
				</ul>
			</div>
		{:else if paymentStatus === 'failed'}
			<div class="text-center">
				<div class="mb-6">
					<div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
						<span class="material-icons text-red-600 text-3xl">error</span>
					</div>
				</div>
				<h1 class="text-3xl font-bold text-gray-900 mb-4">Payment Processing Failed</h1>
				<p class="text-lg text-gray-600 mb-8">
					Sorry, there was an error processing your payment. Please try again or contact support.
				</p>
				
				<div class="flex flex-wrap gap-3 justify-center">
					<Button on:click={() => goto('/pricing')}>
						Try Payment Again
					</Button>
					<Button outlined on:click={() => goto('/dashboard')}>
						Back to Dashboard
					</Button>
				</div>
			</div>
		{:else if paymentStatus === 'not-found'}
			<div class="text-center">
				<div class="mb-6">
					<div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100">
						<span class="material-icons text-gray-600 text-3xl">search_off</span>
					</div>
				</div>
				<h1 class="text-3xl font-bold text-gray-900 mb-4">Payment Information Not Found</h1>
				<p class="text-lg text-gray-600 mb-8">
					No valid payment information found in this link.
				</p>
				
				<Button on:click={() => goto('/dashboard')}>
					Back to Dashboard
				</Button>
			</div>
		{/if}
	</div>
</div>
