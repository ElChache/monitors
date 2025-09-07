<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  
  let loading = true;
  let error = '';
  let success = false;
  let resendLoading = false;
  let resendSuccess = false;

  // Get token and email from URL parameters
  $: token = $page.url.searchParams.get('token');
  $: email = $page.url.searchParams.get('email');

  onMount(async () => {
    if (token) {
      await verifyEmail();
    } else {
      loading = false;
      error = 'Invalid verification link. Please check your email for the correct link.';
    }
  });

  const verifyEmail = async () => {
    loading = true;
    error = '';
    
    // TODO: Integrate with backend email verification API
    console.log('Email verification:', { token, email });
    
    // Simulated API call
    setTimeout(() => {
      loading = false;
      // Simulate success/failure
      const isValid = token && token.length > 10; // Simple simulation
      if (isValid) {
        success = true;
      } else {
        error = 'Invalid or expired verification link. Please request a new verification email.';
      }
    }, 2000);
  };

  const resendVerification = async () => {
    if (!email) {
      error = 'Email address not provided. Please sign up again.';
      return;
    }
    
    resendLoading = true;
    resendSuccess = false;
    
    // TODO: Integrate with backend resend verification API
    console.log('Resending verification email to:', email);
    
    // Simulated API call
    setTimeout(() => {
      resendLoading = false;
      resendSuccess = true;
    }, 1000);
  };
</script>

<div class="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <!-- Header -->
    <div class="text-center">
      <h2 class="text-3xl font-bold text-gray-900">Email Verification</h2>
      {#if email}
        <p class="mt-2 text-gray-600">Verifying your email address: {email}</p>
      {:else}
        <p class="mt-2 text-gray-600">Verifying your email address</p>
      {/if}
    </div>

    {#if loading}
      <!-- Loading State -->
      <div class="text-center py-8">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
          <svg class="animate-spin h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Verifying your email...</h3>
        <p class="text-sm text-gray-600">Please wait while we confirm your email address.</p>
      </div>
    {:else if success}
      <!-- Success State -->
      <div class="bg-secondary-50 border border-secondary-200 rounded-monitors p-6 text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-secondary-100 mb-4">
          <svg class="h-6 w-6 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-secondary-800 mb-2">Email verified successfully!</h3>
        <p class="text-sm text-secondary-600 mb-4">
          Your email has been confirmed. You can now sign in to your Monitors! account.
        </p>
        <div class="space-y-2">
          <a href="/auth/login" class="btn-primary block">Continue to Sign In</a>
          <a href="/" class="block text-sm text-gray-500 hover:text-gray-700">Go to Dashboard</a>
        </div>
      </div>
    {:else if error}
      <!-- Error State -->
      <div class="bg-accent-50 border border-accent-200 rounded-monitors p-6 text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-accent-100 mb-4">
          <svg class="h-6 w-6 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-accent-800 mb-2">Verification failed</h3>
        <p class="text-sm text-accent-600 mb-4">{error}</p>
        
        {#if email}
          <div class="space-y-2">
            <button 
              type="button"
              on:click={resendVerification}
              disabled={resendLoading}
              class="btn-primary {resendLoading ? 'opacity-50 cursor-not-allowed' : ''}"
            >
              {#if resendLoading}
                <svg class="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              {:else}
                Resend Verification Email
              {/if}
            </button>
            
            {#if resendSuccess}
              <p class="text-sm text-secondary-600">
                New verification email sent to {email}. Please check your inbox.
              </p>
            {/if}
          </div>
        {:else}
          <a href="/auth/signup" class="btn-primary">Sign Up Again</a>
        {/if}
      </div>
    {/if}

    <!-- Support Links -->
    <div class="text-center space-y-2">
      <p class="text-sm text-gray-600">
        Need help?
        <a href="/support" class="font-medium text-primary hover:text-primary-600">
          Contact Support
        </a>
      </p>
      <p class="text-sm text-gray-600">
        <a href="/auth/login" class="font-medium text-primary hover:text-primary-600">
          Back to Sign In
        </a>
      </p>
    </div>
  </div>
</div>