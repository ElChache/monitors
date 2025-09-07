<script lang="ts">
  import { onMount } from 'svelte';
  
  let currentYear = new Date().getFullYear();
  let systemStatus = 'operational'; // operational, maintenance, degraded
  let lastUpdated = '';
  
  onMount(() => {
    // Update timestamp
    lastUpdated = new Date().toLocaleString();
    
    // Simulate system status check (in real app, this would be an API call)
    const checkSystemStatus = async () => {
      try {
        // This would be a real status endpoint in production
        systemStatus = 'operational';
      } catch {
        systemStatus = 'degraded';
      }
    };
    
    checkSystemStatus();
  });
  
  const footerLinks = {
    product: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'API Documentation', href: '/docs' },
      { label: 'Status', href: '/status' }
    ],
    company: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' }
    ],
    support: [
      { label: 'Help Center', href: '/help' },
      { label: 'Community', href: '/community' },
      { label: 'Tutorials', href: '/tutorials' },
      { label: 'FAQ', href: '/faq' }
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Security', href: '/security' }
    ]
  };
  
  function getStatusIcon(status: string) {
    switch (status) {
      case 'operational': return '🟢';
      case 'maintenance': return '🟡';
      case 'degraded': return '🟠';
      default: return '🔴';
    }
  }
  
  function getStatusText(status: string) {
    switch (status) {
      case 'operational': return 'All Systems Operational';
      case 'maintenance': return 'Scheduled Maintenance';
      case 'degraded': return 'Degraded Performance';
      default: return 'System Issues';
    }
  }
</script>

