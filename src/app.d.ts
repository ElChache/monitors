// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// Browser globals
	const fetch: typeof globalThis.fetch;
	const console: typeof globalThis.console;
	const alert: typeof globalThis.alert;
	const confirm: typeof globalThis.confirm;
	const setInterval: typeof globalThis.setInterval;
	const clearInterval: typeof globalThis.clearInterval;
	const CustomEvent: typeof globalThis.CustomEvent;
	
	// Node.js types for server-side
	namespace NodeJS {
		interface Timeout {
			[Symbol.toPrimitive](): number;
		}
	}
}

export {};
