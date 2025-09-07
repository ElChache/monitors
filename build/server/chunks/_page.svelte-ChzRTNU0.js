import { p as push, h as head, b as push_element, c as pop_element, e as escape_html, f as attr_class, a as pop, F as FILENAME, i as stringify } from './index3-C1cEPogv.js';

_page[FILENAME] = "src/routes/admin/+page.svelte";
function _page($$payload, $$props) {
  push(_page);
  let filteredUsers;
  let adminData = {
    lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
  };
  let users = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "user",
      status: "active",
      joinedDate: "2024-12-01T00:00:00Z",
      lastLogin: "2025-01-07T06:00:00Z",
      monitorsCount: 3
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "admin",
      status: "active",
      joinedDate: "2024-11-15T00:00:00Z",
      lastLogin: "2025-01-06T18:30:00Z",
      monitorsCount: 8
    },
    {
      id: "3",
      name: "Bob Johnson",
      email: "bob@example.com",
      role: "user",
      status: "inactive",
      joinedDate: "2024-12-20T00:00:00Z",
      lastLogin: "2024-12-25T10:00:00Z",
      monitorsCount: 1
    }
  ];
  let pagination = { currentPage: 1, itemsPerPage: 10 };
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  filteredUsers = users.filter((user) => {
    return true;
  });
  filteredUsers.slice((pagination.currentPage - 1) * pagination.itemsPerPage, pagination.currentPage * pagination.itemsPerPage);
  Math.ceil(filteredUsers.length / pagination.itemsPerPage);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Admin Panel | Monitors!</title>`;
    $$payload2.out.push(`<meta name="description" content="Administrative interface for user and system management."/>`);
    push_element($$payload2, "meta", 244, 2);
    pop_element();
  });
  $$payload.out.push(`<div class="min-h-screen bg-gray-50">`);
  push_element($$payload, "div", 247, 0);
  $$payload.out.push(`<header class="bg-white shadow-sm border-b border-gray-200">`);
  push_element($$payload, "header", 249, 2);
  $$payload.out.push(`<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">`);
  push_element($$payload, "div", 250, 4);
  $$payload.out.push(`<div class="flex justify-between h-16 items-center">`);
  push_element($$payload, "div", 251, 6);
  $$payload.out.push(`<div class="flex items-center space-x-4">`);
  push_element($$payload, "div", 252, 8);
  $$payload.out.push(`<h1 class="text-2xl font-bold text-gray-900">`);
  push_element($$payload, "h1", 253, 10);
  $$payload.out.push(`Admin Panel</h1>`);
  pop_element();
  $$payload.out.push(` <span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">`);
  push_element($$payload, "span", 254, 10);
  $$payload.out.push(`Restricted Access</span>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(` <div class="flex items-center space-x-4">`);
  push_element($$payload, "div", 258, 8);
  $$payload.out.push(`<span class="text-sm text-gray-500">`);
  push_element($$payload, "span", 259, 10);
  $$payload.out.push(`Last updated: ${escape_html(formatDateTime(adminData.lastUpdated))}</span>`);
  pop_element();
  $$payload.out.push(` <a href="/" class="btn-outline">`);
  push_element($$payload, "a", 262, 10);
  $$payload.out.push(`← Back to App</a>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(`</header>`);
  pop_element();
  $$payload.out.push(` <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">`);
  push_element($$payload, "div", 270, 2);
  $$payload.out.push(`<nav class="flex space-x-8 mb-6">`);
  push_element($$payload, "nav", 272, 4);
  $$payload.out.push(`<button${attr_class(`pb-2 border-b-2 font-medium text-sm transition-colors ${stringify(
    "border-blue-500 text-blue-600"
  )}`)}>`);
  push_element($$payload, "button", 273, 6);
  $$payload.out.push(`📊 Dashboard</button>`);
  pop_element();
  $$payload.out.push(` <button${attr_class(`pb-2 border-b-2 font-medium text-sm transition-colors ${stringify("border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300")}`)}>`);
  push_element($$payload, "button", 281, 6);
  $$payload.out.push(`👥 User Management</button>`);
  pop_element();
  $$payload.out.push(` <button${attr_class(`pb-2 border-b-2 font-medium text-sm transition-colors ${stringify("border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300")}`)}>`);
  push_element($$payload, "button", 289, 6);
  $$payload.out.push(`⚙️ System Health</button>`);
  pop_element();
  $$payload.out.push(` <button${attr_class(`pb-2 border-b-2 font-medium text-sm transition-colors ${stringify("border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300")}`)}>`);
  push_element($$payload, "button", 297, 6);
  $$payload.out.push(`🔧 Settings</button>`);
  pop_element();
  $$payload.out.push(`</nav>`);
  pop_element();
  $$payload.out.push(` `);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="space-y-6">`);
    push_element($$payload, "div", 309, 6);
    {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="text-center py-8">`);
      push_element($$payload, "div", 311, 10);
      $$payload.out.push(`<svg class="animate-spin w-8 h-8 text-blue-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24">`);
      push_element($$payload, "svg", 312, 12);
      $$payload.out.push(`<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">`);
      push_element($$payload, "circle", 313, 14);
      $$payload.out.push(`</circle>`);
      pop_element();
      $$payload.out.push(`<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">`);
      push_element($$payload, "path", 314, 14);
      $$payload.out.push(`</path>`);
      pop_element();
      $$payload.out.push(`</svg>`);
      pop_element();
      $$payload.out.push(` <p class="text-gray-600">`);
      push_element($$payload, "p", 316, 12);
      $$payload.out.push(`Loading dashboard data...</p>`);
      pop_element();
      $$payload.out.push(`</div>`);
      pop_element();
    }
    $$payload.out.push(`<!--]--></div>`);
    pop_element();
  }
  $$payload.out.push(`<!--]--></div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  pop();
}
_page.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};

export { _page as default };
//# sourceMappingURL=_page.svelte-ChzRTNU0.js.map
