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
		client: {start:"_app/immutable/entry/start.HfwN0-iZ.js",app:"_app/immutable/entry/app.4K-LTBLi.js",imports:["_app/immutable/entry/start.HfwN0-iZ.js","_app/immutable/chunks/rj2U34RQ.js","_app/immutable/chunks/qD4JgqqF.js","_app/immutable/entry/app.4K-LTBLi.js","_app/immutable/chunks/qD4JgqqF.js","_app/immutable/chunks/COnmxxEa.js","_app/immutable/chunks/CcPEvL5t.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
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
				id: "/api/monitors",
				pattern: /^\/api\/monitors\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/monitors/_server.ts.js'))
			},
			{
				id: "/api/monitors/[id]",
				pattern: /^\/api\/monitors\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/monitors/_id_/_server.ts.js'))
			},
			{
				id: "/api/monitors/[id]/toggle",
				pattern: /^\/api\/monitors\/([^/]+?)\/toggle\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/monitors/_id_/toggle/_server.ts.js'))
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