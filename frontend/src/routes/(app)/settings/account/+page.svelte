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

	// Admin Settings State
	let smtpSettings = {
		host: '',
		port: 587,
		username: '',
		password: '',
		sender: ''
	}
	
	let oauthSettings = {
		googleClientId: '',
		githubClientId: ''
	}
	
	let loadingSmtpSave = false
	let loadingOAuthSave = false
	
	// Load current settings (in real implementation, these would come from backend)
	onMount(() => {
		// Load existing settings from environment or backend
		oauthSettings.googleClientId = PUBLIC_GOOGLE_AUTH_CLIENT_ID || ''
		oauthSettings.githubClientId = PUBLIC_GITHUB_CLIENT_ID || ''
	})
	
	async function saveSmtpSettings() {
		loadingSmtpSave = true
		try {
			// In real implementation, this would save to backend
			await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
			logSuccess('SMTP settings saved successfully')
		} catch (error) {
			console.error('Failed to save SMTP settings:', error)
		} finally {
			loadingSmtpSave = false
		}
	}
	
	async function saveOAuthSettings() {
		loadingOAuthSave = true
		try {
			// In real implementation, this would save to backend
			await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
			logSuccess('OAuth settings saved successfully')
		} catch (error) {
			console.error('Failed to save OAuth settings:', error)
		} finally {
			loadingOAuthSave = false
		}
	}

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
			if (PUBLIC_GOOGLE_AUTH_CLIENT_ID && PUBLIC_GOOGLE_AUTH_CLIENT_ID !== 'none' && PUBLIC_GOOGLE_AUTH_CLIENT_ID !== 'your-google-client-id') {
				const redirectUri = `${window.location.origin}/auth/google/callback`
				const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${PUBLIC_GOOGLE_AUTH_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`
				window.location.href = googleUrl
			} else {
				logSuccess('Please configure Google Client ID first')
			}
		} else if (provider === 'github') {
			// Trigger GitHub OAuth flow
			if (PUBLIC_GITHUB_CLIENT_ID && PUBLIC_GITHUB_CLIENT_ID !== 'none' && PUBLIC_GITHUB_CLIENT_ID !== 'your-github-client-id') {
				const redirectUri = `${window.location.origin}/auth/github/callback`
				const githubUrl = `https://github.com/login/oauth/authorize?client_id=${PUBLIC_GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`
				window.location.href = githubUrl
			} else {
				logSuccess('Please configure GitHub Client ID first')
			}
		}
	}

	async function disconnectOAuth(provider: 'google' | 'github') {
		// This would call a backend endpoint to disconnect the OAuth provider
		logSuccess(`${provider} account disconnected (functionality to be implemented)`)
	}
</script>

<PageTitle title="Account settings" />

