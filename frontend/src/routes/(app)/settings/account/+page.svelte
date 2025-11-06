<script lang="ts">
	import { PUBLIC_GITHUB_CLIENT_ID, PUBLIC_GOOGLE_AUTH_CLIENT_ID } from '$env/static/public'
	import { onMount, tick } from 'svelte'
	import Button from '../../../../lib/components/basics/Button.svelte'
	import Chip from '../../../../lib/components/basics/Chip.svelte'
	import PageTitle from '../../../../lib/components/basics/PageTitle.svelte'
	import Skeleton from '../../../../lib/components/basics/Skeleton.svelte'
	import { logSuccess } from '../../../../lib/stores/alerts'
	import { logout } from '../../../../lib/stores/auth'
	import { trpc, type ReadMe } from '../../../../lib/trpcClient'
	import { generateRsaKeyPair } from '../../../../lib/utils/rsaKeys'
	import { sleep } from '../../../../lib/utils/sleep'

	let myData: ReadMe | null = null

	onMount(async () => {
		myData = await trpc.auth.me.query()
	})

	let loadingPasswordReset = false
	let signOutAllDevices = false

	function resetPassword() {
		loadingPasswordReset = true
		trpc.auth.requestPasswordResetNoCaptcha
			.mutate({ signOutAllDevices })
			.then(() => {
				logSuccess('We sent you an email with a link to reset your password.')
			})
			.finally(() => {
				loadingPasswordReset = false
			})
	}

	let loadingConsentUpdate = false

	async function toggleMarketingConsent() {
		if (!myData) return

		loadingConsentUpdate = true
		await trpc.auth.update
			.mutate({
				marketingEmails: !myData.marketingEmails,
			})
			.then(() => {
				myData!.marketingEmails = !myData!.marketingEmails
			})
			.finally(() => {
				loadingConsentUpdate = false
			})

		logSuccess('Saved settings')
	}

	let loadingDelete = false

	async function deleteAccount() {
		loadingDelete = true
		await trpc.auth.deleteAccount.mutate().finally(() => {
			loadingDelete = false
		})
		logout()
		logSuccess('Deleted account')
	}

	let loadingRegenerate = false

	async function regenerateKeyPair() {
		loadingRegenerate = true

		await tick()
		await sleep(100)

		const keys = generateRsaKeyPair()

		await trpc.auth.updateRsaPublicKey
			.mutate(keys)
			.then(() => {
				myData!.rsaPublicKey = keys.rsaPublicKey
			})
			.finally(() => {
				loadingRegenerate = false
			})

		logSuccess('Generated new key-pair')
	}
</script>

<PageTitle title="Account settings" />

<div class="flex flex-col max-w-md">
	{#if !myData}
		<Skeleton class="h-20 max-w-md" />
	{:else}
		<div class="px-3 py-2 mt-2 bg-gray-200">
			<b>User ID</b> <span>{myData.userId}</span> <br />
		</div>

		<div class="px-3 py-2 mt-2 bg-gray-200">
			<b>Email</b> <span>{myData.email}</span> <br />
			<i class="text-sm text-gray-500"
				>You can not change your email address - please get in touch if you have any issues.</i
			>
		</div>

		<div class="px-3 py-2 mt-2 bg-gray-200">
			{#if myData.isPasswordAccount}
				<b>Password</b>
				<p class="text-sm">
					When requesting a password reset, you will be sent an email with a link to reset your
					password. <br />
					<br />
					You can choose whether to sign out all signed in devices or not. Signed in devices can still
					access the account for up to an hour.
				</p>

				<div class="my-2">
					<input type="checkbox" bind:checked={signOutAllDevices} id="signOutAllDevices" />
					<label for="signOutAllDevices" class="cursor-pointer">Sign out all devices</label>
				</div>

				<Button loading={loadingPasswordReset} snug on:click={resetPassword}>Reset password</Button>
			{:else}
				<div class="flex items-center mb-1">
					<b>Password</b>
					<Chip class="ml-2">Google account</Chip>
				</div>

				<i class="text-sm text-gray-500"
					>You are using google oauth. You can change your password by changing your google
					password.</i
				>
			{/if}
		</div>

		<div class="px-3 py-2 mt-2 bg-gray-200">
			<b>RSA key pair</b>
			<p class="text-sm">
				The RSA keys are used to sign the license server response when you provide a challenge with
				your verification request.
			</p>

			<p class="px-2 py-1 my-2 overflow-auto font-mono text-sm text-gray-600 bg-gray-100 max-h-36">
				{myData.rsaPublicKey || 'None set'}
			</p>

			<Button on:click={regenerateKeyPair} requiresConfirmation loading={loadingRegenerate} snug
				>Generate new key-pair</Button
			>
			<i class="text-xs">The key-pair is generated on your device and stored on the server.</i>
		</div>

		<div class="px-3 py-2 mt-2 bg-gray-200">
			<b>Marketing consent</b>
			<div class="flex items-center {loadingConsentUpdate ? 'opacity-50' : ''}">
				<input
					id="marketingConsent"
					type="checkbox"
					checked={myData.marketingEmails}
					on:change={toggleMarketingConsent}
				/>
				<label for="marketingConsent" class="ml-1 text-sm cursor-pointer"
					>I agree to receive marketing emails from LicenseGuard</label
				>
			</div>
		</div>

		<div class="px-3 py-2 mt-2 bg-gray-200 border-l-4 border-red-500">
			<b>Delete account</b>
			<p>Delete your account and all your data permanently</p>
			<Button
				class="mt-2"
				snug
				red
				requiresConfirmation
				on:click={deleteAccount}
				loading={loadingDelete}
			>
				Delete account
			</Button>
		</div>

		{#if PUBLIC_GOOGLE_AUTH_CLIENT_ID !== 'none' || (PUBLIC_GITHUB_CLIENT_ID && PUBLIC_GITHUB_CLIENT_ID !== 'none')}
			<div class="px-3 py-2 mt-2 bg-gray-200">
				<b>OAuth Connections</b>
				<p class="text-sm text-gray-500 mb-3">
					Connect your account with external OAuth providers for easier sign-in.
				</p>

				{#if PUBLIC_GOOGLE_AUTH_CLIENT_ID !== 'none'}
					<div class="flex items-center justify-between p-2 bg-white rounded mb-2">
						<div class="flex items-center">
							<svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
								<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
								<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
								<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
								<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
							</svg>
							<span class="font-medium">Google</span>
						</div>
						{#if myData.isPasswordAccount}
							<Chip class="text-green-600 bg-green-100">Available</Chip>
						{:else}
							<Chip class="text-blue-600 bg-blue-100">Connected</Chip>
						{/if}
					</div>
				{/if}

				{#if PUBLIC_GITHUB_CLIENT_ID && PUBLIC_GITHUB_CLIENT_ID !== 'none'}
					<div class="flex items-center justify-between p-2 bg-white rounded mb-2">
						<div class="flex items-center">
							<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd"></path>
							</svg>
							<span class="font-medium">GitHub</span>
						</div>
						<Chip class="text-green-600 bg-green-100">Available</Chip>
					</div>
				{/if}

				<p class="text-xs text-gray-500 mt-2">
					OAuth connections allow you to sign in using your external accounts. Your primary email remains the same.
				</p>
			</div>
		{/if}

		<div class="px-3 py-2 mt-2 bg-gray-200">
			<b>Other Settings</b>
			<p class="text-sm text-gray-500 mb-3">
				Manage your other account settings here.
			</p>

			<!-- Other settings components can be added here -->

		</div>
	{/if}
</div>
