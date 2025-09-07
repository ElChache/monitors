import { z as push, J as pop, F as FILENAME } from './index-BIic7J6z.js';

Layout[FILENAME] = "node_modules/.pnpm/@sveltejs+kit@2.37.1_@sveltejs+vite-plugin-svelte@4.0.4_svelte@5.38.7_vite@5.4.19_@type_b82692f9a03497bcb4358be02822c3fa/node_modules/@sveltejs/kit/src/runtime/components/svelte-5/layout.svelte";
function Layout($$payload, $$props) {
  push(Layout);
  let { children } = $$props;
  children($$payload);
  $$payload.out.push(`<!---->`);
  pop();
}
Layout.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};

export { Layout as default };
//# sourceMappingURL=layout.svelte-B7Zggl69.js.map
