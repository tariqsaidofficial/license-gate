import { redirect } from '@sveltejs/kit';

export const load = () => {
	// Redirect to dashboard if authenticated, otherwise to login
	throw redirect(302, '/dashboard');
};
