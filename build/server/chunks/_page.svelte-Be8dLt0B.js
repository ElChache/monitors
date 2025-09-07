import { p as push, j as store_get, k as copy_payload, l as assign_payload, u as unsubscribe_stores, a as pop, m as current_component, o as ensure_array_like, b as push_element, c as pop_element, q as attr, e as escape_html, f as attr_class, r as fallback, t as bind_props, v as clsx, F as FILENAME, i as stringify } from './index3-C1cEPogv.js';
import './client-BOL_CNRd.js';
import { w as writable } from './index2-vFLLKhfi.js';
import './exports-DdEMOvoO.js';

function onDestroy(fn) {
  var context = (
    /** @type {Component} */
    current_component
  );
  (context.d ??= []).push(fn);
}
AIPromptSuggestions[FILENAME] = "src/lib/components/AIPromptSuggestions.svelte";
function AIPromptSuggestions($$payload, $$props) {
  push(AIPromptSuggestions);
  let prompt = fallback($$props["prompt"], "");
  let error = fallback($$props["error"], "");
  let suggestions = [];
  let suggestionsLoading = false;
  let debounceTimeout = null;
  const fetchSuggestions = async (text) => {
    if (text.trim().length < 20) {
      suggestions = [];
      return;
    }
    suggestionsLoading = true;
    error = "";
    try {
      const response = await fetch("/api/ai/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, context: "monitor_creation" })
      });
      if (response.ok) {
        const data = await response.json();
        suggestions = data.suggestions || [];
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
        suggestions = generateMockSuggestions(text);
      }
    } catch (err) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      suggestions = generateMockSuggestions(text);
    } finally {
      suggestionsLoading = false;
    }
  };
  const generateMockSuggestions = (text) => {
    const mockSuggestions = [];
    const lowerText = text.toLowerCase();
    if (!lowerText.includes("when") && !lowerText.includes("if")) {
      mockSuggestions.push({
        id: "spec_1",
        type: "specificity",
        title: "Add trigger condition",
        description: "Consider adding a specific condition to trigger your monitor",
        suggested_text: `${text} when [condition]`,
        confidence: 0.85,
        reasoning: "Monitors work better with specific trigger conditions"
      });
    }
    if (lowerText.includes("stock") || lowerText.includes("price") || lowerText.includes("$")) {
      mockSuggestions.push({
        id: "stock_1",
        type: "improvement",
        title: "Specify price threshold",
        description: "Add a specific price point for better monitoring",
        suggested_text: text.includes("$") ? text : `${text} below $[amount]`,
        confidence: 0.92,
        reasoning: "Stock monitors need specific price thresholds"
      });
    }
    if (lowerText.includes("weather") || lowerText.includes("rain") || lowerText.includes("snow")) {
      mockSuggestions.push({
        id: "weather_1",
        type: "clarity",
        title: "Add location",
        description: "Weather monitors work better with specific locations",
        suggested_text: lowerText.includes(" in ") ? text : `${text} in [city]`,
        confidence: 0.88,
        reasoning: "Weather data requires location specificity"
      });
    }
    if (text.length > 100) {
      mockSuggestions.push({
        id: "clarity_1",
        type: "clarity",
        title: "Simplify description",
        description: "Consider breaking this into multiple monitors for better accuracy",
        suggested_text: text.split(".")[0] || text.substring(0, 80) + "...",
        confidence: 0.75,
        reasoning: "Simpler prompts often yield better results"
      });
    }
    return mockSuggestions.slice(0, 3);
  };
  onDestroy(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
  });
  {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    debounceTimeout = setTimeout(
      () => {
        if (prompt.trim().length >= 20) {
          fetchSuggestions(prompt);
        } else {
          suggestions = [];
        }
      },
      500
    );
  }
  if (
    // Cleanup timeout on component destroy
    suggestions.length > 0 || suggestionsLoading
  ) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">`);
    push_element($$payload, "div", 160, 2);
    $$payload.out.push(`<div class="flex items-center justify-between mb-3">`);
    push_element($$payload, "div", 161, 4);
    $$payload.out.push(`<div class="flex items-center space-x-2">`);
    push_element($$payload, "div", 162, 6);
    $$payload.out.push(`<svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">`);
    push_element($$payload, "svg", 163, 8);
    $$payload.out.push(`<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd">`);
    push_element($$payload, "path", 164, 10);
    $$payload.out.push(`</path>`);
    pop_element();
    $$payload.out.push(`</svg>`);
    pop_element();
    $$payload.out.push(` <h4 class="text-sm font-medium text-blue-900">`);
    push_element($$payload, "h4", 166, 8);
    $$payload.out.push(`${escape_html(suggestionsLoading ? "Getting suggestions..." : "AI Suggestions")}</h4>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(` `);
    if (suggestionsLoading) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600">`);
      push_element($$payload, "div", 172, 8);
      $$payload.out.push(`</div>`);
      pop_element();
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div>`);
    pop_element();
    $$payload.out.push(` `);
    if (suggestionsLoading) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="space-y-2">`);
      push_element($$payload, "div", 177, 6);
      $$payload.out.push(`<div class="h-4 bg-blue-100 rounded animate-pulse">`);
      push_element($$payload, "div", 178, 8);
      $$payload.out.push(`</div>`);
      pop_element();
      $$payload.out.push(` <div class="h-4 bg-blue-100 rounded animate-pulse w-3/4">`);
      push_element($$payload, "div", 179, 8);
      $$payload.out.push(`</div>`);
      pop_element();
      $$payload.out.push(`</div>`);
      pop_element();
    } else {
      $$payload.out.push("<!--[!-->");
      const each_array = ensure_array_like(suggestions);
      $$payload.out.push(`<div class="space-y-3">`);
      push_element($$payload, "div", 182, 6);
      $$payload.out.push(`<!--[-->`);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let suggestion = each_array[$$index];
        $$payload.out.push(`<div class="bg-white border border-blue-200 rounded-lg p-3 relative group">`);
        push_element($$payload, "div", 184, 10);
        $$payload.out.push(`<div class="flex items-start justify-between">`);
        push_element($$payload, "div", 185, 12);
        $$payload.out.push(`<div class="flex-1">`);
        push_element($$payload, "div", 186, 14);
        $$payload.out.push(`<div class="flex items-center space-x-2 mb-1">`);
        push_element($$payload, "div", 187, 16);
        $$payload.out.push(`<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">`);
        push_element($$payload, "span", 188, 18);
        $$payload.out.push(`${escape_html(suggestion.type)}</span>`);
        pop_element();
        $$payload.out.push(` <span class="text-xs text-gray-500">`);
        push_element($$payload, "span", 191, 18);
        $$payload.out.push(`${escape_html(Math.round(suggestion.confidence * 100))}% confidence</span>`);
        pop_element();
        $$payload.out.push(`</div>`);
        pop_element();
        $$payload.out.push(` <h5 class="text-sm font-medium text-gray-900 mb-1">`);
        push_element($$payload, "h5", 196, 16);
        $$payload.out.push(`${escape_html(suggestion.title)}</h5>`);
        pop_element();
        $$payload.out.push(` <p class="text-xs text-gray-600 mb-2">`);
        push_element($$payload, "p", 200, 16);
        $$payload.out.push(`${escape_html(suggestion.description)}</p>`);
        pop_element();
        $$payload.out.push(` <div class="bg-gray-50 rounded p-2 text-sm text-gray-700 font-mono text-xs">`);
        push_element($$payload, "div", 204, 16);
        $$payload.out.push(`"${escape_html(suggestion.suggested_text)}"</div>`);
        pop_element();
        $$payload.out.push(` <p class="text-xs text-gray-500 mt-2 italic">`);
        push_element($$payload, "p", 208, 16);
        $$payload.out.push(`💡 ${escape_html(suggestion.reasoning)}</p>`);
        pop_element();
        $$payload.out.push(`</div>`);
        pop_element();
        $$payload.out.push(` <button type="button" class="ml-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity svelte-9i4mxp" aria-label="Dismiss suggestion">`);
        push_element($$payload, "button", 213, 14);
        $$payload.out.push(`<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">`);
        push_element($$payload, "svg", 219, 16);
        $$payload.out.push(`<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd">`);
        push_element($$payload, "path", 220, 18);
        $$payload.out.push(`</path>`);
        pop_element();
        $$payload.out.push(`</svg>`);
        pop_element();
        $$payload.out.push(`</button>`);
        pop_element();
        $$payload.out.push(`</div>`);
        pop_element();
        $$payload.out.push(` <div class="flex justify-end space-x-2 mt-3">`);
        push_element($$payload, "div", 225, 12);
        $$payload.out.push(`<button type="button" class="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors svelte-9i4mxp">`);
        push_element($$payload, "button", 226, 14);
        $$payload.out.push(`Apply suggestion</button>`);
        pop_element();
        $$payload.out.push(`</div>`);
        pop_element();
        $$payload.out.push(`</div>`);
        pop_element();
      }
      $$payload.out.push(`<!--]--></div>`);
      pop_element();
    }
    $$payload.out.push(`<!--]--></div>`);
    pop_element();
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  bind_props($$props, { prompt, error });
  pop();
}
AIPromptSuggestions.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
const defaultState = {
  current: null,
  saveStatus: "idle",
  lastSaved: null,
  errorMessage: null
};
function createDraftStore() {
  const { subscribe, set, update } = writable(defaultState);
  let autoSaveTimeout = null;
  let currentDraft = null;
  const AUTO_SAVE_INTERVAL = 3e4;
  const saveToServer = async (draft) => {
    try {
      const response = await fetch("/api/monitors/drafts/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: draft.prompt,
          timestamp: draft.timestamp
        })
      });
      if (response.ok) {
        const result = await response.json();
        return result.success === true;
      }
      return false;
    } catch (error) {
      console.error("Failed to save draft to server:", error);
      return false;
    }
  };
  const scheduleAutoSave = (draft) => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    autoSaveTimeout = setTimeout(async () => {
      if (draft.hasUnsavedChanges) {
        await saveDraft(draft);
      }
    }, AUTO_SAVE_INTERVAL);
  };
  const saveDraft = async (draft) => {
    update((state) => ({ ...state, saveStatus: "saving", errorMessage: null }));
    const serverSaveSuccess = await saveToServer(draft);
    if (serverSaveSuccess) {
      update((state) => ({
        ...state,
        saveStatus: "saved",
        lastSaved: Date.now(),
        current: draft ? { ...draft, hasUnsavedChanges: false, isAutoSaved: true } : null
      }));
    } else {
      update((state) => ({
        ...state,
        saveStatus: "error",
        errorMessage: "Auto-save to server failed, but saved locally",
        current: draft ? { ...draft, hasUnsavedChanges: false, isAutoSaved: true } : null
      }));
    }
    currentDraft = draft;
  };
  return {
    subscribe,
    // Initialize with any existing draft
    initialize: () => {
    },
    // Update the current draft
    updateDraft: (prompt) => {
      const now = Date.now();
      const draft = {
        prompt,
        timestamp: now,
        isAutoSaved: false,
        hasUnsavedChanges: true
      };
      update((state) => ({
        ...state,
        current: draft,
        saveStatus: state.current?.prompt === prompt ? state.saveStatus : "idle"
      }));
      currentDraft = draft;
      scheduleAutoSave(draft);
    },
    // Manually save draft
    save: async () => {
      if (currentDraft) {
        await saveDraft(currentDraft);
      }
    },
    // Clear the current draft
    clear: () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = null;
      }
      update(() => defaultState);
      currentDraft = null;
    },
    // Restore from a specific draft
    restore: (draft) => {
      update((state) => ({
        ...state,
        current: draft,
        saveStatus: "idle",
        lastSaved: draft.timestamp
      }));
      currentDraft = draft;
    },
    // Get available drafts from server
    loadServerDrafts: async () => {
      try {
        const response = await fetch("/api/monitors/drafts");
        if (response.ok) {
          const result = await response.json();
          return result.drafts || [];
        }
      } catch (error) {
        console.error("Failed to load server drafts:", error);
      }
      return [];
    },
    // Delete a draft
    deleteDraft: async (draftId) => {
      try {
        const response = await fetch("/api/monitors/drafts", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ id: draftId })
        });
        return response.ok;
      } catch (error) {
        console.error("Failed to delete draft:", error);
        return false;
      }
    }
  };
}
const draftStore = createDraftStore();
const formatDraftTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 6e4) {
    return "Just now";
  } else if (diff < 36e5) {
    return `${Math.floor(diff / 6e4)} minutes ago`;
  } else if (diff < 864e5) {
    return `${Math.floor(diff / 36e5)} hours ago`;
  } else {
    return new Date(timestamp).toLocaleDateString();
  }
};
DraftStatus[FILENAME] = "src/lib/components/DraftStatus.svelte";
function DraftStatus($$payload, $$props) {
  push(DraftStatus);
  var $$store_subs;
  let saveStatus, lastSaved, currentDraft, hasUnsavedChanges;
  let showDraftManager = fallback($$props["showDraftManager"], false);
  let serverDrafts = [];
  const getStatusIcon = (status) => {
    switch (status) {
      case "saving":
        return "⏳";
      case "saved":
        return "✅";
      case "error":
        return "⚠️";
      default:
        return "💾";
    }
  };
  const getStatusText = (status) => {
    switch (status) {
      case "saving":
        return "Saving...";
      case "saved":
        return lastSaved ? `Saved ${formatDraftTime(lastSaved)}` : "Saved";
      case "error":
        return "Save failed (saved locally)";
      default:
        return hasUnsavedChanges ? "Unsaved changes" : "Up to date";
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "saving":
        return "text-blue-600";
      case "saved":
        return "text-green-600";
      case "error":
        return "text-orange-600";
      default:
        return hasUnsavedChanges ? "text-yellow-600" : "text-gray-500";
    }
  };
  saveStatus = store_get($$store_subs ??= {}, "$draftStore", draftStore).saveStatus;
  lastSaved = store_get($$store_subs ??= {}, "$draftStore", draftStore).lastSaved;
  currentDraft = store_get($$store_subs ??= {}, "$draftStore", draftStore).current;
  hasUnsavedChanges = currentDraft?.hasUnsavedChanges ?? false;
  $$payload.out.push(`<div class="flex items-center justify-between p-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">`);
  push_element($$payload, "div", 103, 0);
  $$payload.out.push(`<div class="flex items-center space-x-2 text-sm">`);
  push_element($$payload, "div", 104, 2);
  $$payload.out.push(`<span class="text-lg">`);
  push_element($$payload, "span", 105, 4);
  $$payload.out.push(`${escape_html(getStatusIcon(saveStatus))}</span>`);
  pop_element();
  $$payload.out.push(` <span${attr_class(clsx(getStatusColor(saveStatus)), "svelte-1c3ig4d")}>`);
  push_element($$payload, "span", 106, 4);
  $$payload.out.push(`${escape_html(getStatusText(saveStatus))}</span>`);
  pop_element();
  $$payload.out.push(` `);
  if (store_get($$store_subs ??= {}, "$draftStore", draftStore).errorMessage) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<span class="text-xs text-orange-600">`);
    push_element($$payload, "span", 111, 6);
    $$payload.out.push(`(${escape_html(store_get($$store_subs ??= {}, "$draftStore", draftStore).errorMessage)})</span>`);
    pop_element();
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  pop_element();
  $$payload.out.push(` <div class="flex items-center space-x-2">`);
  push_element($$payload, "div", 117, 2);
  if (hasUnsavedChanges) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<button type="button"${attr("disabled", saveStatus === "saving", true)} class="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors svelte-1c3ig4d">`);
    push_element($$payload, "button", 120, 6);
    $$payload.out.push(`${escape_html(saveStatus === "saving" ? "Saving..." : "Save now")}</button>`);
    pop_element();
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (showDraftManager) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<button type="button" class="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-colors svelte-1c3ig4d" title="Manage drafts">`);
    push_element($$payload, "button", 132, 6);
    $$payload.out.push(`📋 Drafts</button>`);
    pop_element();
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(` `);
  if (showDraftManager && serverDrafts.length > 0) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(serverDrafts);
    $$payload.out.push(`<div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">`);
    push_element($$payload, "div", 146, 2);
    $$payload.out.push(`<h4 class="text-sm font-medium text-blue-900 mb-3">`);
    push_element($$payload, "h4", 147, 4);
    $$payload.out.push(`Saved Drafts</h4>`);
    pop_element();
    $$payload.out.push(` <div class="space-y-2 max-h-48 overflow-y-auto">`);
    push_element($$payload, "div", 149, 4);
    $$payload.out.push(`<!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let draft = each_array[$$index];
      $$payload.out.push(`<div class="bg-white border border-blue-200 rounded p-3 hover:bg-blue-50 transition-colors group">`);
      push_element($$payload, "div", 151, 8);
      $$payload.out.push(`<div class="flex items-start justify-between">`);
      push_element($$payload, "div", 152, 10);
      $$payload.out.push(`<button type="button" class="flex-1 text-left svelte-1c3ig4d">`);
      push_element($$payload, "button", 153, 12);
      $$payload.out.push(`<p class="text-sm text-gray-900 line-clamp-2 mb-1 svelte-1c3ig4d">`);
      push_element($$payload, "p", 158, 14);
      $$payload.out.push(`${escape_html(draft.prompt.length > 80 ? `${draft.prompt.substring(0, 80)}...` : draft.prompt)}</p>`);
      pop_element();
      $$payload.out.push(` <p class="text-xs text-gray-500">`);
      push_element($$payload, "p", 161, 14);
      $$payload.out.push(`${escape_html(formatDraftTime(draft.timestamp))} `);
      if (draft.isAutoSaved) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`· Auto-saved`);
      } else {
        $$payload.out.push("<!--[!-->");
        $$payload.out.push(`· Manually saved`);
      }
      $$payload.out.push(`<!--]--></p>`);
      pop_element();
      $$payload.out.push(`</button>`);
      pop_element();
      $$payload.out.push(` <button type="button" class="ml-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity svelte-1c3ig4d" aria-label="Delete draft">`);
      push_element($$payload, "button", 171, 12);
      $$payload.out.push(`<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">`);
      push_element($$payload, "svg", 177, 14);
      $$payload.out.push(`<path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd">`);
      push_element($$payload, "path", 178, 16);
      $$payload.out.push(`</path>`);
      pop_element();
      $$payload.out.push(`</svg>`);
      pop_element();
      $$payload.out.push(`</button>`);
      pop_element();
      $$payload.out.push(`</div>`);
      pop_element();
      $$payload.out.push(`</div>`);
      pop_element();
    }
    $$payload.out.push(`<!--]--></div>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  bind_props($$props, { showDraftManager });
  pop();
}
DraftStatus.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
_page[FILENAME] = "src/routes/monitors/create/+page.svelte";
function _page($$payload, $$props) {
  push(_page);
  var $$store_subs;
  let prompt = "";
  let error = "";
  let characterCount = 0;
  const maxCharacters = 500;
  onDestroy(() => {
    if (prompt.trim().length > 0) {
      draftStore.updateDraft(prompt);
    }
  });
  const examplePrompts = [
    "Tell me when Tesla stock drops below $200",
    "Alert me when it's going to rain for 3 days in Seattle",
    "Notify when Bitcoin rises 10% in 24 hours",
    "Let me know when iPhone 15 Pro is back in stock at Apple Store",
    "Track when gas prices in San Francisco drop below $4.50"
  ];
  characterCount = prompt.length;
  if (prompt !== (store_get($$store_subs ??= {}, "$draftStore", draftStore).current?.prompt || "")) {
    if (prompt.trim().length > 0) {
      draftStore.updateDraft(prompt);
    }
  }
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    const each_array = ensure_array_like(examplePrompts);
    $$payload2.out.push(`<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">`);
    push_element($$payload2, "div", 128, 0);
    $$payload2.out.push(`<div class="mb-8">`);
    push_element($$payload2, "div", 130, 2);
    $$payload2.out.push(`<nav class="flex" aria-label="Breadcrumb">`);
    push_element($$payload2, "nav", 131, 4);
    $$payload2.out.push(`<ol role="list" class="flex items-center space-x-4">`);
    push_element($$payload2, "ol", 132, 6);
    $$payload2.out.push(`<li>`);
    push_element($$payload2, "li", 133, 8);
    $$payload2.out.push(`<a href="/" class="text-gray-400 hover:text-gray-500">`);
    push_element($$payload2, "a", 134, 10);
    $$payload2.out.push(`<span class="sr-only">`);
    push_element($$payload2, "span", 135, 12);
    $$payload2.out.push(`Home</span>`);
    pop_element();
    $$payload2.out.push(` Dashboard</a>`);
    pop_element();
    $$payload2.out.push(`</li>`);
    pop_element();
    $$payload2.out.push(` <li>`);
    push_element($$payload2, "li", 139, 8);
    $$payload2.out.push(`<div class="flex items-center">`);
    push_element($$payload2, "div", 140, 10);
    $$payload2.out.push(`<span class="text-gray-400 mx-4">`);
    push_element($$payload2, "span", 141, 12);
    $$payload2.out.push(`/</span>`);
    pop_element();
    $$payload2.out.push(` <span class="text-gray-900 font-medium">`);
    push_element($$payload2, "span", 142, 12);
    $$payload2.out.push(`Create Monitor</span>`);
    pop_element();
    $$payload2.out.push(`</div>`);
    pop_element();
    $$payload2.out.push(`</li>`);
    pop_element();
    $$payload2.out.push(`</ol>`);
    pop_element();
    $$payload2.out.push(`</nav>`);
    pop_element();
    $$payload2.out.push(` <h1 class="mt-4 text-3xl font-bold text-gray-900">`);
    push_element($$payload2, "h1", 148, 4);
    $$payload2.out.push(`Create Your Monitor</h1>`);
    pop_element();
    $$payload2.out.push(` <p class="mt-2 text-gray-600">`);
    push_element($$payload2, "p", 149, 4);
    $$payload2.out.push(`Describe what you want to track in plain English</p>`);
    pop_element();
    $$payload2.out.push(`</div>`);
    pop_element();
    $$payload2.out.push(` `);
    {
      $$payload2.out.push("<!--[!-->");
    }
    $$payload2.out.push(`<!--]--> <div class="bg-white shadow-lg rounded-lg overflow-hidden">`);
    push_element($$payload2, "div", 196, 2);
    $$payload2.out.push(`<form class="p-6 space-y-6">`);
    push_element($$payload2, "form", 197, 4);
    {
      $$payload2.out.push("<!--[!-->");
    }
    $$payload2.out.push(`<!--]--> <div>`);
    push_element($$payload2, "div", 205, 6);
    $$payload2.out.push(`<label for="prompt" class="block text-sm md:text-base font-medium text-gray-700 mb-2">`);
    push_element($$payload2, "label", 206, 8);
    $$payload2.out.push(`What do you want to monitor?</label>`);
    pop_element();
    $$payload2.out.push(` <div class="relative">`);
    push_element($$payload2, "div", 209, 8);
    $$payload2.out.push(`<textarea id="prompt" name="prompt" rows="4" required placeholder="Describe what you want to track... (e.g., 'Tell me when Tesla stock drops below $200')" class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none p-4 text-base md:text-sm min-h-[120px] touch-manipulation" style="font-size: 16px; /* Prevents iOS zoom */"${attr("maxlength", maxCharacters)}>`);
    push_element($$payload2, "textarea", 210, 10);
    const $$body = escape_html(prompt);
    if ($$body) {
      $$payload2.out.push(`${$$body}`);
    }
    $$payload2.out.push(`</textarea>`);
    pop_element();
    $$payload2.out.push(` <div class="absolute bottom-2 right-2 text-xs text-gray-400">`);
    push_element($$payload2, "div", 221, 10);
    $$payload2.out.push(`${escape_html(characterCount)}/500</div>`);
    pop_element();
    $$payload2.out.push(`</div>`);
    pop_element();
    $$payload2.out.push(` `);
    AIPromptSuggestions($$payload2, {
      error,
      get prompt() {
        return prompt;
      },
      set prompt($$value) {
        prompt = $$value;
        $$settled = false;
      }
    });
    $$payload2.out.push(`<!----></div>`);
    pop_element();
    $$payload2.out.push(` <div class="flex flex-col-reverse sm:flex-row justify-end space-y-reverse space-y-3 sm:space-y-0 sm:space-x-3">`);
    push_element($$payload2, "div", 235, 6);
    $$payload2.out.push(`<a href="/" class="w-full sm:w-auto px-6 py-3 sm:px-4 sm:py-2 text-base sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-center touch-manipulation min-h-[44px] flex items-center justify-center">`);
    push_element($$payload2, "a", 236, 8);
    $$payload2.out.push(`Cancel</a>`);
    pop_element();
    $$payload2.out.push(` <button type="submit"${attr("disabled", prompt.trim().length < 10, true)}${attr_class(`w-full sm:w-auto px-6 py-3 sm:px-4 sm:py-2 text-base sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-manipulation min-h-[44px] flex items-center justify-center ${stringify(prompt.trim().length < 10 ? "opacity-50 cursor-not-allowed" : "")}`)}>`);
    push_element($$payload2, "button", 242, 8);
    {
      $$payload2.out.push("<!--[!-->");
      $$payload2.out.push(`Create Monitor`);
    }
    $$payload2.out.push(`<!--]--></button>`);
    pop_element();
    $$payload2.out.push(`</div>`);
    pop_element();
    $$payload2.out.push(`</form>`);
    pop_element();
    $$payload2.out.push(` `);
    DraftStatus($$payload2, { showDraftManager: true });
    $$payload2.out.push(`<!----></div>`);
    pop_element();
    $$payload2.out.push(` <div class="mt-8">`);
    push_element($$payload2, "div", 269, 2);
    $$payload2.out.push(`<h3 class="text-lg font-medium text-gray-900 mb-4">`);
    push_element($$payload2, "h3", 270, 4);
    $$payload2.out.push(`Need inspiration? Try these examples:</h3>`);
    pop_element();
    $$payload2.out.push(` <div class="grid gap-3 sm:grid-cols-2">`);
    push_element($$payload2, "div", 271, 4);
    $$payload2.out.push(`<!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let example = each_array[$$index];
      $$payload2.out.push(`<button type="button" class="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group">`);
      push_element($$payload2, "button", 273, 8);
      $$payload2.out.push(`<p class="text-sm text-gray-700 group-hover:text-blue-700">`);
      push_element($$payload2, "p", 278, 10);
      $$payload2.out.push(`"${escape_html(example)}"</p>`);
      pop_element();
      $$payload2.out.push(`</button>`);
      pop_element();
    }
    $$payload2.out.push(`<!--]--></div>`);
    pop_element();
    $$payload2.out.push(`</div>`);
    pop_element();
    $$payload2.out.push(` <div class="mt-8 bg-gray-50 rounded-lg p-6">`);
    push_element($$payload2, "div", 285, 2);
    $$payload2.out.push(`<h4 class="font-medium text-gray-900 mb-2">`);
    push_element($$payload2, "h4", 286, 4);
    $$payload2.out.push(`Tips for creating great monitors:</h4>`);
    pop_element();
    $$payload2.out.push(` <ul class="text-sm text-gray-600 space-y-1">`);
    push_element($$payload2, "ul", 287, 4);
    $$payload2.out.push(`<li>`);
    push_element($$payload2, "li", 288, 6);
    $$payload2.out.push(`• Be specific about what you want to track (stocks, weather, prices, etc.)</li>`);
    pop_element();
    $$payload2.out.push(` <li>`);
    push_element($$payload2, "li", 289, 6);
    $$payload2.out.push(`• Include trigger conditions (when price drops below X, when it rains for X days)</li>`);
    pop_element();
    $$payload2.out.push(` <li>`);
    push_element($$payload2, "li", 290, 6);
    $$payload2.out.push(`• Use natural language - write like you're talking to a friend</li>`);
    pop_element();
    $$payload2.out.push(` <li>`);
    push_element($$payload2, "li", 291, 6);
    $$payload2.out.push(`• Include locations when relevant (weather, gas prices, local events)</li>`);
    pop_element();
    $$payload2.out.push(`</ul>`);
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
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
_page.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};

export { _page as default };
//# sourceMappingURL=_page.svelte-Be8dLt0B.js.map
