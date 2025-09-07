<script lang="ts">
  import { onMount } from 'svelte';
  import { notifications } from '$lib/stores/notifications';
  import MiniChart from '$lib/components/MiniChart.svelte';
  
  let monitors = [];
  let loading = true;
  let error = '';
  
  // Mock monitor data for proof testing
  const mockMonitors = [
    {
      id: 'monitor_001',
      name: 'Tesla Stock Monitor',
      prompt: 'Alert me when Tesla drops below $200',
      status: 'active',
      currentValue: '$195.50',
      lastCheck: '2 minutes ago',
      alertsTriggered: 3,
      monitorType: 'line',
      chartData: []
    },
    {
      id: 'monitor_002', 
      name: 'Website Status Monitor',
      prompt: 'Monitor Google.com for downtime',
      status: 'active',
      currentValue: 'Online',
      lastCheck: '30 seconds ago',
      alertsTriggered: 0,
      monitorType: 'status',
      chartData: []
    },
    {
      id: 'monitor_003',
      name: 'Bitcoin Price Monitor',
      prompt: 'Track Bitcoin price changes',
      status: 'active',
      currentValue: '$43,250',
      lastCheck: '1 minute ago',
      alertsTriggered: 1,
      monitorType: 'line',
      chartData: []
    }
  ];
  
  onMount(async () => {
    try {
      // Try to fetch real monitors from API
      const response = await fetch('/api/monitors', {
        credentials: 'include'
      });
      
      if (response.ok) {
        monitors = await response.json();
      } else {
        // Use mock data for proof testing
        monitors = mockMonitors;
        notifications.info('Using demo data', 'Real monitor data will be available after authentication');
      }
    } catch (err) {
      console.error('Failed to load monitors:', err);
      monitors = mockMonitors;
      notifications.warning('Demo Mode', 'Using sample data for demonstration');
    } finally {
      loading = false;
    }
  });
  
  function createMonitor() {
    window.location.href = '/monitors/create';
  }
  
  // Handle chart clicks for detailed view
  function handleChartClick(event) {
    const { monitorId } = event.detail;
    // Navigate to detailed monitor view
    window.location.href = `/monitors/${monitorId}`;
  }
</script>

<svelte:head>
  <title>Dashboard - AI-Powered Monitoring</title>
</svelte:head>

<div class="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <!-- Dashboard Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
    <p class="mt-2 text-gray-600">Monitor your systems with AI-powered intelligence</p>
  </div>
  
  <!-- Quick Stats -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-500 truncate">Active Monitors</dt>
            <dd class="text-lg font-medium text-gray-900">{monitors.length}</dd>
          </dl>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-500 truncate">Health Status</dt>
            <dd class="text-lg font-medium text-gray-900">All Systems Operational</dd>
          </dl>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-500 truncate">Alerts Today</dt>
            <dd class="text-lg font-medium text-gray-900">3</dd>
          </dl>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-500 truncate">AI Classification</dt>
            <dd class="text-lg font-medium text-gray-900">89% Accuracy</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Monitors Section -->
  <div class="bg-white shadow rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-lg font-medium text-gray-900">Your Monitors</h2>
        <button 
          on:click={createMonitor}
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Monitor
        </button>
      </div>
      
      {#if loading}
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="ml-2 text-gray-600">Loading monitors...</span>
        </div>
      {:else if monitors.length === 0}
        <div class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No monitors</h3>
          <p class="mt-1 text-sm text-gray-500">Get started by creating your first AI-powered monitor.</p>
          <div class="mt-6">
            <button 
              on:click={createMonitor}
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Create your first monitor
            </button>
          </div>
        </div>
      {:else}
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {#each monitors as monitor}
            <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-200 hover:-translate-y-0.5">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-900">{monitor.name}</h3>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {monitor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                  {monitor.status}
                </span>
              </div>
              
              <p class="text-sm text-gray-600 mb-4">{monitor.prompt}</p>
              
              <!-- Mini-chart Integration -->
              <div class="mb-4 bg-white rounded-lg p-3 border">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {monitor.monitorType === 'line' ? 'Trend' : 'Status History'}
                  </span>
                  <span class="text-xs text-gray-400">7 days</span>
                </div>
                <MiniChart 
                  monitorId={monitor.id}
                  monitorType={monitor.monitorType || 'line'}
                  data={monitor.chartData || []}
                  height={60}
                  width="100%"
                  responsive={true}
                  on:chart-click={handleChartClick}
                />
              </div>
              
              <div class="space-y-2 mb-4">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Current Value:</span>
                  <span class="font-medium">{monitor.currentValue}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Last Check:</span>
                  <span class="font-medium">{monitor.lastCheck}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Alerts Triggered:</span>
                  <span class="font-medium {monitor.alertsTriggered > 0 ? 'text-orange-600' : ''}">{monitor.alertsTriggered}</span>
                </div>
              </div>
              
              <div class="flex justify-between items-center space-x-2">
                <div class="flex space-x-2">
                  <button 
                    on:click={() => handleChartClick({ detail: { monitorId: monitor.id } })}
                    class="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                  >
                    View Details
                  </button>
                  <button class="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors">
                    Edit
                  </button>
                </div>
                
                <!-- Quick action toggle -->
                <button 
                  class="px-2 py-1 text-xs font-medium rounded {monitor.status === 'active' ? 'text-orange-700 bg-orange-100 hover:bg-orange-200' : 'text-green-700 bg-green-100 hover:bg-green-200'} transition-colors"
                  title="{monitor.status === 'active' ? 'Pause monitor' : 'Resume monitor'}"
                >
                  {monitor.status === 'active' ? 'Pause' : 'Resume'}
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .dashboard-container {
    min-height: calc(100vh - 4rem);
  }
</style>