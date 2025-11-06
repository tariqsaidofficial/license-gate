import { writable } from 'svelte/store'

export interface Toast {
	id: string
	type: 'success' | 'error' | 'info' | 'warning'
	title: string
	message?: string
	duration?: number
	action?: { label: string; handler: () => void }
}

function createToastStore() {
	const { subscribe, set, update } = writable<Toast[]>([])

	return {
		subscribe,
		add: (toast: Omit<Toast, 'id'>) => {
			const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
			const newToast: Toast = { id, ...toast }
			
			update(toasts => [...toasts, newToast])
			return id
		},
		remove: (id: string) => {
			update(toasts => toasts.filter(t => t.id !== id))
		},
		clear: () => {
			set([])
		}
	}
}

export const toasts = createToastStore()

// Helper functions for different toast types
export const showSuccess = (title: string, message?: string, action?: Toast['action']) => {
	return toasts.add({ type: 'success', title, message, action, duration: 4000 })
}

export const showError = (title: string, message?: string, action?: Toast['action']) => {
	return toasts.add({ type: 'error', title, message, action, duration: 6000 })
}

export const showInfo = (title: string, message?: string, action?: Toast['action']) => {
	return toasts.add({ type: 'info', title, message, action, duration: 5000 })
}

export const showWarning = (title: string, message?: string, action?: Toast['action']) => {
	return toasts.add({ type: 'warning', title, message, action, duration: 5000 })
}

// Verification specific toasts
export const showVerificationSuccess = () => {
	return showSuccess(
		'Email Verified!',
		'Your email address has been successfully verified'
	)
}

export const showVerificationSent = (email?: string) => {
	return showInfo(
		'Verification Email Sent',
		email ? `Verification link sent to ${email}` : 'Please check your inbox for the verification link'
	)
}

export const showPaymentSuccess = () => {
	return showSuccess(
		'Payment Successful! 🎉',
		'Your payment has been processed and license created'
	)
}
