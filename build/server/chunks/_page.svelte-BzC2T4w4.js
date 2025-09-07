import { p as push, k as copy_payload, l as assign_payload, a as pop, o as ensure_array_like, h as head, b as push_element, c as pop_element, f as attr_class, e as escape_html, F as FILENAME } from './index3-C1cEPogv.js';
import './client-BOL_CNRd.js';
import './exports-DdEMOvoO.js';
import './index2-vFLLKhfi.js';

_page[FILENAME] = "src/routes/settings/email-templates/+page.svelte";
function _page($$payload, $$props) {
  push(_page);
  let templates = [];
  let selectedTemplate = null;
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    const each_array = ensure_array_like(templates);
    head($$payload2, ($$payload3) => {
      $$payload3.title = `<title>Email Templates - Monitors</title>`;
    });
    $$payload2.out.push(`<div class="email-templates-page svelte-yhyjbn">`);
    push_element($$payload2, "div", 257, 0);
    $$payload2.out.push(`<div class="page-header svelte-yhyjbn">`);
    push_element($$payload2, "div", 259, 2);
    $$payload2.out.push(`<div class="header-content svelte-yhyjbn">`);
    push_element($$payload2, "div", 260, 4);
    $$payload2.out.push(`<div class="header-text svelte-yhyjbn">`);
    push_element($$payload2, "div", 261, 6);
    $$payload2.out.push(`<h1 class="page-title svelte-yhyjbn">`);
    push_element($$payload2, "h1", 262, 8);
    $$payload2.out.push(`Email Template Configuration</h1>`);
    pop_element();
    $$payload2.out.push(` <p class="page-description svelte-yhyjbn">`);
    push_element($$payload2, "p", 263, 8);
    $$payload2.out.push(`Customize notification email templates with dynamic variables and preview functionality</p>`);
    pop_element();
    $$payload2.out.push(`</div>`);
    pop_element();
    $$payload2.out.push(` <div class="header-actions svelte-yhyjbn">`);
    push_element($$payload2, "div", 268, 6);
    $$payload2.out.push(`<button class="btn-primary svelte-yhyjbn">`);
    push_element($$payload2, "button", 269, 8);
    $$payload2.out.push(`➕ New Template</button>`);
    pop_element();
    $$payload2.out.push(`</div>`);
    pop_element();
    $$payload2.out.push(`</div>`);
    pop_element();
    $$payload2.out.push(` `);
    {
      $$payload2.out.push("<!--[!-->");
    }
    $$payload2.out.push(`<!--]--></div>`);
    pop_element();
    $$payload2.out.push(` <div class="templates-container svelte-yhyjbn">`);
    push_element($$payload2, "div", 287, 2);
    $$payload2.out.push(`<div class="templates-sidebar svelte-yhyjbn">`);
    push_element($$payload2, "div", 289, 4);
    $$payload2.out.push(`<div class="sidebar-header svelte-yhyjbn">`);
    push_element($$payload2, "div", 290, 6);
    $$payload2.out.push(`<h2 class="sidebar-title svelte-yhyjbn">`);
    push_element($$payload2, "h2", 291, 8);
    $$payload2.out.push(`Email Templates</h2>`);
    pop_element();
    $$payload2.out.push(` `);
    {
      $$payload2.out.push("<!--[!-->");
    }
    $$payload2.out.push(`<!--]--></div>`);
    pop_element();
    $$payload2.out.push(` <div class="templates-list svelte-yhyjbn">`);
    push_element($$payload2, "div", 297, 6);
    $$payload2.out.push(`<!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let template = each_array[$$index];
      $$payload2.out.push(`<div${attr_class("template-item svelte-yhyjbn", void 0, { "active": selectedTemplate?.id === template.id })}>`);
      push_element($$payload2, "div", 299, 10);
      $$payload2.out.push(`<button class="template-button svelte-yhyjbn">`);
      push_element($$payload2, "button", 303, 12);
      $$payload2.out.push(`<div class="template-info svelte-yhyjbn">`);
      push_element($$payload2, "div", 307, 14);
      $$payload2.out.push(`<div class="template-name svelte-yhyjbn">`);
      push_element($$payload2, "div", 308, 16);
      $$payload2.out.push(`${escape_html(template.name)}</div>`);
      pop_element();
      $$payload2.out.push(` <div class="template-subject svelte-yhyjbn">`);
      push_element($$payload2, "div", 309, 16);
      $$payload2.out.push(`${escape_html(template.subject)}</div>`);
      pop_element();
      $$payload2.out.push(`</div>`);
      pop_element();
      $$payload2.out.push(`</button>`);
      pop_element();
      $$payload2.out.push(` `);
      if (template.id !== "default") {
        $$payload2.out.push("<!--[-->");
        $$payload2.out.push(`<button class="delete-button svelte-yhyjbn" aria-label="Delete template" title="Delete template">`);
        push_element($$payload2, "button", 314, 14);
        $$payload2.out.push(`🗑️</button>`);
        pop_element();
      } else {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]--></div>`);
      pop_element();
    }
    $$payload2.out.push(`<!--]--> `);
    if (templates.length === 0 && true) {
      $$payload2.out.push("<!--[-->");
      $$payload2.out.push(`<div class="empty-state svelte-yhyjbn">`);
      push_element($$payload2, "div", 327, 10);
      $$payload2.out.push(`<div class="empty-icon svelte-yhyjbn">`);
      push_element($$payload2, "div", 328, 12);
      $$payload2.out.push(`📧</div>`);
      pop_element();
      $$payload2.out.push(` <p>`);
      push_element($$payload2, "p", 329, 12);
      $$payload2.out.push(`No templates found</p>`);
      pop_element();
      $$payload2.out.push(`</div>`);
      pop_element();
    } else {
      $$payload2.out.push("<!--[!-->");
    }
    $$payload2.out.push(`<!--]--></div>`);
    pop_element();
    $$payload2.out.push(`</div>`);
    pop_element();
    $$payload2.out.push(` <div class="template-editor svelte-yhyjbn">`);
    push_element($$payload2, "div", 336, 4);
    {
      $$payload2.out.push("<!--[!-->");
      $$payload2.out.push(`<div class="no-template-selected svelte-yhyjbn">`);
      push_element($$payload2, "div", 346, 8);
      $$payload2.out.push(`<div class="no-template-icon svelte-yhyjbn">`);
      push_element($$payload2, "div", 347, 10);
      $$payload2.out.push(`📝</div>`);
      pop_element();
      $$payload2.out.push(` <h3 class="svelte-yhyjbn">`);
      push_element($$payload2, "h3", 348, 10);
      $$payload2.out.push(`Select a Template</h3>`);
      pop_element();
      $$payload2.out.push(` <p class="svelte-yhyjbn">`);
      push_element($$payload2, "p", 349, 10);
      $$payload2.out.push(`Choose a template from the sidebar to edit, or create a new one.</p>`);
      pop_element();
      $$payload2.out.push(` <button class="btn-primary svelte-yhyjbn">`);
      push_element($$payload2, "button", 350, 10);
      $$payload2.out.push(`➕ Create New Template</button>`);
      pop_element();
      $$payload2.out.push(`</div>`);
      pop_element();
    }
    $$payload2.out.push(`<!--]--></div>`);
    pop_element();
    $$payload2.out.push(`</div>`);
    pop_element();
    $$payload2.out.push(`</div>`);
    pop_element();
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  pop();
}
_page.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};

export { _page as default };
//# sourceMappingURL=_page.svelte-BzC2T4w4.js.map
