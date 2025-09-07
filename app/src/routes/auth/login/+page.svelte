<script lang="ts">
  let email = '';
  let password = '';
  let loading = false;
  let error = '';

  const handleSubmit = async () => {
    loading = true;
    error = '';
    
    // TODO: Integrate with backend authentication API
    console.log('Login attempt:', { email, password: '***' });
    
    // Simulated login for now
    setTimeout(() => {
      loading = false;
      // Will integrate with actual auth in Iteration 1
    }, 1000);
  };
</script>

<div class="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <!-- Header -->
    <div class="text-center">
      <h2 class="text-3xl font-bold text-gray-900">Sign in to Monitors!</h2>
      <p class="mt-2 text-gray-600">Track what matters to you</p>
    </div>

    <!-- Login Form -->
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
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label for="password" class="form-label">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          bind:value={password}
          class="form-input"
          placeholder="Enter your password"
        />
      </div>

      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label for="remember-me" class="ml-2 block text-sm text-gray-900">
            Remember me
          </label>
        </div>

        <div class="text-sm">
          <a href="/auth/forgot-password" class="font-medium text-primary hover:text-primary-600">
            Forgot your password?
          </a>
        </div>
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
            Signing in...
          {:else}
            Sign in
          {/if}
        </button>
      </div>

      <!-- OAuth Section -->
      <div class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-gray-50 text-gray-500">Or continue with</span>
          </div>
        </div>

        <div class="mt-6">
          <button
            type="button"
            class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-monitors shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <svg class="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </form>

    <!-- Sign up link -->
    <div class="text-center">
      <p class="text-sm text-gray-600">
        Don't have an account?
        <a href="/auth/signup" class="font-medium text-primary hover:text-primary-600">
          Sign up here
        </a>
      </p>
    </div>
  </div>
</div>