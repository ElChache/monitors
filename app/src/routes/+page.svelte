<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import DashboardFilters from '$lib/components/DashboardFilters.svelte';
  import MonitorCard from '$lib/components/MonitorCard.svelte';

  let viewMode: 'grid' | 'list' = 'grid';
  let searchQuery = '';
  let statusFilter: 'all' | 'active' | 'paused' | 'triggered' | 'error' = 'all';
  let typeFilter: 'all' | 'state' | 'change' = 'all';
  let sortBy: 'name' | 'created' | 'lastChecked' | 'triggers' = 'created';
  let sortOrder: 'asc' | 'desc' = 'desc';
  let isLoading = true;

  // Mock data for development - will be replaced with API calls
  let monitors = [
    {
      id: '1',
      name: 'Tesla Stock Price Monitor',
      prompt: 'Tell me when Tesla stock drops below $200',
      type: 'state' as const,
      isActive: true,
      lastChecked: '2024-01-07T10:30:00Z',
      currentValue: '$235.42',
      triggerCount: 3,
      status: 'active' as const,
      createdAt: '2024-01-01T08:00:00Z'
    },
    {
      id: '2',
      name: 'Weather Alert System',
      prompt: 'Alert me when it\'s going to rain for 3 consecutive days',
      type: 'change' as const,
      isActive: true,
      lastChecked: '2024-01-07T09:15:00Z',
      currentValue: 'Sunny, 72°F',
      triggerCount: 0,
      status: 'active' as const,
      createdAt: '2024-01-02T14:30:00Z'
    },
    {
      id: '3',
      name: 'Bitcoin Price Surge',
      prompt: 'Notify when Bitcoin rises 10% in 24 hours',
      type: 'change' as const,
      isActive: false,
      lastChecked: '2024-01-06T22:45:00Z',
      currentValue: '$43,250',
      triggerCount: 12,
      status: 'triggered' as const,
      createdAt: '2023-12-28T16:20:00Z'
    },
    {
      id: '4',
      name: 'Server Uptime Monitor',
      prompt: 'Track when my website goes down',
      type: 'state' as const,
      isActive: true,
      lastChecked: null,
      currentValue: null,
      triggerCount: 0,
      status: 'error' as const,
      createdAt: '2024-01-05T11:00:00Z'
    }
  ];

  // Filter and sort monitors based on current filters
  $: filteredMonitors = monitors
    .filter(monitor => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!monitor.name.toLowerCase().includes(query) && 
            !monitor.prompt.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Status filter
      if (statusFilter !== 'all' && monitor.status !== statusFilter) {
        return false;
      }
      
      // Type filter
      if (typeFilter !== 'all' && monitor.type !== typeFilter) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'created':
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        case 'lastChecked':
          aVal = a.lastChecked ? new Date(a.lastChecked).getTime() : 0;
          bVal = b.lastChecked ? new Date(b.lastChecked).getTime() : 0;
          break;
        case 'triggers':
          aVal = a.triggerCount;
          bVal = b.triggerCount;
          break;
        default:
          return 0;
      }
      
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      } else {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });

  // Load user preferences
  onMount(() => {
    if (browser) {
      const savedViewMode = localStorage.getItem('dashboard-view-mode');
      if (savedViewMode === 'list' || savedViewMode === 'grid') {
        viewMode = savedViewMode;
      }
    }
    
    // Simulate loading time
    setTimeout(() => {
      isLoading = false;
    }, 500);
  });

  // Save view mode preference
  const handleViewModeChange = (event: CustomEvent<'grid' | 'list'>) => {
    viewMode = event.detail;
    if (browser) {
      localStorage.setItem('dashboard-view-mode', viewMode);
    }
  };

  // Handle search changes
  const handleSearchChange = (event: CustomEvent<string>) => {
    searchQuery = event.detail;
  };

  // Handle filter changes
  const handleFilterChange = (event: CustomEvent<{
    statusFilter: typeof statusFilter;
    typeFilter: typeof typeFilter;
    sortBy: typeof sortBy;
    sortOrder: typeof sortOrder;
  }>) => {
    const { statusFilter: newStatusFilter, typeFilter: newTypeFilter, sortBy: newSortBy, sortOrder: newSortOrder } = event.detail;
    statusFilter = newStatusFilter;
    typeFilter = newTypeFilter;
    sortBy = newSortBy;
    sortOrder = newSortOrder;
  };

  // Show empty state when no monitors exist or all are filtered out
  $: showEmptyState = !isLoading && (monitors.length === 0 || filteredMonitors.length === 0);
  $: showNoResults = !isLoading && monitors.length > 0 && filteredMonitors.length === 0;
