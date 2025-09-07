<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let prompt = '';
  export let error = '';
  
  let suggestions: any[] = [];
  let suggestionsLoading = false;
  let debounceTimeout: NodeJS.Timeout | null = null;
  
  // AI suggestion types
  interface AISuggestion {
    id: string;
    type: 'improvement' | 'clarity' | 'specificity' | 'alternative';
    title: string;
    description: string;
    suggested_text: string;
    confidence: number;
    reasoning: string;
  }
  
  // Debounced AI suggestions fetch
  const fetchSuggestions = async (text: string) => {
    if (text.trim().length < 20) {
      suggestions = [];
      return;
    }
    
    suggestionsLoading = true;
    error = '';
    
    try {
      // Mock API call with realistic behavior
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: text,
          context: 'monitor_creation'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        suggestions = data.suggestions || [];
      } else {
        // Fallback to mock suggestions for development
        await new Promise(resolve => setTimeout(resolve, 800));
        suggestions = generateMockSuggestions(text);
      }
    } catch (err) {
      // Fallback to mock suggestions
      await new Promise(resolve => setTimeout(resolve, 800));
      suggestions = generateMockSuggestions(text);
    } finally {
      suggestionsLoading = false;
    }
  };
  
  // Generate mock suggestions based on prompt analysis
  const generateMockSuggestions = (text: string): AISuggestion[] => {
    const mockSuggestions: AISuggestion[] = [];
    const lowerText = text.toLowerCase();
    
    // Specificity suggestions
    if (!lowerText.includes('when') && !lowerText.includes('if')) {
      mockSuggestions.push({
        id: 'spec_1',
        type: 'specificity',
        title: 'Add trigger condition',
        description: 'Consider adding a specific condition to trigger your monitor',
        suggested_text: `${text} when [condition]`,
        confidence: 0.85,
        reasoning: 'Monitors work better with specific trigger conditions'
      });
    }
    
    // Stock monitoring improvements
    if (lowerText.includes('stock') || lowerText.includes('price') || lowerText.includes('$')) {
      mockSuggestions.push({
        id: 'stock_1',
        type: 'improvement',
        title: 'Specify price threshold',
        description: 'Add a specific price point for better monitoring',
        suggested_text: text.includes('$') ? text : `${text} below $[amount]`,
        confidence: 0.92,
        reasoning: 'Stock monitors need specific price thresholds'
      });
    }
    
    // Weather suggestions
    if (lowerText.includes('weather') || lowerText.includes('rain') || lowerText.includes('snow')) {
      mockSuggestions.push({
        id: 'weather_1',
        type: 'clarity',
        title: 'Add location',
        description: 'Weather monitors work better with specific locations',
        suggested_text: lowerText.includes(' in ') ? text : `${text} in [city]`,
        confidence: 0.88,
        reasoning: 'Weather data requires location specificity'
      });
    }
    
    // General clarity improvements
    if (text.length > 100) {
      mockSuggestions.push({
        id: 'clarity_1',
        type: 'clarity',
        title: 'Simplify description',
        description: 'Consider breaking this into multiple monitors for better accuracy',
        suggested_text: text.split('.')[0] || text.substring(0, 80) + '...',
        confidence: 0.75,
        reasoning: 'Simpler prompts often yield better results'
      });
    }
    
    return mockSuggestions.slice(0, 3); // Limit to 3 suggestions
  };
  
  // Reactive suggestion fetching with debounce
  $: {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    debounceTimeout = setTimeout(() => {
      if (prompt.trim().length >= 20) {
        fetchSuggestions(prompt);
      } else {
        suggestions = [];
      }
    }, 500);
  }
  
  const applySuggestion = (suggestion: AISuggestion) => {
    dispatch('apply-suggestion', {
      text: suggestion.suggested_text,
      type: suggestion.type
    });
  };
  
  const dismissSuggestion = (suggestionId: string) => {
    suggestions = suggestions.filter(s => s.id !== suggestionId);
  };
  
  // Cleanup timeout on component destroy
  import { onDestroy } from 'svelte';
  onDestroy(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
  });
</script>

{#if suggestions.length > 0 || suggestionsLoading}
  <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center space-x-2">
        <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
        </svg>
        <h4 class="text-sm font-medium text-blue-900">
          {suggestionsLoading ? 'Getting suggestions...' : 'AI Suggestions'}
        </h4>
      </div>
      
      {#if suggestionsLoading}
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      {/if}
    </div>
    
    {#if suggestionsLoading}
      <div class="space-y-2">
        <div class="h-4 bg-blue-100 rounded animate-pulse"></div>
        <div class="h-4 bg-blue-100 rounded animate-pulse w-3/4"></div>
      </div>
    {:else}
      <div class="space-y-3">
        {#each suggestions as suggestion (suggestion.id)}
          <div class="bg-white border border-blue-200 rounded-lg p-3 relative group">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-1">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {suggestion.type}
                  </span>
                  <span class="text-xs text-gray-500">
                    {Math.round(suggestion.confidence * 100)}% confidence
                  </span>
                </div>
                
                <h5 class="text-sm font-medium text-gray-900 mb-1">
                  {suggestion.title}
                </h5>
                
                <p class="text-xs text-gray-600 mb-2">
                  {suggestion.description}
                </p>
                
                <div class="bg-gray-50 rounded p-2 text-sm text-gray-700 font-mono text-xs">
                  "{suggestion.suggested_text}"
                </div>
                
                <p class="text-xs text-gray-500 mt-2 italic">
                  💡 {suggestion.reasoning}
                </p>
              </div>
              
              <button
                type="button"
                on:click={() => dismissSuggestion(suggestion.id)}
                class="ml-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Dismiss suggestion"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
              </button>
            </div>
            
            <div class="flex justify-end space-x-2 mt-3">
              <button
                type="button"
                on:click={() => applySuggestion(suggestion)}
                class="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
              >
                Apply suggestion
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  /* Enhanced accessibility for mobile */
  @media (max-width: 640px) {
    button {
      min-height: 44px;
      touch-action: manipulation;
    }
  }
</style>