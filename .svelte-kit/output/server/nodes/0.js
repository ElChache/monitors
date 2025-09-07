

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.ykr7ezOS.js","_app/immutable/chunks/DY2n60aa.js","_app/immutable/chunks/Dj_MzOAd.js"];
export const stylesheets = [];
export const fonts = [];
