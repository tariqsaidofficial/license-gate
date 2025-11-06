<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import Button from '../basics/Button.svelte'

	export let paymentId: string = ''
	export let orderId: string = ''
	export let status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' = 'pending'
	export let attempts: number = 0
	export let maxAttempts: number = 30

	const dispatch = createEventDispatcher()

	function getStatusIcon() {
		switch (status) {
			case 'pending':
			case 'processing':
				return 'hourglass_empty'
			case 'completed':
				return 'check_circle'
			case 'failed':
				return 'error'
			case 'cancelled':
				return 'cancel'
			default:
				return 'help'
		}
	}

	function getStatusColor() {
		switch (status) {
			case 'pending':
				return 'text-yellow-600 bg-yellow-100'
			case 'processing':
				return 'text-blue-600 bg-blue-100'
			case 'completed':
				return 'text-green-600 bg-green-100'
			case 'failed':
				return 'text-red-600 bg-red-100'
			case 'cancelled':
				return 'text-gray-600 bg-gray-100'
			default:
				return 'text-gray-600 bg-gray-100'
		}
	}

	function getStatusMessage() {
		switch (status) {
			case 'pending':
				return 'Payment is being processed...'
			case 'processing':
				return `Verifying payment... (${attempts}/${maxAttempts})`
			case 'completed':
				return 'Payment completed successfully!'
			case 'failed':
				return 'Payment verification failed'
			case 'cancelled':
				return 'Payment was cancelled'
			default:
				return 'Unknown payment status'
		}
	}

	function getProgressPercentage() {
		if (status === 'completed') return 100
		if (status === 'failed' || status === 'cancelled') return 0
		return Math.min((attempts / maxAttempts) * 100, 90)
	}
</script>

<div class="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
	<!-- Status Icon -->
	<div class="text-center mb-6">
		<div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full {getStatusColor()}">
			{#if status === 'processing'}
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			{:else}
				<span class="material-icons text-2xl">{getStatusIcon()}</span>
			{/if}
		</div>
	</div>

	<!-- Status Message -->
	<div class="text-center mb-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-2">
			{getStatusMessage()}
		</h3>
		
		{#if status === 'processing'}
			<div class="w-full bg-gray-200 rounded-full h-2 mb-4">
				<div 
					class="bg-blue-600 h-2 rounded-full transition-all duration-500"
					style="width: {getProgressPercentage()}%"
				></div>
			</div>
		{/if}

		{#if paymentId || orderId}
			<p class="text-sm text-gray-500">
				Transaction: <span class="font-mono">{paymentId || orderId}</span>
			</p>
		{/if}
	</div>

	<!-- Actions -->
	<div class="space-y-3">
		{#if status === 'processing'}
			<p class="text-sm text-gray-600 text-center">
				Please wait while we verify your payment. This usually takes a few moments.
			</p>
		{:else if status === 'failed'}
			<div class="flex gap-2">
				<Button 
					class="flex-1" 
					on:click={() => dispatch('retry')}
				>
					Try Again
				</Button>
				<Button 
					outlined 
					class="flex-1" 
					on:click={() => dispatch('support')}
				>
					Get Help
				</Button>
			</div>
		{:else if status === 'completed'}
			<Button 
				class="w-full" 
				on:click={() => dispatch('continue')}
			>
				Continue
			</Button>
		{:else if status === 'cancelled'}
			<div class="flex gap-2">
				<Button 
					class="flex-1" 
					on:click={() => dispatch('retry-payment')}
				>
					Try Payment Again
				</Button>
				<Button 
					outlined 
					class="flex-1" 
					on:click={() => dispatch('back')}
				>
					Back
				</Button>
			</div>
		{/if}
	</div>

	<!-- Additional Info -->
	{#if status === 'processing'}
		<div class="mt-4 text-xs text-gray-500 text-center">
			<p>Don't close this page. We'll update you automatically.</p>
		</div>
	{/if}
</div>
