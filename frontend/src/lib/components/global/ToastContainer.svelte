<script lang="ts">
	import { toasts } from '../../stores/toast'
	import Toast from './Toast.svelte'
</script>

<!-- Toast Container - Fixed position -->
<div class="toast-container">
	{#each $toasts as toast (toast.id)}
		<Toast {toast} />
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 400px;
		pointer-events: none;
	}

	.toast-container :global(.toast-item) {
		pointer-events: auto;
	}
</style>