<script lang="ts">
	import PageTitle from '../../../lib/components/basics/PageTitle.svelte'
	import { trpc } from '../../../lib/trpcClient'
	
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
	
	// Email templates content (simplified for demo)
	const emailTemplates = [
		{
			name: 'Welcome New User',
			description: 'Email sent to new users after registration',
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
							Welcome to LicenseGate! We're excited to have you on board. Your account has been successfully created and you can now start managing your software licenses.
						</p>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${sampleData.dashboardUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
								Go to Dashboard
							</a>
						</div>
						<p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
							If you have any questions, feel free to contact our support team.
						</p>
					</div>
				</div>
			`
		},
		{
			name: 'Email Verification',
			description: 'Email verification link for new accounts',
			content: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
					<div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
						<div style="text-align: center; margin-bottom: 30px;">
							<h1 style="color: #2563eb; margin: 0; font-size: 28px;">Verify Your Email</h1>
						</div>
						<p style="color: #374151; font-size: 16px; line-height: 1.6;">
							Hello <strong>${sampleData.userName}</strong>,
						</p>
						<p style="color: #374151; font-size: 16px; line-height: 1.6;">
							Please verify your email address by clicking the button below. This link will expire in 24 hours.
						</p>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${sampleData.verifyUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
								Verify Email Address
							</a>
						</div>
						<p style="color: #6b7280; font-size: 14px;">
							If you didn't create an account, you can safely ignore this email.
						</p>
					</div>
				</div>
			`
		},
		{
			name: 'Password Reset',
			description: 'Password reset instructions and link',
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
							We received a request to reset your password. Click the button below to create a new password. This link will expire in 1 hour.
						</p>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${sampleData.resetUrl}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
								Reset Password
							</a>
						</div>
						<p style="color: #6b7280; font-size: 14px;">
							If you didn't request a password reset, you can safely ignore this email.
						</p>
					</div>
				</div>
			`
		},
		{
			name: 'License Ready',
			description: 'Notification when a new license is generated',
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
							Great news! Your license for <strong>${sampleData.productName}</strong> has been generated and is ready to use.
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
						<p style="color: #6b7280; font-size: 14px;">
							License expires on: <strong>${sampleData.expirationDate}</strong>
						</p>
					</div>
				</div>
			`
		},
		{
			name: 'Activation Confirmation',
			description: 'Confirmation after successful account activation',
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
							Congratulations! Your account has been successfully activated. You now have full access to all LicenseGate features.
						</p>
						<div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
							<p style="margin: 0; color: #065f46; font-weight: bold;">✓ Account Status: Active</p>
							<p style="margin: 5px 0 0 0; color: #065f46;">You can now create and manage licenses.</p>
						</div>
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
			content: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
					<div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
						<div style="text-align: center; margin-bottom: 30px;">
							<h1 style="color: #f59e0b; margin: 0; font-size: 28px;">Verify Your Email</h1>
						</div>
						<p style="color: #374151; font-size: 16px; line-height: 1.6;">
							Hello <strong>${sampleData.userName}</strong>,
						</p>
						<p style="color: #374151; font-size: 16px; line-height: 1.6;">
							We noticed that you haven't verified your email address yet. Please verify your email to unlock all features of your LicenseGate account.
						</p>
						<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
							<p style="margin: 0; color: #92400e; font-weight: bold;">⚠ Action Required</p>
							<p style="margin: 5px 0 0 0; color: #92400e;">Some features are limited until email verification.</p>
						</div>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${sampleData.verifyUrl}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
								Verify Email Now
							</a>
						</div>
					</div>
				</div>
			`
		}
	]
	
	let selectedTemplate = emailTemplates[0]
	
	// Test Email Functionality
	let testEmail = ''
	let sendingTestEmail = false
	let testEmailSent = false
	
	async function sendTestEmail() {
		if (!testEmail || !selectedTemplate) return
		
		sendingTestEmail = true
		testEmailSent = false
		
		try {
			// Call the backend API to send test email
			const result = await trpc.admin.sendTestEmail.mutate({
				recipientEmail: testEmail,
				templateName: selectedTemplate.name,
				templateData: {
					userName: sampleData.userName,
					userEmail: testEmail,
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
				
				// Show success message for 5 seconds
				setTimeout(() => {
					testEmailSent = false
				}, 5000)
				
				console.log('✅ Test email sent successfully:', result)
			}
			
		} catch (error) {
			console.error('❌ Failed to send test email:', error)
			
			// Show error notification
			const errorMessage = error?.message || 'Failed to send test email. Please check SMTP configuration.'
			
			// You can add a toast notification here if available
			alert(`Error: ${errorMessage}`)
		} finally {
			sendingTestEmail = false
		}
	}
	
	// Reset test email status when template changes
	$: if (selectedTemplate) {
		testEmailSent = false
	}
	
	// Save custom template data to localStorage
	$: if (typeof window !== 'undefined') {
		localStorage.setItem('demo-template-data', JSON.stringify(sampleData))
	}
	
	// Load custom template data from localStorage
	import { onMount } from 'svelte'
	
	onMount(() => {
		const saved = localStorage.getItem('demo-template-data')
		if (saved) {
			try {
				const savedData = JSON.parse(saved)
				Object.assign(sampleData, savedData)
			} catch (e) {
				console.log('Could not load saved template data')
			}
		}
	})
</script>

<PageTitle title="Email Templates Demo" />

<div class="max-w-7xl mx-auto">
	<div class="mb-6">
		<p class="text-gray-600 mb-4">
			Preview all email templates used in the LicenseGate system. These templates are automatically sent for various user actions and system events.
		</p>
		
		<!-- Template Selector -->
		<div class="flex flex-wrap gap-2 mb-6">
			{#each emailTemplates as template}
				<button
					class="px-4 py-2 rounded-lg border transition-all duration-200"
					class:bg-blue-500={selectedTemplate === template}
					class:text-white={selectedTemplate === template}
					class:border-blue-500={selectedTemplate === template}
					class:bg-white={selectedTemplate !== template}
					class:text-gray-700={selectedTemplate !== template}
					class:border-gray-300={selectedTemplate !== template}
					class:hover:border-blue-300={selectedTemplate !== template}
					on:click={() => selectedTemplate = template}
				>
					{template.name}
				</button>
			{/each}
		</div>

		<!-- Test Email Section -->
		<div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6 border border-green-200">
			<div class="flex items-center mb-4">
				<svg class="w-6 h-6 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
					<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
					<path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
				</svg>
				<h3 class="text-lg font-semibold text-gray-800">Send Test Email</h3>
			</div>
			
			<p class="text-gray-600 mb-4">
				Test the selected email template by sending it to any email address. This helps you verify how the email will look in different email clients.
			</p>
			
			<div class="flex flex-col sm:flex-row gap-3">
				<div class="flex-1">
					<label class="block text-sm font-medium text-gray-700 mb-2">
						Recipient Email Address
					</label>
					<input
						type="email"
						bind:value={testEmail}
						placeholder="test@example.com"
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						disabled={sendingTestEmail}
					/>
				</div>
				
				<div class="flex flex-col justify-end">
					<button
						on:click={sendTestEmail}
						disabled={!testEmail || sendingTestEmail || !selectedTemplate}
						class="px-6 py-2 bg-green-600 text-white rounded-lg font-medium transition-all duration-200 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
					>
						{#if sendingTestEmail}
							<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Sending...
						{:else if testEmailSent}
							<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
							</svg>
							Sent!
						{:else}
							<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
								<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
								<path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
							</svg>
							Send Test
						{/if}
					</button>
				</div>
			</div>
			
			{#if testEmailSent}
				<div class="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
					<div class="flex items-center">
						<svg class="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
						</svg>
						<span class="text-green-800 font-medium">
							Test email sent successfully to {testEmail}!
						</span>
					</div>
					<p class="text-green-700 text-sm mt-1 ml-7">
						Template: <strong>{selectedTemplate.name}</strong> • Check your inbox and spam folder.
					</p>
				</div>
			{/if}
			
			<div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
				<div class="flex items-center text-gray-600">
					<svg class="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
					</svg>
					<span>Selected: <strong>{selectedTemplate.name}</strong></span>
				</div>
				<div class="flex items-center text-gray-600">
					<svg class="w-4 h-4 mr-2 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
					</svg>
					<span>Requires SMTP setup</span>
				</div>
				<div class="flex items-center text-gray-600">
					<svg class="w-4 h-4 mr-2 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
					</svg>
					<span>Real email delivery</span>
				</div>
				<div class="flex items-center text-gray-600">
					<svg class="w-4 h-4 mr-2 text-purple-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
					<span>Admin access required</span>
				</div>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Template Info -->
		<div class="bg-white rounded-lg shadow-sm border p-6">
			<h2 class="text-xl font-semibold text-gray-800 mb-2">{selectedTemplate.name}</h2>
			<p class="text-gray-600 mb-4">{selectedTemplate.description}</p>
			
			<div class="space-y-3">
				<div>
					<h3 class="font-medium text-gray-700 mb-2">Template Variables:</h3>
					<div class="bg-gray-50 rounded p-3 text-sm space-y-2">
						<div class="grid grid-cols-1 gap-2">
							<div class="flex items-center">
								<label class="w-20 text-blue-600 font-mono text-xs">userName:</label>
								<input 
									type="text" 
									bind:value={sampleData.userName}
									class="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
								/>
							</div>
							<div class="flex items-center">
								<label class="w-20 text-blue-600 font-mono text-xs">productName:</label>
								<input 
									type="text" 
									bind:value={sampleData.productName}
									class="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
								/>
							</div>
							<div class="flex items-center">
								<label class="w-20 text-blue-600 font-mono text-xs">licenseKey:</label>
								<input 
									type="text" 
									bind:value={sampleData.licenseKey}
									class="flex-1 px-2 py-1 text-xs border border-gray-300 rounded font-mono"
								/>
							</div>
							<div class="flex items-center">
								<label class="w-20 text-blue-600 font-mono text-xs">expiration:</label>
								<input 
									type="date" 
									bind:value={sampleData.expirationDate}
									class="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
								/>
							</div>
						</div>
						<div class="pt-2 border-t border-gray-200">
							<button 
								on:click={() => {
									// Reset to defaults
									sampleData.userName = 'John Doe'
									sampleData.productName = 'LicenseGate Pro'
									sampleData.licenseKey = 'ABCD-EFGH-IJKL-MNOP'
									sampleData.expirationDate = '2025-12-31'
								}}
								class="text-xs text-blue-600 hover:text-blue-800 underline"
							>
								Reset to defaults
							</button>
						</div>
					</div>
				</div>
				
				<div>
					<h3 class="font-medium text-gray-700 mb-2">Usage:</h3>
					<div class="text-sm text-gray-600">
						{#if selectedTemplate.name === 'Welcome New User'}
							Sent automatically when a new user registers and their account is created.
						{:else if selectedTemplate.name === 'Email Verification'}
							Sent when a user needs to verify their email address during registration.
						{:else if selectedTemplate.name === 'Password Reset'}
							Sent when a user requests a password reset from the login page.
						{:else if selectedTemplate.name === 'License Ready'}
							Sent when a new license is generated for a user's product.
						{:else if selectedTemplate.name === 'Activation Confirmation'}
							Sent after successful email verification and account activation.
						{:else if selectedTemplate.name === 'Verification Reminder'}
							Sent as a reminder to users who haven't verified their email address.
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Template Preview -->
		<div class="bg-white rounded-lg shadow-sm border">
			<div class="p-4 border-b bg-gray-50 rounded-t-lg">
				<h3 class="font-medium text-gray-800">Email Preview</h3>
				<p class="text-sm text-gray-600">How the email will appear to recipients</p>
			</div>
			<div class="p-4">
				<div class="border rounded-lg overflow-hidden">
					<div class="bg-gray-100 px-4 py-2 text-sm text-gray-600 border-b">
						<div><strong>To:</strong> {sampleData.userEmail}</div>
						<div><strong>From:</strong> LicenseGate &lt;noreply@licensegate.com&gt;</div>
						<div><strong>Subject:</strong> 
							{#if selectedTemplate.name === 'Welcome New User'}
								Welcome to LicenseGate!
							{:else if selectedTemplate.name === 'Email Verification'}
								Please verify your email address
							{:else if selectedTemplate.name === 'Password Reset'}
								Reset your LicenseGate password
							{:else if selectedTemplate.name === 'License Ready'}
								Your license is ready!
							{:else if selectedTemplate.name === 'Activation Confirmation'}
								Account successfully activated
							{:else if selectedTemplate.name === 'Verification Reminder'}
								Please verify your email address
							{/if}
						</div>
					</div>
					<div class="bg-white">
						{@html selectedTemplate.content}
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- SMTP Configuration Quick Setup -->
	<div class="mt-8 bg-yellow-50 rounded-lg p-6 border border-yellow-200">
		<div class="flex items-center mb-4">
			<svg class="w-6 h-6 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
			</svg>
			<h3 class="text-lg font-semibold text-yellow-800">⚙️ SMTP Configuration Required</h3>
		</div>
		
		<p class="text-yellow-700 mb-4">
			To send test emails, you need to configure SMTP settings. You can do this in the Account Settings or by updating your environment variables.
		</p>
		
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<div>
				<h4 class="font-medium text-yellow-800 mb-2">Quick Setup Options:</h4>
				<div class="space-y-2">
					<a 
						href="/settings/account" 
						class="flex items-center p-3 bg-white rounded border border-yellow-300 hover:border-yellow-400 transition-colors"
					>
						<svg class="w-5 h-5 text-yellow-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path>
						</svg>
						<div>
							<div class="font-medium text-yellow-800">Configure in Account Settings</div>
							<div class="text-sm text-yellow-600">Admin panel with SMTP form</div>
						</div>
					</a>
					
					<div class="p-3 bg-white rounded border border-yellow-300">
						<div class="flex items-center mb-2">
							<svg class="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
							</svg>
							<div class="font-medium text-yellow-800">Environment Variables</div>
						</div>
						<div class="text-sm text-yellow-600 font-mono bg-yellow-100 p-2 rounded">
							SMTP_HOST=smtp.gmail.com<br>
							SMTP_PORT=587<br>
							SMTP_USERNAME=your-email@gmail.com<br>
							SMTP_PASSWORD=your-app-password<br>
							SMTP_SENDER=LicenseGate &lt;noreply@yourdomain.com&gt;
						</div>
					</div>
				</div>
			</div>
			
			<div>
				<h4 class="font-medium text-yellow-800 mb-2">Popular SMTP Providers:</h4>
				<div class="space-y-2 text-sm">
					<div class="p-2 bg-white rounded border border-yellow-300">
						<div class="font-medium text-yellow-800">Gmail</div>
						<div class="text-yellow-600">smtp.gmail.com:587 (Use App Password)</div>
					</div>
					<div class="p-2 bg-white rounded border border-yellow-300">
						<div class="font-medium text-yellow-800">Outlook/Hotmail</div>
						<div class="text-yellow-600">smtp-mail.outlook.com:587</div>
					</div>
					<div class="p-2 bg-white rounded border border-yellow-300">
						<div class="font-medium text-yellow-800">SendGrid</div>
						<div class="text-yellow-600">smtp.sendgrid.net:587</div>
					</div>
					<div class="p-2 bg-white rounded border border-yellow-300">
						<div class="font-medium text-yellow-800">Mailgun</div>
						<div class="text-yellow-600">smtp.mailgun.org:587</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Technical Information -->
	<div class="mt-6 bg-blue-50 rounded-lg p-6 border border-blue-200">
		<h3 class="text-lg font-semibold text-blue-800 mb-3">📧 Email System Information</h3>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
			<div>
				<h4 class="font-medium text-blue-700 mb-2">Configuration:</h4>
				<ul class="space-y-1 text-blue-600">
					<li>✅ SMTP Integration Ready</li>
					<li>✅ HTML Templates Included</li>
					<li>✅ Responsive Design</li>
					<li>✅ Error Handling</li>
				</ul>
			</div>
			<div>
				<h4 class="font-medium text-blue-700 mb-2">Features:</h4>
				<ul class="space-y-1 text-blue-600">
					<li>✅ Variable Substitution</li>
					<li>✅ Professional Styling</li>
					<li>✅ Cross-client Compatibility</li>
					<li>✅ Automated Sending</li>
				</ul>
			</div>
		</div>
	</div>
</div>