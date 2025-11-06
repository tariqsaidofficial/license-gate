<script lang="ts">
	import PageTitle from '../../../lib/components/basics/PageTitle.svelte'
	
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
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Template Info -->
		<div class="bg-white rounded-lg shadow-sm border p-6">
			<h2 class="text-xl font-semibold text-gray-800 mb-2">{selectedTemplate.name}</h2>
			<p class="text-gray-600 mb-4">{selectedTemplate.description}</p>
			
			<div class="space-y-3">
				<div>
					<h3 class="font-medium text-gray-700 mb-2">Template Variables:</h3>
					<div class="bg-gray-50 rounded p-3 text-sm font-mono">
						<div class="grid grid-cols-1 gap-1">
							<div><span class="text-blue-600">userName:</span> {sampleData.userName}</div>
							<div><span class="text-blue-600">userEmail:</span> {sampleData.userEmail}</div>
							<div><span class="text-blue-600">productName:</span> {sampleData.productName}</div>
							<div><span class="text-blue-600">licenseKey:</span> {sampleData.licenseKey}</div>
							<div><span class="text-blue-600">expirationDate:</span> {sampleData.expirationDate}</div>
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

	<!-- Technical Information -->
	<div class="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
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
		<div class="mt-4 p-3 bg-white rounded border border-blue-200">
			<p class="text-sm text-blue-700">
				<strong>Setup Required:</strong> Configure SMTP settings in your environment variables to enable email sending.
				See the <a href="/docs/setup/OAUTH_CONFIGURATION.md" class="underline">setup documentation</a> for details.
			</p>
		</div>
	</div>
</div>