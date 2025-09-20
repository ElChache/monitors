<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let activities: Array<{
		id: string;
		type: 'triggered' | 'updated' | 'created' | 'paused';
		monitor: string;
		timestamp: string;
		description: string;
	}> = [];
	export let maxItems: number = 10;
	export let autoRefresh: boolean = true;
	export let refreshInterval: number = 30000; // 30 seconds

	let refreshTimer: NodeJS.Timeout | null = null;

	// Mock activities for development - replace with actual API call
	const mockActivities = [
		{
			id: '1',
			type: 'triggered',
			monitor: 'Tesla Stock Monitor',
			timestamp: '9:23 AM',
			description: 'Tesla stock dropped below $200 threshold'
		},
		{
			id: '2',
			type: 'updated',
			monitor: 'Weather Monitor',
			timestamp: '9:15 AM',
			description: 'Clear skies detected in San Francisco'
		},
		{
			id: '3',
			type: 'created',
			monitor: 'Perfect Timing Combination',
			timestamp: '8:45 AM',
			description: 'New combination monitor created successfully'
		},
		{
			id: '4',
			type: 'paused',
			monitor: 'Bitcoin Monitor',
			timestamp: '8:30 AM',
			description: 'Monitor paused by user request'
		}
	];

	function getActivityIcon(type: string): string {
		switch (type) {
			case 'triggered':
				return '🔴';
			case 'updated':
				return '🔵';
			case 'created':
				return '🟢';
			case 'paused':
				return '🟡';
			default:
				return '⚪';
		}
	}

	function getActivityColor(type: string): string {
		switch (type) {
			case 'triggered':
				return 'var(--monitor-triggered)';
			case 'updated':
				return 'var(--primary)';
			case 'created':
				return 'var(--monitor-active)';
			case 'paused':
				return 'var(--monitor-paused)';
			default:
				return 'var(--text-secondary)';
		}
	}

	function formatRelativeTime(timestamp: string): string {
		// For now, return the timestamp as-is
		// In a real implementation, you'd convert to relative time
		return timestamp;
	}

	function refreshActivities(): void {
		// TODO: Replace with actual API call
		console.log('Refreshing activities...');
	}

	onMount(() => {
		// Set up auto-refresh if enabled
		if (autoRefresh) {
			refreshTimer = setInterval(refreshActivities, refreshInterval);
		}

		// Use mock data if no activities provided
		if (activities.length === 0) {
			activities = mockActivities;
		}
	});

	onDestroy(() => {
		if (refreshTimer) {
			clearInterval(refreshTimer);
		}
	});

	$: displayedActivities = activities.slice(0, maxItems);
</script>

<section 
	class="activity-feed"
	role="region"
	aria-label="Recent monitor activity"
	aria-live="polite"
>
	<div class="feed-header">
		<h2 class="feed-title">Recent Activity</h2>
		{#if autoRefresh}
			<div class="refresh-indicator" title="Auto-refreshing every {refreshInterval / 1000} seconds">
				<span class="refresh-icon">🔄</span>
				<span class="refresh-text">Live</span>
			</div>
		{/if}
	</div>

	<div class="activity-list">
		{#if displayedActivities.length === 0}
			<div class="empty-state">
				<div class="empty-icon">📭</div>
				<p class="empty-text">No recent activity</p>
				<p class="empty-subtitle">Activity will appear here when monitors are triggered or updated</p>
			</div>
		{:else}
			{#each displayedActivities as activity (activity.id)}
				<article 
					class="activity-item"
					class:triggered={activity.type === 'triggered'}
					role="listitem"
				>
					<div class="activity-icon" style="color: {getActivityColor(activity.type)}">
						{getActivityIcon(activity.type)}
					</div>
					
					<div class="activity-content">
						<div class="activity-main">
							<span class="activity-monitor">{activity.monitor}</span>
							<span class="activity-type">{activity.type}</span>
						</div>
						<p class="activity-description">{activity.description}</p>
						<time class="activity-timestamp" datetime={activity.timestamp}>
							{formatRelativeTime(activity.timestamp)}
						</time>
					</div>

					<div class="activity-actions">
						<button 
							class="action-link"
							on:click={(): void => {/* TODO: Navigate to monitor */}}
							aria-label="View {activity.monitor}"
						>
							View
						</button>
					</div>
				</article>
			{/each}
		{/if}
	</div>

	{#if activities.length > maxItems}
		<div class="feed-footer">
			<button 
				class="view-all-btn"
				on:click={(): void => {/* TODO: Navigate to full activity log */}}
			>
				View All Activity ({activities.length - maxItems} more)
			</button>
		</div>
	{/if}
</section>

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

	.activity-feed {
		background: white;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.feed-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 1.5rem 0 1.5rem;
		margin-bottom: 1rem;
	}

	.feed-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.refresh-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: var(--monitor-active);
		background: #ECFDF5;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		border: 1px solid #A7F3D0;
	}

	.refresh-icon {
		animation: spin 2s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.refresh-text {
		font-weight: 600;
	}

	.activity-list {
		max-height: 400px;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: var(--border) transparent;
	}

	.activity-list::-webkit-scrollbar {
		width: 6px;
	}

	.activity-list::-webkit-scrollbar-track {
		background: transparent;
	}

	.activity-list::-webkit-scrollbar-thumb {
		background: var(--border);
		border-radius: 3px;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1.5rem;
		color: var(--text-secondary);
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.empty-text {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
	}

	.empty-subtitle {
		font-size: 0.875rem;
		margin: 0;
		line-height: 1.5;
	}

	.activity-item {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--border);
		transition: background-color 0.2s ease;
	}

	.activity-item:hover {
		background: var(--surface);
	}

	.activity-item:last-child {
		border-bottom: none;
	}

	.activity-item.triggered {
		background: linear-gradient(90deg, #FEF2F2 0%, transparent 100%);
		border-left: 3px solid var(--monitor-triggered);
	}

	.activity-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.activity-content {
		flex: 1;
		min-width: 0;
	}

	.activity-main {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.25rem;
		flex-wrap: wrap;
	}

	.activity-monitor {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 0.875rem;
	}

	.activity-type {
		text-transform: uppercase;
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		background: var(--surface);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.activity-description {
		color: var(--text-secondary);
		font-size: 0.875rem;
		line-height: 1.4;
		margin: 0 0 0.5rem 0;
	}

	.activity-timestamp {
		font-size: 0.75rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.activity-actions {
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.action-link {
		background: none;
		border: none;
		color: var(--primary);
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		padding: 0.25rem 0;
		text-decoration: underline;
		text-decoration-color: transparent;
		transition: text-decoration-color 0.2s ease;
	}

	.action-link:hover {
		text-decoration-color: var(--primary);
	}

	.action-link:focus {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
		border-radius: 0.25rem;
	}

	.feed-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--border);
		background: var(--surface);
	}

	.view-all-btn {
		width: 100%;
		background: none;
		border: 1px solid var(--border);
		color: var(--text-secondary);
		font-size: 0.875rem;
		font-weight: 600;
		padding: 0.75rem;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.view-all-btn:hover {
		background: white;
		border-color: var(--primary);
		color: var(--primary);
	}

	.view-all-btn:focus {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	@media (max-width: 768px) {
		.feed-header {
			padding: 1rem 1rem 0 1rem;
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.activity-item {
			padding: 0.75rem 1rem;
			gap: 0.75rem;
		}

		.activity-main {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		.activity-actions {
			margin-top: 0.5rem;
		}

		.feed-footer {
			padding: 0.75rem 1rem;
		}
	}
</style>