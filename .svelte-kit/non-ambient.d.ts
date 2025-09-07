
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
		RouteId(): "/" | "/admin" | "/api" | "/api/admin" | "/api/admin/activity" | "/api/admin/config" | "/api/admin/health" | "/api/admin/stats" | "/api/admin/users" | "/api/ai" | "/api/ai/suggestions" | "/api/auth" | "/api/auth/forgot-password" | "/api/auth/google" | "/api/auth/login" | "/api/auth/logout" | "/api/auth/me" | "/api/auth/refresh" | "/api/auth/register" | "/api/auth/reset-password" | "/api/auth/verify-email" | "/api/cache" | "/api/cache/stats" | "/api/cache/test" | "/api/email" | "/api/email/test" | "/api/email/unsubscribe" | "/api/health" | "/api/monitoring" | "/api/monitoring/evaluate-all" | "/api/monitoring/status" | "/api/monitoring/test" | "/api/monitors" | "/api/monitors/drafts" | "/api/monitors/drafts/save" | "/api/monitors/test" | "/api/monitors/[id]" | "/api/monitors/[id]/chart" | "/api/monitors/[id]/evaluate" | "/api/monitors/[id]/history" | "/api/monitors/[id]/insights" | "/api/monitors/[id]/mini-chart-data" | "/api/monitors/[id]/refresh" | "/api/monitors/[id]/stats" | "/api/monitors/[id]/toggle" | "/api/user" | "/api/user/change-password" | "/api/user/delete-account" | "/api/user/export-data" | "/api/user/preferences" | "/api/user/profile" | "/api/user/sessions" | "/dashboard" | "/monitors" | "/monitors/create" | "/settings" | "/settings/email-templates";
		RouteParams(): {
			"/api/monitors/[id]": { id: string };
			"/api/monitors/[id]/chart": { id: string };
			"/api/monitors/[id]/evaluate": { id: string };
			"/api/monitors/[id]/history": { id: string };
			"/api/monitors/[id]/insights": { id: string };
			"/api/monitors/[id]/mini-chart-data": { id: string };
			"/api/monitors/[id]/refresh": { id: string };
			"/api/monitors/[id]/stats": { id: string };
			"/api/monitors/[id]/toggle": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string };
			"/admin": Record<string, never>;
			"/api": { id?: string };
			"/api/admin": Record<string, never>;
			"/api/admin/activity": Record<string, never>;
			"/api/admin/config": Record<string, never>;
			"/api/admin/health": Record<string, never>;
			"/api/admin/stats": Record<string, never>;
			"/api/admin/users": Record<string, never>;
			"/api/ai": Record<string, never>;
			"/api/ai/suggestions": Record<string, never>;
			"/api/auth": Record<string, never>;
			"/api/auth/forgot-password": Record<string, never>;
			"/api/auth/google": Record<string, never>;
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
			"/api/monitoring": Record<string, never>;
			"/api/monitoring/evaluate-all": Record<string, never>;
			"/api/monitoring/status": Record<string, never>;
			"/api/monitoring/test": Record<string, never>;
			"/api/monitors": { id?: string };
			"/api/monitors/drafts": Record<string, never>;
			"/api/monitors/drafts/save": Record<string, never>;
			"/api/monitors/test": Record<string, never>;
			"/api/monitors/[id]": { id: string };
			"/api/monitors/[id]/chart": { id: string };
			"/api/monitors/[id]/evaluate": { id: string };
			"/api/monitors/[id]/history": { id: string };
			"/api/monitors/[id]/insights": { id: string };
			"/api/monitors/[id]/mini-chart-data": { id: string };
			"/api/monitors/[id]/refresh": { id: string };
			"/api/monitors/[id]/stats": { id: string };
			"/api/monitors/[id]/toggle": { id: string };
			"/api/user": Record<string, never>;
			"/api/user/change-password": Record<string, never>;
			"/api/user/delete-account": Record<string, never>;
			"/api/user/export-data": Record<string, never>;
			"/api/user/preferences": Record<string, never>;
			"/api/user/profile": Record<string, never>;
			"/api/user/sessions": Record<string, never>;
			"/dashboard": Record<string, never>;
			"/monitors": Record<string, never>;
			"/monitors/create": Record<string, never>;
			"/settings": Record<string, never>;
			"/settings/email-templates": Record<string, never>
		};
		Pathname(): "/" | "/admin" | "/admin/" | "/api" | "/api/" | "/api/admin" | "/api/admin/" | "/api/admin/activity" | "/api/admin/activity/" | "/api/admin/config" | "/api/admin/config/" | "/api/admin/health" | "/api/admin/health/" | "/api/admin/stats" | "/api/admin/stats/" | "/api/admin/users" | "/api/admin/users/" | "/api/ai" | "/api/ai/" | "/api/ai/suggestions" | "/api/ai/suggestions/" | "/api/auth" | "/api/auth/" | "/api/auth/forgot-password" | "/api/auth/forgot-password/" | "/api/auth/google" | "/api/auth/google/" | "/api/auth/login" | "/api/auth/login/" | "/api/auth/logout" | "/api/auth/logout/" | "/api/auth/me" | "/api/auth/me/" | "/api/auth/refresh" | "/api/auth/refresh/" | "/api/auth/register" | "/api/auth/register/" | "/api/auth/reset-password" | "/api/auth/reset-password/" | "/api/auth/verify-email" | "/api/auth/verify-email/" | "/api/cache" | "/api/cache/" | "/api/cache/stats" | "/api/cache/stats/" | "/api/cache/test" | "/api/cache/test/" | "/api/email" | "/api/email/" | "/api/email/test" | "/api/email/test/" | "/api/email/unsubscribe" | "/api/email/unsubscribe/" | "/api/health" | "/api/health/" | "/api/monitoring" | "/api/monitoring/" | "/api/monitoring/evaluate-all" | "/api/monitoring/evaluate-all/" | "/api/monitoring/status" | "/api/monitoring/status/" | "/api/monitoring/test" | "/api/monitoring/test/" | "/api/monitors" | "/api/monitors/" | "/api/monitors/drafts" | "/api/monitors/drafts/" | "/api/monitors/drafts/save" | "/api/monitors/drafts/save/" | "/api/monitors/test" | "/api/monitors/test/" | `/api/monitors/${string}` & {} | `/api/monitors/${string}/` & {} | `/api/monitors/${string}/chart` & {} | `/api/monitors/${string}/chart/` & {} | `/api/monitors/${string}/evaluate` & {} | `/api/monitors/${string}/evaluate/` & {} | `/api/monitors/${string}/history` & {} | `/api/monitors/${string}/history/` & {} | `/api/monitors/${string}/insights` & {} | `/api/monitors/${string}/insights/` & {} | `/api/monitors/${string}/mini-chart-data` & {} | `/api/monitors/${string}/mini-chart-data/` & {} | `/api/monitors/${string}/refresh` & {} | `/api/monitors/${string}/refresh/` & {} | `/api/monitors/${string}/stats` & {} | `/api/monitors/${string}/stats/` & {} | `/api/monitors/${string}/toggle` & {} | `/api/monitors/${string}/toggle/` & {} | "/api/user" | "/api/user/" | "/api/user/change-password" | "/api/user/change-password/" | "/api/user/delete-account" | "/api/user/delete-account/" | "/api/user/export-data" | "/api/user/export-data/" | "/api/user/preferences" | "/api/user/preferences/" | "/api/user/profile" | "/api/user/profile/" | "/api/user/sessions" | "/api/user/sessions/" | "/dashboard" | "/dashboard/" | "/monitors" | "/monitors/" | "/monitors/create" | "/monitors/create/" | "/settings" | "/settings/" | "/settings/email-templates" | "/settings/email-templates/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}