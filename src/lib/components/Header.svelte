<script lang="ts">
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import MobileNavigation from './MobileNavigation.svelte';
  
  export let user = {
    name: 'John Doe',
    email: 'john@example.com',
    avatar: null,
    isAdmin: false
  };
  
  let showUserMenu = false;
  let userMenuElement: HTMLElement;
  
  // Get user initials for avatar
  $: userInitials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  // Handle click outside to close user menu
  function handleClickOutside(event: MouseEvent) {
    if (userMenuElement && !userMenuElement.contains(event.target as Node)) {
      showUserMenu = false;
    }
  }
  
  function toggleUserMenu() {
    showUserMenu = !showUserMenu;
  }
  
  function closeUserMenu() {
    showUserMenu = false;
  }
  
  // Navigation items for desktop
  const navigationItems = [
    { href: '/', label: 'Dashboard', show: true },
    { href: '/monitors/create', label: 'Create Monitor', show: true },
    { href: '/settings', label: 'Settings', show: true },
    { href: '/admin', label: 'Admin', show: () => user.isAdmin }
  ];
  
  function isActive(href: string): boolean {
    if (href === '/') {
      return $page.url.pathname === '/';
    }
    return $page.url.pathname.startsWith(href);
  }
  
  function shouldShowItem(item: any): boolean {
    return typeof item.show === 'function' ? item.show() : item.show;
  }
</script>

<svelte:window on:click={handleClickOutside} />

<header class="header">
  <div class="header-container">
    <!-- Logo and brand -->
    <div class="brand">
      <a href="/" class="brand-link" aria-label="Monitors - Home">
        <div class="logo">📊</div>
        <span class="brand-text">Monitors</span>
      </a>
    </div>
    
    <!-- Desktop navigation -->
    <nav class="desktop-nav" aria-label="Main navigation">
      <ul class="nav-list">
        {#each navigationItems as item}
          {#if shouldShowItem(item)}
            <li>
              <a 
                href={item.href}
                class="nav-link"
                class:active={isActive(item.href)}
                data-sveltekit-preload-data="hover"
              >
                {item.label}
              </a>
            </li>
          {/if}
        {/each}
      </ul>
    </nav>
    
    <!-- User menu and mobile navigation -->
    <div class="header-actions">
      <!-- User menu (desktop) -->
      <div class="user-menu" bind:this={userMenuElement}>
        <button 
          class="user-button"
          class:active={showUserMenu}
          on:click={toggleUserMenu}
          aria-label="Open user menu"
          aria-expanded={showUserMenu}
          aria-haspopup="true"
        >
          <div class="user-avatar">
            {#if user.avatar}
              <img src={user.avatar} alt="User avatar" class="avatar-image" />
            {:else}
              <span class="avatar-text">{userInitials}</span>
            {/if}
          </div>
          <span class="user-name">{user.name}</span>
          <svg 
            class="dropdown-icon" 
            class:rotated={showUserMenu}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {#if showUserMenu}
          <div class="user-dropdown">
            <div class="dropdown-header">
              <div class="user-info">
                <div class="user-display-name">{user.name}</div>
                <div class="user-email">{user.email}</div>
              </div>
            </div>
            
            <div class="dropdown-divider"></div>
            
            <nav class="dropdown-nav">
              <a href="/settings" class="dropdown-item" on:click={closeUserMenu}>
                <span class="item-icon">⚙️</span>
                Settings
              </a>
              
              {#if user.isAdmin}
                <a href="/admin" class="dropdown-item" on:click={closeUserMenu}>
                  <span class="item-icon">👤</span>
                  Admin Panel
                </a>
              {/if}
              
              <div class="dropdown-divider"></div>
              
              <button class="dropdown-item logout-item" on:click={closeUserMenu}>
                <span class="item-icon">🚪</span>
                Sign Out
              </button>
            </nav>
          </div>
        {/if}
      </div>
      
      <!-- Mobile navigation toggle -->
      <MobileNavigation />
    </div>
  </div>
</header>

<style>
  .header {
    position: sticky;
    top: 0;
    z-index: 40;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  }
  
  .header-container {
    max-width: 1280px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    height: 64px;
  }
  
  /* Brand and logo */
  .brand {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  
  .brand-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    color: #1f2937;
    font-weight: 600;
    transition: color 0.2s ease;
  }
  
  .brand-link:hover {
    color: var(--primary);
  }
  
  .logo {
    font-size: 1.75rem;
    line-height: 1;
  }
  
  .brand-text {
    font-size: 1.25rem;
    font-weight: 700;
  }
  
  /* Desktop navigation */
  .desktop-nav {
    display: none;
  }
  
  @media (min-width: 768px) {
    .desktop-nav {
      display: block;
      flex: 1;
      margin: 0 2rem;
    }
  }
  
  .nav-list {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .nav-link {
    display: block;
    padding: 0.5rem 1rem;
    text-decoration: none;
    color: #6b7280;
    font-weight: 500;
    border-radius: 8px;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  
  .nav-link:hover,
  .nav-link:focus {
    color: var(--primary);
    background: rgba(13, 71, 161, 0.05);
  }
  
  .nav-link.active {
    color: var(--primary);
    background: rgba(13, 71, 161, 0.08);
    font-weight: 600;
  }
  
  /* Header actions */
  .header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  /* User menu */
  .user-menu {
    position: relative;
    display: none;
  }
  
  @media (min-width: 768px) {
    .user-menu {
      display: block;
    }
  }
  
  .user-button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    background: none;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #374151;
  }
  
  .user-button:hover,
  .user-button.active {
    background: rgba(13, 71, 161, 0.05);
    color: var(--primary);
  }
  
  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .avatar-text {
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  .user-name {
    font-size: 0.875rem;
    font-weight: 500;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .dropdown-icon {
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }
  
  .dropdown-icon.rotated {
    transform: rotate(180deg);
  }
  
  /* User dropdown */
  .user-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    min-width: 240px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    z-index: 50;
    animation: dropdown-appear 0.2s ease-out;
  }
  
  @keyframes dropdown-appear {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .dropdown-header {
    padding: 1rem;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .user-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .user-display-name {
    font-weight: 600;
    color: #1f2937;
    font-size: 0.875rem;
  }
  
  .user-email {
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .dropdown-divider {
    height: 1px;
    background: #e5e7eb;
    margin: 0.5rem 0;
  }
  
  .dropdown-nav {
    padding: 0.5rem;
  }
  
  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem;
    text-decoration: none;
    color: #374151;
    font-size: 0.875rem;
    font-weight: 500;
    border: none;
    background: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }
  
  .dropdown-item:hover,
  .dropdown-item:focus {
    background: rgba(13, 71, 161, 0.05);
    color: var(--primary);
  }
  
  .logout-item:hover {
    background: rgba(239, 68, 68, 0.05);
    color: #dc2626;
  }
  
  .item-icon {
    font-size: 1rem;
    width: 20px;
    text-align: center;
  }
  
  /* Mobile optimizations */
  @media (max-width: 767px) {
    .header-container {
      padding: 0.75rem 1rem;
    }
    
    .brand-text {
      font-size: 1.125rem;
    }
    
    .logo {
      font-size: 1.5rem;
    }
  }
  
  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    .nav-link,
    .user-button,
    .dropdown-item,
    .dropdown-icon {
      transition: none;
    }
    
    .user-dropdown {
      animation: none;
    }
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    .header {
      border-bottom: 2px solid #000;
    }
    
    .nav-link.active {
      border: 1px solid var(--primary);
    }
    
    .user-dropdown {
      border: 2px solid #000;
    }
  }
</style>