import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface MonitorDraft {
  id?: string;
  prompt: string;
  timestamp: number;
  isAutoSaved: boolean;
  hasUnsavedChanges: boolean;
}

export interface DraftStore {
  current: MonitorDraft | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: number | null;
  errorMessage: string | null;
}

const defaultState: DraftStore = {
  current: null,
  saveStatus: 'idle',
  lastSaved: null,
  errorMessage: null
};

// Create the main draft store
function createDraftStore() {
  const { subscribe, set, update }: Writable<DraftStore> = writable(defaultState);
  
  let autoSaveTimeout: NodeJS.Timeout | null = null;
  let currentDraft: MonitorDraft | null = null;

  // Auto-save interval (30 seconds)
  const AUTO_SAVE_INTERVAL = 30000;

  const saveToLocal = (draft: MonitorDraft) => {
    if (!browser) return;
    try {
      localStorage.setItem('monitor_draft_current', JSON.stringify(draft));
    } catch (error) {
      console.warn('Failed to save draft to localStorage:', error);
    }
  };

  const loadFromLocal = (): MonitorDraft | null => {
    if (!browser) return null;
    try {
      const saved = localStorage.getItem('monitor_draft_current');
      if (saved) {
        const draft = JSON.parse(saved);
        // Only restore if it's less than 24 hours old
        if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
          return draft;
        } else {
          localStorage.removeItem('monitor_draft_current');
        }
      }
    } catch (error) {
      console.warn('Failed to load draft from localStorage:', error);
    }
    return null;
  };

  const saveToServer = async (draft: MonitorDraft): Promise<boolean> => {
    try {
      const response = await fetch('/api/monitors/drafts/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: draft.prompt,
          timestamp: draft.timestamp
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.success === true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save draft to server:', error);
      return false;
    }
  };

  const scheduleAutoSave = (draft: MonitorDraft) => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    autoSaveTimeout = setTimeout(async () => {
      if (draft.hasUnsavedChanges) {
        await saveDraft(draft);
      }
    }, AUTO_SAVE_INTERVAL);
  };

  const saveDraft = async (draft: MonitorDraft) => {
    update(state => ({ ...state, saveStatus: 'saving', errorMessage: null }));

    // Always save locally first
    saveToLocal(draft);

    // Try to save to server
    const serverSaveSuccess = await saveToServer(draft);
    
    if (serverSaveSuccess) {
      update(state => ({
        ...state,
        saveStatus: 'saved',
        lastSaved: Date.now(),
        current: draft ? { ...draft, hasUnsavedChanges: false, isAutoSaved: true } : null
      }));
    } else {
      // If server save fails, still mark as locally saved
      update(state => ({
        ...state,
        saveStatus: 'error',
        errorMessage: 'Auto-save to server failed, but saved locally',
        current: draft ? { ...draft, hasUnsavedChanges: false, isAutoSaved: true } : null
      }));
    }

    currentDraft = draft;
  };

  return {
    subscribe,
    
    // Initialize with any existing draft
    initialize: () => {
      const existingDraft = loadFromLocal();
      if (existingDraft) {
        update(state => ({
          ...state,
          current: existingDraft,
          lastSaved: existingDraft.timestamp
        }));
        currentDraft = existingDraft;
      }
    },

    // Update the current draft
    updateDraft: (prompt: string) => {
      const now = Date.now();
      const draft: MonitorDraft = {
        prompt,
        timestamp: now,
        isAutoSaved: false,
        hasUnsavedChanges: true
      };

      update(state => ({
        ...state,
        current: draft,
        saveStatus: state.current?.prompt === prompt ? state.saveStatus : 'idle'
      }));

      currentDraft = draft;
      scheduleAutoSave(draft);
    },

    // Manually save draft
    save: async () => {
      if (currentDraft) {
        await saveDraft(currentDraft);
      }
    },

    // Clear the current draft
    clear: () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = null;
      }
      
      if (browser) {
        localStorage.removeItem('monitor_draft_current');
      }
      
      update(() => defaultState);
      currentDraft = null;
    },

    // Restore from a specific draft
    restore: (draft: MonitorDraft) => {
      update(state => ({
        ...state,
        current: draft,
        saveStatus: 'idle',
        lastSaved: draft.timestamp
      }));
      currentDraft = draft;
    },

    // Get available drafts from server
    loadServerDrafts: async () => {
      try {
        const response = await fetch('/api/monitors/drafts');
        if (response.ok) {
          const result = await response.json();
          return result.drafts || [];
        }
      } catch (error) {
        console.error('Failed to load server drafts:', error);
      }
      return [];
    },

    // Delete a draft
    deleteDraft: async (draftId: string) => {
      try {
        const response = await fetch('/api/monitors/drafts', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: draftId })
        });
        return response.ok;
      } catch (error) {
        console.error('Failed to delete draft:', error);
        return false;
      }
    }
  };
}

export const draftStore = createDraftStore();

// Utility function for formatting timestamps
export const formatDraftTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) {
    return 'Just now';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} minutes ago`;
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} hours ago`;
  } else {
    return new Date(timestamp).toLocaleDateString();
  }
};