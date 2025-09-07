<script lang="ts">
  let prompt = '';
  let loading = false;
  let error = '';
  let characterCount = 0;
  const maxCharacters = 500;

  $: characterCount = prompt.length;

  const handleSubmit = async () => {
    loading = true;
    error = '';
    
    // TODO: Integrate with AI API for monitor creation
    console.log('Creating monitor with prompt:', prompt);
    
    // Simulated AI processing for now
    setTimeout(() => {
      loading = false;
      // Will integrate with actual AI in Iteration 2
    }, 2000);
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

  <!-- Monitor Creation Form -->
  <div class="bg-white shadow-monitors rounded-monitors overflow-hidden">
    <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-6">
      {#if error}
        <div class="bg-accent-50 border border-accent-200 rounded-monitors p-4">
          <p class="text-sm text-accent-700">{error}</p>
        </div>
      {/if}

      <!-- Natural Language Input -->
      <div>
        <label for="prompt" class="form-label">
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
            class="form-input resize-none"
            maxlength={maxCharacters}
          ></textarea>
          <div class="absolute bottom-2 right-2 text-xs text-gray-400">
            {characterCount}/{maxCharacters}
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="flex justify-end space-x-3">
        <a
          href="/"
          class="btn-outline"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={loading || prompt.trim().length < 10}
          class="btn-primary {loading || prompt.trim().length < 10 ? 'opacity-50 cursor-not-allowed' : ''}"
        >
          {#if loading}
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing with AI...
          {:else}
            Create Monitor
          {/if}
        </button>
      </div>
    </form>
  </div>

  <!-- Example Prompts -->
  <div class="mt-8">
    <h3 class="text-lg font-medium text-gray-900 mb-4">Need inspiration? Try these examples:</h3>
    <div class="grid gap-3 sm:grid-cols-2">
      {#each examplePrompts as example}
        <button
          type="button"
          on:click={() => prompt = example}
          class="text-left p-4 border border-gray-200 rounded-monitors hover:border-primary-300 hover:bg-primary-50 transition-colors group"
        >
          <p class="text-sm text-gray-700 group-hover:text-primary-700">"{example}"</p>
        </button>
      {/each}
    </div>
  </div>

  <!-- Help Text -->
  <div class="mt-8 bg-gray-50 rounded-monitors p-6">
    <h4 class="font-medium text-gray-900 mb-2">Tips for creating great monitors:</h4>
    <ul class="text-sm text-gray-600 space-y-1">
      <li>• Be specific about what you want to track (stocks, weather, prices, etc.)</li>
      <li>• Include trigger conditions (when price drops below X, when it rains for X days)</li>
      <li>• Use natural language - write like you're talking to a friend</li>
      <li>• Include locations when relevant (weather, gas prices, local events)</li>
    </ul>
  </div>
</div>