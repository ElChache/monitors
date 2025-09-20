<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';

  export let message: string;
  export let type: 'success' | 'error' | 'warning' | 'info' = 'info';
  export let duration: number = 5000;
  export let persistent: boolean = false;

  const dispatch = createEventDispatcher();

  let visible = false;
  let timeoutId: number | null = null;

  onMount(() => {
    visible = true;

    if (!persistent) {
      timeoutId = window.setTimeout(() => {
        close();
      }, duration);
    }

    return (): void => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  });

  function close(): void {
    visible = false;
    setTimeout(() => {
      dispatch('close');
    }, 300); // Allow animation to complete
  }

  function getIcon(): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  }
</script>

<div class="toast toast-{type}" class:visible role="alert" aria-live="polite">
  <div class="toast-content">
    <span class="toast-icon">{getIcon()}</span>
    <span class="toast-message">{message}</span>
    <button class="toast-close" on:click={close} aria-label="Close notification"> × </button>
  </div>
</div>

<style>
  .toast {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 1000;
    max-width: 400px;
    min-width: 300px;
    border-radius: 0.5rem;
    box-shadow:
      0 10px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
    pointer-events: none;
  }

  .toast.visible {
    transform: translateX(0);
    opacity: 1;
    pointer-events: auto;
  }

  .toast-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: white;
    border-radius: 0.5rem;
    border-left: 4px solid;
  }

  .toast-success .toast-content {
    border-left-color: #10b981;
    background: #f0fdf4;
  }

  .toast-error .toast-content {
    border-left-color: #ef4444;
    background: #fef2f2;
  }

  .toast-warning .toast-content {
    border-left-color: #f59e0b;
    background: #fffbeb;
  }

  .toast-info .toast-content {
    border-left-color: #3b82f6;
    background: #eff6ff;
  }

  .toast-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    font-weight: bold;
    font-size: 0.875rem;
    flex-shrink: 0;
  }

  .toast-success .toast-icon {
    background: #10b981;
    color: white;
  }

  .toast-error .toast-icon {
    background: #ef4444;
    color: white;
  }

  .toast-warning .toast-icon {
    background: #f59e0b;
    color: white;
  }

  .toast-info .toast-icon {
    background: #3b82f6;
    color: white;
  }

  .toast-message {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    line-height: 1.4;
  }

  .toast-close {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    font-size: 1.25rem;
    line-height: 1;
    padding: 0;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .toast-close:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #374151;
  }

  @media (max-width: 640px) {
    .toast {
      left: 1rem;
      right: 1rem;
      max-width: none;
      min-width: unset;
    }
  }
</style>
