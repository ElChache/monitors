<!-- MonitorHub Dashboard -->
<script lang="ts">
	import type { PageData } from './$types';
	import FilterSidebar from '$lib/components/dashboard/FilterSidebar.svelte';
	import ActivityFeed from '$lib/components/dashboard/ActivityFeed.svelte';
	import MonitorCard from '$lib/components/monitors/MonitorCard.svelte';
	import HistoricalMonitorCard from '$lib/components/monitors/HistoricalMonitorCard.svelte';

	export let data: PageData;
	
	$: user = data.session?.user;
	
	import type { Monitor, DashboardFilters, MonitorStats } from '$lib/types/monitor';
	
	let activeFilters: DashboardFilters = {
		search: '',
		monitorType: 'ALL',
		status: 'ALL'
	};
	
	let stats: MonitorStats = {
		totalMonitors: 0,
		activeMonitors: 0,
		recentAlerts: 0,
		templates: 0
	};
	
	let monitors: Monitor[] = [];
	let loading = true;

	// Load monitors on page mount
	import { onMount } from 'svelte';
	
	onMount(async () => {
		try {
			await loadMonitors();
		} catch (error) {
			console.error('Failed to load monitors:', error);
		} finally {
			loading = false;
		}
	});
	
	async function loadMonitors() {
		const response = await fetch('/api/monitors');
		if (!response.ok) {
			throw new Error('Failed to load monitors');
		}
		const data = await response.json();
		monitors = data.monitors || [];
		updateStats();
	}
	
	function updateStats() {
		stats = {
			totalMonitors: monitors.length,
			activeMonitors: monitors.filter(m => m.isActive).length,
			recentAlerts: monitors.filter(m => m.lastEvaluation?.evaluationResult).length,
			templates: 12 // TODO: Load from templates API
		};
	}

	// Mock monitor data for fallback
	const mockMonitors: Monitor[] = [
		{
			id: '1',
			userId: 'user1',
			name: 'Tesla Stock Below $200',
			description: 'Monitor Tesla stock price for investment opportunity',
			naturalLanguagePrompt: 'Alert me when Tesla stock drops below $200 per share',
			monitorType: 'CURRENT_STATE',
			isActive: true,
			evaluationFrequencyMins: 30,
			createdAt: new Date('2024-01-15'),
			updatedAt: new Date('2024-01-20'),
			facts: [
				{
					id: 'fact1',
					monitorId: '1',
					factName: 'Tesla Stock Price',
					factPrompt: 'Current Tesla (TSLA) stock price',
					createdAt: new Date('2024-01-15')
				}
			],
			lastEvaluation: {
				id: 'eval1',
				monitorId: '1',
				evaluationResult: false,
				stateChanged: false,
				evaluatedAt: new Date(),
				createdAt: new Date()
			}
		},
		{
			id: '2',
			userId: 'user1',
			name: 'Perfect Tesla Timing',
			description: 'Complex combination intelligence for Tesla investment',
			naturalLanguagePrompt: 'Tesla stock drops to $200 AND Elon Musk tweets about innovation AND EV tax credits get renewed',
			monitorType: 'CURRENT_STATE',
			isActive: true,
			evaluationFrequencyMins: 15,
			createdAt: new Date('2024-01-10'),
			updatedAt: new Date('2024-01-20'),
			facts: [
				{
					id: 'fact2a',
					monitorId: '2',
					factName: 'Tesla Stock Price',
					factPrompt: 'Current Tesla (TSLA) stock price',
					createdAt: new Date('2024-01-10')
				},
				{
					id: 'fact2b',
					monitorId: '2',
					factName: 'Elon Musk Innovation Tweet',
					factPrompt: 'Recent tweets from Elon Musk about innovation',
					createdAt: new Date('2024-01-10')
				},
				{
					id: 'fact2c',
					monitorId: '2',
					factName: 'EV Tax Credits',
					factPrompt: 'Current status of EV tax credit legislation',
					createdAt: new Date('2024-01-10')
				}
			],
			lastEvaluation: {
				id: 'eval2',
				monitorId: '2',
				evaluationResult: true,
				stateChanged: true,
				evaluatedAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
				createdAt: new Date(Date.now() - 2 * 60 * 1000)
			}
		},
		{
			id: '3',
			userId: 'user1',
			name: 'Bitcoin Price Drop',
			description: 'Monitor Bitcoin for significant price drops',
			naturalLanguagePrompt: 'Alert me when Bitcoin drops more than 10% in a single day',
			monitorType: 'HISTORICAL_CHANGE',
			isActive: true,
			evaluationFrequencyMins: 60,
			createdAt: new Date('2024-01-05'),
			updatedAt: new Date('2024-01-18'),
			facts: [
				{
					id: 'fact3',
					monitorId: '3',
					factName: 'Bitcoin Price',
					factPrompt: 'Current Bitcoin (BTC) price in USD',
					createdAt: new Date('2024-01-05')
				}
			],
			lastEvaluation: {
				id: 'eval3',
				monitorId: '3',
				evaluationResult: false,
				stateChanged: false,
				evaluatedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
				createdAt: new Date(Date.now() - 5 * 60 * 1000)
			}
		}
	];

	function handleFilterChange(filters: DashboardFilters) {
		activeFilters = filters;
		// TODO: Filter monitors based on active filters
	}

	async function handleMonitorEdit(monitor: Monitor) {
		// TODO: Navigate to edit monitor page
		console.log('Edit monitor:', monitor);
	}

	async function handleMonitorToggle(monitor: Monitor) {
		try {
			const response = await fetch(`/api/monitors/${monitor.id}/toggle`, {
				method: 'POST'
			});
			if (!response.ok) {
				throw new Error('Failed to toggle monitor');
			}
			await loadMonitors(); // Refresh the list
		} catch (error) {
			console.error('Failed to toggle monitor:', error);
			alert('Failed to toggle monitor. Please try again.');
		}
	}

	async function handleMonitorDelete(monitor: Monitor) {
		if (!confirm(`Are you sure you want to delete "${monitor.name}"?`)) {
			return;
		}
		
		try {
			const response = await fetch(`/api/monitors/${monitor.id}`, {
				method: 'DELETE'
			});
			if (!response.ok) {
				throw new Error('Failed to delete monitor');
			}
			await loadMonitors(); // Refresh the list
		} catch (error) {
			console.error('Failed to delete monitor:', error);
			alert('Failed to delete monitor. Please try again.');
		}
	}

	async function handleMonitorEvaluate(monitor: Monitor) {
		try {
			const response = await fetch(`/api/monitors/${monitor.id}/evaluate`, {
				method: 'POST'
			});
			if (!response.ok) {
				throw new Error('Failed to evaluate monitor');
			}
			await loadMonitors(); // Refresh to get updated evaluation
		} catch (error) {
			console.error('Failed to evaluate monitor:', error);
			alert('Failed to evaluate monitor. Please try again.');
		}
	}
