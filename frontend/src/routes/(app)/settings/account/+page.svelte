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

	// OAuth Connection Functions
	async function connectOAuth(provider: 'google' | 'github') {
		if (provider === 'google') {
			// Trigger Google OAuth flow
			if (PUBLIC_GOOGLE_AUTH_CLIENT_ID && PUBLIC_GOOGLE_AUTH_CLIENT_ID !== 'none') {
				// This would typically redirect to Google OAuth
				logSuccess('Google OAuth connection will be implemented with real Client ID')
			}
		} else if (provider === 'github') {
			// Trigger GitHub OAuth flow
			if (PUBLIC_GITHUB_CLIENT_ID && PUBLIC_GITHUB_CLIENT_ID !== 'none') {
				const redirectUri = `${window.location.origin}/auth/github/callback`
				const githubUrl = `https://github.com/login/oauth/authorize?client_id=${PUBLIC_GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`
				window.location.href = githubUrl
			}
		}
	}

	async function disconnectOAuth(provider: 'google' | 'github') {
		// This would call a backend endpoint to disconnect the OAuth provider
		logSuccess(`${provider} account disconnected (functionality to be implemented)`)
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
					Connect your account with external OAuth providers for easier sign-in and enhanced security.
				</p>

				{#if PUBLIC_GOOGLE_AUTH_CLIENT_ID !== 'none'}
					<div class="flex items-center justify-between p-3 bg-white rounded-lg mb-3 border border-gray-200 shadow-sm">
						<div class="flex items-center">
							<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" viewBox="0 0 256 262" class="w-6 h-6 mr-3">
								<path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"></path>
								<path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"></path>
								<path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"></path>
								<path fill="#EB4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"></path>
							</svg>
							<div>
								<span class="font-semibold text-gray-800">Google</span>
								<p class="text-xs text-gray-500">Sign in with your Google account</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							{#if myData.isPasswordAccount}
								<Chip class="text-green-600 bg-green-100 border border-green-200">Available</Chip>
								<Button 
									snug 
									class="text-sm px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white"
									on:click={() => connectOAuth('google')}
								>
									Connect
								</Button>
							{:else}
								<Chip class="text-blue-600 bg-blue-100 border border-blue-200">Connected</Chip>
								<Button 
									snug 
									class="text-sm px-3 py-1 bg-red-500 hover:bg-red-600 text-white"
									on:click={() => disconnectOAuth('google')}
									requiresConfirmation
								>
									Disconnect
								</Button>
							{/if}
						</div>
					</div>
				{/if}

				{#if PUBLIC_GITHUB_CLIENT_ID && PUBLIC_GITHUB_CLIENT_ID !== 'none'}
					<div class="flex items-center justify-between p-3 bg-white rounded-lg mb-3 border border-gray-200 shadow-sm">
						<div class="flex items-center">
							<svg class="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd"></path>
							</svg>
							<div>
								<span class="font-semibold text-gray-800">GitHub</span>
								<p class="text-xs text-gray-500">Sign in with your GitHub account</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<Chip class="text-green-600 bg-green-100 border border-green-200">Available</Chip>
							<Button 
								snug 
								class="text-sm px-3 py-1 bg-gray-800 hover:bg-gray-900 text-white"
								on:click={() => connectOAuth('github')}
							>
								Connect
							</Button>
						</div>
					</div>
				{/if}

				<div class="p-3 bg-blue-50 rounded-lg border border-blue-200">
					<div class="flex items-start">
						<svg class="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
						</svg>
						<div>
							<p class="text-sm font-medium text-blue-800">OAuth Connection Benefits</p>
							<ul class="text-xs text-blue-700 mt-1 space-y-1">
								<li>• Faster sign-in without remembering passwords</li>
								<li>• Enhanced security with two-factor authentication</li>
								<li>• Seamless integration with your existing accounts</li>
								<li>• Your primary email and data remain unchanged</li>
							</ul>
						</div>
					</div>
				</div>
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
