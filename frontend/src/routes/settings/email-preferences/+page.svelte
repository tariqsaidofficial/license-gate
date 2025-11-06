<script lang="ts">
	import { goto } from '$app/navigation'
	import { onMount } from 'svelte'
	import Button from '../../../lib/components/basics/Button.svelte'
	import { logError, logSuccess } from '../../../lib/stores/alerts'
	import { trpc } from '../../../lib/trpcClient'

	let emailPreferences = {
		licenseUpdates: true,
		paymentNotifications: true,
		systemUpdates: false,
		marketingEmails: false,
		weeklyReports: true,
		securityAlerts: true
	}
	
	let loading = true
	let saving = false

	onMount(async () => {
		try {
			// Load user preferences from auth.update
			const userInfo = await trpc.auth.me.query()
			emailPreferences.marketingEmails = userInfo.marketingEmails
		} catch (error) {
			console.error('Failed to load email preferences:', error)
		} finally {
			loading = false
		}
	})

	async function savePreferences() {
		try {
			saving = true
			await trpc.auth.update.mutate({ 
				marketingEmails: emailPreferences.marketingEmails 
			})
			logSuccess('Preferences saved successfully')
		} catch (error) {
			logError('Failed to save preferences')
		} finally {
			saving = false
		}
	}

	function togglePreference(key: keyof typeof emailPreferences) {
		emailPreferences[key] = !emailPreferences[key]
	}
</script>

<svelte:head>
	<title>Email Preferences - LicenseGate</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
	<div class="max-w-2xl mx-auto">
		<div class="bg-white shadow rounded-lg">
			<div class="px-6 py-4 border-b border-gray-200">
				<h1 class="text-2xl font-bold text-gray-900">Email Preferences</h1>
				<p class="mt-1 text-sm text-gray-600">
					Choose which types of notifications you want to receive via email
				</p>
			</div>

			{#if loading}
				<div class="p-6">
					<div class="animate-pulse space-y-4">
						{#each Array(6) as _}
							<div class="flex items-center justify-between py-3">
								<div class="space-y-2">
									<div class="h-4 bg-gray-200 rounded w-32"></div>
									<div class="h-3 bg-gray-200 rounded w-48"></div>
								</div>
								<div class="h-6 w-11 bg-gray-200 rounded-full"></div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="p-6 space-y-6">				<div class="space-y-4">
					<div class="flex items-center justify-between py-3">
						<div>
							<h3 class="text-sm font-medium text-gray-900">Marketing Emails</h3>
							<p class="text-sm text-gray-500">Information about new features and offers</p>
						</div>
						<button
							class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 {emailPreferences.marketingEmails ? 'bg-blue-600' : 'bg-gray-200'}"
							on:click={() => togglePreference('marketingEmails')}
						>
							<span class="sr-only">Toggle marketing emails</span>
							<span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {emailPreferences.marketingEmails ? 'translate-x-5' : 'translate-x-0'}"></span>
						</button>
					</div>

					<div class="flex items-center justify-between py-3">
						<div>
							<h3 class="text-sm font-medium text-gray-900">License Updates</h3>
							<p class="text-sm text-gray-500">Notifications about license expiration and renewal</p>
						</div>
						<button
							class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 {emailPreferences.licenseUpdates ? 'bg-blue-600' : 'bg-gray-200'}"
							on:click={() => togglePreference('licenseUpdates')}
						>
							<span class="sr-only">Toggle license updates</span>
							<span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {emailPreferences.licenseUpdates ? 'translate-x-5' : 'translate-x-0'}"></span>
						</button>
					</div>

					<div class="flex items-center justify-between py-3">
						<div>
							<h3 class="text-sm font-medium text-gray-900">Payment Notifications</h3>
							<p class="text-sm text-gray-500">Payment confirmations and invoices</p>
						</div>
						<button
							class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 {emailPreferences.paymentNotifications ? 'bg-blue-600' : 'bg-gray-200'}"
							on:click={() => togglePreference('paymentNotifications')}
						>
							<span class="sr-only">Toggle payment notifications</span>
							<span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {emailPreferences.paymentNotifications ? 'translate-x-5' : 'translate-x-0'}"></span>
						</button>
					</div>

					<div class="flex items-center justify-between py-3">
						<div>
							<h3 class="text-sm font-medium text-gray-900">Security Alerts</h3>
							<p class="text-sm text-gray-500">Login notifications and security updates</p>
						</div>
						<button
							class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 {emailPreferences.securityAlerts ? 'bg-blue-600' : 'bg-gray-200'}"
							on:click={() => togglePreference('securityAlerts')}
						>
							<span class="sr-only">Toggle security alerts</span>
							<span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {emailPreferences.securityAlerts ? 'translate-x-5' : 'translate-x-0'}"></span>
						</button>
					</div>
				</div>

					<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<div class="flex items-start">
							<span class="material-icons text-blue-600 mt-0.5 ml-2">info</span>
							<div>							<h3 class="text-sm font-medium text-blue-800 mb-1">
								Important Note
							</h3>
							<p class="text-sm text-blue-700">
								Some notifications like security alerts and payment notifications are important for your account security and cannot be disabled.
							</p>
							</div>
						</div>
					</div>

					<div class="flex justify-between">
						<Button outlined on:click={() => goto('/settings/account')}>
							Back
						</Button>
						<Button on:click={savePreferences} loading={saving}>
							Save Preferences
						</Button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
