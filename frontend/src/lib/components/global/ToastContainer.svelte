<script lang="ts">
	import { toasts } from '../../stores/toast'
	import Toast from './Toast.svelte'
</script>

{#if $toasts.length > 0}
	<div 
		class="fixed top-4 left-4 z-50 space-y-4 max-w-sm"
		style="direction: rtl;"
	>
		{#each $toasts as toast (toast.id)}
			<Toast {toast} />
		{/each}
	</div>
{/if}
