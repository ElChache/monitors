<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let monitorId: string;
  export let monitorType: 'line' | 'status' | 'gauge' = 'line';
  export let data: any[] = [];
  export let loading = false;
  export let error = '';
  export let height = 80;
  export let width = 200;
  export let responsive = true;
  
  let chartContainer: HTMLElement;
  let chartWidth = width;
  let chartHeight = height;
  
  // Chart colors
  const colors = {
    primary: '#3B82F6',
    success: '#10B981', 
    warning: '#F59E0B',
    danger: '#EF4444',
    gray: '#6B7280'
  };
  
  // Sample mock data for development
  const mockLineData = [
    { timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, value: 195 },
    { timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000, value: 200 },
    { timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, value: 185 },
    { timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000, value: 192 },
    { timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, value: 198 },
    { timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, value: 188 },
    { timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000, value: 195.5 }
  ];
  
  const mockStatusData = [
    { timestamp: Date.now() - 24 * 60 * 60 * 1000, value: 1, label: 'Online' },
    { timestamp: Date.now() - 20 * 60 * 60 * 1000, value: 1, label: 'Online' },
    { timestamp: Date.now() - 16 * 60 * 60 * 1000, value: 0, label: 'Offline' },
    { timestamp: Date.now() - 12 * 60 * 60 * 1000, value: 1, label: 'Online' },
    { timestamp: Date.now() - 8 * 60 * 60 * 1000, value: 1, label: 'Online' },
    { timestamp: Date.now() - 4 * 60 * 60 * 1000, value: 1, label: 'Online' },
    { timestamp: Date.now(), value: 1, label: 'Online' }
  ];
  
  // Initialize with mock data if no data provided
  $: chartData = data.length > 0 ? data : (monitorType === 'line' ? mockLineData : mockStatusData);
  
  // Responsive sizing
  const updateSize = () => {
    if (responsive && chartContainer) {
      const containerRect = chartContainer.getBoundingClientRect();
      chartWidth = Math.min(width, containerRect.width - 16);
      chartHeight = height;
    }
  };
  
  onMount(() => {
    updateSize();
    
    // Fetch real chart data
    fetchChartData();
    
    if (responsive) {
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  });
  
  const fetchChartData = async () => {
    if (!monitorId) return;
    
    loading = true;
    error = '';
    
    try {
      const response = await fetch(`/api/monitors/${monitorId}/mini-chart-data`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        data = result.data || [];
      } else {
        // Fallback to mock data
        console.log('Using mock chart data for development');
      }
    } catch (err) {
      console.error('Failed to fetch chart data:', err);
      error = 'Failed to load chart';
    } finally {
      loading = false;
    }
  };
  
  // SVG path generation for line charts
  const generateLinePath = (data: any[], width: number, height: number) => {
    if (!data || data.length < 2) return '';
    
    const padding = 4;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);
    
    const minValue = Math.min(...data.map(d => d.value));
    const maxValue = Math.max(...data.map(d => d.value));
    const valueRange = maxValue - minValue || 1;
    
    const points = data.map((point, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };
  
  // Generate status indicator bars
  const generateStatusBars = (data: any[], width: number, height: number) => {
    if (!data || data.length === 0) return [];
    
    const padding = 2;
    const barWidth = (width - (padding * (data.length + 1))) / data.length;
    const barHeight = height - (padding * 2);
    
    return data.map((point, index) => ({
      x: padding + index * (barWidth + padding),
      y: padding,
      width: barWidth,
      height: barHeight,
      value: point.value,
      color: point.value === 1 ? colors.success : colors.danger
    }));
  };
  
  // Get chart trend information
  const getTrend = (data: any[]) => {
    if (!data || data.length < 2) return { direction: 'neutral', change: 0 };
    
    const latest = data[data.length - 1].value;
    const previous = data[data.length - 2].value;
    const change = ((latest - previous) / previous) * 100;
    
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      change: Math.abs(change)
    };
  };
  
  $: trend = getTrend(chartData);
  $: linePath = monitorType === 'line' ? generateLinePath(chartData, chartWidth, chartHeight) : '';
  $: statusBars = monitorType === 'status' ? generateStatusBars(chartData, chartWidth, chartHeight) : [];
  
  // Handle chart interaction
  const handleChartClick = () => {
    dispatch('chart-click', { monitorId, data: chartData });
  };
</script>

<div 
  bind:this={chartContainer}
  class="mini-chart-container relative"
  class:cursor-pointer={monitorId}
  on:click={handleChartClick}
  on:keydown={(e) => e.key === 'Enter' && handleChartClick()}
  role={monitorId ? 'button' : undefined}
  tabindex={monitorId ? 0 : -1}
  aria-label={monitorId ? `View detailed chart for monitor ${monitorId}` : undefined}
>
  {#if loading}
    <div class="flex items-center justify-center" style="height: {height}px; width: {width}px;">
      <div class="animate-pulse bg-gray-200 rounded" style="height: {height - 16}px; width: {width - 16}px;"></div>
    </div>
  {:else if error}
    <div class="flex items-center justify-center text-xs text-gray-400" style="height: {height}px; width: {width}px;">
      <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
      </svg>
      No data
    </div>
  {:else}
    <!-- Chart SVG -->
    <div class="relative">
      <svg 
        width={chartWidth} 
        height={chartHeight} 
        class="chart-svg"
        aria-hidden="true"
      >
        {#if monitorType === 'line' && linePath}
          <!-- Line chart -->
          <defs>
            <linearGradient id="gradient-{monitorId}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:{colors.primary};stop-opacity:0.3" />
              <stop offset="100%" style="stop-color:{colors.primary};stop-opacity:0.05" />
            </linearGradient>
          </defs>
          
          <!-- Fill area -->
          <path 
            d="{linePath} L {chartWidth - 4},{chartHeight - 4} L 4,{chartHeight - 4} Z"
            fill="url(#gradient-{monitorId})"
          />
          
          <!-- Line -->
          <path 
            d={linePath}
            fill="none"
            stroke={colors.primary}
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          
          <!-- Data points -->
          {#each chartData as point, index}
            {@const x = 4 + (index / (chartData.length - 1)) * (chartWidth - 8)}
            {@const y = 4 + (chartHeight - 8) - ((point.value - Math.min(...chartData.map(d => d.value))) / (Math.max(...chartData.map(d => d.value)) - Math.min(...chartData.map(d => d.value)) || 1)) * (chartHeight - 8)}
            <circle cx={x} cy={y} r="2" fill={colors.primary} />
          {/each}
        
        {:else if monitorType === 'status'}
          <!-- Status chart -->
          {#each statusBars as bar}
            <rect 
              x={bar.x} 
              y={bar.y} 
              width={bar.width} 
              height={bar.height}
              fill={bar.color}
              rx="2"
            />
          {/each}
        {/if}
      </svg>
      
      <!-- Trend indicator -->
      {#if trend.direction !== 'neutral' && monitorType === 'line'}
        <div class="absolute top-1 right-1 flex items-center text-xs">
          {#if trend.direction === 'up'}
            <svg class="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
            </svg>
          {:else}
            <svg class="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
          {/if}
          <span class="ml-0.5 {trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}">
            {trend.change.toFixed(1)}%
          </span>
        </div>
      {/if}
      
      <!-- Current status for status monitors -->
      {#if monitorType === 'status'}
        {@const latestStatus = chartData[chartData.length - 1]}
        <div class="absolute top-1 right-1">
          <div class="flex items-center text-xs">
            <div class="w-2 h-2 rounded-full mr-1 {latestStatus?.value === 1 ? 'bg-green-400' : 'bg-red-400'}"></div>
            <span class="text-gray-600 font-medium">
              {latestStatus?.label || (latestStatus?.value === 1 ? 'Online' : 'Offline')}
            </span>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .mini-chart-container {
    transition: transform 0.1s ease;
  }
  
  .mini-chart-container:hover {
    transform: translateY(-1px);
  }
  
  .chart-svg {
    background: transparent;
  }
  
  .cursor-pointer:focus {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
    border-radius: 4px;
  }
  
  /* Enhanced accessibility for mobile */
  @media (max-width: 640px) {
    .mini-chart-container {
      min-height: 44px;
      touch-action: manipulation;
    }
  }
</style>