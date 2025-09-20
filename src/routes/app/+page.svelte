<!-- MonitorHub Dashboard -->
<script lang="ts">
	import type { PageData } from './$types';
	import FilterSidebar from '$lib/components/dashboard/FilterSidebar.svelte';
	import ActivityFeed from '$lib/components/dashboard/ActivityFeed.svelte';
	import MonitorCard from '$lib/components/monitors/MonitorCard.svelte';
	import ToastContainer from '$lib/components/ui/ToastContainer.svelte';
	import { toasts, showError, showSuccess } from '$lib/stores/toast';
	import { goto } from '$app/navigation';

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
	
	async function loadMonitors(): Promise<void> {
		const response = await fetch('/api/monitors');
		if (!response.ok) {
			throw new Error('Failed to load monitors');
		}
		const data = await response.json();
		monitors = data.monitors || [];
		updateStats();
	}
	
	function updateStats(): void {
		stats = {
			totalMonitors: monitors.length,
			activeMonitors: monitors.filter(m => m.isActive).length,
			recentAlerts: monitors.filter(m => m.lastEvaluation?.evaluationResult).length,
			templates: 12 // TODO: Load from templates API
		};
	}


	function handleFilterChange(filters: DashboardFilters): void {
		activeFilters = filters;
	}

	// Computed filtered monitors based on active filters
	$: filteredMonitors = monitors.filter(monitor => {
		// Search filter
		if (activeFilters.search && activeFilters.search.trim()) {
			const searchTerm = activeFilters.search.toLowerCase();
			const matchesSearch = 
				monitor.name.toLowerCase().includes(searchTerm) ||
				monitor.description?.toLowerCase().includes(searchTerm) ||
				monitor.naturalLanguagePrompt.toLowerCase().includes(searchTerm);
			if (!matchesSearch) return false;
		}

		// Monitor type filter
		if (activeFilters.monitorType && activeFilters.monitorType !== 'ALL') {
			if (activeFilters.monitorType === 'CURRENT_STATE' && monitor.monitorType !== 'CURRENT_STATE') return false;
			if (activeFilters.monitorType === 'HISTORICAL_CHANGE' && monitor.monitorType !== 'HISTORICAL_CHANGE') return false;
		}

		// Status filter
		if (activeFilters.status && activeFilters.status !== 'ALL') {
			if (activeFilters.status === 'ACTIVE' && !monitor.isActive) return false;
			if (activeFilters.status === 'INACTIVE' && monitor.isActive) return false;
			if (activeFilters.status === 'TRIGGERED' && (!monitor.isActive || !monitor.lastEvaluation?.evaluationResult)) return false;
		}

		return true;
	});

	async function handleMonitorEdit(monitor: Monitor): Promise<void> {
		// Navigate to edit monitor page
		await goto(`/app/monitors/edit/${monitor.id}`);
	}

	async function handleMonitorToggle(monitor: Monitor): Promise<void> {
		try {
			const response = await fetch(`/api/monitors/${monitor.id}/toggle`, {
				method: 'POST'
			});
			if (!response.ok) {
				throw new Error('Failed to toggle monitor');
			}
			await loadMonitors(); // Refresh the list
			showSuccess(`Monitor ${monitor.isActive ? 'paused' : 'activated'} successfully`);
		} catch (error) {
			console.error('Failed to toggle monitor:', error);
			showError('Failed to toggle monitor. Please try again.');
		}
	}

	async function handleMonitorDelete(monitor: Monitor): Promise<void> {
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
			showSuccess(`Monitor "${monitor.name}" deleted successfully`);
		} catch (error) {
			console.error('Failed to delete monitor:', error);
			showError('Failed to delete monitor. Please try again.');
		}
	}

	async function handleMonitorEvaluate(monitor: Monitor): Promise<void> {
		try {
			const response = await fetch(`/api/monitors/${monitor.id}/evaluate`, {
				method: 'POST'
			});
			if (!response.ok) {
				throw new Error('Failed to evaluate monitor');
			}
			await loadMonitors(); // Refresh to get updated evaluation
			showSuccess(`Monitor "${monitor.name}" evaluated successfully`);
		} catch (error) {
			console.error('Failed to evaluate monitor:', error);
			showError('Failed to evaluate monitor. Please try again.');
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
						bind:value={activeFilters.search}
						on:input={(): void => handleFilterChange(activeFilters)}
					/>
				</div>
				<a href="/app/monitors/create" class="btn btn-primary" data-sveltekit-preload-data="hover">
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
						<a href="/app/monitors/create" class="btn btn-primary" data-sveltekit-preload-data="hover">
							Create Your First Monitor
						</a>
					</div>
				{:else if filteredMonitors.length === 0}
					<div class="empty-monitors">
						<div class="empty-icon">🔍</div>
						<h3>No monitors match your filters</h3>
						<p>Try adjusting your search terms or filters to find monitors.</p>
						<button class="btn btn-secondary" on:click={(): void => handleFilterChange({ search: '', monitorType: 'ALL', status: 'ALL' })}>
							Clear Filters
						</button>
					</div>
				{:else}
					<div class="monitors-grid">
						{#each filteredMonitors as monitor (monitor.id)}
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
					<a href="/app/templates" class="learn-more-link" data-sveltekit-preload-data="hover">
						See Examples →
					</a>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Toast Notifications -->
<ToastContainer toasts={$toasts} />

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
	}
</style>