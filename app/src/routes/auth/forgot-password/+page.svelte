<script lang="ts">
  let email = '';
  let loading = false;
  let error = '';
  let success = false;

  const handleSubmit = async () => {
    loading = true;
    error = '';
    success = false;
    
    // Client-side validation
    if (!email.trim()) {
      error = 'Email is required';
      loading = false;
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      error = 'Please enter a valid email address';
      loading = false;
      return;
    }
    
    // TODO: Integrate with backend password reset API
    console.log('Password reset request:', { email });
    
    // Simulated API call
    setTimeout(() => {
      loading = false;
      success = true;
      // Will integrate with actual API in Iteration 1
    }, 1000);
  };
</script>

<div class="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <!-- Header -->
    <div class="text-center">
      <h2 class="text-3xl font-bold text-gray-900">Forgot your password?</h2>
      <p class="mt-2 text-gray-600">No worries! Enter your email and we'll send you a reset link</p>
    </div>

    {#if success}
      <!-- Success State -->
      <div class="bg-secondary-50 border border-secondary-200 rounded-monitors p-6 text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-secondary-100 mb-4">
          <svg class="h-6 w-6 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-secondary-800 mb-2">Reset link sent!</h3>
        <p class="text-sm text-secondary-600 mb-4">
          We've sent a password reset link to <strong>{email}</strong>. 
          Check your inbox and follow the instructions to reset your password.
        </p>
        <div class="space-y-2">
          <a href="/auth/login" class="btn-primary block">Back to Sign In</a>
          <button 
            type="button" 
            on:click={() => { success = false; email = ''; }}
            class="block w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Didn't receive the email? Try again
          </button>
        </div>
      </div>
    {:else}
      <!-- Reset Form -->
      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        {#if error}
          <div class="bg-accent-50 border border-accent-200 rounded-monitors p-4">
            <p class="text-sm text-accent-700">{error}</p>
          </div>
        {/if}

        <div>
          <label for="email" class="form-label">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            bind:value={email}
            class="form-input"
            placeholder="Enter your email address"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            class="w-full flex justify-center btn-primary {loading ? 'opacity-50 cursor-not-allowed' : ''}"
          >
            {#if loading}
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending reset link...
            {:else}
              Send Reset Link
            {/if}
          </button>
        </div>
      </form>
    {/if}

    <!-- Back to Login -->
    <div class="text-center">
      <p class="text-sm text-gray-600">
        Remember your password?
        <a href="/auth/login" class="font-medium text-primary hover:text-primary-600">
          Back to sign in
        </a>
      </p>
    </div>
  </div>
</div>