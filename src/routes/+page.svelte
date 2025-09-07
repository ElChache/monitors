<script lang="ts">
	import { onMount } from 'svelte';
	
	let databaseStatus = 'Checking...';
	
	onMount(async () => {
		try {
			const response = await fetch('/api/health');
			const data = await response.json();
			databaseStatus = data.database ? 'Connected' : 'Not Connected';
		} catch (error) {
			databaseStatus = 'Error checking status';
		}
	});
</script>

<svelte:head>
	<title>Monitors - AI-Powered Monitoring Platform</title>
</svelte:head>

<main>
	<h1>Welcome to Monitors</h1>
	<p>AI-Powered Monitoring Platform - Hello World!</p>
	
	<div class="status">
		<h2>System Status</h2>
		<p>Database: {databaseStatus}</p>
		<p>SvelteKit: Running</p>
	</div>
</main>

<style>
	main {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, -apple-system, sans-serif;
	}
	
	/* Mobile-first responsive design */
	@media (max-width: 768px) {
		main {
			padding: 1rem;
			max-width: 100%;
		}
	}
	
	h1 {
		color: #333;
		margin-bottom: 1rem;
		font-size: clamp(1.5rem, 4vw, 2.5rem);
	}
	
	.status {
		margin-top: 2rem;
		padding: 1rem;
		background: #f5f5f5;
		border-radius: 8px;
	}
	
	/* Touch-friendly mobile optimization */
	@media (max-width: 768px) {
		.status {
			margin-top: 1.5rem;
			padding: 1.5rem;
		}
	}
	
	.status h2 {
		margin-top: 0;
		color: #555;
		font-size: clamp(1.1rem, 3vw, 1.3rem);
	}
</style>