</script>

<!-- Dashboard Container -->
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <!-- Page Header -->
  <div class="mb-8">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Your Monitors</h1>
        <p class="mt-2 text-gray-600">Track real-world changes that matter to you</p>
      </div>
      
      {#if !showEmptyState && !isLoading}
        <div class="mt-4 sm:mt-0">
          <a href="/monitors/create" class="btn-primary px-4 py-2 inline-flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Monitor
          </a>
        </div>
      {/if}
    </div>
  </div>

  {#if isLoading}
    <!-- Loading State -->
    <div class="text-center py-12">
      <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-monitors text-primary bg-white transition ease-in-out duration-150">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading monitors...
      </div>
    </div>
  {:else if monitors.length === 0}
    <!-- Empty State - No Monitors Yet -->
    <div class="text-center py-12">
      <div class="max-w-md mx-auto">
        <div class="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <svg class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        
        <h2 class="text-xl font-semibold text-gray-900 mb-2">No monitors yet</h2>
        <p class="text-gray-500 mb-6">Create your first monitor to start tracking real-world changes</p>
        
        <a href="/monitors/create" class="btn-primary text-lg px-6 py-3 inline-block">
          Create Your First Monitor
        </a>
        
        <div class="mt-8 text-left">
          <h3 class="text-sm font-medium text-gray-900 mb-3">Example monitors you can create:</h3>
          <ul class="space-y-2 text-sm text-gray-600">
            <li class="flex items-start">
              <span class="text-primary mr-2">•</span>
              "Tell me when Tesla stock drops below $200"
            </li>
            <li class="flex items-start">
              <span class="text-primary mr-2">•</span>
              "Alert me when it's going to rain for 3 days"
            </li>
            <li class="flex items-start">
              <span class="text-primary mr-2">•</span>
              "Notify when Bitcoin rises 10% in 24 hours"
            </li>
          </ul>
        </div>
      </div>
    </div>
  {:else}
    <!-- Dashboard Filters -->
    <DashboardFilters
      bind:viewMode
      bind:searchQuery
      bind:statusFilter
      bind:typeFilter
      bind:sortBy
      bind:sortOrder
      on:viewModeChange={handleViewModeChange}
      on:searchChange={handleSearchChange}
      on:filterChange={handleFilterChange}
    />

    {#if showNoResults}
      <!-- No Results State -->
      <div class="text-center py-12">
        <div class="max-w-md mx-auto">
          <div class="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <svg class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <h2 class="text-lg font-semibold text-gray-900 mb-2">No monitors found</h2>
          <p class="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
          
          <button 
            on:click={() => {
              searchQuery = '';
              statusFilter = 'all';
              typeFilter = 'all';
            }}
            class="btn-outline px-4 py-2"
          >
            Clear Filters
          </button>
        </div>
      </div>
    {:else if viewMode === 'grid'}
      <!-- Grid View -->
      <div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {#each filteredMonitors as monitor (monitor.id)}
          <MonitorCard {monitor} {viewMode} />
        {/each}
      </div>
    {:else}
      <!-- List View -->
      <div class="mt-6 shadow ring-1 ring-black ring-opacity-5 md:rounded-monitors">
        <table class="min-w-full divide-y divide-gray-300">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monitor
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Value
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Triggers
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Checked
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each filteredMonitors as monitor (monitor.id)}
              <MonitorCard {monitor} {viewMode} />
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    {#if filteredMonitors.length > 0}
      <!-- Results Summary -->
      <div class="mt-6 text-sm text-gray-500 text-center">
        Showing {filteredMonitors.length} of {monitors.length} monitor{monitors.length === 1 ? '' : 's'}
      </div>
    {/if}
  {/if}
</div>
