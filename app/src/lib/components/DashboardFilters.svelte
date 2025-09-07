<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let viewMode: 'grid' | 'list' = 'grid';
  export let searchQuery = '';
  export let statusFilter: 'all' | 'active' | 'paused' | 'triggered' | 'error' = 'all';
  export let typeFilter: 'all' | 'state' | 'change' = 'all';
  export let sortBy: 'name' | 'created' | 'lastChecked' | 'triggers' = 'created';
  export let sortOrder: 'asc' | 'desc' = 'desc';

  const statusOptions = [
    { value: 'all', label: 'All Status', count: 0 },
    { value: 'active', label: 'Active', count: 0 },
    { value: 'paused', label: 'Paused', count: 0 },
    { value: 'triggered', label: 'Triggered', count: 0 },
    { value: 'error', label: 'Error', count: 0 }
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'state', label: 'State Monitors' },
    { value: 'change', label: 'Change Monitors' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'created', label: 'Date Created' },
    { value: 'lastChecked', label: 'Last Checked' },
    { value: 'triggers', label: 'Triggers' }
  ];

  const handleViewModeChange = (newMode: 'grid' | 'list') => {
    viewMode = newMode;
    dispatch('viewModeChange', newMode);
  };

  const handleSearchChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    searchQuery = target.value;
    dispatch('searchChange', searchQuery);
  };

  const handleStatusFilterChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    statusFilter = target.value as any;
    dispatch('filterChange', { statusFilter, typeFilter, sortBy, sortOrder });
  };

  const handleTypeFilterChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    typeFilter = target.value as any;
    dispatch('filterChange', { statusFilter, typeFilter, sortBy, sortOrder });
  };

  const handleSortChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    sortBy = target.value as any;
    dispatch('filterChange', { statusFilter, typeFilter, sortBy, sortOrder });
  };

  const toggleSortOrder = () => {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    dispatch('filterChange', { statusFilter, typeFilter, sortBy, sortOrder });
  };
</script>

<div class="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
    
    <!-- Left Side - Search and Filters -->
    <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 flex-1">
      
      <!-- Search Bar -->
      <div class="relative flex-1 max-w-md">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search monitors..."
          bind:value={searchQuery}
          on:input={handleSearchChange}
          class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-monitors text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        />
      </div>

      <!-- Filter Dropdowns -->
      <div class="flex space-x-3">
        <!-- Status Filter -->
        <select 
          bind:value={statusFilter}
          on:change={handleStatusFilterChange}
          class="block w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-monitors focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        >
          {#each statusOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>

        <!-- Type Filter -->
        <select 
          bind:value={typeFilter}
          on:change={handleTypeFilterChange}
          class="block w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-monitors focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        >
          {#each typeOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Right Side - Sort and View Controls -->
    <div class="flex items-center space-x-4">
      
      <!-- Sort Controls -->
      <div class="flex items-center space-x-2">
        <label for="sort-by-select" class="text-sm text-gray-500">Sort by:</label>
        <select 
          id="sort-by-select"
          bind:value={sortBy}
          on:change={handleSortChange}
          class="block pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-monitors focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        >
          {#each sortOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
        
        <button 
          on:click={toggleSortOrder}
          class="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary rounded-monitors"
          title={sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
        >
          {#if sortOrder === 'asc'}
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
            </svg>
          {:else}
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          {/if}
        </button>
      </div>

      <!-- View Mode Toggle -->
      <div class="flex items-center bg-gray-100 rounded-monitors p-1">
        <button
          on:click={() => handleViewModeChange('grid')}
          class="flex items-center justify-center px-3 py-2 text-sm font-medium rounded-monitors transition-colors duration-200 {viewMode === 'grid' ? 'bg-gray-50 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
          title="Grid view"
          aria-label="Switch to grid view"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
        
        <button
          on:click={() => handleViewModeChange('list')}
          class="flex items-center justify-center px-3 py-2 text-sm font-medium rounded-monitors transition-colors duration-200 {viewMode === 'list' ? 'bg-gray-50 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
          title="List view"
          aria-label="Switch to list view"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</div>