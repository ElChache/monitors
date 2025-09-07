import { z as push, O as push_element, Q as pop_element, J as pop, T as getContext, F as FILENAME } from './index-BIic7J6z.js';
import { e as escape_html } from './escaping-BQR1pbqy.js';
import { F as noop, E as writable } from './exports-BCmm90i8.js';

function create_updated_store() {
  const { set, subscribe } = writable(false);
  {
    return {
      subscribe,
      // eslint-disable-next-line @typescript-eslint/require-await
      check: async () => false
    };
  }
}
const is_legacy = noop.toString().includes("$$") || /function \w+\(\) \{\}/.test(noop.toString());
if (is_legacy) {
  ({
    url: new URL("https://example.com")
  });
}
const stores = {
  updated: /* @__PURE__ */ create_updated_store()
};
{
  const console_warn = console.warn;
  console.warn = function warn(...args) {
    if (args.length === 1 && /<(Layout|Page|Error)(_[\w$]+)?> was created (with unknown|without expected) prop '(data|form)'/.test(
      args[0]
    )) {
      return;
    }
    console_warn(...args);
  };
}
({
  check: stores.updated.check
});
function context() {
  return getContext("__request__");
}
function context_dev(name) {
  try {
    return context();
  } catch {
    throw new Error(
      `Can only read '${name}' on the server during rendering (not in e.g. \`load\` functions), as it is bound to the current request via component context. This prevents state from leaking between users.For more information, see https://svelte.dev/docs/kit/state-management#avoid-shared-state-on-the-server`
    );
  }
}
const page$1 = {
  get error() {
    return context_dev("page.error").page.error;
  },
  get status() {
    return context_dev("page.status").page.status;
  }
};
const page = page$1;
Error$1[FILENAME] = "node_modules/.pnpm/@sveltejs+kit@2.37.1_@sveltejs+vite-plugin-svelte@4.0.4_svelte@5.38.7_vite@5.4.19_@type_b82692f9a03497bcb4358be02822c3fa/node_modules/@sveltejs/kit/src/runtime/components/svelte-5/error.svelte";
function Error$1($$payload, $$props) {
  push(Error$1);
  $$payload.out.push(`<h1>`);
  push_element($$payload, "h1", 5, 0);
  $$payload.out.push(`${escape_html(page.status)}</h1>`);
  pop_element();
  $$payload.out.push(` <p>`);
  push_element($$payload, "p", 6, 0);
  $$payload.out.push(`${escape_html(page.error?.message)}</p>`);
  pop_element();
  pop();
}
Error$1.render = function() {
  throw new Error$1("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};

export { Error$1 as default };
//# sourceMappingURL=error.svelte-Dc97Bfro.js.map
