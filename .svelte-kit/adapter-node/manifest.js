export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.Gnjt0Zr9.js",app:"_app/immutable/entry/app.D5462Elp.js",imports:["_app/immutable/entry/start.Gnjt0Zr9.js","_app/immutable/chunks/CROSmZe9.js","_app/immutable/chunks/Dj_MzOAd.js","_app/immutable/chunks/Bz37txc7.js","_app/immutable/entry/app.D5462Elp.js","_app/immutable/chunks/Dj_MzOAd.js","_app/immutable/chunks/DY2n60aa.js","_app/immutable/chunks/DpAHg45Y.js","_app/immutable/chunks/B7Cuh4-K.js","_app/immutable/chunks/Cuz_4TPC.js","_app/immutable/chunks/Bsjv_I7G.js","_app/immutable/chunks/BQhR6swN.js","_app/immutable/chunks/Bz37txc7.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js')),
			__memo(() => import('./nodes/7.js')),
			__memo(() => import('./nodes/8.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/admin",
				pattern: /^\/admin\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/api/admin/activity",
				pattern: /^\/api\/admin\/activity\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/admin/activity/_server.ts.js'))
			},
			{
				id: "/api/admin/config",
				pattern: /^\/api\/admin\/config\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/admin/config/_server.ts.js'))
			},
			{
				id: "/api/admin/health",
				pattern: /^\/api\/admin\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/admin/health/_server.ts.js'))
			},
			{
				id: "/api/admin/stats",
				pattern: /^\/api\/admin\/stats\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/admin/stats/_server.ts.js'))
			},
			{
				id: "/api/admin/users",
				pattern: /^\/api\/admin\/users\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/admin/users/_server.ts.js'))
			},
			{
				id: "/api/ai/suggestions",
				pattern: /^\/api\/ai\/suggestions\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/ai/suggestions/_server.ts.js'))
			},
			{
				id: "/api/auth/forgot-password",
				pattern: /^\/api\/auth\/forgot-password\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/forgot-password/_server.ts.js'))
			},
			{
				id: "/api/auth/login",
				pattern: /^\/api\/auth\/login\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/login/_server.ts.js'))
			},
			{
				id: "/api/auth/logout",
				pattern: /^\/api\/auth\/logout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/logout/_server.ts.js'))
			},
			{
				id: "/api/auth/me",
				pattern: /^\/api\/auth\/me\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/me/_server.ts.js'))
			},
			{
				id: "/api/auth/refresh",
				pattern: /^\/api\/auth\/refresh\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/refresh/_server.ts.js'))
			},
			{
				id: "/api/auth/register",
				pattern: /^\/api\/auth\/register\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/register/_server.ts.js'))
			},
			{
				id: "/api/auth/reset-password",
				pattern: /^\/api\/auth\/reset-password\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/reset-password/_server.ts.js'))
			},
			{
				id: "/api/auth/verify-email",
				pattern: /^\/api\/auth\/verify-email\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/verify-email/_server.ts.js'))
			},
			{
				id: "/api/cache/stats",
				pattern: /^\/api\/cache\/stats\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/cache/stats/_server.ts.js'))
			},
			{
				id: "/api/cache/test",
				pattern: /^\/api\/cache\/test\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/cache/test/_server.ts.js'))
			},
			{
				id: "/api/email/test",
				pattern: /^\/api\/email\/test\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/email/test/_server.ts.js'))
			},
			{
				id: "/api/email/unsubscribe",
				pattern: /^\/api\/email\/unsubscribe\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/email/unsubscribe/_server.ts.js'))
			},
			{
				id: "/api/health",
				pattern: /^\/api\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/health/_server.ts.js'))
			},
			{
				id: "/api/monitoring/evaluate-all",
				pattern: /^\/api\/monitoring\/evaluate-all\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/monitoring/evaluate-all/_server.ts.js'))
			},
			{
				id: "/api/monitoring/status",
				pattern: /^\/api\/monitoring\/status\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/monitoring/status/_server.ts.js'))
			},
			{
				id: "/api/monitoring/test",
				pattern: /^\/api\/monitoring\/test\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/monitoring/test/_server.ts.js'))
			},
			{
				id: "/api/monitors",
				pattern: /^\/api\/monitors\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/monitors/_server.ts.js'))
			},
			{
				id: "/api/monitors/drafts",
				pattern: /^\/api\/monitors\/drafts\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/monitors/drafts/_server.ts.js'))
			},
			{
				id: "/api/monitors/drafts/save",
				pattern: /^\/api\/monitors\/drafts\/save\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/monitors/drafts/save/_server.ts.js'))
			},
			{
				id: "/api/monitors/test",
				pattern: /^\/api\/monitors\/test\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/monitors/test/_server.ts.js'))
			},
			{
				id: "/api/monitors/[id]",
				pattern: /^\/api\/monitors\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/monitors/_id_/_server.ts.js'))
			},
			{
				id: "/api/monitors/[id]/chart",
				pattern: /^\/api\/monitors\/([^/]+?)\/chart\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/monitors/_id_/chart/_server.ts.js'))
			},
			{
				id: "/api/monitors/[id]/evaluate",
				pattern: /^\/api\/monitors\/([^/]+?)\/evaluate\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/monitors/_id_/evaluate/_server.ts.js'))
			},
			{
				id: "/api/monitors/[id]/history",
				pattern: /^\/api\/monitors\/([^/]+?)\/history\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/monitors/_id_/history/_server.ts.js'))
			},
			{
				id: "/api/monitors/[id]/insights",
				pattern: /^\/api\/monitors\/([^/]+?)\/insights\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/monitors/_id_/insights/_server.ts.js'))
			},
			{
				id: "/api/monitors/[id]/mini-chart-data",
				pattern: /^\/api\/monitors\/([^/]+?)\/mini-chart-data\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/monitors/_id_/mini-chart-data/_server.ts.js'))
			},
			{
				id: "/api/monitors/[id]/refresh",
				pattern: /^\/api\/monitors\/([^/]+?)\/refresh\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/monitors/_id_/refresh/_server.ts.js'))
			},
			{
				id: "/api/monitors/[id]/stats",
				pattern: /^\/api\/monitors\/([^/]+?)\/stats\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/monitors/_id_/stats/_server.ts.js'))
			},
			{
				id: "/api/monitors/[id]/toggle",
				pattern: /^\/api\/monitors\/([^/]+?)\/toggle\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/monitors/_id_/toggle/_server.ts.js'))
			},
			{
				id: "/api/user/change-password",
				pattern: /^\/api\/user\/change-password\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/user/change-password/_server.ts.js'))
			},
			{
				id: "/api/user/delete-account",
				pattern: /^\/api\/user\/delete-account\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/user/delete-account/_server.ts.js'))
			},
			{
				id: "/api/user/export-data",
				pattern: /^\/api\/user\/export-data\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/user/export-data/_server.ts.js'))
			},
			{
				id: "/api/user/preferences",
				pattern: /^\/api\/user\/preferences\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/user/preferences/_server.ts.js'))
			},
			{
				id: "/api/user/profile",
				pattern: /^\/api\/user\/profile\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/user/profile/_server.ts.js'))
			},
			{
				id: "/api/user/sessions",
				pattern: /^\/api\/user\/sessions\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/user/sessions/_server.ts.js'))
			},
			{
				id: "/dashboard",
				pattern: /^\/dashboard\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/monitors/create",
				pattern: /^\/monitors\/create\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/settings",
				pattern: /^\/settings\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/settings/email-templates",
				pattern: /^\/settings\/email-templates\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

export const prerendered = new Set([]);

export const base = "";