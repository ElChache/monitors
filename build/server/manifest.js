const manifest = (() => {
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
			__memo(() => import('./chunks/0-DBf7WnxN.js')),
			__memo(() => import('./chunks/1-DYZxU2Rd.js')),
			__memo(() => import('./chunks/2-Ba0AMsuQ.js'))
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
				endpoint: __memo(() => import('./chunks/_server.ts-DgkpAX5e.js'))
			},
			{
				id: "/api/auth/login",
				pattern: /^\/api\/auth\/login\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BPlDZeFX.js'))
			},
			{
				id: "/api/auth/logout",
				pattern: /^\/api\/auth\/logout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CE7ql8oB.js'))
			},
			{
				id: "/api/auth/me",
				pattern: /^\/api\/auth\/me\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-6JFcI20o.js'))
			},
			{
				id: "/api/auth/refresh",
				pattern: /^\/api\/auth\/refresh\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CA7rf5is.js'))
			},
			{
				id: "/api/auth/register",
				pattern: /^\/api\/auth\/register\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DSsFgB3h.js'))
			},
			{
				id: "/api/auth/reset-password",
				pattern: /^\/api\/auth\/reset-password\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-C5keuTK8.js'))
			},
			{
				id: "/api/auth/verify-email",
				pattern: /^\/api\/auth\/verify-email\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-a48C2kIp.js'))
			},
			{
				id: "/api/cache/stats",
				pattern: /^\/api\/cache\/stats\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Bvtl5njV.js'))
			},
			{
				id: "/api/cache/test",
				pattern: /^\/api\/cache\/test\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-c3qiKuRS.js'))
			},
			{
				id: "/api/email/test",
				pattern: /^\/api\/email\/test\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CVz5x5M_.js'))
			},
			{
				id: "/api/email/unsubscribe",
				pattern: /^\/api\/email\/unsubscribe\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-C8mzV9Ry.js'))
			},
			{
				id: "/api/health",
				pattern: /^\/api\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CdZG6exx.js'))
			},
			{
				id: "/api/monitors",
				pattern: /^\/api\/monitors\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BcqeAll1.js'))
			},
			{
				id: "/api/monitors/[id]",
				pattern: /^\/api\/monitors\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-GtEEPI5f.js'))
			},
			{
				id: "/api/monitors/[id]/toggle",
				pattern: /^\/api\/monitors\/([^/]+?)\/toggle\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D2gzuNY1.js'))
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

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
