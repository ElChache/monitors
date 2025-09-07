<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher<{
    edit: void;
    delete: void;
    pause: void;
    resume: void;
  }>();
  
  export let monitor: {
    id: string;
    name: string;
    status: 'active' | 'paused' | 'error';
    lastCheck: string;
    url: string;
  };
  
  let cardElement: HTMLElement;
  let startX = 0;
  let currentX = 0;
  let isDragging = false;
  let translateX = 0;
  
  const SWIPE_THRESHOLD = 100;
  const MAX_TRANSLATE = 150;
  
  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) return;
    isDragging = true;
    startX = e.touches[0].clientX;
    currentX = startX;
  }
  
  function handleTouchMove(e: TouchEvent) {
    if (!isDragging || e.touches.length !== 1) return;
    
    currentX = e.touches[0].clientX;
    const deltaX = currentX - startX;
    
    // Only allow left swipe (negative deltaX)
    if (deltaX < 0) {
      translateX = Math.max(deltaX, -MAX_TRANSLATE);
      cardElement.style.transform = `translateX(${translateX}px)`;
    }
  }
  
  function handleTouchEnd(e: TouchEvent) {
    if (!isDragging) return;
    isDragging = false;
    
    const deltaX = currentX - startX;
    
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      // Show action buttons
      translateX = -MAX_TRANSLATE;
      cardElement.style.transform = `translateX(${translateX}px)`;
    } else {
      // Snap back
      translateX = 0;
      cardElement.style.transform = 'translateX(0)';
    }
  }
  
  function resetPosition() {
    translateX = 0;
    cardElement.style.transform = 'translateX(0)';
  }
  
  function handleAction(action: 'edit' | 'delete' | 'pause' | 'resume') {
    resetPosition();
    dispatch(action);
  }
</script>

<div class="swipeable-monitor-card">
  <div
    bind:this={cardElement}
    class="monitor-card-content"
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
    style="transition: {isDragging ? 'none' : 'transform 0.3s ease-out'}"
  >
    <div class="monitor-info">
      <h3 class="monitor-name">{monitor.name}</h3>
      <p class="monitor-url">{monitor.url}</p>
      <div class="monitor-meta">
        <span class="status" class:active={monitor.status === 'active'} class:paused={monitor.status === 'paused'} class:error={monitor.status === 'error'}>
          {monitor.status}
        </span>
        <span class="last-check">Last: {monitor.lastCheck}</span>
      </div>
    </div>
    
    <div class="quick-actions">
      <button class="desktop-btn edit-btn" on:click={() => handleAction('edit')} aria-label="Edit monitor">
        ✏️
      </button>
      
      {#if monitor.status === 'active'}
        <button class="desktop-btn pause-btn" on:click={() => handleAction('pause')} aria-label="Pause monitor">
          ⏸️
        </button>
      {:else if monitor.status === 'paused'}
        <button class="desktop-btn resume-btn" on:click={() => handleAction('resume')} aria-label="Resume monitor">
          ▶️
        </button>
      {/if}
    </div>
  </div>
  
  <!-- Swipe action buttons (mobile only) -->
  <div class="swipe-actions">
    <button class="action-btn edit-action" on:click={() => handleAction('edit')}>
      ✏️ Edit
    </button>
    
    {#if monitor.status === 'active'}
      <button class="action-btn pause-action" on:click={() => handleAction('pause')}>
        ⏸️ Pause
      </button>
    {:else if monitor.status === 'paused'}
      <button class="action-btn resume-action" on:click={() => handleAction('resume')}>
        ▶️ Resume
      </button>
    {/if}
    
    <button class="action-btn delete-action" on:click={() => handleAction('delete')}>
      🗑️ Delete
    </button>
  </div>
</div>

<style>
  .swipeable-monitor-card {
    position: relative;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 1rem;
    overflow: hidden;
  }
  
  .monitor-card-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem;
    background: white;
    position: relative;
    z-index: 2;
    min-height: 88px; /* Consistent card height */
  }
  
  .monitor-info {
    flex: 1;
    min-width: 0; /* Prevent flex item from overflowing */
  }
  
  .monitor-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .monitor-url {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0 0 0.5rem 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .monitor-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .status {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
  }
  
  .status.active {
    background-color: #d1fae5;
    color: #065f46;
  }
  
  .status.paused {
    background-color: #fef3c7;
    color: #92400e;
  }
  
  .status.error {
    background-color: #fee2e2;
    color: #991b1b;
  }
  
  .last-check {
    font-size: 0.75rem;
    color: #9ca3af;
  }
  
  .quick-actions {
    display: flex;
    gap: 0.5rem;
    margin-left: 1rem;
  }
  
  .desktop-btn {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 8px;
    background: #f3f4f6;
    color: #374151;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  
  .desktop-btn:hover {
    background: #e5e7eb;
    transform: scale(1.05);
  }
  
  .edit-btn:hover {
    background: #dbeafe;
    color: var(--primary);
  }
  
  .pause-btn:hover, .resume-btn:hover {
    background: #fef3c7;
    color: #92400e;
  }
  
  /* Swipe action buttons */
  .swipe-actions {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    background: #f9fafb;
    z-index: 1;
    padding-right: 1rem;
  }
  
  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 70px;
    height: 100%;
    border: none;
    background: none;
    color: #374151;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
    min-height: 88px;
  }
  
  .edit-action {
    background: #dbeafe;
    color: var(--primary);
  }
  
  .pause-action, .resume-action {
    background: #fef3c7;
    color: #92400e;
  }
  
  .delete-action {
    background: #fee2e2;
    color: #991b1b;
  }
  
  .action-btn:active {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  /* Hide swipe actions on desktop */
  @media (min-width: 768px) {
    .swipe-actions {
      display: none;
    }
  }
  
  /* Hide desktop buttons on mobile */
  @media (max-width: 767px) {
    .desktop-btn {
      display: none;
    }
  }
  
  /* Touch-friendly sizing on mobile */
  @media (max-width: 767px) {
    .monitor-card-content {
      padding: 1.5rem;
      min-height: 100px;
    }
    
    .monitor-name {
      font-size: 1.125rem;
    }
    
    .monitor-url {
      font-size: 0.9375rem;
    }
  }
</style>