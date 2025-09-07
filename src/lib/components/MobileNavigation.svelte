<script lang="ts">
  import { page } from '$app/stores';
  import { fly, fade } from 'svelte/transition';
  
  export let isOpen = false;
  
  const navigationItems = [
    { href: '/', label: 'Dashboard', icon: '🏠' },
    { href: '/monitors/create', label: 'Create Monitor', icon: '➕' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
    { href: '/admin', label: 'Admin', icon: '👤' }
  ];
  
  function isActive(href: string): boolean {
    return $page.url.pathname === href || ($page.url.pathname.startsWith(href) && href !== '/');
  }
  
  function toggleMenu() {
    isOpen = !isOpen;
  }
  
  function closeMenu() {
    isOpen = false;
  }
</script>

<!-- Mobile hamburger button -->
<button
  class="mobile-menu-btn md:hidden"
  class:open={isOpen}
  on:click={toggleMenu}
  aria-label="Toggle menu"
  aria-expanded={isOpen}
>
  <span class="hamburger-line"></span>
  <span class="hamburger-line"></span>
  <span class="hamburger-line"></span>
</button>

<!-- Mobile navigation overlay -->
{#if isOpen}
  <div 
    class="mobile-nav-overlay" 
    transition:fade={{ duration: 200 }}
    on:click={closeMenu}
    on:keydown={(e) => e.key === 'Escape' && closeMenu()}
    role="button"
    tabindex="-1"
  >
    <nav 
      class="mobile-nav-menu"
      transition:fly={{ x: -300, duration: 300 }}
      on:click|stopPropagation
      on:keydown|stopPropagation
    >
      <div class="mobile-nav-header">
        <h2>Monitors</h2>
        <button class="close-btn" on:click={closeMenu} aria-label="Close menu">
          ✕
        </button>
      </div>
      
      <ul class="mobile-nav-list">
        {#each navigationItems as item}
          <li>
            <a 
              href={item.href}
              class="mobile-nav-link"
              class:active={isActive(item.href)}
              on:click={closeMenu}
            >
              <span class="nav-icon">{item.icon}</span>
              <span class="nav-label">{item.label}</span>
            </a>
          </li>
        {/each}
      </ul>
    </nav>
  </div>
{/if}

<style>
  /* Mobile hamburger button */
  .mobile-menu-btn {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 44px;
    height: 44px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    position: relative;
    z-index: 50;
  }

  .hamburger-line {
    width: 24px;
    height: 2px;
    background-color: var(--primary);
    margin: 2px 0;
    transition: all 0.3s ease;
    transform-origin: center;
  }

  .mobile-menu-btn.open .hamburger-line:nth-child(1) {
    transform: rotate(45deg) translate(5px, 5px);
  }

  .mobile-menu-btn.open .hamburger-line:nth-child(2) {
    opacity: 0;
  }

  .mobile-menu-btn.open .hamburger-line:nth-child(3) {
    transform: rotate(-45deg) translate(7px, -6px);
  }

  /* Mobile navigation overlay */
  .mobile-nav-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 40;
    backdrop-filter: blur(4px);
  }

  .mobile-nav-menu {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px;
    max-width: 80vw;
    background: white;
    box-shadow: 4px 0 12px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    z-index: 41;
  }

  .mobile-nav-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .mobile-nav-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--primary);
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: #6b7280;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    color: #374151;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }

  .mobile-nav-list {
    list-style: none;
    margin: 0;
    padding: 1rem 0;
    flex: 1;
  }

  .mobile-nav-link {
    display: flex;
    align-items: center;
    padding: 1rem 1.5rem;
    text-decoration: none;
    color: #374151;
    font-weight: 500;
    transition: all 0.2s ease;
    min-height: 56px; /* Touch-friendly height */
  }

  .mobile-nav-link:hover,
  .mobile-nav-link:focus {
    background: #f3f4f6;
    color: var(--primary);
  }

  .mobile-nav-link.active {
    background: rgba(29, 78, 216, 0.1);
    color: var(--primary);
    border-right: 3px solid var(--primary);
  }

  .nav-icon {
    font-size: 1.25rem;
    margin-right: 0.875rem;
    width: 24px;
    text-align: center;
  }

  .nav-label {
    font-size: 1rem;
  }

  /* Hide on desktop */
  @media (min-width: 768px) {
    .mobile-menu-btn {
      display: none;
    }
  }
</style>