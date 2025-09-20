<script lang="ts">
	import type { MonitorCardProps } from '$lib/types/monitor';
	import { Play, Pause, Edit, Trash2, RefreshCw, Calendar, Clock, TrendingUp, Activity } from 'lucide-svelte';
	
	export let monitor: MonitorCardProps['monitor'];
	export let onEdit: MonitorCardProps['onEdit'] = undefined;
	export let onDelete: MonitorCardProps['onDelete'] = undefined;
	export let onToggleActive: MonitorCardProps['onToggleActive'] = undefined;
	export let onEvaluateNow: MonitorCardProps['onEvaluateNow'] = undefined;
	export let compact: MonitorCardProps['compact'] = false;

	$: isCurrentState = monitor.monitorType === 'CURRENT_STATE';
	$: lastEvaluation = monitor.lastEvaluation;
	$: hasRecentActivity = lastEvaluation && new Date(lastEvaluation.createdAt).getTime() > Date.now() - (24 * 60 * 60 * 1000);
	
	function handleEdit(): void {
		onEdit?.(monitor);
	}
	
	function handleDelete(): void {
		if (confirm(`Are you sure you want to delete "${monitor.name}"?`)) {
			onDelete?.(monitor);
		}
	}
	
	function handleToggleActive(): void {
		onToggleActive?.(monitor);
	}
	
	function handleEvaluateNow(): void {
		onEvaluateNow?.(monitor);
	}
	
	function formatDate(date: Date): string {
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(date));
	}
	
</script>

<div 
	class="card monitor-card" 
	class:compact
	class:current-state={isCurrentState}
	class:historical-change={!isCurrentState}
	class:active={monitor.isActive}
	class:inactive={!monitor.isActive}
	class:has-activity={hasRecentActivity}
