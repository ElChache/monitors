<script lang="ts">
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import Header from './Header.svelte';
  import Footer from './Footer.svelte';
  import Breadcrumbs from './Breadcrumbs.svelte';
  import BottomNavigation from './BottomNavigation.svelte';
  import ErrorBoundary from './ErrorBoundary.svelte';
  import ToastContainer from './ToastContainer.svelte';
  
  export let showHeader = true;
  export let showFooter = true;
  export let showBreadcrumbs = true;
  export let showBottomNav = true;
  export let customBreadcrumbs: Array<{ label: string; href?: string }> = [];
  export let maxWidth = '1280px';
  export let paddingY = '2rem';
  export let paddingX = '1rem';
  
  // Mock user data (in real app, this would come from a store/context)
  const user = {
    name: 'John Doe',
    email: 'john@example.com',
    avatar: null,
    isAdmin: true
  };
  
  // Determine layout type based on route
  $: isAuthPage = $page.url.pathname.startsWith('/auth') || 
                  $page.url.pathname.startsWith('/login') || 
                  $page.url.pathname.startsWith('/register');
  
  $: isFullWidthPage = $page.url.pathname.startsWith('/admin') ||
                       $page.url.pathname.startsWith('/dashboard');
  
  // Dynamic layout configuration
  $: layoutConfig = {
    showHeader: showHeader && !isAuthPage,
    showFooter: showFooter && !isAuthPage,
    showBreadcrumbs: showBreadcrumbs && !isAuthPage && $page.url.pathname !== '/',
    showBottomNav: showBottomNav && !isAuthPage,
    contentMaxWidth: isFullWidthPage ? '100%' : maxWidth,
    contentPadding: isAuthPage ? '1rem' : `${paddingY} ${paddingX}`
  };
  
  // Add padding for mobile bottom navigation
  $: mainPaddingBottom = layoutConfig.showBottomNav ? '80px' : '0';
</script>

<ErrorBoundary>
  <div class="layout" class:auth-layout={isAuthPage}>
    <!-- Header -->
    {#if layoutConfig.showHeader}
      <Header {user} />
    {/if}
    
    <!-- Breadcrumbs -->
    {#if layoutConfig.showBreadcrumbs}
      <Breadcrumbs customItems={customBreadcrumbs} />
    {/if}
    
    <!-- Main content -->
    <main 
      class="main-content"
      class:full-width={isFullWidthPage}
      class:auth-main={isAuthPage}
      style="
        max-width: {layoutConfig.contentMaxWidth}; 
        padding: {layoutConfig.contentPadding};
        padding-bottom: calc({paddingY} + {mainPaddingBottom});
      "
    >
      <div class="content-wrapper">
        <slot />
      </div>
    </main>
    
    <!-- Footer -->
    {#if layoutConfig.showFooter}
      <Footer />
    {/if}
    
    <!-- Mobile bottom navigation -->
    {#if layoutConfig.showBottomNav}
      <BottomNavigation />
    {/if}
  </div>
</ErrorBoundary>

<!-- Toast Notifications Container -->
<ToastContainer position="top-right" />

<style>
  .layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #ffffff;
  }
  
  .auth-layout {
    background: #f9fafb;
  }
  
  .main-content {
    flex: 1;
    margin: 0 auto;
    width: 100%;
    position: relative;
  }
  
  .main-content.full-width {
    max-width: none !important;
    margin: 0;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
  
  .auth-main {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem 1rem !important;
  }
  
  .content-wrapper {
    width: 100%;
    position: relative;
  }
  
  /* Full-width content adjustments */
  .full-width .content-wrapper {
    max-width: none;
  }
  
  /* Mobile optimizations */
  @media (max-width: 767px) {
    .main-content {
      padding-left: 1rem !important;
      padding-right: 1rem !important;
    }
    
    .auth-main {
      padding: 1rem !important;
      min-height: calc(100vh - 80px); /* Account for mobile browser UI */
    }
    
    /* Adjust for mobile bottom navigation */
    .layout:not(.auth-layout) .main-content {
      margin-bottom: 0;
    }
  }
  
  /* Tablet adjustments */
  @media (min-width: 768px) and (max-width: 1023px) {
    .main-content {
      padding-left: 1.5rem !important;
      padding-right: 1.5rem !important;
    }
  }
  
  /* Large screen optimizations */
  @media (min-width: 1280px) {
    .main-content:not(.full-width) {
      padding-left: 2rem !important;
      padding-right: 2rem !important;
    }
  }
  
  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    .main-content {
      transition: none;
    }
  }
  
  /* Print styles */
  @media print {
    .layout {
      background: white;
    }
    
    .main-content {
      padding: 0 !important;
      margin: 0 !important;
      max-width: none !important;
    }
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    .layout {
      background: white;
    }
    
    .auth-layout {
      background: white;
      border: 2px solid #000;
    }
  }
  
  /* Focus management */
  .main-content:focus {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
  
  /* Smooth scrolling for anchor links */
  @media (prefers-reduced-motion: no-preference) {
    :global(html) {
      scroll-behavior: smooth;
    }
  }
</style>