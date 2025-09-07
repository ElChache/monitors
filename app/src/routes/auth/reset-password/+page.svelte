<script lang="ts">
  import { page } from '$app/stores';
  
  let newPassword = '';
  let confirmPassword = '';
  let loading = false;
  let error = '';
  let success = false;
  
  // Password strength state
  let passwordStrength = 0;
  let passwordFeedback = '';

  // Get token from URL parameters
  $: token = $page.url.searchParams.get('token');
  $: email = $page.url.searchParams.get('email');

  $: {
    // Password strength calculation
    if (newPassword.length === 0) {
      passwordStrength = 0;
      passwordFeedback = '';
    } else if (newPassword.length < 8) {
      passwordStrength = 1;
      passwordFeedback = 'Password must be at least 8 characters';
    } else {
      let score = 0;
      if (/[a-z]/.test(newPassword)) score++;
      if (/[A-Z]/.test(newPassword)) score++;
      if (/[0-9]/.test(newPassword)) score++;
      if (/[^A-Za-z0-9]/.test(newPassword)) score++;
      
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
    loading = true;
    error = '';
    success = false;
    
    // Validation
    if (!token) {
      error = 'Invalid reset link. Please request a new password reset.';
      loading = false;
      return;
    }
    
    if (passwordStrength < 2) {
      error = 'Please choose a stronger password';
      loading = false;
      return;
    }
    
    if (newPassword !== confirmPassword) {
      error = 'Passwords do not match';
      loading = false;
      return;
    }
    
    // TODO: Integrate with backend password reset API
    console.log('Password reset:', { token, newPassword: '***', email });
    
    // Simulated API call
    setTimeout(() => {
      loading = false;
      success = true;
      // Will integrate with actual API in Iteration 1
    }, 1500);
  };
</script>

<div class="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <!-- Header -->
    <div class="text-center">
      <h2 class="text-3xl font-bold text-gray-900">Reset your password</h2>
      {#if email}
        <p class="mt-2 text-gray-600">Create a new password for {email}</p>
      {:else}
        <p class="mt-2 text-gray-600">Create a new secure password</p>
      {/if}
    </div>

    {#if !token}
      <!-- Invalid Token State -->
      <div class="bg-accent-50 border border-accent-200 rounded-monitors p-6 text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-accent-100 mb-4">
          <svg class="h-6 w-6 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-accent-800 mb-2">Invalid reset link</h3>
        <p class="text-sm text-accent-600 mb-4">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <a href="/auth/forgot-password" class="btn-primary">Request New Reset Link</a>
      </div>
    {:else if success}
      <!-- Success State -->
      <div class="bg-secondary-50 border border-secondary-200 rounded-monitors p-6 text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-secondary-100 mb-4">
          <svg class="h-6 w-6 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-secondary-800 mb-2">Password reset successfully!</h3>
        <p class="text-sm text-secondary-600 mb-4">
          Your password has been changed. You can now sign in with your new password.
        </p>
        <a href="/auth/login" class="btn-primary">Continue to Sign In</a>
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
          <label for="new-password" class="form-label">New password</label>
          <input
            id="new-password"
            name="new-password"
            type="password"
            required
            bind:value={newPassword}
            class="form-input"
            placeholder="Create a secure password"
          />
          
          <!-- Password Strength Indicator -->
          {#if newPassword.length > 0}
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
          <label for="confirm-password" class="form-label">Confirm new password</label>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            required
            bind:value={confirmPassword}
            class="form-input"
            placeholder="Confirm your new password"
          />
          {#if confirmPassword && newPassword !== confirmPassword}
            <p class="mt-1 text-sm text-accent-600">Passwords do not match</p>
          {/if}
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
              Updating password...
            {:else}
              Update Password
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