</script>

<svelte:head>
	<title>Dashboard - MonitorHub</title>
</svelte:head>

<div class="dashboard-container">
	<div class="dashboard-header">
		<div class="header-content">
			<div class="title-section">
				<h1>Dashboard</h1>
				<p class="welcome-text">Welcome back, {user?.name}!</p>
			</div>
			<div class="header-actions">
				<div class="search-container">
					<input 
						type="text" 
						placeholder="Search monitors..." 
						class="search-input"
						aria-label="Search monitors"
					/>
				</div>
				<a href="/app/monitors/create" class="create-btn">
					<span class="plus-icon">+</span>
					Create Monitor
				</a>
			</div>
		</div>
	</div>

	<div class="dashboard-layout">
		<!-- Left Sidebar -->
		<div class="sidebar">
			<FilterSidebar 
				{activeFilters}
				{stats}
				onFilterChange={handleFilterChange}
			/>
		</div>

		<!-- Main Content -->
		<div class="main-content">
			<div class="monitors-section">
				<div class="section-header">
					<h2 class="section-title">Your Monitors</h2>
					<div class="view-options">
						<button class="view-btn active" aria-label="Grid view">
							<span class="view-icon">⊞</span>
						</button>
						<button class="view-btn" aria-label="List view">
							<span class="view-icon">☰</span>
						</button>
					</div>
				</div>

				{#if loading}
					<div class="loading-state">
						<div class="loading-spinner"></div>
						<p>Loading your monitors...</p>
					</div>
				{:else if monitors.length === 0}
					<div class="empty-monitors">
						<div class="empty-icon">📊</div>
						<h3>No monitors yet</h3>
						<p>Create your first monitor to start tracking opportunities with Combination Intelligence.</p>
						<a href="/app/monitors/create" class="primary-btn">
							Create Your First Monitor
						</a>
					</div>
				{:else}
					<div class="monitors-grid">
						{#each monitors as monitor}
							<MonitorCard
								{monitor}
								onEdit={handleMonitorEdit}
								onDelete={handleMonitorDelete}
								onToggleActive={handleMonitorToggle}
								onEvaluateNow={handleMonitorEvaluate}
							/>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Activity Feed -->
			<div class="activity-section">
				<ActivityFeed />
			</div>

			<!-- About Combination Intelligence -->
			<div class="info-section">
				<div class="info-card">
					<h2>💡 About Combination Intelligence</h2>
					<p>
						MonitorHub's revolutionary feature lets you monitor multiple conditions simultaneously. 
						Instead of basic alerts like "Tesla stock drops to $200", create powerful combinations 
						like "Tesla stock drops to $200 AND Elon Musk tweets about innovation AND EV tax credits get renewed".
					</p>
					<a href="/app/templates" class="learn-more-link">
						See Examples →
					</a>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	:root {
		--primary: #3B82F6;
		--text-primary: #111827;
		--text-secondary: #6B7280;
		--surface: #F9FAFB;
		--border: #E5E7EB;
	}

	.dashboard-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1.5rem;
	}

	.dashboard-header {
		margin-bottom: 2rem;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
	}

	.title-section h1 {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
	}

	.welcome-text {
		color: var(--text-secondary);
		margin: 0;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.search-container {
		position: relative;
	}

	.search-input {
		padding: 0.75rem 1rem;
		border: 1px solid var(--border);
		border-radius: 0.375rem;
		font-size: 0.875rem;
		background: white;
		min-width: 200px;
		transition: border-color 0.2s ease;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.create-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: var(--primary);
		color: white;
		text-decoration: none;
		border-radius: 0.375rem;
		font-weight: 600;
		transition: all 0.2s ease;
	}

	.create-btn:hover {
		background: #2563EB;
		transform: translateY(-1px);
	}

	.plus-icon {
		font-size: 1.25rem;
		line-height: 1;
	}

	.dashboard-layout {
		display: grid;
		grid-template-columns: 320px 1fr;
		gap: 2rem;
		align-items: start;
	}

	.sidebar {
		position: sticky;
		top: 1.5rem;
	}

	.main-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.monitors-section {
		background: white;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.view-options {
		display: flex;
		gap: 0.25rem;
	}

	.view-btn {
		padding: 0.5rem;
		background: none;
		border: 1px solid var(--border);
		border-radius: 0.25rem;
		cursor: pointer;
		color: var(--text-secondary);
		transition: all 0.2s ease;
	}

	.view-btn:hover,
	.view-btn.active {
		background: var(--primary);
		border-color: var(--primary);
		color: white;
	}

	.view-icon {
		font-size: 0.875rem;
		display: block;
	}

	.monitors-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.empty-monitors {
		text-align: center;
		padding: 4rem 2rem;
		color: var(--text-secondary);
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-monitors h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
	}

	.empty-monitors p {
		margin: 0 0 1.5rem 0;
		line-height: 1.5;
	}

	.primary-btn {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: var(--primary);
		color: white;
		text-decoration: none;
		border-radius: 0.375rem;
		font-weight: 600;
		transition: all 0.2s ease;
	}

	.primary-btn:hover {
		background: #2563EB;
		transform: translateY(-1px);
	}

	.activity-section,
	.info-section {
		display: flex;
		flex-direction: column;
	}

	.info-card {
		background: linear-gradient(135deg, #DBEAFE 0%, #E0E7FF 100%);
		border: 1px solid var(--primary);
		border-radius: 0.5rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}

	.info-card h2 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1E40AF;
		margin: 0 0 1rem 0;
	}

	.info-card p {
		color: #1E40AF;
		line-height: 1.6;
		margin: 0 0 1rem 0;
	}

	.learn-more-link {
		color: var(--primary);
		font-weight: 600;
		text-decoration: none;
	}

	.learn-more-link:hover {
		text-decoration: underline;
	}

	.loading-state {
		text-align: center;
		padding: 4rem 2rem;
		color: var(--text-secondary);
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--border);
		border-top: 3px solid var(--primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	@media (max-width: 1024px) {
		.dashboard-layout {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.sidebar {
			position: static;
		}

		.header-content {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.header-actions {
			width: 100%;
			justify-content: space-between;
		}

		.search-input {
			min-width: 150px;
		}
	}

	@media (max-width: 768px) {
		.dashboard-container {
			padding: 1rem;
		}

		.monitors-grid {
			grid-template-columns: 1fr;
		}

		.section-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.header-actions {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}

		.search-input {
			min-width: unset;
		}

		.create-btn {
			justify-content: center;
		}
	}
</style>