<script lang="ts">
  import { page } from '$app/stores';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher<{
    close: void;
  }>();
  
  export let isOpen = false;
  export let variant: 'overlay' | 'fixed' = 'overlay';
  export let width = '280px';
  
  interface SidebarSection {
    title?: string;
    items: Array<{
      href: string;
      label: string;
      icon: string;
      badge?: string | number;
      show?: boolean | (() => boolean);
      children?: Array<{
        href: string;
        label: string;
        badge?: string | number;
      }>;
    }>;
  }
  
  const sidebarSections: SidebarSection[] = [
    {
      items: [
        {
          href: '/',
          label: 'Dashboard',
          icon: '🏠',
          show: true
        },
        {
          href: '/monitors',
          label: 'Monitors',
          icon: '📊',
          badge: '12',
          show: true,
          children: [
            { href: '/monitors/active', label: 'Active Monitors' },
            { href: '/monitors/paused', label: 'Paused Monitors' },
            { href: '/monitors/failed', label: 'Failed Monitors' }
          ]
        },
        {
          href: '/monitors/create',
          label: 'Create Monitor',
          icon: '➕',
          show: true
        }
      ]
    },
    {
      title: 'Analytics',
      items: [
        {
          href: '/analytics',
          label: 'Overview',
          icon: '📈',
          show: true
        },
        {
          href: '/analytics/performance',
          label: 'Performance',
          icon: '⚡',
          show: true
        },
        {
          href: '/analytics/alerts',
          label: 'Alert History',
          icon: '🔔',
          badge: 'new',
          show: true
        }
      ]
    },
    {
      title: 'Settings',
      items: [
        {
          href: '/settings',
          label: 'Account',
          icon: '👤',
          show: true
        },
        {
          href: '/settings/notifications',
          label: 'Notifications',
          icon: '🔔',
          show: true
        },
        {
          href: '/settings/integrations',
          label: 'Integrations',
          icon: '🔗',
          show: true
        }
      ]
    },
    {
      title: 'Admin',
      items: [
        {
          href: '/admin',
          label: 'Admin Panel',
          icon: '⚙️',
          show: () => true // Would check user permissions in real app
        },
        {
          href: '/admin/users',
          label: 'User Management',
          icon: '👥',
          show: () => true
        }
      ]
    }
  ];
  
  function isActive(href: string): boolean {
    if (href === '/') {
      return $page.url.pathname === '/';
    }
    return $page.url.pathname.startsWith(href);
  }
  
  function shouldShowItem(item: any): boolean {
    return typeof item.show === 'function' ? item.show() : item.show !== false;
  }
  
  function handleItemClick() {
    if (variant === 'overlay') {
      dispatch('close');
    }
  }
  
  function handleOverlayClick() {
    if (variant === 'overlay') {
      dispatch('close');
    }
  }
  
  // Expanded state for items with children
  let expandedItems: Set<string> = new Set();
  
  function toggleExpanded(href: string) {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(href)) {
      newExpanded.delete(href);
    } else {
      newExpanded.add(href);
    }
    expandedItems = newExpanded;
  }
</script>

