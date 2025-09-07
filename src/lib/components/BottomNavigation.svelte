<script lang="ts">
  import { page } from '$app/stores';
  
  const navItems = [
    { 
      href: '/', 
      label: 'Dashboard', 
      icon: '🏠',
      activeIcon: '🏠'
    },
    { 
      href: '/monitors/create', 
      label: 'Create', 
      icon: '➕',
      activeIcon: '✅'
    },
    { 
      href: '/settings', 
      label: 'Settings', 
      icon: '⚙️',
      activeIcon: '⚙️'
    },
    { 
      href: '/admin', 
      label: 'Admin', 
      icon: '👤',
      activeIcon: '👤'
    }
  ];
  
  function isActive(href: string): boolean {
    if (href === '/') {
      return $page.url.pathname === '/';
    }
    return $page.url.pathname.startsWith(href);
  }
</script>

<nav class="bottom-navigation" aria-label="Main navigation">
  <div class="nav-container">
    {#each navItems as item}
      <a 
        href={item.href}
        class="nav-item"
        class:active={isActive(item.href)}
        aria-label="Navigate to {item.label}"
        data-sveltekit-preload-data="hover"
      >
        <div class="nav-icon">
          {isActive(item.href) ? item.activeIcon : item.icon}
        </div>
        <span class="nav-label">{item.label}</span>
        {#if isActive(item.href)}
          <div class="active-indicator"></div>
        {/if}
      </a>
    {/each}
  </div>
</nav>

<style>
  .bottom-navigation {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-top: 1px solid #e5e7eb;
    z-index: 30;
    padding: env(safe-area-inset-bottom) 0 0 0; /* iOS safe area support */
    display: none; /* Hidden by default, shown on mobile */
  }
  
  /* Show on mobile only */
  @media (max-width: 767px) {
    .bottom-navigation {
      display: block;
    }
  }
  
  .nav-container {
    display: flex;
    max-width: 500px; /* Reasonable max width */
    margin: 0 auto;
    padding: 0.5rem;
  }
  
  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 0.5rem;
    text-decoration: none;
    color: #6b7280;
    transition: all 0.2s ease;
    border-radius: 12px;
    position: relative;
    min-height: 64px; /* Touch-friendly minimum */
    user-select: none;
  }
  
  .nav-item:hover {
    background: rgba(29, 78, 216, 0.05);
    color: var(--primary);
  }
  
  .nav-item:active {
    transform: scale(0.95);
    background: rgba(29, 78, 216, 0.1);
  }
  
  .nav-item.active {
    color: var(--primary);
    background: rgba(29, 78, 216, 0.08);
    font-weight: 600;
  }
  
  .nav-icon {
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
  }
  
  .nav-item.active .nav-icon {
    transform: scale(1.1);
  }
  
  .nav-label {
    font-size: 0.75rem;
    font-weight: 500;
    text-align: center;
    line-height: 1.1;
  }
  
  .active-indicator {
    position: absolute;
    top: 0.25rem;
    left: 50%;
    transform: translateX(-50%);
    width: 24px;
    height: 3px;
    background: var(--primary);
    border-radius: 0 0 2px 2px;
    animation: indicator-slide 0.3s ease-out;
  }
  
  @keyframes indicator-slide {
    from {
      width: 0;
      opacity: 0;
    }
    to {
      width: 24px;
      opacity: 1;
    }
  }
  
  /* Support for devices with notches/safe areas */
  @supports (bottom: env(safe-area-inset-bottom)) {
    .bottom-navigation {
      padding-bottom: env(safe-area-inset-bottom);
    }
  }
  
  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    .nav-item,
    .nav-icon,
    .active-indicator {
      transition: none;
      animation: none;
    }
    
    .nav-item:active {
      transform: none;
    }
    
    .nav-item.active .nav-icon {
      transform: none;
    }
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .bottom-navigation {
      background: white;
      border-top: 2px solid #000;
    }
    
    .nav-item {
      border: 1px solid transparent;
    }
    
    .nav-item.active {
      border-color: #000;
    }
  }
  
  /* Dark mode support (future) */
  @media (prefers-color-scheme: dark) {
    .bottom-navigation {
      background: rgba(17, 24, 39, 0.95);
      border-top-color: #374151;
    }
    
    .nav-item {
      color: #9ca3af;
    }
    
    .nav-item.active {
      color: #60a5fa;
    }
  }
  
  /* Landscape phone adjustments */
  @media (max-width: 767px) and (orientation: landscape) {
    .nav-container {
      padding: 0.25rem;
    }
    
    .nav-item {
      padding: 0.5rem 0.25rem;
      min-height: 48px;
    }
    
    .nav-icon {
      font-size: 1.25rem;
      margin-bottom: 0.125rem;
    }
    
    .nav-label {
      font-size: 0.6875rem;
    }
  }
</style>