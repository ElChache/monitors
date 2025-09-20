<script lang="ts">
	import type { DashboardFilters, MonitorStats } from '$lib/types/monitor';
	import { Search, Filter, Activity, TrendingUp, Play, Pause } from 'lucide-svelte';
	
	export let activeFilters: DashboardFilters;
	export let stats: MonitorStats;
	export let onFilterChange: (filters: DashboardFilters) => void;

	// Local filter state
	let searchTerm = activeFilters.search || '';
	let selectedMonitorType = activeFilters.monitorType || 'ALL';
	let selectedStatus = activeFilters.status || 'ALL';
	
	// Update filters when local state changes
	$: {
		onFilterChange({
			search: searchTerm,
			monitorType: selectedMonitorType,
			status: selectedStatus
		});
	}
	
	function clearFilters() {
		searchTerm = '';
		selectedMonitorType = 'ALL';
		selectedStatus = 'ALL';
	}
	
	$: hasActiveFilters = searchTerm !== '' || selectedMonitorType !== 'ALL' || selectedStatus !== 'ALL';
</script>

<aside class="filter-sidebar" role="complementary" aria-label="Monitor filters and statistics">
	<div class="sidebar-section">
		<h2 class="section-title">Quick Stats</h2>
		<div class="stats-grid">
			<div class="stat-item">
				<div class="stat-value">{stats.totalMonitors}</div>
				<div class="stat-label">Total Monitors</div>
			</div>
			<div class="stat-item">
				<div class="stat-value" style="color: var(--monitor-active);">{stats.activeMonitors}</div>
				<div class="stat-label">Active</div>
			</div>
			<div class="stat-item">
				<div class="stat-value" style="color: var(--monitor-triggered);">{stats.recentAlerts}</div>
				<div class="stat-label">Recent Alerts</div>
			</div>
			<div class="stat-item">
				<div class="stat-value" style="color: var(--monitor-paused);">{stats.templates}</div>
				<div class="stat-label">Templates</div>
			</div>
		</div>
	</div>

	<div class="sidebar-section">
		<div class="section-header">
			<h2 class="section-title">Filters</h2>
			{#if hasActiveFilters}
				<button 
					class="clear-filters-btn"
					on:click={clearFilters}
					aria-label="Clear all active filters"
				>
					Clear All
				</button>
			{/if}
		</div>
		
		<div class="filter-list" role="group" aria-label="Monitor filters">
			{#each filterOptions as filter}
				<label class="filter-option">
					<input
						type="checkbox"
						checked={activeFilters.includes(filter.id)}
						on:change={() => toggleFilter(filter.id)}
						aria-describedby="filter-{filter.id}-description"
					/>
					<span class="filter-checkbox"></span>
					<span class="filter-label">{filter.label}</span>
					{#if filter.count !== undefined}
						<span class="filter-count" id="filter-{filter.id}-description">
							({filter.count})
						</span>
					{/if}
				</label>
			{/each}
		</div>

		{#if hasActiveFilters}
			<div class="active-filters">
				<h3 class="active-filters-title">Active Filters:</h3>
				<div class="filter-tags">
					{#each activeFilters as filter}
						<span class="filter-tag">
							{filterOptions.find(f => f.id === filter)?.label || filter}
							<button
								class="remove-filter"
								on:click={() => toggleFilter(filter)}
								aria-label="Remove {filter} filter"
							>
								×
							</button>
						</span>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<div class="sidebar-section">
		<h2 class="section-title">Quick Actions</h2>
		<div class="quick-actions">
			<a href="/app/monitors/create" class="quick-action-btn primary">
				<span class="action-icon">+</span>
				Create Monitor
			</a>
			<a href="/app/templates" class="quick-action-btn secondary">
				<span class="action-icon">📋</span>
				Browse Templates
			</a>
		</div>
	</div>
</aside>

<style>
	:root {
		--monitor-active: #10B981;
		--monitor-triggered: #EF4444;
		--monitor-paused: #6B7280;
		--primary: #3B82F6;
		--text-primary: #111827;
		--text-secondary: #6B7280;
		--surface: #F9FAFB;
		--border: #E5E7EB;
	}

	.filter-sidebar {
		background: white;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		padding: 1.5rem;
		height: fit-content;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		min-width: 280px;
	}

	.sidebar-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.clear-filters-btn {
		background: none;
		border: none;
		color: var(--primary);
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		padding: 0.25rem 0;
		text-decoration: underline;
	}

	.clear-filters-btn:hover {
		color: #2563EB;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.stat-item {
		text-align: center;
		padding: 0.75rem;
		background: var(--surface);
		border-radius: 0.375rem;
		border: 1px solid var(--border);
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}

	.stat-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.filter-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.filter-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		padding: 0.5rem 0;
	}

	.filter-option input[type="checkbox"] {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.filter-checkbox {
		width: 1.25rem;
		height: 1.25rem;
		border: 2px solid var(--border);
		border-radius: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: white;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.filter-option input:checked + .filter-checkbox {
		background: var(--primary);
		border-color: var(--primary);
	}

	.filter-option input:checked + .filter-checkbox::after {
		content: '✓';
		color: white;
		font-size: 0.875rem;
		font-weight: bold;
	}

	.filter-option input:focus + .filter-checkbox {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	.filter-label {
		font-size: 0.875rem;
		color: var(--text-primary);
		font-weight: 500;
		flex: 1;
	}

	.filter-count {
		font-size: 0.75rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.active-filters {
		margin-top: 0.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border);
	}

	.active-filters-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin: 0 0 0.5rem 0;
	}

	.filter-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.filter-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.5rem;
		background: var(--primary);
		color: white;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.remove-filter {
		background: none;
		border: none;
		color: white;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		padding: 0;
		width: 1rem;
		height: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.remove-filter:hover {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
	}

	.quick-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.quick-action-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 0.375rem;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 600;
		transition: all 0.2s ease;
		border: 1px solid;
	}

	.quick-action-btn.primary {
		background: var(--primary);
		color: white;
		border-color: var(--primary);
	}

	.quick-action-btn.primary:hover {
		background: #2563EB;
		border-color: #2563EB;
	}

	.quick-action-btn.secondary {
		background: white;
		color: var(--text-secondary);
		border-color: var(--border);
	}

	.quick-action-btn.secondary:hover {
		background: var(--surface);
		border-color: var(--text-secondary);
	}

	.action-icon {
		font-size: 1rem;
	}

	@media (max-width: 1024px) {
		.filter-sidebar {
			min-width: 240px;
		}

		.stats-grid {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.stat-item {
			padding: 0.5rem;
		}
	}

	@media (max-width: 768px) {
		.filter-sidebar {
			padding: 1rem;
			min-width: unset;
			width: 100%;
		}

		.stats-grid {
			grid-template-columns: repeat(4, 1fr);
			gap: 0.5rem;
		}

		.stat-item {
			padding: 0.5rem 0.25rem;
		}

		.stat-value {
			font-size: 1.25rem;
		}

		.stat-label {
			font-size: 0.625rem;
		}
	}
</style>