<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  
  const dispatch = createEventDispatcher<{
    dataPointClick: { value: number; timestamp: string; index: number };
  }>();
  
  export let data: Array<{ value: number; timestamp: string; label?: string }> = [];
  export let title = 'Monitor Data';
  export let color = '#1d4ed8';
  export let height = 300;
  export let showGrid = true;
  export let showTooltip = true;
  export let responsive = true;
  
  let container: HTMLElement;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let containerWidth = 0;
  let containerHeight = height;
  let hoveredPoint: { x: number; y: number; data: any } | null = null;
  let touchPoint: { x: number; y: number; data: any } | null = null;
  
  // Responsive breakpoints
  $: if (responsive && containerWidth) {
    if (containerWidth < 640) {
      containerHeight = 200; // Mobile: shorter height
    } else if (containerWidth < 1024) {
      containerHeight = 250; // Tablet: medium height
    } else {
      containerHeight = height; // Desktop: full height
    }
  }
  
  // Chart drawing logic
  function drawChart() {
    if (!ctx || !data.length) return;
    
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size accounting for device pixel ratio
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = containerWidth + 'px';
    canvas.style.height = containerHeight + 'px';
    ctx.scale(dpr, dpr);
    
    const padding = {
      top: 20,
      right: 20,
      bottom: 40,
      left: 60
    };
    
    // Responsive padding adjustments
    if (containerWidth < 640) {
      padding.left = 40;
      padding.bottom = 30;
      padding.right = 15;
    }
    
    const chartWidth = containerWidth - padding.left - padding.right;
    const chartHeight = containerHeight - padding.top - padding.bottom;
    
    // Clear canvas
    ctx.clearRect(0, 0, containerWidth, containerHeight);
    
    // Find min/max values
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;
    
    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      
      // Horizontal grid lines
      const gridLines = containerWidth < 640 ? 3 : 5;
      for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (i * chartHeight / gridLines);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();
      }
      
      // Vertical grid lines
      const verticalLines = Math.min(data.length - 1, containerWidth < 640 ? 3 : 6);
      for (let i = 0; i <= verticalLines; i++) {
        const x = padding.left + (i * chartWidth / verticalLines);
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + chartHeight);
        ctx.stroke();
      }
    }
    
    // Draw y-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = `${containerWidth < 640 ? '10px' : '12px'} system-ui`;
    ctx.textAlign = 'right';
    
    const labelCount = containerWidth < 640 ? 3 : 5;
    for (let i = 0; i <= labelCount; i++) {
      const value = maxValue - (i * valueRange / labelCount);
      const y = padding.top + (i * chartHeight / labelCount);
      ctx.fillText(value.toFixed(1), padding.left - 10, y + 4);
    }
    
    // Draw x-axis labels (timestamps)
    ctx.textAlign = 'center';
    const timeLabels = Math.min(data.length, containerWidth < 640 ? 3 : 6);
    for (let i = 0; i < timeLabels; i++) {
      const dataIndex = Math.floor(i * (data.length - 1) / (timeLabels - 1));
      const datum = data[dataIndex];
      if (datum) {
        const x = padding.left + (dataIndex * chartWidth / (data.length - 1));
        const time = new Date(datum.timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: containerWidth < 640
        });
        ctx.fillText(time, x, containerHeight - 10);
      }
    }
    
    // Draw line chart
    if (data.length > 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = containerWidth < 640 ? 2 : 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      
      data.forEach((datum, index) => {
        const x = padding.left + (index * chartWidth / (data.length - 1));
        const normalizedValue = (datum.value - minValue) / valueRange;
        const y = padding.top + chartHeight - (normalizedValue * chartHeight);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Draw data points
      ctx.fillStyle = color;
      data.forEach((datum, index) => {
        const x = padding.left + (index * chartWidth / (data.length - 1));
        const normalizedValue = (datum.value - minValue) / valueRange;
        const y = padding.top + chartHeight - (normalizedValue * chartHeight);
        
        ctx.beginPath();
        ctx.arc(x, y, containerWidth < 640 ? 4 : 5, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }
  
  // Mouse/touch interaction handlers
  function handleInteraction(clientX: number, clientY: number, isTouch = false) {
    if (!canvas || !data.length) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const padding = { top: 20, right: 20, bottom: 40, left: containerWidth < 640 ? 40 : 60 };
    const chartWidth = containerWidth - padding.left - padding.right;
    
    if (x >= padding.left && x <= padding.left + chartWidth) {
      const relativeX = (x - padding.left) / chartWidth;
      const dataIndex = Math.round(relativeX * (data.length - 1));
      const datum = data[dataIndex];
      
      if (datum) {
        const pointData = { x, y, data: datum };
        
        if (isTouch) {
          touchPoint = pointData;
          hoveredPoint = null;
          dispatch('dataPointClick', { value: datum.value, timestamp: datum.timestamp, index: dataIndex });
          
          // Auto-hide touch tooltip after 3 seconds
          setTimeout(() => {
            touchPoint = null;
          }, 3000);
        } else {
          hoveredPoint = pointData;
          touchPoint = null;
        }
      }
    } else {
      if (isTouch) {
        touchPoint = null;
      } else {
        hoveredPoint = null;
      }
    }
  }
  
  function handleMouseMove(e: MouseEvent) {
    if (!showTooltip) return;
    handleInteraction(e.clientX, e.clientY);
  }
  
  function handleMouseLeave() {
    hoveredPoint = null;
  }
  
  function handleTouchStart(e: TouchEvent) {
    if (!showTooltip || e.touches.length !== 1) return;
    e.preventDefault();
    handleInteraction(e.touches[0].clientX, e.touches[0].clientY, true);
  }
  
  // Resize observer for responsive behavior
  let resizeObserver: ResizeObserver;
  
  onMount(() => {
    if (!browser) return;
    
    ctx = canvas.getContext('2d');
    
    // Initial size
    containerWidth = container.clientWidth;
    
    // Setup resize observer
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth = entry.contentRect.width;
        setTimeout(() => drawChart(), 0); // Allow DOM to update
      }
    });
    
    resizeObserver.observe(container);
    
    return () => {
      resizeObserver?.disconnect();
    };
  });
  
  // Reactive chart updates
  $: if (browser && ctx && data) {
    drawChart();
  }
</script>

<div 
  bind:this={container} 
  class="adaptive-chart"
  style="height: {containerHeight}px;"
>
  {#if data.length > 0}
    <div class="chart-header">
      <h3 class="chart-title">{title}</h3>
    </div>
    
    <canvas
      bind:this={canvas}
      class="chart-canvas"
      on:mousemove={handleMouseMove}
      on:mouseleave={handleMouseLeave}
      on:touchstart={handleTouchStart}
      aria-label="Interactive chart showing {title} data over time"
      role="img"
    ></canvas>
    
    <!-- Tooltip -->
    {#if showTooltip && (hoveredPoint || touchPoint)}
      {@const point = hoveredPoint || touchPoint}
      <div 
        class="chart-tooltip"
        class:touch-tooltip={touchPoint}
        style="left: {point.x}px; top: {point.y - 40}px;"
      >
        <div class="tooltip-content">
          <div class="tooltip-value">{point.data.value.toFixed(2)}</div>
          <div class="tooltip-time">
            {new Date(point.data.timestamp).toLocaleString()}
          </div>
          {#if point.data.label}
            <div class="tooltip-label">{point.data.label}</div>
          {/if}
        </div>
      </div>
    {/if}
  {:else}
    <div class="empty-state">
      <div class="empty-icon">📊</div>
      <p>No data available</p>
    </div>
  {/if}
</div>

<style>
  .adaptive-chart {
    position: relative;
    width: 100%;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    overflow: hidden;
  }
  
  .chart-header {
    padding: 1rem 1.5rem 0;
  }
  
  .chart-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }
  
  .chart-canvas {
    display: block;
    width: 100%;
    cursor: crosshair;
  }
  
  /* Mobile optimizations */
  @media (max-width: 640px) {
    .chart-header {
      padding: 0.75rem 1rem 0;
    }
    
    .chart-title {
      font-size: 1rem;
    }
    
    .chart-canvas {
      cursor: pointer;
    }
  }
  
  .chart-tooltip {
    position: absolute;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.75rem;
    white-space: nowrap;
    pointer-events: none;
    z-index: 10;
    transform: translateX(-50%);
    opacity: 0;
    animation: tooltip-show 0.2s ease-out forwards;
  }
  
  .touch-tooltip {
    background: rgba(29, 78, 216, 0.95);
    animation: tooltip-pulse 0.3s ease-out;
  }
  
  @keyframes tooltip-show {
    from { opacity: 0; transform: translateX(-50%) translateY(5px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  
  @keyframes tooltip-pulse {
    0%, 100% { transform: translateX(-50%) scale(1); }
    50% { transform: translateX(-50%) scale(1.05); }
  }
  
  .tooltip-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.125rem;
  }
  
  .tooltip-value {
    font-weight: 600;
    font-size: 0.875rem;
  }
  
  .tooltip-time {
    font-size: 0.6875rem;
    opacity: 0.9;
  }
  
  .tooltip-label {
    font-size: 0.6875rem;
    opacity: 0.8;
    font-style: italic;
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #6b7280;
    padding: 2rem;
  }
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  @media (max-width: 640px) {
    .empty-state {
      padding: 1.5rem 1rem;
    }
    
    .empty-icon {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
    }
  }
  
  /* High DPI display optimizations */
  @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    .chart-canvas {
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }
  }
</style>