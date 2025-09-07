<script lang="ts">
  import { page } from '$app/stores';
  
  export let customItems: Array<{ label: string; href?: string }> = [];
  
  interface BreadcrumbItem {
    label: string;
    href?: string;
    current?: boolean;
  }
  
  // Auto-generate breadcrumbs from current route
  $: pathSegments = $page.url.pathname.split('/').filter(Boolean);
  
  $: autoBreadcrumbs = pathSegments.reduce((items: BreadcrumbItem[], segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    const isLast = index === pathSegments.length - 1;
    
    let label = segment;
    
    // Convert common route segments to readable labels
    const routeLabels: Record<string, string> = {
      'monitors': 'Monitors',
      'create': 'Create',
      'settings': 'Settings',
      'admin': 'Admin Panel',
      'profile': 'Profile'
    };
    
    if (routeLabels[segment]) {
      label = routeLabels[segment];
    } else {
      // Capitalize and format segment
      label = segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    items.push({
      label,
      href: isLast ? undefined : href,
      current: isLast
    });
    
    return items;
  }, []);
  
  // Use custom items if provided, otherwise use auto-generated
  $: breadcrumbItems = customItems.length > 0 
    ? customItems.map((item, index) => ({
        ...item,
        current: index === customItems.length - 1
      }))
    : [{ label: 'Dashboard', href: '/' }, ...autoBreadcrumbs];
  
  // Don't show breadcrumbs on homepage
  $: showBreadcrumbs = $page.url.pathname !== '/' || customItems.length > 0;
</script>

{#if showBreadcrumbs}
  <nav class="breadcrumbs" aria-label="Breadcrumb navigation">
    <ol class="breadcrumb-list" role="list">
      {#each breadcrumbItems as item, index}
        <li class="breadcrumb-item" class:current={item.current}>
          {#if item.href && !item.current}
            <a 
              href={item.href} 
              class="breadcrumb-link"
              data-sveltekit-preload-data="hover"
            >
              {item.label}
            </a>
          {:else}
            <span class="breadcrumb-current" aria-current="page">
              {item.label}
            </span>
          {/if}
          
          {#if index < breadcrumbItems.length - 1}
            <svg 
              class="breadcrumb-separator" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          {/if}
        </li>
      {/each}
    </ol>
  </nav>
{/if}

<style>
  .breadcrumbs {
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    padding: 0.75rem 0;
  }
  
  .breadcrumb-list {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    list-style: none;
  }
  
  .breadcrumb-item {
    display: flex;
    align-items: center;
    font-size: 0.875rem;
  }
  
  .breadcrumb-link {
    color: #6b7280;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s ease;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    min-height: 32px; /* Touch-friendly minimum */
    display: flex;
    align-items: center;
  }
  
  .breadcrumb-link:hover,
  .breadcrumb-link:focus {
    color: var(--primary);
    background: rgba(13, 71, 161, 0.05);
  }
  
  .breadcrumb-current {
    color: #1f2937;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
  }
  
  .breadcrumb-separator {
    width: 16px;
    height: 16px;
    color: #9ca3af;
    margin: 0 0.25rem;
    flex-shrink: 0;
  }
  
  /* Mobile optimizations */
  @media (max-width: 640px) {
    .breadcrumb-list {
      padding: 0 1rem;
      gap: 0.25rem;
    }
    
    .breadcrumb-item {
      font-size: 0.8125rem;
    }
    
    .breadcrumb-link,
    .breadcrumb-current {
      padding: 0.375rem 0.5rem;
      min-height: 36px;
    }
    
    .breadcrumb-separator {
      width: 14px;
      height: 14px;
      margin: 0 0.125rem;
    }
    
    /* Truncate very long breadcrumb items on mobile */
    .breadcrumb-link,
    .breadcrumb-current {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  
  /* Very small screens */
  @media (max-width: 480px) {
    .breadcrumb-list {
      padding: 0 0.75rem;
    }
    
    .breadcrumb-link,
    .breadcrumb-current {
      max-width: 120px;
    }
  }
  
  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    .breadcrumb-link {
      transition: none;
    }
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    .breadcrumbs {
      border-bottom: 2px solid #000;
    }
    
    .breadcrumb-link:focus {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }
  }
  
  /* Print styles */
  @media print {
    .breadcrumbs {
      background: transparent;
      border-bottom: 1px solid #000;
    }
    
    .breadcrumb-link {
      color: #000;
      text-decoration: underline;
    }
  }
</style>