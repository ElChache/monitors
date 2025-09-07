<script lang="ts">
  export let monitor: {
    id: string;
    name: string;
    prompt: string;
    type: 'state' | 'change';
    isActive: boolean;
    lastChecked: string | null;
    currentValue: any;
    triggerCount: number;
    status: 'active' | 'inactive' | 'triggered' | 'error' | 'paused';
    createdAt: string;
  };
  
  export let viewMode: 'grid' | 'list' = 'grid';

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { 
          class: 'status-active', 
          icon: '●', 
          text: 'Active',
          color: 'text-secondary-600'
        };
      case 'triggered':
        return { 
          class: 'status-error', 
          icon: '🔔', 
          text: 'Triggered',
          color: 'text-accent-600'
        };
      case 'paused':
        return { 
          class: 'status-inactive', 
          icon: '⏸️', 
          text: 'Paused',
          color: 'text-gray-600'
        };
      case 'error':
        return { 
          class: 'status-error', 
          icon: '⚠️', 
          text: 'Error',
          color: 'text-accent-600'
        };
      default:
        return { 
          class: 'status-inactive', 
          icon: '○', 
          text: 'Inactive',
          color: 'text-gray-600'
        };
    }
  };

  $: statusConfig = getStatusConfig(monitor.status);
  $: formattedLastChecked = formatDate(monitor.lastChecked);
</script>

{#if viewMode === 'grid'}
  <!-- Grid View - Card Layout -->
  <div class="monitor-card group hover:shadow-monitors-hover transition-all duration-200">
    <!-- Card Header -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex-1 min-w-0">
        <h3 class="text-lg font-semibold text-gray-900 truncate group-hover:text-primary-600">
          {monitor.name}
        </h3>
        <p class="text-sm text-gray-500 mt-1 line-clamp-2">
          {monitor.prompt}
        </p>
      </div>
      
      <!-- Status Indicator -->
      <div class="ml-3 flex-shrink-0">
        <span class={statusConfig.class}>
          <span class="mr-1">{statusConfig.icon}</span>
          {statusConfig.text}
        </span>
      </div>
    </div>

    <!-- Monitor Type Badge -->
    <div class="mb-3">
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-monitors text-xs font-medium {monitor.type === 'state' ? 'bg-primary-100 text-primary-800' : 'bg-secondary-100 text-secondary-800'}">
        {monitor.type === 'state' ? '📊 State Monitor' : '📈 Change Monitor'}
      </span>
    </div>

    <!-- Current Value Display -->
    {#if monitor.currentValue !== null && monitor.currentValue !== undefined}
      <div class="mb-3 p-3 bg-gray-50 rounded-monitors">
        <p class="text-xs text-gray-500 mb-1">Current Value</p>
        <p class="text-sm font-mono text-gray-900">
          {typeof monitor.currentValue === 'object' 
            ? JSON.stringify(monitor.currentValue, null, 2).substring(0, 100) + '...'
            : String(monitor.currentValue)}
        </p>
      </div>
    {/if}

    <!-- Stats Row -->
    <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
      <div class="flex items-center space-x-4">
        <span>🔔 {monitor.triggerCount} triggers</span>
        <span>⏰ {formattedLastChecked}</span>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center justify-between">
      <div class="flex space-x-2">
        <button class="text-sm text-primary-600 hover:text-primary-700 font-medium">
          View Details
        </button>
        <button class="text-sm text-gray-500 hover:text-gray-700">
          Edit
        </button>
      </div>
      
      <div class="flex items-center space-x-2">
        {#if monitor.status === 'active'}
          <button class="btn-outline text-xs px-3 py-1">
            Pause
          </button>
        {:else if monitor.status === 'paused'}
          <button class="btn-secondary text-xs px-3 py-1">
            Resume
          </button>
        {/if}
        
        <button class="btn-primary text-xs px-3 py-1" disabled={!monitor.isActive}>
          Check Now
        </button>
      </div>
    </div>
  </div>
{:else}
  <!-- List View - Table Row Layout -->
  <tr class="hover:bg-gray-50 transition-colors duration-150">
    <!-- Name & Prompt -->
    <td class="px-6 py-4">
      <div class="flex items-start">
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2">
            <h3 class="text-sm font-medium text-gray-900 truncate">
              {monitor.name}
            </h3>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {monitor.type === 'state' ? 'bg-primary-100 text-primary-800' : 'bg-secondary-100 text-secondary-800'}">
              {monitor.type}
            </span>
          </div>
          <p class="text-sm text-gray-500 mt-1 truncate" title={monitor.prompt}>
            {monitor.prompt}
          </p>
        </div>
      </div>
    </td>

    <!-- Status -->
    <td class="px-6 py-4 text-sm">
      <span class={statusConfig.class}>
        <span class="mr-1">{statusConfig.icon}</span>
        {statusConfig.text}
      </span>
    </td>

    <!-- Current Value -->
    <td class="px-6 py-4 text-sm text-gray-500">
      {#if monitor.currentValue !== null && monitor.currentValue !== undefined}
        <span class="font-mono">
          {typeof monitor.currentValue === 'object' 
            ? JSON.stringify(monitor.currentValue).substring(0, 30) + '...'
            : String(monitor.currentValue)}
        </span>
      {:else}
        <span class="text-gray-400">No data</span>
      {/if}
    </td>

    <!-- Triggers -->
    <td class="px-6 py-4 text-sm text-gray-500">
      {monitor.triggerCount}
    </td>

    <!-- Last Checked -->
    <td class="px-6 py-4 text-sm text-gray-500">
      {formattedLastChecked}
    </td>

    <!-- Actions -->
    <td class="px-6 py-4 text-right text-sm">
      <div class="flex items-center justify-end space-x-2">
        <button class="text-primary-600 hover:text-primary-700 font-medium">
          View
        </button>
        <button class="text-gray-500 hover:text-gray-700">
          Edit
        </button>
        {#if monitor.status === 'active'}
          <button class="text-gray-500 hover:text-gray-700">
            Pause
          </button>
        {:else if monitor.status === 'paused'}
          <button class="text-secondary-600 hover:text-secondary-700">
            Resume
          </button>
        {/if}
        <button class="btn-primary text-xs px-2 py-1" disabled={!monitor.isActive}>
          Check Now
        </button>
      </div>
    </td>
  </tr>
{/if}

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>