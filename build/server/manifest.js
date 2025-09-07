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
		client: {start:"_app/immutable/entry/start.Gnjt0Zr9.js",app:"_app/immutable/entry/app.D5462Elp.js",imports:["_app/immutable/entry/start.Gnjt0Zr9.js","_app/immutable/chunks/CROSmZe9.js","_app/immutable/chunks/Dj_MzOAd.js","_app/immutable/chunks/Bz37txc7.js","_app/immutable/entry/app.D5462Elp.js","_app/immutable/chunks/Dj_MzOAd.js","_app/immutable/chunks/DY2n60aa.js","_app/immutable/chunks/DpAHg45Y.js","_app/immutable/chunks/B7Cuh4-K.js","_app/immutable/chunks/Cuz_4TPC.js","_app/immutable/chunks/Bsjv_I7G.js","_app/immutable/chunks/BQhR6swN.js","_app/immutable/chunks/Bz37txc7.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-CYvQxBQ2.js')),
			__memo(() => import('./chunks/1-Cc9Spwl0.js')),
			__memo(() => import('./chunks/2-DXznhlTX.js')),
			__memo(() => import('./chunks/3-rjIGpH_L.js')),
			__memo(() => import('./chunks/4-CDAdPJ_Q.js')),
			__memo(() => import('./chunks/5-Cp4W1F8B.js')),
			__memo(() => import('./chunks/6-DN4U5tBd.js')),
			__memo(() => import('./chunks/7-kcp0M5_d.js')),
			__memo(() => import('./chunks/8-DmZZ2fVz.js'))
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
				endpoint: __memo(() => import('./chunks/_server.ts-BXQ10jCN.js'))
			},
			{
				id: "/api/admin/config",
				pattern: /^\/api\/admin\/config\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-81BRrT5C.js'))
			},
			{
				id: "/api/admin/health",
				pattern: /^\/api\/admin\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Bl2f5HNg.js'))
			},
			{
				id: "/api/admin/stats",
				pattern: /^\/api\/admin\/stats\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Bmzmv9Wl.js'))
			},
			{
				id: "/api/admin/users",
				pattern: /^\/api\/admin\/users\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-3oRl_yhW.js'))
			},
			{
				id: "/api/ai/suggestions",
				pattern: /^\/api\/ai\/suggestions\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Ck3ZJRK0.js'))
			},
			{
				id: "/api/auth/forgot-password",
				pattern: /^\/api\/auth\/forgot-password\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CBklqeOG.js'))
			},
			{
				id: "/api/auth/login",
				pattern: /^\/api\/auth\/login\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CToMo9GS.js'))
			},
			{
				id: "/api/auth/logout",
				pattern: /^\/api\/auth\/logout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-ngOtXDnV.js'))
			},
			{
				id: "/api/auth/me",
				pattern: /^\/api\/auth\/me\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CjdPUA_s.js'))
			},
			{
				id: "/api/auth/refresh",
				pattern: /^\/api\/auth\/refresh\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CY8SkJ7N.js'))
			},
			{
				id: "/api/auth/register",
				pattern: /^\/api\/auth\/register\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-B8pT6v-R.js'))
			},
			{
				id: "/api/auth/reset-password",
				pattern: /^\/api\/auth\/reset-password\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-E13TJ472.js'))
			},
			{
				id: "/api/auth/verify-email",
				pattern: /^\/api\/auth\/verify-email\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-sVLMYXHm.js'))
			},
			{
				id: "/api/cache/stats",
				pattern: /^\/api\/cache\/stats\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DB-7BdIe.js'))
			},
			{
				id: "/api/cache/test",
				pattern: /^\/api\/cache\/test\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DGr1DryM.js'))
			},
			{
				id: "/api/email/test",
				pattern: /^\/api\/email\/test\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-NJfgwcDH.js'))
			},
			{
				id: "/api/email/unsubscribe",
				pattern: /^\/api\/email\/unsubscribe\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BJCB4Pyb.js'))
			},
			{
				id: "/api/health",
				pattern: /^\/api\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BwWddA2b.js'))
			},
			{
				id: "/api/monitoring/evaluate-all",
				pattern: /^\/api\/monitoring\/evaluate-all\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CNOp-PqX.js'))
			},
			{
				id: "/api/monitoring/status",
				pattern: /^\/api\/monitoring\/status\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DwFgzvk-.js'))
			},
			{
				id: "/api/monitoring/test",
				pattern: /^\/api\/monitoring\/test\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D6AV53eV.js'))
			},
			{
				id: "/api/monitors",
				pattern: /^\/api\/monitors\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Cor0zJf2.js'))
			},
			{
				id: "/api/monitors/drafts",
				pattern: /^\/api\/monitors\/drafts\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D0V7MCOW.js'))
			},
			{
				id: "/api/monitors/drafts/save",
				pattern: /^\/api\/monitors\/drafts\/save\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-yURdbXKo.js'))
			},
			{
				id: "/api/monitors/test",
				pattern: /^\/api\/monitors\/test\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-orOLoadU.js'))
			},
			{
				id: "/api/monitors/[id]",
				pattern: /^\/api\/monitors\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-C6ZwvtVj.js'))
			},
			{
				id: "/api/monitors/[id]/chart",
				pattern: /^\/api\/monitors\/([^/]+?)\/chart\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CZnoLI8e.js'))
			},
			{
				id: "/api/monitors/[id]/evaluate",
				pattern: /^\/api\/monitors\/([^/]+?)\/evaluate\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-B-UO8WEA.js'))
			},
			{
				id: "/api/monitors/[id]/history",
				pattern: /^\/api\/monitors\/([^/]+?)\/history\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D8numEWm.js'))
			},
			{
				id: "/api/monitors/[id]/insights",
				pattern: /^\/api\/monitors\/([^/]+?)\/insights\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Ce5622ET.js'))
			},
			{
				id: "/api/monitors/[id]/mini-chart-data",
				pattern: /^\/api\/monitors\/([^/]+?)\/mini-chart-data\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-gTMNBrOr.js'))
			},
			{
				id: "/api/monitors/[id]/refresh",
				pattern: /^\/api\/monitors\/([^/]+?)\/refresh\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-C_e1Wo-a.js'))
			},
			{
				id: "/api/monitors/[id]/stats",
				pattern: /^\/api\/monitors\/([^/]+?)\/stats\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DOr1G0A8.js'))
			},
			{
				id: "/api/monitors/[id]/toggle",
				pattern: /^\/api\/monitors\/([^/]+?)\/toggle\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CZMzZv8r.js'))
			},
			{
				id: "/api/user/change-password",
				pattern: /^\/api\/user\/change-password\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CzAUMeYW.js'))
			},
			{
				id: "/api/user/delete-account",
				pattern: /^\/api\/user\/delete-account\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BG6vcE1J.js'))
			},
			{
				id: "/api/user/export-data",
				pattern: /^\/api\/user\/export-data\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-AxGZfDRi.js'))
			},
			{
				id: "/api/user/preferences",
				pattern: /^\/api\/user\/preferences\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-B6VSr0PR.js'))
			},
			{
				id: "/api/user/profile",
				pattern: /^\/api\/user\/profile\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DeoL9gLe.js'))
			},
			{
				id: "/api/user/sessions",
				pattern: /^\/api\/user\/sessions\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-C1bZLCTI.js'))
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

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
