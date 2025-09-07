<script lang="ts">
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { onMount, onDestroy } from 'svelte';
  import AIPromptSuggestions from '$lib/components/AIPromptSuggestions.svelte';
  import DraftStatus from '$lib/components/DraftStatus.svelte';
  import { draftStore } from '$lib/stores/drafts';
  
  let prompt = '';
  let loading = false;
  let error = '';
  let characterCount = 0;
  const maxCharacters = 500;
  
  // Draft management
  let showDraftRestore = false;
  let promptBeforeRestore = '';

  $: characterCount = prompt.length;

  const handleSubmit = async () => {
    loading = true;
    error = '';
    
    try {
      const response = await fetch('/api/monitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: prompt.substring(0, 100) + '...',
          description: prompt,
          url: 'https://example.com',
          factType: 'text',
          triggerCondition: 'contains "monitor"',
          notificationMethod: 'email'
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          error = 'Please log in to create monitors';
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const monitor = await response.json();
      console.log('Monitor created:', monitor);
      
      // Redirect to monitors dashboard
      if (browser) {
        goto('/');
      }
      
    } catch (err) {
      console.error('Error creating monitor:', err);
      error = err instanceof Error ? err.message : 'Failed to create monitor';
    } finally {
      loading = false;
    }
  };

  // Handle AI suggestion application
  const handleApplySuggestion = (event: CustomEvent) => {
    const { text, type } = event.detail;
    prompt = text;
    
    // Update draft when AI suggestion is applied
    draftStore.updateDraft(prompt);
    
    // Optionally show a subtle feedback
    console.log(`Applied ${type} suggestion:`, text);
  };

  // Handle draft restoration
  const handleDraftRestored = (event: CustomEvent) => {
    const draft = event.detail;
    prompt = draft.prompt;
    showDraftRestore = false;
  };

  // Handle draft cleared
  const handleDraftCleared = () => {
    prompt = '';
    showDraftRestore = false;
  };

  // Initialize draft store on mount
  onMount(() => {
    draftStore.initialize();
    
    // Check if there's an existing draft to restore
    const currentDraft = $draftStore.current;
    if (currentDraft && currentDraft.prompt.trim().length > 0) {
      showDraftRestore = true;
      promptBeforeRestore = prompt;
    }
  });

  // Clean up on destroy
  onDestroy(() => {
    // Auto-save any final changes before leaving
    if (prompt.trim().length > 0) {
      draftStore.updateDraft(prompt);
    }
  });

  // Reactive statement to update draft when prompt changes
  $: if (prompt !== ($draftStore.current?.prompt || '')) {
    if (prompt.trim().length > 0) {
      draftStore.updateDraft(prompt);
    }
  };

  // Example prompts for inspiration
  const examplePrompts = [
    "Tell me when Tesla stock drops below $200",
    "Alert me when it's going to rain for 3 days in Seattle",
    "Notify when Bitcoin rises 10% in 24 hours",
    "Let me know when iPhone 15 Pro is back in stock at Apple Store",
    "Track when gas prices in San Francisco drop below $4.50"
  ];
</script>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <!-- Page Header -->
  <div class="mb-8">
    <nav class="flex" aria-label="Breadcrumb">
      <ol role="list" class="flex items-center space-x-4">
        <li>
          <a href="/" class="text-gray-400 hover:text-gray-500">
            <span class="sr-only">Home</span>
            Dashboard
          </a>
        </li>
        <li>
          <div class="flex items-center">
            <span class="text-gray-400 mx-4">/</span>
            <span class="text-gray-900 font-medium">Create Monitor</span>
          </div>
        </li>
      </ol>
    </nav>
    
    <h1 class="mt-4 text-3xl font-bold text-gray-900">Create Your Monitor</h1>
    <p class="mt-2 text-gray-600">Describe what you want to track in plain English</p>
  </div>

  <!-- Draft Restore Prompt -->
  {#if showDraftRestore && $draftStore.current}
    <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-sm font-medium text-blue-900 mb-2">Draft Found</h3>
          <p class="text-sm text-blue-700 mb-3">
            You have an unsaved draft from your previous session. Would you like to restore it?
          </p>
          <div class="bg-white border border-blue-200 rounded p-3 mb-3">
            <p class="text-sm text-gray-700 line-clamp-3">
              {$draftStore.current.prompt}
            </p>
            <p class="text-xs text-gray-500 mt-2">
              Saved {new Date($draftStore.current.timestamp).toLocaleString()}
            </p>
          </div>
          <div class="flex space-x-3">
            <button
              type="button"
              on:click={() => { prompt = $draftStore.current?.prompt || ''; showDraftRestore = false; }}
              class="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Restore draft
            </button>
            <button
              type="button"
              on:click={() => { draftStore.clear(); showDraftRestore = false; }}
              class="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Start fresh
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Monitor Creation Form -->
  <div class="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
    <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-6">
      {#if error}
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-sm text-red-700">{error}</p>
        </div>
      {/if}

      <!-- Natural Language Input -->
      <div>
        <label for="prompt" class="block text-sm md:text-base font-medium text-gray-700 mb-2">
          What do you want to monitor?
        </label>
        <div class="relative">
          <textarea
            id="prompt"
            name="prompt"
            rows="4"
            required
            bind:value={prompt}
            placeholder="Describe what you want to track... (e.g., 'Tell me when Tesla stock drops below $200')"
            class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none p-4 text-base md:text-sm min-h-[120px] touch-manipulation"
            style="font-size: 16px; /* Prevents iOS zoom */"
            maxlength={maxCharacters}
          ></textarea>
          <div class="absolute bottom-2 right-2 text-xs text-gray-400">
            {characterCount}/{maxCharacters}
          </div>
        </div>
        
        <!-- AI Suggestions Integration -->
        <AIPromptSuggestions 
          bind:prompt 
          {error}
          on:apply-suggestion={handleApplySuggestion}
        />
      </div>

      <!-- Submit Button -->
      <div class="flex flex-col-reverse sm:flex-row justify-end space-y-reverse space-y-3 sm:space-y-0 sm:space-x-3">
        <a
          href="/"
          class="w-full sm:w-auto px-6 py-3 sm:px-4 sm:py-2 text-base sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-center touch-manipulation min-h-[44px] flex items-center justify-center"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={loading || prompt.trim().length < 10}
          class="w-full sm:w-auto px-6 py-3 sm:px-4 sm:py-2 text-base sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-manipulation min-h-[44px] flex items-center justify-center {loading || prompt.trim().length < 10 ? 'opacity-50 cursor-not-allowed' : ''}"
        >
          {#if loading}
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Monitor...
          {:else}
            Create Monitor
          {/if}
        </button>
      </div>
    </form>
    
    <!-- Draft Status -->
    <DraftStatus 
      showDraftManager={true}
      on:draft-restored={handleDraftRestored}
      on:draft-cleared={handleDraftCleared}
    />
  </div>

  <!-- Example Prompts -->
  <div class="mt-8">
    <h3 class="text-lg font-medium text-gray-900 mb-4">Need inspiration? Try these examples:</h3>
    <div class="grid gap-3 sm:grid-cols-2">
      {#each examplePrompts as example}
        <button
          type="button"
          on:click={() => prompt = example}
          class="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
        >
          <p class="text-sm text-gray-700 group-hover:text-blue-700">"{example}"</p>
        </button>
      {/each}
    </div>
  </div>

  <!-- Help Text -->
  <div class="mt-8 bg-gray-50 rounded-lg p-6">
    <h4 class="font-medium text-gray-900 mb-2">Tips for creating great monitors:</h4>
    <ul class="text-sm text-gray-600 space-y-1">
      <li>• Be specific about what you want to track (stocks, weather, prices, etc.)</li>
      <li>• Include trigger conditions (when price drops below X, when it rains for X days)</li>
      <li>• Use natural language - write like you're talking to a friend</li>
      <li>• Include locations when relevant (weather, gas prices, local events)</li>
    </ul>
  </div>
</div>

<style>
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>