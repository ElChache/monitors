<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Main App Layout -->
<div class="min-h-screen bg-gray-50 flex flex-col">
	<!-- Header Navigation -->
	<header class="bg-white shadow-sm border-b border-gray-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex items-center">
					<h1 class="text-xl font-bold text-primary">Monitors!</h1>
					<span class="ml-2 px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-monitors">Beta</span>
				</div>
				<nav class="flex items-center space-x-4">
					<!-- Navigation items -->
					<a href="/" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-monitors text-sm font-medium transition-colors">Dashboard</a>
					<a href="/auth/login" class="btn-primary text-sm">Sign In</a>
				</nav>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="flex-1">
		{@render children?.()}
	</main>

	<!-- Footer -->
	<footer class="bg-white border-t border-gray-200 mt-auto">
		<div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
			<div class="text-center text-sm text-gray-500">
				<p>&copy; 2025 Monitors! - Track what matters to you</p>
			</div>
		</div>
	</footer>
</div>
