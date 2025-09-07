<script lang="ts">
  import { notifications } from '$lib/stores/notifications';
  import Toast from './Toast.svelte';
  
  export let position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center' = 'top-right';
  export let maxToasts: number = 5;
  
  // Position mappings
  const positionMap = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'top-center': 'top-0 left-1/2 transform -translate-x-1/2',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0', 
    'bottom-center': 'bottom-0 left-1/2 transform -translate-x-1/2'
  };
  
  // Limit the number of visible toasts
  $: visibleToasts = $notifications.toasts.slice(-maxToasts);
  
  // Stack direction based on position
  $: stackFromTop = position.startsWith('top');
</script>

<!-- Toast Container -->
<div 
  class="toast-container fixed z-50 p-6 pointer-events-none {positionMap[position]}"
  role="region"
  aria-label="Notifications"
  aria-live="polite"
>
  <div class="flex flex-col {stackFromTop ? '' : 'flex-col-reverse'} space-y-4">
    {#each visibleToasts as toast (toast.id)}
      <div class="pointer-events-auto">
        <Toast {toast} />
      </div>
    {/each}
  </div>
</div>

<style>
  .toast-container {
    /* Ensure toasts don't interfere with other UI elements */
    max-width: 100vw;
    max-height: 100vh;
    overflow: hidden;
  }
  
  /* Mobile optimization */
  @media (max-width: 640px) {
    .toast-container {
      padding: 1rem;
      width: 100%;
      left: 0 !important;
      right: 0 !important;
      transform: none !important;
    }
    
    /* Stack toasts more efficiently on mobile */
    .toast-container .flex {
      max-height: calc(100vh - 2rem);
      overflow-y: auto;
    }
  }
  
  /* Safe area support for mobile devices */
  @supports (padding: max(0px)) {
    .toast-container {
      padding-top: max(1.5rem, env(safe-area-inset-top));
      padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
      padding-left: max(1.5rem, env(safe-area-inset-left));
      padding-right: max(1.5rem, env(safe-area-inset-right));
    }
  }
</style>