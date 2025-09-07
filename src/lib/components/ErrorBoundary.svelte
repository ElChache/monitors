<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  
  export let fallback: string | null = null;
  export let showRetry: boolean = true;
  export let maxRetries: number = 3;
  export let showReport: boolean = true;
  
  const dispatch = createEventDispatcher<{
    error: { error: Error; retry: () => void };
  }>();
  
  let error: Error | null = null;
  let retryCount = 0;
  let errorId = '';
  
  // Error handling
  function handleError(err: Error) {
    error = err;
    errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.error('ErrorBoundary caught error:', err);
    
    // Report to error tracking service
    if (browser && showReport) {
      reportError(err, errorId);
    }
    
    dispatch('error', { error: err, retry: handleRetry });
  }
  
  // Retry mechanism
  function handleRetry() {
    if (retryCount < maxRetries) {
      retryCount++;
      error = null;
      
      // Small delay before retry
      setTimeout(() => {
        // Component will re-render and try again
      }, 500);
    }
  }
  
  // Report error to external service (mock for now)
  async function reportError(err: Error, id: string) {
    try {
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorId: id,
          message: err.message,
          stack: err.stack,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        })
      });
    } catch (reportErr) {
      console.warn('Failed to report error:', reportErr);
    }
  }
  
  // Handle unhandled promise rejections
  if (browser) {
    window.addEventListener('unhandledrejection', (event) => {
      handleError(new Error(`Unhandled promise rejection: ${event.reason}`));
    });
  }
</script>

{#if error}
  <div class="error-boundary-container bg-red-50 border border-red-200 rounded-lg p-6 m-4" role="alert" aria-live="assertive">
    {#if fallback}
      {@html fallback}
    {:else}
      <!-- Default error UI -->
      <div class="flex items-center mb-4">
        <svg class="w-6 h-6 text-red-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="text-lg font-medium text-red-900">Something went wrong</h3>
      </div>
      
      <div class="mb-4">
        <p class="text-sm text-red-700 mb-2">
          We encountered an unexpected error. This has been reported to our team.
        </p>
        
        <!-- Error details (collapsible) -->
        <details class="mb-4">
          <summary class="cursor-pointer text-sm text-red-600 hover:text-red-800">
            Show error details
          </summary>
          <div class="mt-2 p-3 bg-red-100 rounded border text-xs font-mono text-red-800 whitespace-pre-wrap max-h-32 overflow-y-auto">
            {error.message}
            {#if error.stack}
              
{error.stack}
            {/if}
          </div>
          <p class="text-xs text-red-500 mt-1">Error ID: {errorId}</p>
        </details>
      </div>
      
      <!-- Action buttons -->
      <div class="flex flex-wrap gap-3">
        {#if showRetry && retryCount < maxRetries}
          <button
            on:click={handleRetry}
            class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            aria-describedby="retry-description"
          >
            Try Again ({maxRetries - retryCount} left)
          </button>
          <div id="retry-description" class="sr-only">
            Retry the operation that failed. {maxRetries - retryCount} attempts remaining.
          </div>
        {/if}
        
        <button
          on:click={() => window.location.reload()}
          class="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Refresh Page
        </button>
        
        <a
          href="/"
          class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary no-underline"
        >
          Go to Home
        </a>
        
        {#if showReport}
          <a
            href={`mailto:support@yourapp.com?subject=Error Report ${errorId}&body=Error ID: ${errorId}%0AError: ${encodeURIComponent(error.message)}%0APage: ${encodeURIComponent(window.location.href)}`}
            class="px-4 py-2 text-red-700 border border-red-300 text-sm font-medium rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Report Bug
          </a>
        {/if}
      </div>
      
      {#if retryCount >= maxRetries}
        <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p class="text-sm text-yellow-700">
            Maximum retry attempts reached. Please refresh the page or contact support if the problem persists.
          </p>
        </div>
      {/if}
    {/if}
  </div>
{:else}
  <slot {handleError} />
{/if}

<style>
  .error-boundary-container {
    max-width: 100%;
    word-wrap: break-word;
  }
  
  @media (max-width: 640px) {
    .error-boundary-container {
      margin: 1rem;
      padding: 1rem;
    }
  }
</style>