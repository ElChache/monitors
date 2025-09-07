<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';

  // Form state
  let prompt = '';
  let monitorName = '';
  let frequency = 'hourly';
  let notificationMethod = 'email';
  let isActive = true;
  
  // UI state
  let loading = false;
  let error = '';
  let step = 1; // 1: input, 2: interpretation, 3: configuration, 4: success
  let aiInterpretation: any = null;
  let characterCount = 0;
  let isDraftsaved = false;
  let lastSavedTime = '';
  
  const maxCharacters = 1000; // Increased for better descriptions
  const minCharacters = 20;

  $: characterCount = prompt.length;
  $: isValidInput = prompt.trim().length >= minCharacters && prompt.trim().length <= maxCharacters;

  // Draft auto-save functionality
  let saveTimeout: NodeJS.Timeout;
  
  const saveDraft = () => {
    if (browser && prompt.trim()) {
      const draft = {
        prompt,
        monitorName,
        frequency,
        notificationMethod,
        timestamp: Date.now()
      };
      localStorage.setItem('monitor-draft', JSON.stringify(draft));
      isDraftsaved = true;
      lastSavedTime = new Date().toLocaleTimeString();
    }
  };

  const debouncedSave = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveDraft, 2000);
  };

  $: if (prompt || monitorName) {
    debouncedSave();
  }

  // Load draft on mount
  onMount(() => {
    if (browser) {
      const saved = localStorage.getItem('monitor-draft');
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          prompt = draft.prompt || '';
          monitorName = draft.monitorName || '';
          frequency = draft.frequency || 'hourly';
          notificationMethod = draft.notificationMethod || 'email';
          isDraftsaved = true;
          lastSavedTime = new Date(draft.timestamp).toLocaleTimeString();
        } catch (e) {
          console.warn('Failed to load draft:', e);
        }
      }
    }
  });

  const clearDraft = () => {
    if (browser) {
      localStorage.removeItem('monitor-draft');
      isDraftsaved = false;
    }
  };

  // AI processing simulation
  const processWithAI = async () => {
    if (!isValidInput) {
      error = `Please enter between ${minCharacters} and ${maxCharacters} characters.`;
      return;
    }

    loading = true;
    error = '';
    step = 2;
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock AI interpretation
    aiInterpretation = {
      type: prompt.toLowerCase().includes('stock') || prompt.toLowerCase().includes('price') ? 'state' : 'change',
      category: detectCategory(prompt),
      extractedValues: extractValues(prompt),
      suggestedName: generateSuggestedName(prompt),
      confidence: 0.85,
      triggers: extractTriggers(prompt),
      dataSource: detectDataSource(prompt)
    };
    
    // Set suggested name if empty
    if (!monitorName.trim()) {
      monitorName = aiInterpretation.suggestedName;
    }
    
    loading = false;
    step = 3;
  };

  const detectCategory = (text: string): string => {
    if (text.toLowerCase().includes('stock') || text.toLowerCase().includes('shares')) return 'Finance';
    if (text.toLowerCase().includes('weather') || text.toLowerCase().includes('rain') || text.toLowerCase().includes('temperature')) return 'Weather';
    if (text.toLowerCase().includes('price') && !text.toLowerCase().includes('stock')) return 'Shopping';
    if (text.toLowerCase().includes('crypto') || text.toLowerCase().includes('bitcoin') || text.toLowerCase().includes('ethereum')) return 'Cryptocurrency';
    return 'General';
  };

  const extractValues = (text: string): string[] => {
    const values = [];
    const priceMatch = text.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g);
    if (priceMatch) values.push(...priceMatch);
    
    const percentMatch = text.match(/(\d+)%/g);
    if (percentMatch) values.push(...percentMatch);
    
    const numberMatch = text.match(/(\d+)\s*(days?|hours?|minutes?)/g);
    if (numberMatch) values.push(...numberMatch);
    
    return values;
  };

  const generateSuggestedName = (text: string): string => {
    if (text.toLowerCase().includes('tesla')) return 'Tesla Stock Alert';
    if (text.toLowerCase().includes('bitcoin')) return 'Bitcoin Price Monitor';
    if (text.toLowerCase().includes('weather') || text.toLowerCase().includes('rain')) return 'Weather Alert';
    if (text.toLowerCase().includes('gas price')) return 'Gas Price Tracker';
    return 'Custom Monitor';
  };

  const extractTriggers = (text: string): string[] => {
    const triggers = [];
    if (text.toLowerCase().includes('drops below') || text.toLowerCase().includes('falls below')) {
      triggers.push('Price decrease threshold');
    }
    if (text.toLowerCase().includes('rises above') || text.toLowerCase().includes('increases above')) {
      triggers.push('Price increase threshold');
    }
    if (text.toLowerCase().includes('rain')) {
      triggers.push('Weather condition change');
    }
    return triggers;
  };

  const detectDataSource = (text: string): string => {
    if (text.toLowerCase().includes('stock')) return 'Financial APIs (Yahoo Finance, Alpha Vantage)';
    if (text.toLowerCase().includes('weather')) return 'Weather APIs (OpenWeatherMap)';
    if (text.toLowerCase().includes('crypto')) return 'Cryptocurrency APIs (CoinGecko)';
    return 'Web scraping and API monitoring';
  };

  const createMonitor = async () => {
    if (!monitorName.trim()) {
      error = 'Please provide a name for your monitor.';
      return;
    }

    loading = true;
    error = '';
    
    const monitorData = {
      name: monitorName.trim(),
      prompt: prompt.trim(),
      type: aiInterpretation.type,
      category: aiInterpretation.category,
      frequency,
      notificationMethod,
      isActive,
      interpretation: aiInterpretation
    };
    
    console.log('Creating monitor:', monitorData);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Clear draft after successful creation
    clearDraft();
    
    loading = false;
    step = 4;
    
    // Redirect to dashboard after 3 seconds
    setTimeout(() => {
      goto('/', { replaceState: true });
    }, 3000);
  };

  const goBack = () => {
    if (step > 1) {
      step = step - 1;
      loading = false;
      error = '';
    }
  };

  const startOver = () => {
    step = 1;
    prompt = '';
    monitorName = '';
    aiInterpretation = null;
    error = '';
    loading = false;
    clearDraft();
  };

  // Example prompts for inspiration
  const examplePrompts = [
    "Tell me when Tesla stock drops below $200 so I can buy the dip",
    "Alert me when it's going to rain for 3 consecutive days in Seattle",
    "Notify when Bitcoin rises 10% in 24 hours for trading opportunities", 
    "Let me know when iPhone 15 Pro is back in stock at Apple Store online",
    "Track when gas prices in San Francisco drop below $4.50 per gallon",
    "Monitor when Amazon stock reaches $150 per share for my investment",
    "Watch for when the temperature in New York drops below 32°F for 3 days",
    "Alert when Ethereum price increases by 15% in a single day"
  ];

  const frequencyOptions = [
    { value: 'realtime', label: 'Real-time (Pro)', disabled: false },
    { value: '15min', label: 'Every 15 minutes', disabled: false },
    { value: 'hourly', label: 'Every hour', disabled: false },
    { value: 'daily', label: 'Once daily', disabled: false },
    { value: 'weekly', label: 'Weekly', disabled: false }
  ];

  const notificationOptions = [
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'sms', label: 'SMS (Pro)', icon: '💬', disabled: true },
    { value: 'push', label: 'Browser Push', icon: '🔔' },
    { value: 'webhook', label: 'Webhook (Pro)', icon: '🔗', disabled: true }
  ];
