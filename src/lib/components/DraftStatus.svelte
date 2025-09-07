<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { draftStore, formatDraftTime, type MonitorDraft } from '$lib/stores/drafts';
  
  const dispatch = createEventDispatcher();
  
  export let showDraftManager = false;
  
  let serverDrafts: MonitorDraft[] = [];
  let showConfirmRestore = false;
  let draftToRestore: MonitorDraft | null = null;
  
  $: saveStatus = $draftStore.saveStatus;
  $: lastSaved = $draftStore.lastSaved;
  $: currentDraft = $draftStore.current;
  $: hasUnsavedChanges = currentDraft?.hasUnsavedChanges ?? false;
  
  // Load server drafts when component mounts
  onMount(async () => {
    if (showDraftManager) {
      serverDrafts = await draftStore.loadServerDrafts();
    }
  });
  
  const handleManualSave = () => {
    draftStore.save();
  };
  
  const handleRestoreDraft = (draft: MonitorDraft) => {
    if (hasUnsavedChanges) {
      draftToRestore = draft;
      showConfirmRestore = true;
    } else {
      restoreDraft(draft);
    }
  };
  
  const restoreDraft = (draft: MonitorDraft) => {
    draftStore.restore(draft);
    dispatch('draft-restored', draft);
    showConfirmRestore = false;
    draftToRestore = null;
  };
  
  const handleDiscardCurrent = () => {
    draftStore.clear();
    dispatch('draft-cleared');
    showConfirmRestore = false;
    draftToRestore = null;
  };
  
  const handleDeleteDraft = async (draft: MonitorDraft, event: Event) => {
    event.stopPropagation();
    if (draft.id && confirm('Delete this draft permanently?')) {
      const success = await draftStore.deleteDraft(draft.id);
      if (success) {
        serverDrafts = serverDrafts.filter(d => d.id !== draft.id);
      }
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'saving':
        return '⏳';
      case 'saved':
        return '✅';
      case 'error':
        return '⚠️';
      default:
        return '💾';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return lastSaved ? `Saved ${formatDraftTime(lastSaved)}` : 'Saved';
      case 'error':
        return 'Save failed (saved locally)';
      default:
        return hasUnsavedChanges ? 'Unsaved changes' : 'Up to date';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'saving':
        return 'text-blue-600';
      case 'saved':
        return 'text-green-600';
      case 'error':
        return 'text-orange-600';
      default:
        return hasUnsavedChanges ? 'text-yellow-600' : 'text-gray-500';
    }
  };
</script>

<!-- Draft Status Bar -->
<div class="flex items-center justify-between p-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
  <div class="flex items-center space-x-2 text-sm">
    <span class="text-lg">{getStatusIcon(saveStatus)}</span>
    <span class={getStatusColor(saveStatus)}>
      {getStatusText(saveStatus)}
    </span>
    
    {#if $draftStore.errorMessage}
      <span class="text-xs text-orange-600">
        ({$draftStore.errorMessage})
      </span>
    {/if}
  </div>
  
  <div class="flex items-center space-x-2">
    <!-- Manual Save Button -->
    {#if hasUnsavedChanges}
      <button
        type="button"
        on:click={handleManualSave}
        disabled={saveStatus === 'saving'}
        class="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saveStatus === 'saving' ? 'Saving...' : 'Save now'}
      </button>
    {/if}
    
    <!-- Draft Manager Toggle -->
    {#if showDraftManager}
      <button
        type="button"
        on:click={() => showDraftManager = !showDraftManager}
        class="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-colors"
        title="Manage drafts"
      >
        📋 Drafts
      </button>
    {/if}
  </div>
</div>

<!-- Draft Manager Panel -->
{#if showDraftManager && serverDrafts.length > 0}
  <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <h4 class="text-sm font-medium text-blue-900 mb-3">Saved Drafts</h4>
    
    <div class="space-y-2 max-h-48 overflow-y-auto">
      {#each serverDrafts as draft}
        <div class="bg-white border border-blue-200 rounded p-3 hover:bg-blue-50 transition-colors group">
          <div class="flex items-start justify-between">
            <button
              type="button"
              on:click={() => handleRestoreDraft(draft)}
              class="flex-1 text-left"
            >
              <p class="text-sm text-gray-900 line-clamp-2 mb-1">
                {draft.prompt.length > 80 ? `${draft.prompt.substring(0, 80)}...` : draft.prompt}
              </p>
              <p class="text-xs text-gray-500">
                {formatDraftTime(draft.timestamp)}
                {#if draft.isAutoSaved}
                  · Auto-saved
                {:else}
                  · Manually saved
                {/if}
              </p>
            </button>
            
            <button
              type="button"
              on:click={(e) => handleDeleteDraft(draft, e)}
              class="ml-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Delete draft"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<!-- Confirm Restore Modal -->
{#if showConfirmRestore && draftToRestore}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Restore Draft?</h3>
      
      <p class="text-sm text-gray-600 mb-4">
        You have unsaved changes in your current draft. Restoring this draft will replace your current work.
      </p>
      
      <div class="bg-gray-50 rounded p-3 mb-4">
        <p class="text-sm text-gray-700 line-clamp-3">
          <strong>Draft to restore:</strong><br>
          {draftToRestore.prompt}
        </p>
        <p class="text-xs text-gray-500 mt-2">
          Saved {formatDraftTime(draftToRestore.timestamp)}
        </p>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button
          type="button"
          on:click={() => { showConfirmRestore = false; draftToRestore = null; }}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          Cancel
        </button>
        
        <button
          type="button"
          on:click={handleDiscardCurrent}
          class="px-4 py-2 text-sm font-medium text-orange-700 bg-orange-100 border border-orange-300 rounded hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
        >
          Discard current
        </button>
        
        <button
          type="button"
          on:click={() => draftToRestore && restoreDraft(draftToRestore)}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Restore draft
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  /* Enhanced accessibility for mobile */
  @media (max-width: 640px) {
    button {
      min-height: 44px;
      touch-action: manipulation;
    }
  }
</style>