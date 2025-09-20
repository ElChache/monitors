import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// Ensure user is authenticated
	if (!locals.session?.user) {
		throw redirect(302, '/auth/signin');
	}

	return {
		session: locals.session
	};
};