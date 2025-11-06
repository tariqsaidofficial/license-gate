<script lang="ts">
	import { onMount } from 'svelte'
	import { userEmail } from '../../stores/auth'
	import { trpc } from '../../trpcClient'

	export let showText: boolean = true
	export let size: 'sm' | 'md' | 'lg' = 'md'

	let isVerified = true
	let loading = true
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
			} finally {
				loading = false
			}
		} else {
			loading = false
		}
	})

	function getSizeClasses() {
		switch (size) {
			case 'sm':
				return 'text-xs'
			case 'lg':
				return 'text-base'
			default:
				return 'text-sm'
		}
	}

	function getIconSize() {
		switch (size) {
			case 'sm':
				return 'text-sm'
			case 'lg':
				return 'text-lg'
			default:
				return 'text-base'
		}
	}
</script>

<div class="relative inline-flex items-center">
	{#if loading}
		<div class="flex items-center space-x-1 text-gray-400">
			<div class="animate-pulse w-4 h-4 bg-gray-300 rounded-full"></div>
			{#if showText}
				<div class="animate-pulse h-3 w-12 bg-gray-300 rounded"></div>
			{/if}
		</div>
	{:else}
		<div 
			class="flex items-center cursor-pointer {getSizeClasses()}"
			on:mouseenter={() => showTooltip = true}
			on:mouseleave={() => showTooltip = false}
			role="button"
			tabindex="0"
		>
			{#if isVerified}
				<div class="flex items-center space-x-1 text-green-600">
					<span class="material-icons {getIconSize()}">verified</span>
					{#if showText}
						<span class="font-medium">Verified</span>
					{/if}
				</div>
			{:else}
				<div class="flex items-center space-x-1 text-yellow-600">
					<span class="material-icons {getIconSize()}">pending</span>
					{#if showText}
						<span class="font-medium">Unverified</span>
					{/if}
				</div>
			{/if}
		</div>

		{#if showTooltip}
			<div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
				<div class="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
					{#if isVerified}
						Email address is verified ✓
					{:else}
						Email address needs verification
					{/if}
					<div class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
				</div>
			</div>
		{/if}
	{/if}
</div>
