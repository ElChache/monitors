import { p as push, b as slot, a as pop, F as FILENAME } from "../../../chunks/index3.js";
_layout[FILENAME] = "src/routes/monitors/+layout.svelte";
function _layout($$payload, $$props) {
  push(_layout);
  $$payload.out.push(`<!---->`);
  slot($$payload, $$props, "default", {});
  $$payload.out.push(`<!---->`);
  pop();
}
_layout.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
export {
  _layout as default
};