</script>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
  <!-- Page Header -->
  <div class="mb-6 sm:mb-8">
    <nav class="flex mb-4" aria-label="Breadcrumb">
      <ol role="list" class="flex items-center space-x-2 sm:space-x-4 text-sm">
        <li>
          <a href="/" class="text-gray-400 hover:text-gray-500 font-medium">
            Dashboard
          </a>
        </li>
        <li class="flex items-center">
          <span class="text-gray-400 mx-2">/</span>
          <span class="text-gray-900 font-medium">Create Monitor</span>
        </li>
      </ol>
    </nav>
    
    <!-- Progress Indicator -->
    <div class="mb-6 sm:mb-8">
      <div class="flex items-center justify-between">
        {#each ['Input', 'AI Processing', 'Configuration', 'Success'] as stepName, i}
          <div class="flex items-center {i < 3 ? 'flex-1' : ''}">
            <div class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
              {step > i + 1 ? 'bg-primary text-white' : step === i + 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}">
              {i + 1}
            </div>
            <span class="ml-2 text-sm font-medium text-gray-600 hidden sm:block">{stepName}</span>
            {#if i < 3}
              <div class="flex-1 h-0.5 mx-4 {step > i + 1 ? 'bg-primary' : 'bg-gray-200'}"></div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
    
    <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Create Your Monitor</h1>
    <p class="mt-2 text-gray-600">
      {#if step === 1}
        Describe what you want to track in plain English
      {:else if step === 2}
        Our AI is understanding your request...
      {:else if step === 3}
        Configure your monitor settings
      {:else}
        Your monitor has been created successfully!
      {/if}
    </p>

    <!-- Draft Auto-Save Status -->
    {#if isDraftsaved && step === 1}
      <div class="mt-3 flex items-center text-sm text-gray-500">
        <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        Draft saved at {lastSavedTime}
      </div>
    {/if}
  </div>

  <!-- Error Display -->
  {#if error}
    <div class="mb-6 bg-red-50 border border-red-200 rounded-monitors p-4">
      <div class="flex items-center">
        <svg class="w-5 h-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p class="text-sm text-red-700">{error}</p>
      </div>
    </div>
  {/if}

  <!-- Step 1: Natural Language Input -->
  {#if step === 1}
    <div class="bg-white shadow-monitors rounded-monitors overflow-hidden">
      <div class="p-4 sm:p-6 space-y-6">
        <!-- Natural Language Input -->
        <div>
          <label for="prompt" class="form-label text-base">
            What do you want to monitor? <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <textarea
              id="prompt"
              name="prompt"
              rows="5"
              required
              bind:value={prompt}
              placeholder="Be as specific as possible... 

Examples:
• Tell me when Tesla stock drops below $200 so I can buy the dip
• Alert me when it's going to rain for 3 consecutive days in Seattle
• Notify when Bitcoin rises 10% in 24 hours for trading opportunities"
              class="form-input resize-none text-base leading-relaxed"
              maxlength={maxCharacters}
            ></textarea>
            <div class="absolute bottom-3 right-3 text-sm {characterCount > maxCharacters * 0.9 ? 'text-red-500' : 'text-gray-400'}">
              {characterCount}/{maxCharacters}
            </div>
          </div>
          {#if characterCount > 0 && characterCount < minCharacters}
            <p class="mt-2 text-sm text-gray-500">
              Please provide at least {minCharacters} characters for better AI understanding.
            </p>
          {/if}
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row justify-between items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
          <div class="flex items-center space-x-3">
            <a href="/" class="btn-outline text-center">Cancel</a>
            {#if isDraftsaved}
              <button type="button" on:click={startOver} class="text-sm text-gray-500 hover:text-gray-700">
                Clear Draft
              </button>
            {/if}
          </div>
          <button
            type="button"
            on:click={processWithAI}
            disabled={loading || !isValidInput}
            class="btn-primary {loading || !isValidInput ? 'opacity-50 cursor-not-allowed' : ''}"
          >
            {#if loading}
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing with AI...
            {:else}
              Process with AI →
            {/if}
          </button>
        </div>
      </div>
    </div>

    <!-- Example Prompts -->
    <div class="mt-6 sm:mt-8">
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
    <div class="mt-6 sm:mt-8 bg-gray-50 rounded-monitors p-4 sm:p-6">
      <h4 class="font-medium text-gray-900 mb-3">Tips for creating great monitors:</h4>
      <div class="grid gap-3 sm:grid-cols-2">
        <ul class="text-sm text-gray-600 space-y-2">
          <li class="flex items-start">
            <span class="text-primary mr-2">•</span>
            <span>Be specific about what you want to track (stocks, weather, prices, etc.)</span>
          </li>
          <li class="flex items-start">
            <span class="text-primary mr-2">•</span>
            <span>Include trigger conditions (when price drops below X, when it rains for X days)</span>
          </li>
        </ul>
        <ul class="text-sm text-gray-600 space-y-2">
          <li class="flex items-start">
            <span class="text-primary mr-2">•</span>
            <span>Use natural language - write like you're talking to a friend</span>
          </li>
          <li class="flex items-start">
            <span class="text-primary mr-2">•</span>
            <span>Include locations when relevant (weather, gas prices, local events)</span>
          </li>
        </ul>
      </div>
    </div>
  {/if}

  <!-- Step 2: AI Processing -->
  {#if step === 2}
    <div class="bg-white shadow-monitors rounded-monitors overflow-hidden">
      <div class="p-6 sm:p-8 text-center">
        <div class="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6">
          <svg class="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Processing your request...</h2>
        <p class="text-gray-600 mb-6">Our AI is analyzing your description to understand what you want to monitor.</p>
        
        <div class="max-w-md mx-auto bg-gray-50 rounded-monitors p-4">
          <p class="text-sm text-gray-700 font-medium mb-2">Your request:</p>
          <p class="text-sm text-gray-600 italic">"{prompt}"</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Step 3: Configuration -->
  {#if step === 3 && aiInterpretation}
    <div class="space-y-6">
      <!-- AI Interpretation Display -->
      <div class="bg-white shadow-monitors rounded-monitors overflow-hidden">
        <div class="p-4 sm:p-6">
          <div class="flex items-start">
            <div class="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-4 flex-1">
              <h3 class="text-lg font-medium text-gray-900 mb-3">AI Understanding Complete!</h3>
              
              <div class="grid gap-4 sm:grid-cols-2 mb-4">
                <div class="bg-gray-50 rounded-monitors p-3">
                  <p class="text-sm font-medium text-gray-700">Monitor Type</p>
                  <p class="text-sm text-gray-600 capitalize">{aiInterpretation.type} Monitor</p>
                </div>
                <div class="bg-gray-50 rounded-monitors p-3">
                  <p class="text-sm font-medium text-gray-700">Category</p>
                  <p class="text-sm text-gray-600">{aiInterpretation.category}</p>
                </div>
                <div class="bg-gray-50 rounded-monitors p-3">
                  <p class="text-sm font-medium text-gray-700">Confidence</p>
                  <p class="text-sm text-gray-600">{Math.round(aiInterpretation.confidence * 100)}%</p>
                </div>
                <div class="bg-gray-50 rounded-monitors p-3">
                  <p class="text-sm font-medium text-gray-700">Data Source</p>
                  <p class="text-sm text-gray-600">{aiInterpretation.dataSource}</p>
                </div>
              </div>

              {#if aiInterpretation.extractedValues.length > 0}
                <div class="mb-4">
                  <p class="text-sm font-medium text-gray-700 mb-2">Extracted Values</p>
                  <div class="flex flex-wrap gap-2">
                    {#each aiInterpretation.extractedValues as value}
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {value}
                      </span>
                    {/each}
                  </div>
                </div>
              {/if}

              {#if aiInterpretation.triggers.length > 0}
                <div class="mb-4">
                  <p class="text-sm font-medium text-gray-700 mb-2">Trigger Conditions</p>
                  <ul class="space-y-1">
                    {#each aiInterpretation.triggers as trigger}
                      <li class="text-sm text-gray-600 flex items-center">
                        <span class="text-green-500 mr-2">✓</span>
                        {trigger}
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- Configuration Form -->
      <div class="bg-white shadow-monitors rounded-monitors overflow-hidden">
        <div class="p-4 sm:p-6 space-y-6">
          <h3 class="text-lg font-medium text-gray-900">Configure Your Monitor</h3>

          <!-- Monitor Name -->
          <div>
            <label for="monitor-name" class="form-label">
              Monitor Name <span class="text-red-500">*</span>
            </label>
            <input
              id="monitor-name"
              type="text"
              bind:value={monitorName}
              placeholder="Give your monitor a memorable name"
              class="form-input"
              required
            />
          </div>

          <div class="grid gap-6 sm:grid-cols-2">
            <!-- Check Frequency -->
            <div>
              <label for="frequency" class="form-label">
                Check Frequency
              </label>
              <select
                id="frequency"
                bind:value={frequency}
                class="form-input"
              >
                {#each frequencyOptions as option}
                  <option value={option.value} disabled={option.disabled}>
                    {option.label}
                  </option>
                {/each}
              </select>
            </div>

            <!-- Notification Method -->
            <div>
              <p class="form-label">
                Notification Method
              </p>
              <div class="space-y-2">
                {#each notificationOptions as option}
                  <label class="flex items-center">
                    <input
                      type="radio"
                      bind:group={notificationMethod}
                      value={option.value}
                      disabled={option.disabled}
                      class="sr-only"
                    />
                    <div class="flex items-center w-full p-3 border rounded-monitors cursor-pointer transition-colors
                      {notificationMethod === option.value ? 'border-primary bg-primary-50' : 'border-gray-200 hover:border-gray-300'}
                      {option.disabled ? 'opacity-50 cursor-not-allowed' : ''}">
                      <span class="text-lg mr-3">{option.icon}</span>
                      <span class="text-sm font-medium {notificationMethod === option.value ? 'text-primary' : 'text-gray-700'}">
                        {option.label}
                      </span>
                    </div>
                  </label>
                {/each}
              </div>
            </div>
          </div>

          <!-- Monitor Status -->
          <div>
            <label class="flex items-center">
              <input
                type="checkbox"
                bind:checked={isActive}
                class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span class="ml-2 text-sm text-gray-700">Start monitoring immediately</span>
            </label>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row justify-between items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              on:click={goBack}
              class="btn-outline text-center"
            >
              ← Back to Edit
            </button>
            <button
              type="button"
              on:click={createMonitor}
              disabled={loading || !monitorName.trim()}
              class="btn-primary {loading || !monitorName.trim() ? 'opacity-50 cursor-not-allowed' : ''}"
            >
              {#if loading}
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Monitor...
              {:else}
                Create Monitor
              {/if}
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Step 4: Success -->
  {#if step === 4}
    <div class="bg-white shadow-monitors rounded-monitors overflow-hidden">
      <div class="p-6 sm:p-8 text-center">
        <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg class="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Monitor Created Successfully! 🎉</h2>
        <p class="text-gray-600 mb-6">
          Your monitor <strong>"{monitorName}"</strong> has been created and is now active.
          {#if isActive}
            It will start checking for updates based on your selected frequency.
          {:else}
            You can activate it from your dashboard when you're ready.
          {/if}
        </p>
        
        <div class="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <a href="/" class="btn-primary">
            View Dashboard
          </a>
          <button
            type="button"
            on:click={startOver}
            class="btn-outline"
          >
            Create Another Monitor
          </button>
        </div>

        <p class="text-sm text-gray-500 mt-4">
          Redirecting to dashboard in 3 seconds...
        </p>
      </div>
    </div>
  {/if}
</div>