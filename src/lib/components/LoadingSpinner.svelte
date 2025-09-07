<script lang="ts">
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let color: string = 'primary';
  export let overlay: boolean = false;
  export let fullscreen: boolean = false;
  export let text: string = '';
  export let showProgress: boolean = false;
  export let progress: number = 0; // 0-100
  
  // Size mappings
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  
  // Color mappings
  const colorMap = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
    white: 'text-white',
    gray: 'text-gray-500'
  };
  
  // Text size mappings
  const textSizeMap = {
    sm: 'text-xs',
    md: 'text-sm', 
    lg: 'text-base',
    xl: 'text-lg'
  };
</script>

<!-- Wrapper with optional overlay -->
<div 
  class="loading-spinner-wrapper {fullscreen ? 'fixed inset-0 z-50' : ''} {overlay ? 'absolute inset-0' : ''}" 
  class:overlay
  class:fullscreen
  role="status"
  aria-live="polite"
  aria-label={text || 'Loading'}
>
  {#if overlay || fullscreen}
    <div class="absolute inset-0 bg-black bg-opacity-20 backdrop-blur-sm"></div>
  {/if}
  
  <div class="loading-content flex flex-col items-center justify-center {fullscreen || overlay ? 'relative z-10 h-full' : ''} {overlay ? 'p-8' : ''}">
    <!-- Spinner SVG -->
    <svg 
      class="animate-spin {sizeMap[size]} {colorMap[color] || `text-${color}`}" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle 
        class="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        stroke-width="4"
      />
      <path 
        class="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    
    <!-- Loading text -->
    {#if text}
      <p class="mt-3 {textSizeMap[size]} {colorMap[color] || `text-${color}`} font-medium">
        {text}
      </p>
    {/if}
    
    <!-- Progress bar -->
    {#if showProgress}
      <div class="mt-4 w-full max-w-xs">
        <div class="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
            style="width: {progress}%"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Loading progress: {progress}%"
          />
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Accessible hidden text for screen readers -->
<span class="sr-only">
  {text || 'Loading content'}
  {#if showProgress}
    {progress}% complete
  {/if}
</span>

<style>
  .loading-spinner-wrapper {
    min-height: var(--min-height, auto);
  }
  
  .loading-spinner-wrapper.overlay {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .loading-spinner-wrapper.fullscreen {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.1);
  }
  
  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    .animate-spin {
      animation: none;
    }
    
    /* Alternative loading indicator for reduced motion */
    .animate-spin::after {
      content: '⋯';
      animation: pulse 1.5s ease-in-out infinite;
      display: inline-block;
      color: currentColor;
    }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  
  /* Mobile optimization */
  @media (max-width: 640px) {
    .loading-content {
      padding: 1rem;
    }
  }
</style>