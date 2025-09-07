
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/auth" | "/api/auth/forgot-password" | "/api/auth/login" | "/api/auth/logout" | "/api/auth/me" | "/api/auth/refresh" | "/api/auth/register" | "/api/auth/reset-password" | "/api/auth/verify-email" | "/api/cache" | "/api/cache/stats" | "/api/cache/test" | "/api/email" | "/api/email/test" | "/api/email/unsubscribe" | "/api/health" | "/api/monitors" | "/api/monitors/[id]" | "/api/monitors/[id]/toggle";
		RouteParams(): {
			"/api/monitors/[id]": { id: string };
			"/api/monitors/[id]/toggle": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string };
			"/api": { id?: string };
			"/api/auth": Record<string, never>;
			"/api/auth/forgot-password": Record<string, never>;
			"/api/auth/login": Record<string, never>;
			"/api/auth/logout": Record<string, never>;
			"/api/auth/me": Record<string, never>;
			"/api/auth/refresh": Record<string, never>;
			"/api/auth/register": Record<string, never>;
			"/api/auth/reset-password": Record<string, never>;
			"/api/auth/verify-email": Record<string, never>;
			"/api/cache": Record<string, never>;
			"/api/cache/stats": Record<string, never>;
			"/api/cache/test": Record<string, never>;
			"/api/email": Record<string, never>;
			"/api/email/test": Record<string, never>;
			"/api/email/unsubscribe": Record<string, never>;
			"/api/health": Record<string, never>;
			"/api/monitors": { id?: string };
			"/api/monitors/[id]": { id: string };
			"/api/monitors/[id]/toggle": { id: string }
		};
		Pathname(): "/" | "/api" | "/api/" | "/api/auth" | "/api/auth/" | "/api/auth/forgot-password" | "/api/auth/forgot-password/" | "/api/auth/login" | "/api/auth/login/" | "/api/auth/logout" | "/api/auth/logout/" | "/api/auth/me" | "/api/auth/me/" | "/api/auth/refresh" | "/api/auth/refresh/" | "/api/auth/register" | "/api/auth/register/" | "/api/auth/reset-password" | "/api/auth/reset-password/" | "/api/auth/verify-email" | "/api/auth/verify-email/" | "/api/cache" | "/api/cache/" | "/api/cache/stats" | "/api/cache/stats/" | "/api/cache/test" | "/api/cache/test/" | "/api/email" | "/api/email/" | "/api/email/test" | "/api/email/test/" | "/api/email/unsubscribe" | "/api/email/unsubscribe/" | "/api/health" | "/api/health/" | "/api/monitors" | "/api/monitors/" | `/api/monitors/${string}` & {} | `/api/monitors/${string}/` & {} | `/api/monitors/${string}/toggle` & {} | `/api/monitors/${string}/toggle/` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}