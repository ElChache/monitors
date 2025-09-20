<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Toast from './Toast.svelte';

  export interface ToastNotification {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    persistent?: boolean;
  }

  export let toasts: ToastNotification[] = [];

  const dispatch = createEventDispatcher();

  function removeToast(toastId: string): void {
    toasts = toasts.filter((toast) => toast.id !== toastId);
    dispatch('remove', toastId);
  }
</script>

<div class="toast-container">
  {#each toasts as toast (toast.id)}
    <Toast
      message={toast.message}
      type={toast.type}
      duration={toast.duration}
      persistent={toast.persistent}
      on:close={(): void => removeToast(toast.id)}
    />
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 1000;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
  }

  @media (max-width: 640px) {
    .toast-container {
      left: 0;
      right: 0;
      padding: 1rem;
    }
  }
</style>
