<script lang="ts">
	import { onMount } from 'svelte'
	import { userEmail } from '../../stores/auth'
	import { trpc } from '../../trpcClient'

	let isVerified = true
	let showTooltip = false

	onMount(async () => {
		if ($userEmail) {
			try {
				const status = await trpc.verification.checkVerificationStatus.query({ 
					email: $userEmail 
				})
				
				isVerified = status.verified
			} catch (error) {
				console.error('Failed to check verification status:', error)
			}
		}
	})
</script>

<div class="relative inline-flex items-center">
	<div 
		class="flex items-center cursor-pointer"
		on:mouseenter={() => showTooltip = true}
		on:mouseleave={() => showTooltip = false}
	>
		{#if isVerified}
			<div class="flex items-center space-x-1 text-green-600">
				<span class="material-icons text-sm">verified</span>
				<span class="text-xs font-medium hidden md:inline">Verified</span>
			</div>
		{:else}
			<div class="flex items-center space-x-1 text-yellow-600">
				<span class="material-icons text-sm">pending</span>
				<span class="text-xs font-medium hidden md:inline">Pending</span>
			</div>
		{/if}
	</div>

	{#if showTooltip}
		<div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
			<div class="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
				{#if isVerified}
					Email verified ✓
				{:else}
					Email not verified
				{/if}
				<div class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
			</div>
		</div>
	{/if}
</div>
