// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			code?: string;
			details?: unknown;
		}
		interface Locals {
			user?: {
				id: string;
				email: string;
				name: string;
			};
			session?: {
				id: string;
				userId: string;
			};
		}
		interface PageData {}
		interface PageState {}
		interface Platform {}
	}
}

export {};