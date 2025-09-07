<script lang="ts">
  import { browser } from '$app/environment';
  
  let loading = false;
  let error = '';
  let success = '';
  
  // User settings form data
  let settings = {
    email: '',
    name: '',
    notifications: {
      email: true,
      push: false,
      browser: false,
      sms: false,
      weeklyDigest: false,
      securityAlerts: true,
      systemUpdates: true,
      marketingUpdates: false,
      frequency: 'immediate'
    },
    preferences: {
      timezone: 'UTC',
      theme: 'light'
    },
    sessions: {
      activeSessions: [], // To be populated from API
      lastActiveTime: null
    },
    export: {
      lastExportDate: null
    }
  };
  
  // Load current user settings (mock for now)
  async function loadSettings() {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const user = await response.json();
        settings.email = user.email || '';
        settings.name = user.name || '';
      }
    } catch (err) {
      console.error('Failed to load user settings:', err);
    }
  }
  
  // Save settings
  async function saveSettings() {
    loading = true;
    error = '';
    success = '';
    
    try {
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: settings.name,
          email: settings.email,
          preferences: settings.preferences,
          notifications: {
            email: settings.notifications.email,
            push: settings.notifications.push,
            browser: settings.notifications.browser,
            sms: settings.notifications.sms,
            weeklyDigest: settings.notifications.weeklyDigest,
            securityAlerts: settings.notifications.securityAlerts,
            systemUpdates: settings.notifications.systemUpdates,
            marketingUpdates: settings.notifications.marketingUpdates,
            frequency: settings.notifications.frequency
          }
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          error = 'Please log in to update settings';
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      success = 'Settings updated successfully!';
      
    } catch (err) {
      console.error('Error saving settings:', err);
      error = err instanceof Error ? err.message : 'Failed to save settings';
    } finally {
      loading = false;
    }
  }
  
  // Load settings on page mount
  if (browser) {
    loadSettings();
  }
</script>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <!-- Page Header -->
  <div class="mb-8">
    <nav class="flex" aria-label="Breadcrumb">
      <ol role="list" class="flex items-center space-x-4">
        <li>
          <a href="/" class="text-gray-400 hover:text-gray-500">
            <span class="sr-only">Home</span>
            Dashboard
          </a>
        </li>
        <li>
          <div class="flex items-center">
            <span class="text-gray-400 mx-4">/</span>
            <span class="text-gray-900 font-medium">Settings</span>
          </div>
        </li>
      </ol>
    </nav>
    
    <h1 class="mt-4 text-3xl font-bold text-gray-900">Account Settings</h1>
    <p class="mt-2 text-gray-600">Manage your account preferences and notifications</p>
  </div>

  <!-- Settings Form -->
  <div class="bg-white shadow-lg rounded-lg overflow-hidden">
    <form on:submit|preventDefault={saveSettings} class="divide-y divide-gray-200">
      
      {#if error}
        <div class="p-6">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-700">{error}</p>
          </div>
        </div>
      {/if}

      {#if success}
        <div class="p-6">
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-sm text-green-700">{success}</p>
          </div>
        </div>
      {/if}

      <!-- Profile Information -->
      <div class="p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              bind:value={settings.name}
              placeholder="Enter your full name"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              bind:value={settings.email}
              placeholder="your@email.com"
              disabled
              class="block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 text-gray-500"
            />
            <p class="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
        </div>
      </div>

      <!-- Notification Preferences -->
      <div class="p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
        <div class="space-y-4">
          {#each [
            { id: 'email', label: 'Email Notifications', description: 'Receive monitor alerts via email' },
            { id: 'push', label: 'Browser Push Notifications', description: 'Receive browser push notifications' },
            { id: 'browser', label: 'Browser Notifications', description: 'In-browser notifications' },
            { id: 'sms', label: 'SMS Notifications', description: 'Text message alerts' },
            { id: 'weeklyDigest', label: 'Weekly Digest', description: 'Summary of monitor activities' },
            { id: 'securityAlerts', label: 'Security Alerts', description: 'Critical security-related notifications' },
            { id: 'systemUpdates', label: 'System Updates', description: 'Important system-wide updates' },
            { id: 'marketingUpdates', label: 'Marketing Updates', description: 'Promotional content and announcements' }
          ] as { id, label, description }}
            <div class="flex items-center justify-between">
              <div>
                <label for="{id}-notifications" class="text-sm font-medium text-gray-700">
                  {label}
                </label>
                <p class="text-sm text-gray-500">{description}</p>
              </div>
              <input
                id="{id}-notifications"
                type="checkbox"
                bind:checked={settings.notifications[id]}
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          {/each}

          <div>
            <label for="frequency" class="block text-sm font-medium text-gray-700 mb-2">
              Notification Frequency
            </label>
            <select
              id="frequency"
              bind:value={settings.notifications.frequency}
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="immediate">Immediate</option>
              <option value="hourly">Hourly Digest</option>
              <option value="daily">Daily Digest</option>
              <option value="weekly">Weekly Summary</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Account Preferences -->
      <div class="p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Preferences</h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="timezone" class="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              id="timezone"
              bind:value={settings.preferences.timezone}
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
          </div>
          
          <div>
            <label for="theme" class="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              id="theme"
              bind:value={settings.preferences.theme}
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
        <a
          href="/"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={loading}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 {loading ? 'opacity-50 cursor-not-allowed' : ''}"
        >
          {#if loading}
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          {:else}
            Save Changes
          {/if}
        </button>
      </div>
    </form>
  </div>

  <!-- Danger Zone -->
  <div class="mt-8 bg-white shadow-lg rounded-lg overflow-hidden border border-red-200">
    <div class="p-6">
      <h3 class="text-lg font-medium text-red-900 mb-2">Danger Zone</h3>
      <p class="text-sm text-red-600 mb-4">These actions cannot be undone</p>
      
      <div class="space-y-3">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Delete All Monitors
        </button>
        
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Delete Account
        </button>
      </div>
    </div>
  </div>
</div>