<script lang="ts">
  let name = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let loading = false;
  let error = '';
  let success = false;

  // Password strength state
  let passwordStrength = 0;
  let passwordFeedback = '';

  $: {
    // Password strength calculation
    if (password.length === 0) {
      passwordStrength = 0;
      passwordFeedback = '';
    } else if (password.length < 8) {
      passwordStrength = 1;
      passwordFeedback = 'Password must be at least 8 characters';
    } else {
      let score = 0;
      if (/[a-z]/.test(password)) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;
      
      passwordStrength = Math.min(score, 4);
      
      if (score === 1) passwordFeedback = 'Weak password - add uppercase, numbers, or symbols';
      else if (score === 2) passwordFeedback = 'Fair password - consider adding more variety';
      else if (score === 3) passwordFeedback = 'Good password - very secure';
      else if (score === 4) passwordFeedback = 'Excellent password - maximum security';
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-accent';
    if (passwordStrength === 2) return 'bg-warning';
    if (passwordStrength === 3) return 'bg-secondary';
    return 'bg-secondary';
  };

  const getPasswordStrengthWidth = () => {
    return `${(passwordStrength / 4) * 100}%`;
  };

  const handleSubmit = async () => {
    // Reset state
    loading = true;
    error = '';
    success = false;
    
    // Client-side validation
    if (!name.trim()) {
      error = 'Name is required';
      loading = false;
      return;
    }
    
    if (!email.trim()) {
      error = 'Email is required';
      loading = false;
      return;
    }
    
    if (passwordStrength < 2) {
      error = 'Please choose a stronger password';
      loading = false;
      return;
    }
    
    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      loading = false;
      return;
    }
    
    // TODO: Integrate with backend authentication API
    console.log('Signup attempt:', { name, email, password: '***' });
    
    // Simulated signup for now
    setTimeout(() => {
      loading = false;
      success = true;
      // Will integrate with actual auth in Iteration 1
    }, 1500);
  };
</script>

<div class="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <!-- Header -->
    <div class="text-center">
      <h2 class="text-3xl font-bold text-gray-900">Create your Monitors! account</h2>
      <p class="mt-2 text-gray-600">Join and start tracking what matters to you</p>
    </div>

    {#if success}
      <!-- Success State -->
      <div class="bg-secondary-50 border border-secondary-200 rounded-monitors p-6 text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-secondary-100 mb-4">
          <svg class="h-6 w-6 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-secondary-800 mb-2">Account created successfully!</h3>
        <p class="text-sm text-secondary-600 mb-4">
          We've sent a verification email to <strong>{email}</strong>. Please check your inbox and click the verification link.
        </p>
        <a href="/auth/login" class="btn-primary">Continue to Sign In</a>
      </div>
    {:else}
      <!-- Signup Form -->
      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        {#if error}
          <div class="bg-accent-50 border border-accent-200 rounded-monitors p-4">
            <p class="text-sm text-accent-700">{error}</p>
          </div>
        {/if}

        <div>
          <label for="name" class="form-label">Full name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            bind:value={name}
            class="form-input"
            placeholder="Enter your full name"
          />
        </div>

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
            placeholder="Create a secure password"
          />
          
          <!-- Password Strength Indicator -->
          {#if password.length > 0}
            <div class="mt-2">
              <div class="flex justify-between text-xs mb-1">
                <span class="text-gray-500">Password strength</span>
                <span class="text-gray-600">{passwordFeedback}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="h-2 rounded-full transition-all duration-300 {getPasswordStrengthColor()}"
                  style="width: {getPasswordStrengthWidth()}"
                ></div>
              </div>
            </div>
          {/if}
        </div>

        <div>
          <label for="confirm-password" class="form-label">Confirm password</label>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            required
            bind:value={confirmPassword}
            class="form-input"
            placeholder="Confirm your password"
          />
          {#if confirmPassword && password !== confirmPassword}
            <p class="mt-1 text-sm text-accent-600">Passwords do not match</p>
          {/if}
        </div>

        <div class="flex items-center">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            required
            class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label for="terms" class="ml-2 block text-sm text-gray-900">
            I agree to the <a href="/terms" class="text-primary hover:text-primary-600 font-medium">Terms of Service</a> 
            and <a href="/privacy" class="text-primary hover:text-primary-600 font-medium">Privacy Policy</a>
          </label>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading || passwordStrength < 2}
            class="w-full flex justify-center btn-primary {loading || passwordStrength < 2 ? 'opacity-50 cursor-not-allowed' : ''}"
          >
            {#if loading}
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating account...
            {:else}
              Create Account
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
    {/if}

    <!-- Sign in link -->
    <div class="text-center">
      <p class="text-sm text-gray-600">
        Already have an account?
        <a href="/auth/login" class="font-medium text-primary hover:text-primary-600">
          Sign in here
        </a>
      </p>
    </div>
  </div>
</div>