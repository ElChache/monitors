import { p as push, h as head, b as push_element, c as pop_element, e as escape_html, a as pop, F as FILENAME } from './index3-C1cEPogv.js';
import { w as writable } from './index2-vFLLKhfi.js';

function createNotificationStore() {
  const { subscribe, set, update } = writable({
    toasts: []
  });
  return {
    subscribe,
    // Add a toast notification
    addToast: (toast) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newToast = {
        id,
        duration: 5e3,
        // 5 seconds default
        persistent: false,
        ...toast
      };
      update((store) => ({
        ...store,
        toasts: [...store.toasts, newToast]
      }));
      if (!newToast.persistent && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, newToast.duration);
      }
      return id;
    },
    // Remove a toast by ID
    removeToast: (id) => {
      update((store) => ({
        ...store,
        toasts: store.toasts.filter((toast) => toast.id !== id)
      }));
    },
    // Update toast progress
    updateProgress: (id, progress) => {
      update((store) => ({
        ...store,
        toasts: store.toasts.map(
          (toast) => toast.id === id ? { ...toast, progressValue: Math.min(100, Math.max(0, progress)) } : toast
        )
      }));
    },
    // Clear all toasts
    clearAll: () => {
      set({ toasts: [] });
    },
    // Helper methods for common toast types
    success: (title, message, options) => {
      return addToast({ type: "success", title, message, ...options });
    },
    error: (title, message, options) => {
      return addToast({
        type: "error",
        title,
        message,
        duration: 8e3,
        // Errors show longer
        ...options
      });
    },
    warning: (title, message, options) => {
      return addToast({
        type: "warning",
        title,
        message,
        duration: 6e3,
        ...options
      });
    },
    info: (title, message, options) => {
      return addToast({ type: "info", title, message, ...options });
    },
    // Network-specific helpers
    networkError: (error) => {
      const message = error instanceof Error ? error.message : error;
      return addToast({
        type: "error",
        title: "Network Error",
        message: `Failed to connect: ${message}`,
        duration: 1e4,
        action: {
          label: "Retry",
          handler: () => window.location.reload()
        }
      });
    },
    // Form validation helper
    formError: (field, message) => {
      return addToast({
        type: "error",
        title: `${field} Error`,
        message,
        duration: 6e3
      });
    },
    // Rate limit helper
    rateLimited: (retryAfter) => {
      const message = retryAfter ? `Please wait ${retryAfter} seconds before trying again` : "You are making requests too quickly";
      return addToast({
        type: "warning",
        title: "Rate Limited",
        message,
        duration: 8e3
      });
    }
  };
  function removeToast(id) {
    update((store) => ({
      ...store,
      toasts: store.toasts.filter((toast) => toast.id !== id)
    }));
  }
  function addToast(toast) {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast = {
      id,
      duration: 5e3,
      persistent: false,
      ...toast
    };
    update((store) => ({
      ...store,
      toasts: [...store.toasts, newToast]
    }));
    if (!newToast.persistent && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
    return id;
  }
}
createNotificationStore();
_page[FILENAME] = "src/routes/dashboard/+page.svelte";
function _page($$payload, $$props) {
  push(_page);
  let monitors = [];
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Dashboard - AI-Powered Monitoring</title>`;
  });
  $$payload.out.push(`<div class="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 svelte-1ugv462">`);
  push_element($$payload, "div", 86, 0);
  $$payload.out.push(`<div class="mb-8">`);
  push_element($$payload, "div", 88, 2);
  $$payload.out.push(`<h1 class="text-3xl font-bold text-gray-900">`);
  push_element($$payload, "h1", 89, 4);
  $$payload.out.push(`Dashboard</h1>`);
  pop_element();
  $$payload.out.push(` <p class="mt-2 text-gray-600">`);
  push_element($$payload, "p", 90, 4);
  $$payload.out.push(`Monitor your systems with AI-powered intelligence</p>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(` <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">`);
  push_element($$payload, "div", 94, 2);
  $$payload.out.push(`<div class="bg-white rounded-lg shadow p-6">`);
  push_element($$payload, "div", 95, 4);
  $$payload.out.push(`<div class="flex items-center">`);
  push_element($$payload, "div", 96, 6);
  $$payload.out.push(`<div class="flex-shrink-0">`);
  push_element($$payload, "div", 97, 8);
  $$payload.out.push(`<div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">`);
  push_element($$payload, "div", 98, 10);
  $$payload.out.push(`<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">`);
  push_element($$payload, "svg", 99, 12);
  $$payload.out.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z">`);
  push_element($$payload, "path", 100, 14);
  $$payload.out.push(`</path>`);
  pop_element();
  $$payload.out.push(`</svg>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(` <div class="ml-5 w-0 flex-1">`);
  push_element($$payload, "div", 104, 8);
  $$payload.out.push(`<dl>`);
  push_element($$payload, "dl", 105, 10);
  $$payload.out.push(`<dt class="text-sm font-medium text-gray-500 truncate">`);
  push_element($$payload, "dt", 106, 12);
  $$payload.out.push(`Active Monitors</dt>`);
  pop_element();
  $$payload.out.push(` <dd class="text-lg font-medium text-gray-900">`);
  push_element($$payload, "dd", 107, 12);
  $$payload.out.push(`${escape_html(monitors.length)}</dd>`);
  pop_element();
  $$payload.out.push(`</dl>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(` <div class="bg-white rounded-lg shadow p-6">`);
  push_element($$payload, "div", 113, 4);
  $$payload.out.push(`<div class="flex items-center">`);
  push_element($$payload, "div", 114, 6);
  $$payload.out.push(`<div class="flex-shrink-0">`);
  push_element($$payload, "div", 115, 8);
  $$payload.out.push(`<div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">`);
  push_element($$payload, "div", 116, 10);
  $$payload.out.push(`<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">`);
  push_element($$payload, "svg", 117, 12);
  $$payload.out.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7">`);
  push_element($$payload, "path", 118, 14);
  $$payload.out.push(`</path>`);
  pop_element();
  $$payload.out.push(`</svg>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(` <div class="ml-5 w-0 flex-1">`);
  push_element($$payload, "div", 122, 8);
  $$payload.out.push(`<dl>`);
  push_element($$payload, "dl", 123, 10);
  $$payload.out.push(`<dt class="text-sm font-medium text-gray-500 truncate">`);
  push_element($$payload, "dt", 124, 12);
  $$payload.out.push(`Health Status</dt>`);
  pop_element();
  $$payload.out.push(` <dd class="text-lg font-medium text-gray-900">`);
  push_element($$payload, "dd", 125, 12);
  $$payload.out.push(`All Systems Operational</dd>`);
  pop_element();
  $$payload.out.push(`</dl>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(` <div class="bg-white rounded-lg shadow p-6">`);
  push_element($$payload, "div", 131, 4);
  $$payload.out.push(`<div class="flex items-center">`);
  push_element($$payload, "div", 132, 6);
  $$payload.out.push(`<div class="flex-shrink-0">`);
  push_element($$payload, "div", 133, 8);
  $$payload.out.push(`<div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">`);
  push_element($$payload, "div", 134, 10);
  $$payload.out.push(`<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">`);
  push_element($$payload, "svg", 135, 12);
  $$payload.out.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z">`);
  push_element($$payload, "path", 136, 14);
  $$payload.out.push(`</path>`);
  pop_element();
  $$payload.out.push(`</svg>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(` <div class="ml-5 w-0 flex-1">`);
  push_element($$payload, "div", 140, 8);
  $$payload.out.push(`<dl>`);
  push_element($$payload, "dl", 141, 10);
  $$payload.out.push(`<dt class="text-sm font-medium text-gray-500 truncate">`);
  push_element($$payload, "dt", 142, 12);
  $$payload.out.push(`Alerts Today</dt>`);
  pop_element();
  $$payload.out.push(` <dd class="text-lg font-medium text-gray-900">`);
  push_element($$payload, "dd", 143, 12);
  $$payload.out.push(`3</dd>`);
  pop_element();
  $$payload.out.push(`</dl>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(` <div class="bg-white rounded-lg shadow p-6">`);
  push_element($$payload, "div", 149, 4);
  $$payload.out.push(`<div class="flex items-center">`);
  push_element($$payload, "div", 150, 6);
  $$payload.out.push(`<div class="flex-shrink-0">`);
  push_element($$payload, "div", 151, 8);
  $$payload.out.push(`<div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">`);
  push_element($$payload, "div", 152, 10);
  $$payload.out.push(`<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">`);
  push_element($$payload, "svg", 153, 12);
  $$payload.out.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z">`);
  push_element($$payload, "path", 154, 14);
  $$payload.out.push(`</path>`);
  pop_element();
  $$payload.out.push(`</svg>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(` <div class="ml-5 w-0 flex-1">`);
  push_element($$payload, "div", 158, 8);
  $$payload.out.push(`<dl>`);
  push_element($$payload, "dl", 159, 10);
  $$payload.out.push(`<dt class="text-sm font-medium text-gray-500 truncate">`);
  push_element($$payload, "dt", 160, 12);
  $$payload.out.push(`AI Classification</dt>`);
  pop_element();
  $$payload.out.push(` <dd class="text-lg font-medium text-gray-900">`);
  push_element($$payload, "dd", 161, 12);
  $$payload.out.push(`89% Accuracy</dd>`);
  pop_element();
  $$payload.out.push(`</dl>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(` <div class="bg-white shadow rounded-lg">`);
  push_element($$payload, "div", 169, 2);
  $$payload.out.push(`<div class="px-4 py-5 sm:p-6">`);
  push_element($$payload, "div", 170, 4);
  $$payload.out.push(`<div class="flex justify-between items-center mb-6">`);
  push_element($$payload, "div", 171, 6);
  $$payload.out.push(`<h2 class="text-lg font-medium text-gray-900">`);
  push_element($$payload, "h2", 172, 8);
  $$payload.out.push(`Your Monitors</h2>`);
  pop_element();
  $$payload.out.push(` <button class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">`);
  push_element($$payload, "button", 173, 8);
  $$payload.out.push(`<svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">`);
  push_element($$payload, "svg", 177, 10);
  $$payload.out.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4">`);
  push_element($$payload, "path", 178, 12);
  $$payload.out.push(`</path>`);
  pop_element();
  $$payload.out.push(`</svg>`);
  pop_element();
  $$payload.out.push(` Create Monitor</button>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(` `);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="flex justify-center items-center py-12">`);
    push_element($$payload, "div", 185, 8);
    $$payload.out.push(`<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600">`);
    push_element($$payload, "div", 186, 10);
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(` <span class="ml-2 text-gray-600">`);
    push_element($$payload, "span", 187, 10);
    $$payload.out.push(`Loading monitors...</span>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
  }
  $$payload.out.push(`<!--]--></div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  pop();
}
_page.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};

export { _page as default };
//# sourceMappingURL=_page.svelte-BLuTKC3u.js.map