<footer class="footer">
  <!-- Main footer content -->
  <div class="footer-main">
    <div class="footer-container">
      <!-- Brand section -->
      <div class="footer-brand">
        <div class="brand-info">
          <div class="footer-logo">
            <span class="logo-icon">📊</span>
            <span class="logo-text">Monitors</span>
          </div>
          <p class="brand-description">
            AI-powered monitoring platform for real-time insights and intelligent alerts.
          </p>
        </div>
        
        <!-- System status -->
        <div class="system-status">
          <div class="status-item">
            <span class="status-icon">{getStatusIcon(systemStatus)}</span>
            <span class="status-text">{getStatusText(systemStatus)}</span>
          </div>
          {#if lastUpdated}
            <div class="status-updated">
              Last updated: {lastUpdated}
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Links sections -->
      <div class="footer-links">
        <div class="links-section">
          <h3 class="section-title">Product</h3>
          <ul class="link-list">
            {#each footerLinks.product as link}
              <li>
                <a href={link.href} class="footer-link">{link.label}</a>
              </li>
            {/each}
          </ul>
        </div>
        
        <div class="links-section">
          <h3 class="section-title">Company</h3>
          <ul class="link-list">
            {#each footerLinks.company as link}
              <li>
                <a href={link.href} class="footer-link">{link.label}</a>
              </li>
            {/each}
          </ul>
        </div>
        
        <div class="links-section">
          <h3 class="section-title">Support</h3>
          <ul class="link-list">
            {#each footerLinks.support as link}
              <li>
                <a href={link.href} class="footer-link">{link.label}</a>
              </li>
            {/each}
          </ul>
        </div>
        
        <div class="links-section">
          <h3 class="section-title">Legal</h3>
          <ul class="link-list">
            {#each footerLinks.legal as link}
              <li>
                <a href={link.href} class="footer-link">{link.label}</a>
              </li>
            {/each}
          </ul>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Footer bottom -->
  <div class="footer-bottom">
    <div class="footer-container">
      <div class="footer-bottom-content">
        <div class="copyright">
          <p>&copy; {currentYear} Monitors. All rights reserved.</p>
        </div>
        
        <div class="social-links">
          <a href="https://twitter.com/monitors" class="social-link" aria-label="Follow us on Twitter">
            🐦
          </a>
          <a href="https://github.com/monitors" class="social-link" aria-label="View our code on GitHub">
            🐙
          </a>
          <a href="https://linkedin.com/company/monitors" class="social-link" aria-label="Connect with us on LinkedIn">
            💼
          </a>
        </div>
        
        <div class="footer-meta">
          <span class="build-info">v1.0.0</span>
          <span class="separator">•</span>
          <span class="region">US East</span>
        </div>
      </div>
    </div>
  </div>
</footer>

<style>
  .footer {
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
    margin-top: auto; /* Push footer to bottom of page */
  }
  
  .footer-main {
    padding: 3rem 0 2rem;
  }
  
  .footer-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  
  .footer-main .footer-container {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 3rem;
  }
  
  /* Brand section */
  .footer-brand {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .footer-logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .logo-icon {
    font-size: 1.5rem;
  }
  
  .logo-text {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
  }
  
  .brand-description {
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.6;
    margin: 0;
    max-width: 280px;
  }
  
  /* System status */
  .system-status {
    padding: 1rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 0.875rem;
  }
  
  .status-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }
  
  .status-icon {
    font-size: 0.75rem;
  }
  
  .status-updated {
    color: #6b7280;
    font-size: 0.75rem;
  }
  
  /* Links sections */
  .footer-links {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2rem;
  }
  
  .links-section {
    display: flex;
    flex-direction: column;
  }
  
  .section-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 1rem 0;
  }
  
  .link-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .footer-link {
    color: #6b7280;
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.2s ease;
    padding: 0.25rem 0;
  }
  
  .footer-link:hover,
  .footer-link:focus {
    color: var(--primary);
  }
  
  /* Footer bottom */
  .footer-bottom {
    padding: 1.5rem 0;
    border-top: 1px solid #e5e7eb;
    background: #f3f4f6;
  }
  
  .footer-bottom-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .copyright {
    margin: 0;
  }
  
  .copyright p {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0;
  }
  
  .social-links {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .social-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: white;
    border: 1px solid #e5e7eb;
    text-decoration: none;
    font-size: 1rem;
    transition: all 0.2s ease;
  }
  
  .social-link:hover,
  .social-link:focus {
    background: var(--primary);
    border-color: var(--primary);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(13, 71, 161, 0.2);
  }
  
  .footer-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #9ca3af;
    font-size: 0.75rem;
  }
  
  .separator {
    opacity: 0.5;
  }
  
  /* Mobile responsive design */
  @media (max-width: 1024px) {
    .footer-links {
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
  }
  
  @media (max-width: 768px) {
    .footer-main .footer-container {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    
    .footer-main {
      padding: 2rem 0 1.5rem;
    }
    
    .footer-links {
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    
    .footer-brand {
      gap: 1.5rem;
    }
    
    .system-status {
      padding: 0.75rem;
    }
  }
  
  @media (max-width: 640px) {
    .footer-container {
      padding: 0 1rem;
    }
    
    .footer-links {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
    
    .footer-bottom-content {
      flex-direction: column;
      text-align: center;
      gap: 1rem;
    }
    
    .social-links {
      order: -1;
    }
    
    .brand-description {
      max-width: 100%;
    }
  }
  
  /* Mobile touch optimization */
  @media (max-width: 767px) {
    .footer-link {
      padding: 0.5rem 0;
      min-height: 44px;
      display: flex;
      align-items: center;
    }
    
    .social-link {
      width: 44px;
      height: 44px;
    }
  }
  
  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    .footer-link,
    .social-link {
      transition: none;
    }
    
    .social-link:hover,
    .social-link:focus {
      transform: none;
    }
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    .footer {
      border-top: 2px solid #000;
    }
    
    .footer-bottom {
      border-top: 2px solid #000;
    }
    
    .social-link {
      border: 2px solid #000;
    }
    
    .social-link:focus {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }
  }
  
  /* Print styles */
  @media print {
    .footer {
      display: none;
    }
  }
</style>