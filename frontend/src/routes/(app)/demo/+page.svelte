<script lang="ts">
	import { onMount } from 'svelte';
	import PageTitle from '../../../lib/components/basics/PageTitle.svelte'
	import Button from '../../../lib/components/basics/Button.svelte'
	import { trpc } from '../../../lib/trpcClient'
	import { logSuccess, logError } from '../../../lib/stores/alerts'
	
	// Sample data for email templates
	const sampleData = {
		userName: 'John Doe',
		userEmail: 'john.doe@example.com',
		verifyUrl: 'https://licensegate.com/verify?token=sample-token',
		resetUrl: 'https://licensegate.com/reset?token=sample-token',
		dashboardUrl: 'https://licensegate.com/dashboard',
		licenseKey: 'ABCD-EFGH-IJKL-MNOP',
		productName: 'LicenseGate Pro',
		expirationDate: '2025-12-31'
	}

	// SMTP Configuration State
	let isAdmin = false;
	let showSmtpConfig = false;
	let loadingSmtp = false;
	let testingSmtp = false;
	let savingSmtp = false;
	let smtpConfigured = false;
	let showPassword = false;
	
	let smtpSettings = {
		host: '',
		port: 587,
		username: '',
		password: '',
		sender: '',
		secure: true
	};
	
	let testResult: any = null;

	// Check admin and load SMTP settings
	onMount(async () => {
		try {
			const userInfo = await trpc.auth.me.query();
			isAdmin = userInfo.isAdmin || false;
			
			if (isAdmin) {
				await loadSmtpSettings();
			}
		} catch (error) {
			console.error('Failed to check admin status:', error);
		}
	});

	async function loadSmtpSettings() {
		try {
			loadingSmtp = true;
			const response = await trpc.settings.getSettings.query({ category: 'smtp' });
			
			console.log('📧 Loading SMTP settings...');
			
			if (response.success && response.data) {
				console.log('📧 Available fields:', Object.keys(response.data));
				
				smtpSettings = {
					host: response.data.host || '',
					port: parseInt(response.data.port) || 587,
					username: response.data.username || '',
					password: response.data.password || '',
					sender: response.data.sender || '',
					secure: response.data.secure === 'true'
				};
				
				// Check if all required fields are present
				const isConfigured = !!(
					smtpSettings.host && 
					smtpSettings.username && 
					smtpSettings.password && 
					smtpSettings.sender
				);
				
				smtpConfigured = isConfigured;
				
				console.log('✅ SMTP Configured:', isConfigured);
				console.log('✅ Host loaded:', smtpSettings.host ? 'YES' : 'NO');
				console.log('✅ Username loaded:', smtpSettings.username ? 'YES' : 'NO');
				console.log('✅ Sender loaded:', smtpSettings.sender ? 'YES' : 'NO');
			} else {
				smtpConfigured = false;
				console.log('⚠️ SMTP not configured - no data in response');
			}
		} catch (error: any) {
			console.error('❌ Failed to load SMTP settings:', error);
			smtpConfigured = false;
		} finally {
			loadingSmtp = false;
		}
	}

	async function saveSmtpSettings() {
		if (!smtpSettings.host || !smtpSettings.username || !smtpSettings.password || !smtpSettings.sender) {
			logError('Please fill in all required fields (Host, Username, Password, Sender)');
			return;
		}

		// Validate email formats
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(smtpSettings.username)) {
			logError('Username must be a valid email address');
			return;
		}
		if (!emailRegex.test(smtpSettings.sender)) {
			logError('Sender must be a valid email address');
			return;
		}

		try {
			savingSmtp = true;
			console.log('💾 Saving SMTP settings...');

			await trpc.settings.updateSmtpSettings.mutate(smtpSettings);
			
			console.log('✅ SMTP settings saved successfully');
			
			// Reload settings to confirm they're saved
			await loadSmtpSettings();
			
			logSuccess('SMTP settings saved successfully! ✓');
			testResult = null;
		} catch (error: any) {
			console.error('❌ Failed to save SMTP settings:', error);
			
			// Extract detailed error message
			let errorMessage = 'Failed to save SMTP settings';
			
			if (error?.message) {
				errorMessage = error.message;
			} else if (error?.data?.message) {
				errorMessage = error.data.message;
			} else if (typeof error === 'string') {
				errorMessage = error;
			}
			
			logError(errorMessage);
		} finally {
			savingSmtp = false;
		}
	}

	async function testSmtpConnection() {
		if (!smtpConfigured) {
			logError('Please save SMTP settings first');
			return;
		}

		try {
			testingSmtp = true;
			testResult = null;
			const result = await trpc.settings.testSmtpConnection.mutate(smtpSettings);
			testResult = result;
			
			if (result.success) {
				logSuccess('SMTP connection successful!');
			} else {
				logError(result.message || 'SMTP connection failed');
			}
		} catch (error: any) {
			console.error('SMTP test failed:', error);
			testResult = { success: false, message: error.message || 'SMTP test failed' };
			logError(error.message || 'SMTP test failed');
		} finally {
			testingSmtp = false;
		}
	}
	
	// Email templates content
	const emailTemplates = [
		{
			name: 'Welcome New User',
			description: 'Email sent to new users after registration',
			icon: '👋',
			color: 'blue',
			content: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
					<div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
						<div style="text-align: center; margin-bottom: 30px;">
							<h1 style="color: #2563eb; margin: 0; font-size: 28px;">Welcome to LicenseGate!</h1>
						</div>
						<p style="color: #374151; font-size: 16px; line-height: 1.6;">
							Hello <strong>${sampleData.userName}</strong>,
						</p>
						<p style="color: #374151; font-size: 16px; line-height: 1.6;">
							Welcome to LicenseGate! We're excited to have you on board.
						</p>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${sampleData.dashboardUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
								Go to Dashboard
							</a>
						</div>
					</div>
				</div>
			`
		},
		{
			name: 'Email Verification',
			description: 'Email verification link for new accounts',
			icon: '✉️',
			color: 'green',
			content: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
					<div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
						<div style="text-align: center; margin-bottom: 30px;">
							<h1 style="color: #10b981; margin: 0; font-size: 28px;">Verify Your Email</h1>
						</div>
						<p style="color: #374151; font-size: 16px; line-height: 1.6;">
							Hello <strong>${sampleData.userName}</strong>,
						</p>
						<p style="color: #374151; font-size: 16px; line-height: 1.6;">
							Please verify your email address by clicking the button below.
						</p>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${sampleData.verifyUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
								Verify Email Address
							</a>
						</div>
					</div>
				</div>
			`
		},
		{
			name: 'Password Reset',
			description: 'Password reset instructions and link',
			icon: '🔐',
			color: 'red',
			content: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
					<div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
						<div style="text-align: center; margin-bottom: 30px;">
							<h1 style="color: #dc2626; margin: 0; font-size: 28px;">Reset Your Password</h1>
						</div>
						<p style="color: #374151; font-size: 16px; line-height: 1.6;">
							Hello <strong>${sampleData.userName}</strong>,
						</p>
						<p style="color: #374151; font-size: 16px; line-height: 1.6;">
							We received a request to reset your password.
						</p>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${sampleData.resetUrl}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
								Reset Password
							</a>
						</div>
					</div>
				</div>
			`
		},
		{
			name: 'License Ready',
			description: 'Notification when a new license is generated',
			icon: '🎉',
			color: 'emerald',
			content: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
					<div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
						<div style="text-align: center; margin-bottom: 30px;">
							<h1 style="color: #059669; margin: 0; font-size: 28px;">Your License is Ready!</h1>
						</div>
						<p style="color: #374151; font-size: 16px; line-height: 1.6;">
							Hello <strong>${sampleData.userName}</strong>,
						</p>
						<p style="color: #374151; font-size: 16px; line-height: 1.6;">
							Your license for <strong>${sampleData.productName}</strong> has been generated.
						</p>
						<div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
							<p style="margin: 0; color: #374151; font-size: 14px; font-weight: bold;">License Key:</p>
							<p style="margin: 5px 0 0 0; font-family: monospace; font-size: 18px; color: #1f2937; font-weight: bold;">
								${sampleData.licenseKey}
							</p>
						</div>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${sampleData.dashboardUrl}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
								View License Details
							</a>
						</div>
					</div>
				</div>
			`
		},
		{
			name: 'Activation Confirmation',
			description: 'Confirmation after successful account activation',
			icon: '✅',
			color: 'teal',
			content: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
					<div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
						<div style="text-align: center; margin-bottom: 30px;">
							<h1 style="color: #10b981; margin: 0; font-size: 28px;">Account Activated!</h1>
						</div>
						<p style="color: #374151; font-size: 16px; line-height: 1.6;">
							Hello <strong>${sampleData.userName}</strong>,
						</p>
						<p style="color: #374151; font-size: 16px; line-height: 1.6;">
							Your account has been successfully activated.
						</p>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${sampleData.dashboardUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
								Start Using LicenseGate
							</a>
						</div>
					</div>
				</div>
			`
		},
		{
			name: 'Verification Reminder',
			description: 'Reminder to verify email address',
			icon: '⏰',
			color: 'amber',
			content: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
					<div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
						<div style="text-align: center; margin-bottom: 30px;">
							<h1 style="color: #f59e0b; margin: 0; font-size: 28px;">Reminder: Verify Your Email</h1>
						</div>
						<p style="color: #374151; font-size: 16px; line-height: 1.6;">
							Hello <strong>${sampleData.userName}</strong>,
						</p>
						<p style="color: #374151; font-size: 16px; line-height: 1.6;">
							This is a reminder to verify your email address.
						</p>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${sampleData.verifyUrl}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
								Verify Now
							</a>
						</div>
					</div>
				</div>
			`
		}
	]
	
	let selectedTemplate = emailTemplates[0]
	
	// Test Email Functionality (for templates)
	let templateTestEmail = ''
	let sendingTestEmail = false
	let testEmailSent = false
	
	async function sendTemplateTestEmail() {
		if (!templateTestEmail || !selectedTemplate) {
			logError('Please enter an email address');
			return;
		}
		
		// Force reload SMTP settings before testing
		await loadSmtpSettings();
		
		// Check if SMTP is configured
		if (!smtpConfigured) {
			logError('SMTP not configured. Please configure SMTP settings first in the section above.');
			showSmtpConfig = true;
			return;
		}
		
		sendingTestEmail = true
		testEmailSent = false
		
		try {
			const result = await trpc.admin.sendTestEmail.mutate({
				recipientEmail: templateTestEmail,
				templateName: selectedTemplate.name,
				templateData: {
					userName: sampleData.userName,
					userEmail: templateTestEmail,
					verifyUrl: sampleData.verifyUrl,
					resetUrl: sampleData.resetUrl,
					dashboardUrl: sampleData.dashboardUrl,
					licenseKey: sampleData.licenseKey,
					productName: sampleData.productName,
					expirationDate: sampleData.expirationDate
				}
			})
			
			if (result.success) {
				testEmailSent = true
				logSuccess(`Test email sent to ${templateTestEmail}`)
				
				setTimeout(() => {
					testEmailSent = false
				}, 5000)
			}
			
		} catch (error: any) {
			console.error('❌ Failed to send test email:', error)
			logError(error.message || 'Failed to send test email. Please check SMTP configuration.')
			
			if (error.message?.includes('SMTP not configured')) {
				showSmtpConfig = true;
			}
		} finally {
			sendingTestEmail = false
		}
	}
	
	// Reset test email status when template changes
	$: if (selectedTemplate) {
		testEmailSent = false
	}
</script>

<PageTitle title="Email Templates & SMTP Settings" />

<div class="max-w-7xl mx-auto space-y-6">
	
	<!-- SMTP Configuration (Admin Only) -->
	{#if isAdmin}
	<div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg border-2 border-blue-200">
		<button 
			on:click={() => showSmtpConfig = !showSmtpConfig} 
			class="w-full flex items-center justify-between p-6 hover:bg-white/30 transition-all duration-200 rounded-xl"
		>
			<div class="flex items-center space-x-4">
				<div class="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
					<svg class="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
						<path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
					</svg>
				</div>
				<div class="text-left">
					<h2 class="text-xl font-bold text-gray-900 flex items-center">
						SMTP Configuration
						<span class="ml-2 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">Admin</span>
						{#if smtpConfigured}
						<span class="ml-2 px-2 py-0.5 text-xs bg-green-600 text-white rounded-full">✓ Configured</span>
						{:else}
						<span class="ml-2 px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full">⚠ Not Configured</span>
						{/if}
					</h2>
					<p class="text-sm text-gray-600 mt-1">
						{#if smtpConfigured}
							SMTP is configured and ready to send emails
						{:else}
							Configure SMTP to enable email sending
						{/if}
					</p>
				</div>
			</div>
			<svg 
				class="w-6 h-6 text-gray-600 transform transition-transform duration-200" 
				class:rotate-180={showSmtpConfig}
				fill="currentColor" 
				viewBox="0 0 20 20"
			>
				<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
			</svg>
		</button>

		{#if showSmtpConfig}
		<div class="px-6 pb-6 space-y-5 border-t border-blue-200 pt-6">
			
			<!-- Status Banner -->
			{#if !smtpConfigured}
			<div class="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
						</svg>
					</div>
					<div class="ml-3">
						<p class="text-sm text-amber-700">
							<strong>SMTP not configured!</strong> Please fill in all fields and save settings to enable email sending.
						</p>
					</div>
				</div>
			</div>
			{/if}
			
			<!-- SMTP Form -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Host -->
				<div>
					<label class="block text-sm font-semibold text-gray-700 mb-2">
						SMTP Host <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						bind:value={smtpSettings.host}
						placeholder="smtp.gmail.com"
						class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
						disabled={savingSmtp}
					/>
				</div>

				<!-- Port -->
				<div>
					<label class="block text-sm font-semibold text-gray-700 mb-2">
						Port <span class="text-red-500">*</span>
					</label>
					<input
						type="number"
						bind:value={smtpSettings.port}
						placeholder="587"
						class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
						disabled={savingSmtp}
					/>
				</div>

				<!-- Username -->
				<div>
					<label class="block text-sm font-semibold text-gray-700 mb-2">
						Username (Email) <span class="text-red-500">*</span>
					</label>
					<input
						type="email"
						bind:value={smtpSettings.username}
						placeholder="your-email@gmail.com"
						class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
						disabled={savingSmtp}
					/>
				</div>

				<!-- Password -->
				<div>
					<label class="block text-sm font-semibold text-gray-700 mb-2">
						Password <span class="text-red-500">*</span>
					</label>
					<div class="relative">
						{#if showPassword}
							<input
								type="text"
								bind:value={smtpSettings.password}
								placeholder="App Password or SMTP Password"
								class="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
								disabled={savingSmtp}
							/>
						{:else}
							<input
								type="password"
								bind:value={smtpSettings.password}
								placeholder="••••••••"
								class="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
								disabled={savingSmtp}
							/>
						{/if}
						<button
							type="button"
							on:click={() => showPassword = !showPassword}
							class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
						>
							{#if showPassword}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
								</svg>
							{:else}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
								</svg>
							{/if}
						</button>
					</div>
					<p class="text-xs text-gray-500 mt-1">
						💡 For Gmail, use an <a href="https://support.google.com/accounts/answer/185833" target="_blank" class="text-blue-600 hover:underline">App Password</a>
					</p>
				</div>

				<!-- Sender -->
				<div class="md:col-span-2">
					<label class="block text-sm font-semibold text-gray-700 mb-2">
						Sender Email <span class="text-red-500">*</span>
					</label>
					<input
						type="email"
						bind:value={smtpSettings.sender}
						placeholder="noreply@yourdomain.com"
						class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
						disabled={savingSmtp}
					/>
				</div>

				<!-- Secure -->
				<div class="md:col-span-2">
					<label class="flex items-center space-x-2 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={smtpSettings.secure}
							class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
							disabled={savingSmtp}
						/>
						<span class="text-sm font-medium text-gray-700">Use SSL/TLS (Secure Connection)</span>
					</label>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex flex-wrap gap-3 pt-4 border-t border-gray-200 mt-4">
				<Button 
					on:click={saveSmtpSettings} 
					disabled={savingSmtp || !smtpSettings.host || !smtpSettings.username || !smtpSettings.password || !smtpSettings.sender}
					class="flex-1 sm:flex-none"
				>
					{#if savingSmtp}
						<svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Saving...
					{:else}
						💾 Save Settings
					{/if}
				</Button>

				<button
					on:click={testSmtpConnection}
					disabled={testingSmtp || !smtpConfigured}
					class="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
				>
					{#if testingSmtp}
						<svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Testing...
					{:else}
						🔌 Test Connection
					{/if}
				</button>
			</div>

			<!-- Test Result -->
			{#if testResult}
			<div class="mt-4 p-4 rounded-lg border-2 {testResult.success ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}">
				<p class="text-sm font-medium {testResult.success ? 'text-green-800' : 'text-red-800'}">
					{testResult.success ? '✅' : '❌'} {testResult.message}
				</p>
			</div>
			{/if}
			
			<div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
				<p class="text-sm text-gray-700">
					<strong>💡 Note:</strong> After saving SMTP settings, you can test sending emails using any template in the "Email Templates" section below.
				</p>
			</div>

			<!-- Quick Guide -->
			<div class="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
				<h4 class="font-semibold text-gray-800 mb-2 flex items-center">
					<svg class="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
					</svg>
					Popular SMTP Providers
				</h4>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
					<div class="bg-white p-3 rounded border border-blue-100">
						<strong>Gmail:</strong><br/>
						Host: smtp.gmail.com<br/>
						Port: 587<br/>
						<span class="text-xs text-blue-600">Requires App Password</span>
					</div>
					<div class="bg-white p-3 rounded border border-blue-100">
						<strong>SendGrid:</strong><br/>
						Host: smtp.sendgrid.net<br/>
						Port: 587<br/>
						<span class="text-xs text-blue-600">Use API Key as password</span>
					</div>
				</div>
			</div>
		</div>
		{/if}
	</div>
	{/if}

	<!-- Email Templates Section -->
	<div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
		<div class="mb-6">
			<h2 class="text-2xl font-bold text-gray-900 mb-2">📧 Email Templates</h2>
			<p class="text-gray-600">
				Preview and test email templates used throughout the LicenseGate system.
			</p>
		</div>
		
		<!-- Template Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
			{#each emailTemplates as template}
				<button
					on:click={() => selectedTemplate = template}
					class="p-4 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md"
					class:border-blue-500={selectedTemplate === template}
					class:bg-blue-50={selectedTemplate === template}
					class:border-gray-200={selectedTemplate !== template}
					class:bg-white={selectedTemplate !== template}
				>
					<div class="flex items-start space-x-3">
						<div class="text-3xl flex-shrink-0">{template.icon}</div>
						<div class="flex-1 min-w-0">
							<h3 class="font-semibold text-gray-900 mb-1">{template.name}</h3>
							<p class="text-xs text-gray-600">{template.description}</p>
						</div>
						{#if selectedTemplate === template}
							<svg class="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
							</svg>
						{/if}
					</div>
				</button>
			{/each}
		</div>

		<!-- Send Test Email -->
		<div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 mb-6 border-2 border-green-200">
			<h3 class="text-lg font-bold text-gray-900 mb-3 flex items-center">
				<svg class="w-6 h-6 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
					<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
					<path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
				</svg>
				Send Test Email: {selectedTemplate.name}
			</h3>
			
			{#if !smtpConfigured}
			<div class="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r mb-4">
				<p class="text-sm text-amber-800">
					⚠️ <strong>SMTP not configured!</strong> Please configure SMTP settings above first.
				</p>
			</div>
			{/if}
			
			<div class="flex flex-col sm:flex-row gap-3">
				<div class="flex-1">
					<input
						type="email"
						bind:value={templateTestEmail}
						placeholder="recipient@example.com"
						class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
						disabled={sendingTestEmail}
					/>
				</div>
				
				<button
					on:click={sendTemplateTestEmail}
					disabled={!templateTestEmail || sendingTestEmail || !selectedTemplate}
					class="px-6 py-3 bg-green-600 text-white rounded-lg font-bold transition-all duration-200 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center min-w-[160px] shadow-md hover:shadow-lg"
				>
					{#if sendingTestEmail}
						<svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Sending...
					{:else if testEmailSent}
						✅ Sent!
					{:else}
						📧 Send Test Email
					{/if}
				</button>
			</div>
		</div>

		<!-- Email Preview -->
		<div class="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
			<h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
				<svg class="w-5 h-5 mr-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
					<path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
					<path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"></path>
				</svg>
				Email Preview
			</h3>
			<div class="bg-white rounded-lg shadow-inner">
				{@html selectedTemplate.content}
			</div>
		</div>
	</div>
</div>

<style>
	:global(.rotate-180) {
		transform: rotate(180deg);
	}
</style>