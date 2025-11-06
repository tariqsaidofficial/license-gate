<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { onDestroy, onMount } from 'svelte'
	import Button from '../../lib/components/basics/Button.svelte'
	import { logSuccess } from '../../lib/stores/alerts'

	let paymentId = ''
	let orderId = ''
	let pollingInterval: NodeJS.Timeout | null = null
	let attempts = 0
	let maxAttempts = 30 // 30 attempts = 5 minutes with 10 second intervals
	let status: 'checking' | 'completed' | 'failed' | 'timeout' = 'checking'

	onMount(() => {
		paymentId = $page.url.searchParams.get('payment_id') || ''
		orderId = $page.url.searchParams.get('order_id') || ''
		
		if (paymentId || orderId) {
			startPolling()
		} else {
			status = 'failed'
		}
	})

	onDestroy(() => {
		if (pollingInterval) {
			clearInterval(pollingInterval)
		}
	})

	function startPolling() {
		checkPaymentStatus()
		
		pollingInterval = setInterval(() => {
			attempts++
			
			if (attempts >= maxAttempts) {
				status = 'timeout'
				if (pollingInterval) clearInterval(pollingInterval)
				return
			}
			
			checkPaymentStatus()
		}, 10000) // Check every 10 seconds
	}

	async function checkPaymentStatus() {
		try {
			const id = paymentId || orderId
			if (!id) return

			// This would be the actual API call to check payment status
			// For now, simulate the check
			const result = await simulatePaymentCheck(id)
			
			if (result.status === 'completed') {
				status = 'completed'
				logSuccess('Payment completed successfully!')
				if (pollingInterval) clearInterval(pollingInterval)
				
				// Redirect to success page
				setTimeout(() => {
					goto(`/payment-success?payment_id=${id}`)
				}, 2000)
			} else if (result.status === 'failed') {
				status = 'failed'
				if (pollingInterval) clearInterval(pollingInterval)
			}
			// If status is 'pending', continue polling
		} catch (error) {
			console.error('Payment status check failed:', error)
		}
	}

	// Simulate payment status check - replace with actual API call
	async function simulatePaymentCheck(id: string) {
		// Simulate random completion after some attempts
		if (attempts > 5 && Math.random() > 0.7) {
			return { status: 'completed' }
		}
		
		if (attempts > 20) {
			return { status: 'failed' }
		}
		
		return { status: 'pending' }
	}

	function retryCheck() {
		attempts = 0
		status = 'checking'
		startPolling()
	}

	function getStatusMessage() {
		switch (status) {
			case 'checking':
				return `Checking payment status... (Attempt ${attempts + 1}/${maxAttempts})`
			case 'completed':
				return 'Payment completed successfully!'
			case 'failed':
				return 'Payment verification failed'
			case 'timeout':
				return 'Payment verification timed out'
			default:
				return 'Checking payment...'
		}
	}
</script>

<svelte:head>
	<title>Payment Processing - LicenseGate</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-2xl mx-auto text-center">
		{#if status === 'checking'}
			<div class="mb-8">
				<div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				</div>
			</div>
			<h1 class="text-3xl font-bold text-gray-900 mb-4">Processing Payment</h1>
			<p class="text-lg text-gray-600 mb-8">
				{getStatusMessage()}
			</p>
			<p class="text-sm text-gray-500">
				Please don't close this page. We'll redirect you automatically once payment is confirmed.
			</p>
		{:else if status === 'completed'}
			<div class="mb-8">
				<div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
					<span class="material-icons text-green-600 text-3xl">check_circle</span>
				</div>
			</div>
			<h1 class="text-3xl font-bold text-gray-900 mb-4">Payment Successful! 🎉</h1>
			<p class="text-lg text-gray-600 mb-8">
				Your payment has been processed successfully. Redirecting you to the success page...
			</p>
		{:else if status === 'failed'}
			<div class="mb-8">
				<div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
					<span class="material-icons text-red-600 text-3xl">error</span>
				</div>
			</div>
			<h1 class="text-3xl font-bold text-gray-900 mb-4">Payment Failed</h1>
			<p class="text-lg text-gray-600 mb-8">
				We couldn't verify your payment. This might be a temporary issue.
			</p>
			<div class="flex flex-wrap gap-3 justify-center">
				<Button on:click={retryCheck}>
					Check Again
				</Button>
				<Button outlined on:click={() => goto('/pricing')}>
					Try Payment Again
				</Button>
				<Button text on:click={() => goto('/dashboard')}>
					Back to Dashboard
				</Button>
			</div>
		{:else if status === 'timeout'}
			<div class="mb-8">
				<div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
					<span class="material-icons text-yellow-600 text-3xl">schedule</span>
				</div>
			</div>
			<h1 class="text-3xl font-bold text-gray-900 mb-4">Verification Timeout</h1>
			<p class="text-lg text-gray-600 mb-8">
				Payment verification is taking longer than expected. Your payment might still be processing.
			</p>
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
				<div class="flex items-start">
					<span class="material-icons text-blue-600 mt-0.5 ml-2">info</span>
					<div>
						<h3 class="text-sm font-medium text-blue-800 mb-1">
							What to do next
						</h3>
						<p class="text-sm text-blue-700">
							Check your email for payment confirmation, or contact support if you've been charged but don't see your license.
						</p>
					</div>
				</div>
			</div>
			<div class="flex flex-wrap gap-3 justify-center">
				<Button on:click={retryCheck}>
					Check Again
				</Button>
				<Button outlined on:click={() => goto('/dashboard')}>
					Go to Dashboard
				</Button>
			</div>
		{/if}

		{#if paymentId || orderId}
			<div class="mt-8 text-center">
				<p class="text-sm text-gray-500">
					Transaction ID: <span class="font-mono">{paymentId || orderId}</span>
				</p>
			</div>
		{/if}
	</div>
</div>
