<script lang="ts">
	import { onMount } from 'svelte'
	import { toasts } from '../../stores/toast'

	export let toast: {
		id: string
		type: 'success' | 'error' | 'info' | 'warning'
		title: string
		message?: string
		duration?: number
		action?: { label: string; handler: () => void }
	}

	let visible = false
	let timeoutId: NodeJS.Timeout

	onMount(() => {
		visible = true
		
		const duration = toast.duration || 5000
		timeoutId = setTimeout(() => {
			removeToast()
		}, duration)

		return () => {
			if (timeoutId) clearTimeout(timeoutId)
		}
	})

	function removeToast() {
		visible = false
		setTimeout(() => {
			toasts.remove(toast.id)
		}, 300)
	}

	function getIcon() {
		switch (toast.type) {
			case 'success': return 'check_circle'
			case 'error': return 'error'
			case 'warning': return 'warning'
			case 'info': return 'info'
			default: return 'info'
		}
	}

	function getColorClasses() {
		switch (toast.type) {
			case 'success': return 'bg-green-50 border-green-200 text-green-800'
			case 'error': return 'bg-red-50 border-red-200 text-red-800'
			case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
			case 'info': return 'bg-blue-50 border-blue-200 text-blue-800'
			default: return 'bg-gray-50 border-gray-200 text-gray-800'
		}
	}

	function getIconColor() {
		switch (toast.type) {
			case 'success': return 'text-green-500'
			case 'error': return 'text-red-500'
			case 'warning': return 'text-yellow-500'
			case 'info': return 'text-blue-500'
			default: return 'text-gray-500'
		}
	}
</script>

<div 
	class="toast-item transform transition-all duration-300 ease-in-out {visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}"
>
	<div class="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto border {getColorClasses()}"
		<div class="p-4">
			<div class="flex items-start">
				<div class="flex-shrink-0">
					<span class="material-icons {getIconColor()}">{getIcon()}</span>
				</div>
				<div class="mr-3 w-0 flex-1 pt-0.5">
					<p class="text-sm font-medium">{toast.title}</p>
					{#if toast.message}
						<p class="mt-1 text-sm text-gray-600">{toast.message}</p>
					{/if}
					{#if toast.action}
						<div class="mt-3">
							<button
								class="text-sm font-medium underline hover:no-underline focus:outline-none"
								on:click={toast.action.handler}
							>
								{toast.action.label}
							</button>
						</div>
					{/if}
				</div>
				<div class="mr-4 flex-shrink-0 flex">
					<button
						class="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						on:click={removeToast}
					>
						<span class="sr-only">إغلاق</span>
						<span class="material-icons text-sm">close</span>
					</button>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.toast-container {
		transition: all 0.3s ease;
	}
</style>
