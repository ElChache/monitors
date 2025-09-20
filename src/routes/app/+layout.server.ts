// MonitorHub App Layout Server
// Authentication check for protected routes

import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	// Redirect to login if not authenticated
	if (!session?.user) {
		throw redirect(302, '/auth/login');
	}

	return {
		session
	};
};