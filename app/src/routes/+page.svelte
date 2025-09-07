<script lang="ts">
  // Dashboard page - for Iteration 1, this will be simple
</script>

<!-- Dashboard Container -->
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <!-- Page Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">Your Monitors</h1>
    <p class="mt-2 text-gray-600">Track real-world changes that matter to you</p>
  </div>

  <!-- Empty State - No Monitors Yet -->
  <div class="text-center py-12">
    <div class="max-w-md mx-auto">
      <!-- Icon placeholder (we can add an icon later) -->
      <div class="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <svg class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      
      <h2 class="text-xl font-semibold text-gray-900 mb-2">No monitors yet</h2>
      <p class="text-gray-500 mb-6">Create your first monitor to start tracking real-world changes</p>
      
      <!-- Call to Action -->
      <a href="/monitors/create" class="btn-primary text-lg px-6 py-3 inline-block">
        Create Your First Monitor
      </a>
      
      <!-- Examples -->
      <div class="mt-8 text-left">
        <h3 class="text-sm font-medium text-gray-900 mb-3">Example monitors you can create:</h3>
        <ul class="space-y-2 text-sm text-gray-600">
          <li class="flex items-start">
            <span class="text-primary mr-2">•</span>
            "Tell me when Tesla stock drops below $200"
          </li>
          <li class="flex items-start">
            <span class="text-primary mr-2">•</span>
            "Alert me when it's going to rain for 3 days"
          </li>
          <li class="flex items-start">
            <span class="text-primary mr-2">•</span>
            "Notify when Bitcoin rises 10% in 24 hours"
          </li>
        </ul>
      </div>
    </div>
  </div>
</div>
