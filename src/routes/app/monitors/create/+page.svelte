<!-- Monitor Creation Page -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import MonitorCreationForm from '$lib/components/forms/MonitorCreationForm.svelte';
	import type { PageData } from './$types';
	
	export let data: PageData;
	// Use the session data for authentication checks
	$: user = data.session?.user;
	
	
	// Handle form submission
	async function handleMonitorSubmit(event: CustomEvent<{
		prompt: string;
		monitorType: 'CURRENT_STATE' | 'HISTORICAL_CHANGE';
		frequency: number;
		name: string;
	}>) {
		const { prompt, monitorType, frequency, name } = event.detail;
		
		try {
			const response = await fetch('/api/monitors', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					prompt: prompt,
					name: name,
					frequency: frequency,
					monitorType: monitorType,
				}),
			});
			
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to create monitor');
			}
			
			const monitor = await response.json();
			
			// Redirect to dashboard with success message
			await goto('/app?created=' + monitor.id, { replaceState: true });
			
		} catch (error) {
			console.error('Error creating monitor:', error);
			// TODO: Show error toast notification
			alert('Failed to create monitor. Please try again.');
		}
	}
	
	// Handle preview/validation
	async function handlePreview(event: CustomEvent<{ prompt: string }>) {
		const { prompt } = event.detail;
		
		// TODO: Call AI service to validate and extract facts from prompt
		console.log('Preview prompt:', prompt);
		
		// For now, just log the preview request
		// In future versions, this will show real-time fact extraction
	}
</script>

<svelte:head>
	<title>Create Monitor - MonitorHub</title>
	<meta name="description" content="Create a new intelligent monitor using natural language with MonitorHub's Combination Intelligence" />
</svelte:head>

<div class="create-monitor-page">
	<!-- Header -->
	<div class="page-header">
		<div class="breadcrumb">
			<a href="/app" class="breadcrumb-link">Dashboard</a>
			<span class="breadcrumb-separator">›</span>
			<span class="breadcrumb-current">Create Monitor</span>
		</div>
	</div>
	
	<!-- Main Content -->
	<div class="page-content">
		<MonitorCreationForm 
			on:submit={handleMonitorSubmit}
			on:preview={handlePreview}
		/>
	</div>
	
	<!-- Help Section -->
	<div class="help-section">
		<div class="help-card">
			<h3 class="help-title">💡 Combination Intelligence Tips</h3>
			<div class="help-content">
				<div class="tip">
					<strong>Start Simple:</strong> Begin with single conditions like "Tesla stock below $200"
				</div>
				<div class="tip">
					<strong>Add Combinations:</strong> Combine multiple facts with AND/OR: "Tesla drops AND Elon tweets"
				</div>
				<div class="tip">
					<strong>Use Time Context:</strong> Specify timeframes: "Bitcoin gains 10% in 24 hours"
				</div>
				<div class="tip">
					<strong>Be Specific:</strong> Include exact numbers, companies, or conditions for better accuracy
				</div>
			</div>
		</div>
		
		<div class="help-card">
			<h3 class="help-title">🎯 Monitor Types</h3>
			<div class="help-content">
				<div class="tip">
					<strong>Current State:</strong> Tracks if conditions are true right now (stock prices, weather, news)
				</div>
				<div class="tip">
					<strong>Historical Change:</strong> Tracks changes over time (price movements, trend analysis)
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.create-monitor-page {
		min-height: 100vh;
		background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
		padding: 2rem 1rem;
	}
	
	.page-header {
		max-width: 800px;
		margin: 0 auto;
		margin-bottom: 2rem;
	}
	
	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}
	
	.breadcrumb-link {
		color: #3b82f6;
		text-decoration: none;
		font-weight: 500;
	}
	
	.breadcrumb-link:hover {
		text-decoration: underline;
	}
	
	.breadcrumb-separator {
		color: #6b7280;
	}
	
	.breadcrumb-current {
		color: #374151;
		font-weight: 600;
	}
	
	.page-content {
		background: #fff;
		border-radius: 1rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		margin-bottom: 3rem;
	}
	
	.help-section {
		max-width: 800px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}
	
	.help-card {
		background: #fff;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}
	
	.help-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 1rem 0;
	}
	
	.help-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.tip {
		padding: 0.75rem;
		background: #f9fafb;
		border-radius: 0.5rem;
		border-left: 3px solid #3b82f6;
		font-size: 0.875rem;
		line-height: 1.5;
	}
	
	.tip strong {
		color: #1f2937;
		font-weight: 600;
	}
	
	/* Responsive */
	@media (max-width: 768px) {
		.create-monitor-page {
			padding: 1rem 0.5rem;
		}
		
		.help-section {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
		
		.help-card {
			padding: 1rem;
		}
	}
</style>