<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import { trpc } from '../../trpcClient'
	import { logSuccess, logError } from '../../stores/alerts'
	import Button from '../basics/Button.svelte'

	export let user: any
	export let show = false

	const dispatch = createEventDispatcher()

	let loading = false
	let step: 'choose' | 'custom' | 'result' = 'choose'
	let customPassword = ''
	let confirmPassword = ''
	let generatedPassword = ''
	let passwordStrength = 0
	let showPassword = false
	let showConfirmPassword = false
	let passwordsMatch = true

	// Reset state when modal opens
	$: if (show) {
		step = 'choose'
		customPassword = ''
		confirmPassword = ''
		generatedPassword = ''
		passwordStrength = 0
		showPassword = false
		showConfirmPassword = false
		passwordsMatch = true
	}

	// Password strength checker
	$: if (customPassword) {
		passwordStrength = calculatePasswordStrength(customPassword)
		passwordsMatch = customPassword === confirmPassword
	}

	function calculatePasswordStrength(password: string): number {
		let strength = 0
		if (password.length >= 8) strength += 25
		if (password.length >= 12) strength += 15
		if (/[a-z]/.test(password)) strength += 15
		if (/[A-Z]/.test(password)) strength += 15
		if (/[0-9]/.test(password)) strength += 15
		if (/[^A-Za-z0-9]/.test(password)) strength += 15
		return Math.min(strength, 100)
	}

	function getStrengthColor(strength: number): string {
		if (strength < 30) return 'bg-red-500'
		if (strength < 60) return 'bg-yellow-500'
		if (strength < 80) return 'bg-blue-500'
		return 'bg-green-500'
	}

	function getStrengthText(strength: number): string {
		if (strength < 30) return 'Weak'
		if (strength < 60) return 'Fair'
		if (strength < 80) return 'Good'
		return 'Strong'
	}

	async function generateRandomPassword() {
		loading = true
		try {
			const result = await trpc.admin.resetUserPassword.mutate({ 
				userID: user.userID 
			})
			
			generatedPassword = result.newPassword
			step = 'result'
			
			logSuccess('Password generated successfully and sent to user email')
			dispatch('success', { type: 'generated', password: result.newPassword })
		} catch (error: any) {
			console.error('Failed to generate password:', error)
			logError(error.message || 'Failed to generate password')
		} finally {
			loading = false
		}
	}

	async function setCustomPassword() {
		if (!customPassword || customPassword.length < 6) {
			return
		}

		if (customPassword !== confirmPassword) {
			return
		}

		loading = true
		try {
			await trpc.admin.setUserPassword.mutate({ 
				userID: user.userID,
				newPassword: customPassword
			})
			
			step = 'result'
			generatedPassword = customPassword
			
			logSuccess('Custom password set successfully and sent to user email')
			dispatch('success', { type: 'custom', password: customPassword })
		} catch (error: any) {
			console.error('Failed to set password:', error)
			logError(error.message || 'Failed to set password')
		} finally {
			loading = false
		}
	}

	function closeModal() {
		show = false
		dispatch('close')
	}

	function copyPassword() {
		navigator.clipboard.writeText(generatedPassword)
		logSuccess('Password copied to clipboard')
	}
</script>

