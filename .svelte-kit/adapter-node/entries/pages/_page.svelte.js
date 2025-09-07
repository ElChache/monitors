import { G as push, T as head, O as push_element, Q as pop_element, K as pop, F as FILENAME } from "../../chunks/index.js";
import { e as escape_html } from "../../chunks/escaping.js";
_page[FILENAME] = "src/routes/+page.svelte";
function _page($$payload, $$props) {
  push(_page);
  let databaseStatus = "Checking...";
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Monitors - AI-Powered Monitoring Platform</title>`;
  });
  $$payload.out.push(`<main class="svelte-wkqzup">`);
  push_element($$payload, "main", 21, 0);
  $$payload.out.push(`<h1 class="svelte-wkqzup">`);
  push_element($$payload, "h1", 22, 1);
  $$payload.out.push(`Welcome to Monitors</h1>`);
  pop_element();
  $$payload.out.push(` <p>`);
  push_element($$payload, "p", 23, 1);
  $$payload.out.push(`AI-Powered Monitoring Platform - Hello World!</p>`);
  pop_element();
  $$payload.out.push(` <div class="status svelte-wkqzup">`);
  push_element($$payload, "div", 25, 1);
  $$payload.out.push(`<h2 class="svelte-wkqzup">`);
  push_element($$payload, "h2", 26, 2);
  $$payload.out.push(`System Status</h2>`);
  pop_element();
  $$payload.out.push(` <p>`);
  push_element($$payload, "p", 27, 2);
  $$payload.out.push(`Database: ${escape_html(databaseStatus)}</p>`);
  pop_element();
  $$payload.out.push(` <p>`);
  push_element($$payload, "p", 28, 2);
  $$payload.out.push(`SvelteKit: Running</p>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(`</main>`);
  pop_element();
  pop();
}
_page.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
export {
  _page as default
};
