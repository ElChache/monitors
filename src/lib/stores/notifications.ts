import { writable } from 'svelte/store';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
  progress?: boolean;
  progressValue?: number; // 0-100
}

interface NotificationStore {
  toasts: Toast[];
}

function createNotificationStore() {
  const { subscribe, set, update } = writable<NotificationStore>({
    toasts: []
  });

  return {
    subscribe,
    
    // Add a toast notification
    addToast: (toast: Omit<Toast, 'id'>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newToast: Toast = {
        id,
        duration: 5000, // 5 seconds default
        persistent: false,
        ...toast
      };

      update(store => ({
        ...store,
        toasts: [...store.toasts, newToast]
      }));

      // Auto-dismiss non-persistent toasts
      if (!newToast.persistent && newToast.duration! > 0) {
        setTimeout(() => {
          removeToast(id);
        }, newToast.duration);
      }

      return id;
    },

    // Remove a toast by ID
    removeToast: (id: string) => {
      update(store => ({
        ...store,
        toasts: store.toasts.filter(toast => toast.id !== id)
      }));
    },

    // Update toast progress
    updateProgress: (id: string, progress: number) => {
      update(store => ({
        ...store,
        toasts: store.toasts.map(toast => 
          toast.id === id 
            ? { ...toast, progressValue: Math.min(100, Math.max(0, progress)) }
            : toast
        )
      }));
    },

    // Clear all toasts
    clearAll: () => {
      set({ toasts: [] });
    },

    // Helper methods for common toast types
    success: (title: string, message?: string, options?: Partial<Toast>) => {
      return addToast({ type: 'success', title, message, ...options });
    },

    error: (title: string, message?: string, options?: Partial<Toast>) => {
      return addToast({ 
        type: 'error', 
        title, 
        message, 
        duration: 8000, // Errors show longer
        ...options 
      });
    },

    warning: (title: string, message?: string, options?: Partial<Toast>) => {
      return addToast({ 
        type: 'warning', 
        title, 
        message, 
        duration: 6000, 
        ...options 
      });
    },

    info: (title: string, message?: string, options?: Partial<Toast>) => {
      return addToast({ type: 'info', title, message, ...options });
    },

    // Network-specific helpers
    networkError: (error: Error | string) => {
      const message = error instanceof Error ? error.message : error;
      return addToast({
        type: 'error',
        title: 'Network Error',
        message: `Failed to connect: ${message}`,
        duration: 10000,
        action: {
          label: 'Retry',
          handler: () => window.location.reload()
        }
      });
    },

    // Form validation helper
    formError: (field: string, message: string) => {
      return addToast({
        type: 'error',
        title: `${field} Error`,
        message,
        duration: 6000
      });
    },

    // Rate limit helper
    rateLimited: (retryAfter?: number) => {
      const message = retryAfter 
        ? `Please wait ${retryAfter} seconds before trying again`
        : 'You are making requests too quickly';
      
      return addToast({
        type: 'warning',
        title: 'Rate Limited',
        message,
        duration: 8000
      });
    }
  };

  function removeToast(id: string) {
    update(store => ({
      ...store,
      toasts: store.toasts.filter(toast => toast.id !== id)
    }));
  }

  function addToast(toast: Omit<Toast, 'id'>) {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      id,
      duration: 5000,
      persistent: false,
      ...toast
    };

    update(store => ({
      ...store,
      toasts: [...store.toasts, newToast]
    }));

    if (!newToast.persistent && newToast.duration! > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }
}

export const notifications = createNotificationStore();