{#if show}
	<!-- Modal Backdrop -->
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" on:click={closeModal}>
		<!-- Modal Content -->
		<div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" on:click|stopPropagation>
			<!-- Header -->
			<div class="px-6 py-4 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-semibold text-gray-900">
						Reset Password
					</h3>
					<button
						class="text-gray-400 hover:text-gray-600 transition-colors"
						on:click={closeModal}
					>
						<span class="material-icons">close</span>
					</button>
				</div>
				<p class="text-sm text-gray-600 mt-1">
					User: <span class="font-medium">{user?.email}</span>
				</p>
			</div>

			<!-- Content -->
			<div class="px-6 py-4">
				{#if step === 'choose'}
					<!-- Choose Method -->
					<div class="space-y-4">
						<p class="text-gray-700">Choose how to reset the password:</p>
						
						<div class="space-y-3">
							<!-- Generate Random Password -->
							<button
								class="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
								on:click={generateRandomPassword}
								disabled={loading}
							>
								<div class="flex items-center">
									<div class="p-2 bg-blue-100 rounded-lg mr-3">
										<span class="material-icons text-blue-600">auto_awesome</span>
									</div>
									<div>
										<h4 class="font-medium text-gray-900">Generate Random Password</h4>
										<p class="text-sm text-gray-600">A strong password will be generated automatically</p>
									</div>
								</div>
							</button>

							<!-- Custom Password -->
							<button
								class="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all text-left"
								on:click={() => step = 'custom'}
								disabled={loading}
							>
								<div class="flex items-center">
									<div class="p-2 bg-green-100 rounded-lg mr-3">
										<span class="material-icons text-green-600">edit</span>
									</div>
									<div>
										<h4 class="font-medium text-gray-900">Set Custom Password</h4>
										<p class="text-sm text-gray-600">Choose your own password</p>
									</div>
								</div>
							</button>
						</div>
					</div>

				{:else if step === 'custom'}
					<!-- Custom Password Input -->
					<div class="space-y-4">
						<!-- New Password -->
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								New Password
							</label>
							<div class="relative">
								{#if showPassword}
									<input
										type="text"
										bind:value={customPassword}
										placeholder="Enter new password"
										class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										disabled={loading}
									/>
								{:else}
									<input
										type="password"
										bind:value={customPassword}
										placeholder="Enter new password"
										class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										disabled={loading}
									/>
								{/if}
								<button
									type="button"
									class="absolute inset-y-0 right-0 pr-3 flex items-center"
									on:click={() => showPassword = !showPassword}
								>
									<span class="material-icons text-gray-400 hover:text-gray-600">
										{showPassword ? 'visibility_off' : 'visibility'}
									</span>
								</button>
							</div>
						</div>

						<!-- Confirm Password -->
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Confirm Password
							</label>
							<div class="relative">
								{#if showConfirmPassword}
									<input
										type="text"
										bind:value={confirmPassword}
										placeholder="Confirm new password"
										class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 {!passwordsMatch && confirmPassword ? 'border-red-300' : ''}"
										disabled={loading}
									/>
								{:else}
									<input
										type="password"
										bind:value={confirmPassword}
										placeholder="Confirm new password"
										class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 {!passwordsMatch && confirmPassword ? 'border-red-300' : ''}"
										disabled={loading}
									/>
								{/if}
								<button
									type="button"
									class="absolute inset-y-0 right-0 pr-3 flex items-center"
									on:click={() => showConfirmPassword = !showConfirmPassword}
								>
									<span class="material-icons text-gray-400 hover:text-gray-600">
										{showConfirmPassword ? 'visibility_off' : 'visibility'}
									</span>
								</button>
							</div>
							{#if !passwordsMatch && confirmPassword}
								<p class="text-sm text-red-600 mt-1">Passwords do not match</p>
							{/if}
						</div>

						{#if customPassword}
							{@const hasMinLength = customPassword.length >= 8}
							{@const hasUpperCase = /[A-Z]/.test(customPassword)}
							{@const hasNumber = /[0-9]/.test(customPassword)}
							
							<!-- Password Strength Indicator -->
							<div class="space-y-2">
								<div class="flex justify-between text-sm">
									<span class="text-gray-600">Password Strength:</span>
									<span class="font-medium {passwordStrength >= 80 ? 'text-green-600' : passwordStrength >= 60 ? 'text-blue-600' : passwordStrength >= 30 ? 'text-yellow-600' : 'text-red-600'}">
										{getStrengthText(passwordStrength)}
									</span>
								</div>
								<div class="w-full bg-gray-200 rounded-full h-2">
									<div 
										class="h-2 rounded-full transition-all duration-300 {getStrengthColor(passwordStrength)}"
										style="width: {passwordStrength}%"
									></div>
								</div>
							</div>

							<!-- Password Requirements -->
							<div class="text-xs text-gray-600 space-y-1">
								<p class="flex items-center">
									<span class="material-icons text-xs mr-1 {hasMinLength ? 'text-green-500' : 'text-gray-400'}">
										{hasMinLength ? 'check_circle' : 'radio_button_unchecked'}
									</span>
									At least 8 characters
								</p>
								<p class="flex items-center">
									<span class="material-icons text-xs mr-1 {hasUpperCase ? 'text-green-500' : 'text-gray-400'}">
										{hasUpperCase ? 'check_circle' : 'radio_button_unchecked'}
									</span>
									At least one uppercase letter
								</p>
								<p class="flex items-center">
									<span class="material-icons text-xs mr-1 {hasNumber ? 'text-green-500' : 'text-gray-400'}">
										{hasNumber ? 'check_circle' : 'radio_button_unchecked'}
									</span>
									At least one number
								</p>
							</div>
						{/if}

						<!-- Buttons -->
						<div class="flex gap-3 pt-4">
							<Button
								on:click={() => step = 'choose'}
								class="flex-1 bg-gray-500 hover:bg-gray-600"
								disabled={loading}
							>
								<span class="material-icons mr-2">arrow_back</span>
								Back
							</Button>
							<Button
								on:click={setCustomPassword}
								class="flex-1 bg-green-600 hover:bg-green-700"
								disabled={loading || !customPassword || customPassword.length < 6 || !passwordsMatch}
								{loading}
							>
								{#if loading}
									<span class="material-icons mr-2 animate-spin">refresh</span>
									Updating...
								{:else}
									<span class="material-icons mr-2">save</span>
									Set Password
								{/if}
							</Button>
						</div>
					</div>

				{:else if step === 'result'}
					<!-- Result -->
					<div class="space-y-4">
						<div class="text-center">
							<div class="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
								<span class="material-icons text-green-600">check_circle</span>
							</div>
							<h4 class="text-lg font-semibold text-gray-900 mb-2">
								Password Updated Successfully!
							</h4>
							<p class="text-gray-600 text-sm">
								The new password has been sent to the user's email address
							</p>
						</div>

						<!-- Password Display -->
						<div class="bg-gray-50 rounded-lg p-4">
							<div class="flex items-center justify-between">
								<div class="flex-1">
									<p class="text-sm text-gray-600 mb-1">New Password:</p>
									<p class="font-mono text-lg font-semibold text-gray-900 select-all break-all">
										{generatedPassword}
									</p>
								</div>
								<button
									class="ml-3 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
									on:click={copyPassword}
									title="Copy password"
								>
									<span class="material-icons">content_copy</span>
								</button>
							</div>
						</div>

						<!-- Close Button -->
						<Button
							on:click={closeModal}
							class="w-full bg-blue-600 hover:bg-blue-700"
						>
							<span class="material-icons mr-2">done</span>
							Close
						</Button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}