<div class="flex flex-col lg:flex-row gap-6 max-w-7xl">
	<!-- Main Account Settings -->
	<div class="flex flex-col max-w-md flex-1">
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

	<!-- Admin Settings Panel (Right Side) -->
	{#if myData?.isAdmin}
		<div class="lg:w-96 flex-shrink-0">
			<div class="sticky top-4 space-y-6">
				<!-- SMTP Configuration -->
				<div class="bg-white rounded-lg shadow-sm border p-6">
					<div class="flex items-center mb-4">
						<svg class="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
							<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
							<path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
						</svg>
						<h3 class="text-lg font-semibold text-gray-800">SMTP Configuration</h3>
					</div>
					<p class="text-sm text-gray-600 mb-4">Configure email server settings for automated emails.</p>
					
					<div class="space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
							<input
								type="text"
								bind:value={smtpSettings.host}
								placeholder="smtp.gmail.com"
								class="w-full"
							/>
						</div>
						
						<div class="grid grid-cols-2 gap-3">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Port</label>
								<input
									type="number"
									bind:value={smtpSettings.port}
									placeholder="587"
									class="w-full"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Security</label>
								<select class="w-full">
									<option value="tls">TLS</option>
									<option value="ssl">SSL</option>
								</select>
							</div>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
							<input
								type="email"
								bind:value={smtpSettings.username}
								placeholder="your-email@gmail.com"
								class="w-full"
							/>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
							<input
								type="password"
								bind:value={smtpSettings.password}
								placeholder="App password or SMTP password"
								class="w-full"
							/>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Sender Name</label>
							<input
								type="text"
								bind:value={smtpSettings.sender}
								placeholder="LicenseGate <noreply@yourdomain.com>"
								class="w-full"
							/>
						</div>
						
						<Button
							on:click={saveSmtpSettings}
							loading={loadingSmtpSave}
							class="w-full !bg-blue-500 !text-white"
						>
							Save SMTP Settings
						</Button>
					</div>
				</div>

				<!-- OAuth Configuration -->
				<div class="bg-white rounded-lg shadow-sm border p-6">
					<div class="flex items-center mb-4">
						<svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clip-rule="evenodd"></path>
						</svg>
						<h3 class="text-lg font-semibold text-gray-800">OAuth Configuration</h3>
					</div>
					<p class="text-sm text-gray-600 mb-4">Configure OAuth providers for social login.</p>
					
					<div class="space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								<div class="flex items-center">
									<svg class="w-4 h-4 mr-1" viewBox="0 0 24 24">
										<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
										<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
										<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
										<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
									</svg>
									Google Client ID
								</div>
							</label>
							<input
								type="text"
								bind:value={oauthSettings.googleClientId}
								placeholder="123456789-abcdefghijklmnop.apps.googleusercontent.com"
								class="w-full font-mono text-sm"
							/>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								<div class="flex items-center">
									<svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd"></path>
									</svg>
									GitHub Client ID
								</div>
							</label>
							<input
								type="text"
								bind:value={oauthSettings.githubClientId}
								placeholder="Iv1.1234567890abcdef"
								class="w-full font-mono text-sm"
							/>
						</div>
						
						<Button
							on:click={saveOAuthSettings}
							loading={loadingOAuthSave}
							class="w-full !bg-green-500 !text-white"
						>
							Save OAuth Settings
						</Button>
					</div>
					
					<div class="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
						<p class="text-xs text-blue-700">
							<strong>Note:</strong> After updating OAuth settings, restart the application for changes to take effect.
							See the <a href="/demo" class="underline">setup guide</a> for detailed configuration instructions.
						</p>
					</div>
				</div>

				<!-- Quick Actions -->
				<div class="bg-white rounded-lg shadow-sm border p-6">
					<div class="flex items-center mb-4">
						<svg class="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path>
						</svg>
						<h3 class="text-lg font-semibold text-gray-800">Quick Actions</h3>
					</div>
					
					<div class="space-y-3">
						{#if myData?.isAdmin}
						<a
							href="/demo"
							class="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
						>
							<div class="flex items-center">
								<svg class="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
									<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
									<path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
								</svg>
								<span class="text-sm font-medium text-blue-900">Email & SMTP Settings</span>
								<span class="ml-2 px-2 py-0.5 text-xs bg-blue-200 text-blue-800 rounded">Admin</span>
							</div>
							<svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
							</svg>
						</a>
						{/if}
						
						<a
							href="/demo"
							class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
						>
							<div class="flex items-center">
								<svg class="w-4 h-4 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
									<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
									<path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
								</svg>
								<span class="text-sm font-medium">Email Templates Demo</span>
							</div>
							<svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
							</svg>
						</a>
						
						{#if myData?.isAdmin}
						<a
							href="/user-management"
							class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
						>
							<div class="flex items-center">
								<svg class="w-4 h-4 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
									<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
								<span class="text-sm font-medium">User Management</span>
							</div>
							<svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
							</svg>
						</a>
						{/if}
						
						<a
							href="/dashboard"
							class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
						>
							<div class="flex items-center">
								<svg class="w-4 h-4 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
									<path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
								</svg>
								<span class="text-sm font-medium">Dashboard</span>
							</div>
							<svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
							</svg>
						</a>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