<!-- Overlay for mobile sidebar -->
{#if variant === 'overlay' && isOpen}
  <div 
    class="sidebar-overlay"
    on:click={handleOverlayClick}
    on:keydown={(e) => e.key === 'Escape' && dispatch('close')}
    role="button"
    tabindex="-1"
  ></div>
{/if}

<aside 
  class="sidebar"
  class:open={isOpen}
  class:fixed={variant === 'fixed'}
  class:overlay={variant === 'overlay'}
  style="--sidebar-width: {width};"
  role="navigation"
  aria-label="Main navigation sidebar"
>
  <!-- Sidebar header -->
  <div class="sidebar-header">
    <div class="sidebar-title">
      <span class="title-icon">📊</span>
      <span class="title-text">Monitors</span>
    </div>
    
    {#if variant === 'overlay'}
      <button 
        class="close-button"
        on:click={() => dispatch('close')}
        aria-label="Close sidebar"
      >
        ✕
      </button>
    {/if}
  </div>
  
  <!-- Sidebar content -->
  <div class="sidebar-content">
    <nav class="sidebar-nav">
      {#each sidebarSections as section}
        {#if section.title}
          <div class="nav-section">
            <h3 class="section-title">{section.title}</h3>
            <ul class="nav-list">
              {#each section.items as item}
                {#if shouldShowItem(item)}
                  <li class="nav-item">
                    {#if item.children}
                      <!-- Item with children -->
                      <div class="nav-item-wrapper">
                        <a
                          href={item.href}
                          class="nav-link"
                          class:active={isActive(item.href)}
                          on:click={handleItemClick}
                        >
                          <span class="nav-icon">{item.icon}</span>
                          <span class="nav-label">{item.label}</span>
                          {#if item.badge}
                            <span class="nav-badge">{item.badge}</span>
                          {/if}
                        </a>
                        
                        <button
                          class="expand-button"
                          class:expanded={expandedItems.has(item.href)}
                          on:click={() => toggleExpanded(item.href)}
                          aria-label="Toggle {item.label} submenu"
                        >
                          <svg class="expand-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      
                      {#if expandedItems.has(item.href)}
                        <ul class="sub-nav-list">
                          {#each item.children as child}
                            <li>
                              <a
                                href={child.href}
                                class="sub-nav-link"
                                class:active={isActive(child.href)}
                                on:click={handleItemClick}
                              >
                                <span class="sub-nav-label">{child.label}</span>
                                {#if child.badge}
                                  <span class="nav-badge">{child.badge}</span>
                                {/if}
                              </a>
                            </li>
                          {/each}
                        </ul>
                      {/if}
                    {:else}
                      <!-- Simple item -->
                      <a
                        href={item.href}
                        class="nav-link"
                        class:active={isActive(item.href)}
                        on:click={handleItemClick}
                      >
                        <span class="nav-icon">{item.icon}</span>
                        <span class="nav-label">{item.label}</span>
                        {#if item.badge}
                          <span class="nav-badge">{item.badge}</span>
                        {/if}
                      </a>
                    {/if}
                  </li>
                {/if}
              {/each}
            </ul>
          </div>
        {:else}
          <!-- Section without title -->
          <ul class="nav-list">
            {#each section.items as item}
              {#if shouldShowItem(item)}
                <li class="nav-item">
                  <a
                    href={item.href}
                    class="nav-link"
                    class:active={isActive(item.href)}
                    on:click={handleItemClick}
                  >
                    <span class="nav-icon">{item.icon}</span>
                    <span class="nav-label">{item.label}</span>
                    {#if item.badge}
                      <span class="nav-badge">{item.badge}</span>
                    {/if}
                  </a>
                </li>
              {/if}
            {/each}
          </ul>
        {/if}
      {/each}
    </nav>
  </div>
  
  <!-- Sidebar footer -->
  <div class="sidebar-footer">
    <div class="user-info">
      <div class="user-avatar">JD</div>
      <div class="user-details">
        <div class="user-name">John Doe</div>
        <div class="user-role">Administrator</div>
      </div>
    </div>
  </div>
</aside>

<style>
  /* Sidebar overlay */
  .sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 49;
    backdrop-filter: blur(4px);
  }
  
  /* Sidebar */
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: var(--sidebar-width);
    background: white;
    border-right: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    z-index: 50;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  .sidebar.fixed {
    position: relative;
    transform: none;
    transition: none;
  }
  
  .sidebar.overlay {
    box-shadow: 4px 0 12px rgba(0, 0, 0, 0.15);
  }
  
  /* Sidebar header */
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  
  .sidebar-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 700;
    font-size: 1.125rem;
    color: #1f2937;
  }
  
  .title-icon {
    font-size: 1.25rem;
  }
  
  .close-button {
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    color: #6b7280;
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    transition: all 0.2s ease;
  }
  
  .close-button:hover,
  .close-button:focus {
    background: rgba(0, 0, 0, 0.05);
    color: #374151;
  }
  
  /* Sidebar content */
  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 0;
  }
  
  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .nav-section {
    padding: 0 1.25rem;
  }
  
  .section-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 0.75rem 0;
  }
  
  .nav-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .nav-item {
    position: relative;
  }
  
  .nav-item-wrapper {
    display: flex;
    align-items: center;
  }
  
  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    text-decoration: none;
    color: #6b7280;
    font-weight: 500;
    border-radius: 8px;
    transition: all 0.2s ease;
    flex: 1;
    min-height: 44px;
  }
  
  .nav-link:hover,
  .nav-link:focus {
    background: rgba(13, 71, 161, 0.05);
    color: var(--primary);
  }
  
  .nav-link.active {
    background: rgba(13, 71, 161, 0.08);
    color: var(--primary);
    font-weight: 600;
  }
  
  .nav-icon {
    font-size: 1.125rem;
    width: 20px;
    text-align: center;
    flex-shrink: 0;
  }
  
  .nav-label {
    flex: 1;
    font-size: 0.875rem;
  }
  
  .nav-badge {
    background: #ef4444;
    color: white;
    font-size: 0.6875rem;
    font-weight: 600;
    padding: 0.125rem 0.375rem;
    border-radius: 9999px;
    min-width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  
  .nav-badge[data-badge="new"] {
    background: #10b981;
  }
  
  /* Expand button */
  .expand-button {
    width: 24px;
    height: 24px;
    border: none;
    background: none;
    color: #9ca3af;
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    margin-right: 0.5rem;
  }
  
  .expand-button:hover,
  .expand-button:focus {
    background: rgba(0, 0, 0, 0.05);
    color: #6b7280;
  }
  
  .expand-icon {
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;
  }
  
  .expand-button.expanded .expand-icon {
    transform: rotate(180deg);
  }
  
  /* Sub-navigation */
  .sub-nav-list {
    list-style: none;
    margin: 0.25rem 0 0 0;
    padding: 0 0 0 2.75rem;
  }
  
  .sub-nav-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    text-decoration: none;
    color: #6b7280;
    font-size: 0.8125rem;
    font-weight: 500;
    border-radius: 6px;
    transition: all 0.2s ease;
    min-height: 36px;
  }
  
  .sub-nav-link:hover,
  .sub-nav-link:focus {
    background: rgba(13, 71, 161, 0.05);
    color: var(--primary);
  }
  
  .sub-nav-link.active {
    background: rgba(13, 71, 161, 0.08);
    color: var(--primary);
    font-weight: 600;
  }
  
  .sub-nav-label {
    flex: 1;
  }
  
  /* Sidebar footer */
  .sidebar-footer {
    padding: 1rem 1.25rem;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .user-avatar {
    width: 32px;
    height: 32px;
    background: var(--primary);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
    flex-shrink: 0;
  }
  
  .user-details {
    flex: 1;
    min-width: 0;
  }
  
  .user-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .user-role {
    font-size: 0.75rem;
    color: #6b7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  /* Desktop layout adjustments */
  @media (min-width: 1024px) {
    .sidebar.fixed {
      position: sticky;
      top: 0;
      height: 100vh;
    }
  }
  
  /* Mobile optimizations */
  @media (max-width: 1023px) {
    .sidebar {
      width: min(var(--sidebar-width), calc(100vw - 4rem));
    }
  }
  
  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    .sidebar,
    .nav-link,
    .expand-icon,
    .close-button {
      transition: none;
    }
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    .sidebar {
      border-right: 2px solid #000;
    }
    
    .sidebar-header {
      border-bottom: 2px solid #000;
    }
    
    .sidebar-footer {
      border-top: 2px solid #000;
    }
    
    .nav-link.active {
      border: 1px solid var(--primary);
    }
  }
  
  /* Scrollbar styling */
  .sidebar-content::-webkit-scrollbar {
    width: 6px;
  }
  
  .sidebar-content::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .sidebar-content::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }
  
  .sidebar-content::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
</style>