>
	<!-- Header -->
	<div class="card-body">
		<div class="monitor-info">
			<div class="monitor-type-indicator">
				{#if isCurrentState}
					<Activity size={16} />
					<span class="type-label">Current State</span>
				{:else}
					<TrendingUp size={16} />
					<span class="type-label">Historical Change</span>
				{/if}
			</div>
			
			<h3 class="monitor-title">{monitor.name}</h3>
			
			{#if monitor.description && !compact}
				<p class="monitor-description">{monitor.description}</p>
			{/if}
		</div>
		
		<div class="monitor-status">
			{#if monitor.isActive}
				{#if lastEvaluation?.evaluationResult}
					<span class="status-indicator status-triggered">
						Triggered
					</span>
				{:else}
					<span class="status-indicator status-active">
						Active
					</span>
				{/if}
			{:else}
				<span class="status-indicator status-inactive">
					Inactive
				</span>
			{/if}
		</div>
	</div>
	
	<!-- Content -->
	{#if !compact}
		<div class="card-content">
			<div class="monitor-prompt">
				<p>{monitor.naturalLanguagePrompt}</p>
			</div>
			
			{#if monitor.facts && monitor.facts.length > 0}
				<div class="facts-summary">
					<span class="facts-count">{monitor.facts.length} fact{monitor.facts.length !== 1 ? 's' : ''}</span>
					{#if monitor.facts.length <= 3}
						<div class="fact-tags">
							{#each monitor.facts as fact (fact.id)}
								<span class="fact-tag">{fact.factName}</span>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
	
	<!-- Footer -->
	<div class="card-footer">
		<div class="monitor-meta">
			<div class="meta-item">
				<Clock size={14} />
				<span>Every {monitor.evaluationFrequencyMins}min</span>
			</div>
			
			{#if lastEvaluation}
				<div class="meta-item">
					<Calendar size={14} />
					<span>Last: {formatDate(lastEvaluation.createdAt)}</span>
				</div>
			{/if}
		</div>
		
		<div class="action-buttons flex gap-2">
			{#if onEvaluateNow}
				<button 
					class="btn btn-ghost btn-sm" 
					on:click={handleEvaluateNow}
					title="Evaluate now"
					disabled={!monitor.isActive}
				>
					<RefreshCw size={16} />
				</button>
			{/if}
			
			{#if onToggleActive}
				<button 
					class="btn btn-ghost btn-sm" 
					on:click={handleToggleActive}
					title={monitor.isActive ? 'Pause monitor' : 'Activate monitor'}
				>
					{#if monitor.isActive}
						<Pause size={16} />
					{:else}
						<Play size={16} />
					{/if}
				</button>
			{/if}
			
			{#if onEdit}
				<button 
					class="btn btn-ghost btn-sm" 
					on:click={handleEdit}
					title="Edit monitor"
				>
					<Edit size={16} />
				</button>
			{/if}
			
			{#if onDelete}
				<button 
					class="btn btn-error btn-sm" 
					on:click={handleDelete}
					title="Delete monitor"
				>
					<Trash2 size={16} />
				</button>
			{/if}
		</div>
	</div>
</div>

<style>
	.monitor-card {
		background: #fff;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
		position: relative;
		overflow: hidden;
	}
	
	.monitor-card:hover {
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		border-color: #d1d5db;
	}
	
	.monitor-card.compact {
		padding: 1rem;
	}
	
	.monitor-card.inactive {
		opacity: 0.75;
		background: #f9fafb;
	}
	
	.monitor-card.has-activity::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, #3b82f6, #06b6d4);
	}
	
	/* Header */
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
		gap: 1rem;
	}
	
	.monitor-info {
		flex: 1;
		min-width: 0;
	}
	
	.monitor-type-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		color: #6b7280;
		font-size: 0.875rem;
	}
	
	.current-state .monitor-type-indicator {
		color: #3b82f6;
	}
	
	.historical-change .monitor-type-indicator {
		color: #059669;
	}
	
	.type-label {
		font-weight: 500;
	}
	
	.monitor-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
		line-height: 1.4;
		word-break: break-word;
	}
	
	.monitor-description {
		color: #6b7280;
		font-size: 0.875rem;
		margin: 0;
		line-height: 1.4;
	}
	
	.status-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
	}
	
	.status-indicator.success {
		background: #dcfce7;
		color: #166534;
	}
	
	.status-indicator.neutral {
		background: #f3f4f6;
		color: #374151;
	}
	
	.status-indicator.inactive {
		background: #fef2f2;
		color: #991b1b;
	}
	
	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	
	.status-indicator.success .status-dot {
		background: #22c55e;
	}
	
	.status-indicator.neutral .status-dot {
		background: #6b7280;
	}
	
	.status-indicator.inactive .status-dot {
		background: #ef4444;
	}
	
	/* Content */
	.card-content {
		margin-bottom: 1rem;
	}
	
	.monitor-prompt {
		margin-bottom: 1rem;
	}
	
	.monitor-prompt p {
		color: #374151;
		font-size: 0.875rem;
		line-height: 1.5;
		margin: 0;
		font-style: italic;
	}
	
	.facts-summary {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	
	.facts-count {
		color: #6b7280;
		font-size: 0.75rem;
		font-weight: 500;
	}
	
	.fact-tags {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	
	.fact-tag {
		background: #f3f4f6;
		color: #374151;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
	}
	
	/* Footer */
	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #f3f4f6;
	}
	
	.monitor-meta {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}
	
	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		color: #6b7280;
		font-size: 0.75rem;
	}
	
	.action-buttons {
		display: flex;
		gap: 0.5rem;
	}
	
	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		background: #fff;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.action-btn:hover:not(:disabled) {
		background: #f9fafb;
		border-color: #9ca3af;
		color: #374151;
	}
	
	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.action-btn.danger:hover:not(:disabled) {
		background: #fef2f2;
		border-color: #fca5a5;
		color: #dc2626;
	}
	
	/* Responsive */
	@media (max-width: 640px) {
		.card-header {
			flex-direction: column;
			align-items: stretch;
		}
		
		.card-footer {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}
		
		.monitor-meta {
			justify-content: center;
		}
		
		.action-buttons {
			justify-content: center;
		}
	}
</style>