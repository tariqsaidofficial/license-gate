import { goto } from '$app/navigation'
import { showError, showPaymentSuccess } from '../stores/toast'

export interface PaymentStatus {
	id: string
	status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
	licenseInfo?: {
		licenseKey: string
		expirationDate: Date | null
		scope: string
		status: string
	}
	error?: string
}

export class PaymentStatusChecker {
	private paymentId: string
	private attempts = 0
	private maxAttempts = 30
	private intervalId: NodeJS.Timeout | null = null
	private onStatusChange?: (status: PaymentStatus) => void

	constructor(paymentId: string, maxAttempts = 30) {
		this.paymentId = paymentId
		this.maxAttempts = maxAttempts
	}

	async checkStatus(): Promise<PaymentStatus> {
		try {
			// This would be replaced with actual API call
			// const response = await trpc.payment.checkStatus.query({ paymentId: this.paymentId })
			
			// Simulate payment status check
			const status = this.simulatePaymentCheck()
			return {
				id: this.paymentId,
				status,
				licenseInfo: status === 'completed' ? {
					licenseKey: 'LIC-XXXX-XXXX-XXXX',
					expirationDate: null,
					scope: 'premium',
					status: 'active'
				} : undefined
			}
		} catch (error) {
			return {
				id: this.paymentId,
				status: 'failed',
				error: error instanceof Error ? error.message : 'Unknown error'
			}
		}
	}

	startPolling(onStatusChange?: (status: PaymentStatus) => void): void {
		this.onStatusChange = onStatusChange
		this.poll()
		
		this.intervalId = setInterval(() => {
			this.poll()
		}, 10000) // Check every 10 seconds
	}

	stopPolling(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId)
			this.intervalId = null
		}
	}

	private async poll(): Promise<void> {
		this.attempts++
		
		if (this.attempts > this.maxAttempts) {
			this.stopPolling()
			const timeoutStatus: PaymentStatus = {
				id: this.paymentId,
				status: 'failed',
				error: 'Timeout: Payment verification took too long'
			}
			this.onStatusChange?.(timeoutStatus)
			return
		}

		const status = await this.checkStatus()
		this.onStatusChange?.(status)

		// Stop polling if payment is completed or failed
		if (status.status === 'completed' || status.status === 'failed') {
			this.stopPolling()
			
			if (status.status === 'completed') {
				showPaymentSuccess()
				// Redirect to success page after a delay
				setTimeout(() => {
					goto(`/payment-success?payment_id=${this.paymentId}`)
				}, 2000)
			} else {
				showError(status.error || 'Payment verification failed')
			}
		}
	}

	// Simulate payment status - replace with actual API logic
	private simulatePaymentCheck(): PaymentStatus['status'] {
		// Simulate different outcomes based on attempts
		if (this.attempts <= 3) {
			return 'pending'
		} else if (this.attempts <= 8) {
			return 'processing'
		} else if (this.attempts <= 15) {
			// Random chance of completion
			return Math.random() > 0.6 ? 'completed' : 'processing'
		} else {
			// Higher chance of completion after many attempts
			return Math.random() > 0.3 ? 'completed' : 'processing'
		}
	}
}

// Utility function to start payment verification
export function startPaymentVerification(paymentId: string): PaymentStatusChecker {
	const checker = new PaymentStatusChecker(paymentId)
	return checker
}

// Utility function to handle payment redirect from external payment providers
export function handlePaymentReturn(searchParams: URLSearchParams): void {
	const paymentId = searchParams.get('payment_id')
	const orderId = searchParams.get('order_id')
	const status = searchParams.get('status')

	if (paymentId || orderId) {
		if (status === 'success' || status === 'completed') {
			// Direct success - go to success page
			goto(`/payment-success?payment_id=${paymentId || orderId}`)
		} else {
			// Need verification - go to processing page
			goto(`/payment-processing?payment_id=${paymentId || orderId}`)
		}
	} else {
		// No payment info - redirect to pricing
		goto('/pricing')
	}
}
