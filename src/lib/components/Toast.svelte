<script lang="ts">
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { notifications, type Toast } from '$lib/stores/notifications';
  
  export let toast: Toast;
  
  let progressInterval: NodeJS.Timeout | null = null;
  let timeLeft = toast.duration || 5000;
  
  // Progress animation for auto-dismiss
  $: if (!toast.persistent && toast.duration && toast.duration > 0) {
    startProgressAnimation();
  }
  
  function startProgressAnimation() {
    const startTime = Date.now();
    const duration = toast.duration || 5000;
    
    progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      timeLeft = remaining;
      
      if (remaining <= 0) {
        clearInterval(progressInterval!);
      }
    }, 100);
  }
  
  function handleClose() {
    notifications.removeToast(toast.id);
    if (progressInterval) {
      clearInterval(progressInterval);
    }
  }
  
  function handleAction() {
    if (toast.action) {
      toast.action.handler();
      handleClose();
    }
  }
  
  // Icon mappings
  const iconMap = {
    success: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />`,
    error: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />`,
    warning: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />`,
    info: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`
  };
  
  // Color mappings
  const colorMap = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-400',
      title: 'text-green-800',
      message: 'text-green-700',
      button: 'text-green-500 hover:text-green-600',
      progress: 'bg-green-500'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200', 
      icon: 'text-red-400',
      title: 'text-red-800',
      message: 'text-red-700',
      button: 'text-red-500 hover:text-red-600',
      progress: 'bg-red-500'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-400',
      title: 'text-yellow-800', 
      message: 'text-yellow-700',
      button: 'text-yellow-500 hover:text-yellow-600',
      progress: 'bg-yellow-500'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-400',
      title: 'text-blue-800',
      message: 'text-blue-700',
      button: 'text-blue-500 hover:text-blue-600',
      progress: 'bg-blue-500'
    }
  };
  
  $: colors = colorMap[toast.type];
  $: progressPercent = toast.duration ? ((toast.duration - timeLeft) / toast.duration) * 100 : 0;
</script>

<div
  transition:slide={{ duration: 300, easing: quintOut }}
  class="toast-container max-w-sm w-full {colors.bg} {colors.border} border rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden"
  role="alert"
  aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
  aria-atomic="true"
>
  <div class="p-4">
    <div class="flex items-start">
      <!-- Icon -->
      <div class="flex-shrink-0">
        <svg class="h-6 w-6 {colors.icon}" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          {@html iconMap[toast.type]}
        </svg>
      </div>
      
      <!-- Content -->
      <div class="ml-3 w-0 flex-1 pt-0.5">
        <p class="text-sm font-medium {colors.title}">
          {toast.title}
        </p>
        {#if toast.message}
          <p class="mt-1 text-sm {colors.message}">
            {toast.message}
          </p>
        {/if}
        
        <!-- Custom progress bar if enabled -->
        {#if toast.progress && toast.progressValue !== undefined}
          <div class="mt-3">
            <div class="flex items-center justify-between text-xs {colors.message} mb-1">
              <span>Progress</span>
              <span>{toast.progressValue}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="h-2 rounded-full {colors.progress} transition-all duration-300"
                style="width: {toast.progressValue}%"
                role="progressbar"
                aria-valuenow={toast.progressValue}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label="Progress: {toast.progressValue}%"
              />
            </div>
          </div>
        {/if}
      </div>
      
      <!-- Action button -->
      {#if toast.action}
        <div class="ml-4 flex-shrink-0 flex">
          <button
            on:click={handleAction}
            class="rounded-md inline-flex text-sm font-medium {colors.button} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-{toast.type}-50 focus:ring-{toast.type}-600"
          >
            {toast.action.label}
          </button>
        </div>
      {/if}
      
      <!-- Close button -->
      <div class="ml-4 flex-shrink-0 flex">
        <button
          on:click={handleClose}
          class="rounded-md inline-flex {colors.button} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-{toast.type}-50 focus:ring-{toast.type}-600"
          aria-label="Close notification"
        >
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
  
  <!-- Auto-dismiss progress bar -->
  {#if !toast.persistent && toast.duration && toast.duration > 0}
    <div class="h-1 bg-gray-200">
      <div 
        class="h-full {colors.progress} transition-all duration-100 ease-linear"
        style="width: {progressPercent}%"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Auto-dismiss progress"
      />
    </div>
  {/if}
</div>

<style>
  .toast-container {
    /* Ensure proper stacking and animations */
    transform-origin: top right;
  }
  
  /* Mobile optimization */
  @media (max-width: 640px) {
    .toast-container {
      max-width: calc(100vw - 2rem);
      margin: 0 1rem;
    }
  }
</style>