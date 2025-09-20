<script lang="ts">
	export const id: string = '';
	export let title: string;
	export let status: 'active' | 'paused' | 'triggered';
	export let changeData: {
		percentage: string;
		timeframe: string;
		direction: 'up' | 'down';
	};
	export let chartPreview: Array<{ x: number; y: number }> = [];
	export let onView: () => void;
	export let onConfig: () => void;

	const getStatusColor = (status: string): string => {
		switch (status) {
			case 'active': return 'var(--monitor-active)';
			case 'triggered': return 'var(--monitor-triggered)';
			case 'paused': return 'var(--monitor-paused)';
			default: return 'var(--monitor-paused)';
		}
	};

	const getStatusIcon = (status: string): string => {
		return status === 'paused' ? '○' : '●';
	};

	const getChangeIcon = (direction: string): string => {
		return direction === 'down' ? '▼' : '▲';
	};

	// Simple SVG path generation for chart preview
	const generateChartPath = (data: Array<{ x: number; y: number }>): string => {
		if (data.length === 0) return '';
		
		const maxY = Math.max(...data.map(d => d.y));
		const minY = Math.min(...data.map(d => d.y));
		const range = maxY - minY || 1;
		
		return data
			.map((point, index) => {
				const x = (index / (data.length - 1)) * 100;
				const y = 100 - ((point.y - minY) / range) * 100;
				return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
			})
			.join(' ');
	};

	$: chartPath = generateChartPath(chartPreview);
</script>

<div 
	class="historical-monitor-card"
	class:triggered={status === 'triggered'}
	role="article"
	aria-label="Historical Monitor: {title}"
>
	<div class="monitor-header">
		<h3 class="monitor-title">{title}</h3>
		<div class="status-indicator" style="color: {getStatusColor(status)}">
			<span aria-label="Status: {status}">
				{getStatusIcon(status)}
			</span>
			<span class="status-text">{status.toUpperCase()}</span>
		</div>
	</div>

	<div class="monitor-content">
		<div class="change-summary">
			<span 
				class="change-icon"
				class:up={changeData.direction === 'up'}
				class:down={changeData.direction === 'down'}
				aria-label="Change: {changeData.direction} {changeData.percentage}"
			>
				{getChangeIcon(changeData.direction)}
			</span>
			<div class="change-details">
				<span class="change-percentage">{changeData.percentage}</span>
				<span class="change-timeframe">in {changeData.timeframe}</span>
			</div>
		</div>

		<div class="chart-preview" aria-label="Chart preview showing historical data">
			<div class="chart-container">
				{#if chartPreview.length > 0}
					<svg viewBox="0 0 100 100" class="chart-svg">
						<path
							d={chartPath}
							stroke={changeData.direction === 'down' ? 'var(--monitor-triggered)' : 'var(--monitor-active)'}
							stroke-width="2"
							fill="none"
							vector-effect="non-scaling-stroke"
						/>
						<!-- Add some sample dots for visual interest -->
						{#each chartPreview.slice(-3) as _item, index (index)}
							<circle
								cx={(index / 2) * 100}
								cy={50 + (index - 1) * 10}
								r="2"
								fill={changeData.direction === 'down' ? 'var(--monitor-triggered)' : 'var(--monitor-active)'}
							/>
						{/each}
					</svg>
				{:else}
					<div class="chart-placeholder">
						<span class="chart-icon">📈</span>
						<span class="chart-text">Chart View</span>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<div class="monitor-actions">
		<button 
			class="action-btn primary"
			on:click={onView}
			aria-label="View detailed chart for {title}"
		>
			View
		</button>
		<button 
			class="action-btn secondary"
			on:click={onConfig}
			aria-label="Configure {title}"
		>
			Config
		</button>
	</div>
</div>

<style>
	:root {
		--monitor-active: #10B981;
		--monitor-triggered: #EF4444;
		--monitor-paused: #6B7280;
		--primary: #3B82F6;
		--text-primary: #111827;
		--text-secondary: #6B7280;
		--surface: #F9FAFB;
	}

	.historical-monitor-card {
		background: white;
		border: 1px solid #E5E7EB;
		border-radius: 0.5rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
		min-height: 200px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.historical-monitor-card:hover {
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	.historical-monitor-card.triggered {
		background: linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%);
		border-color: var(--monitor-triggered);
	}

	.monitor-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.monitor-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
		line-height: 1.4;
		flex: 1;
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.status-indicator span:first-child {
		font-size: 1rem;
	}

	.monitor-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.change-summary {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.change-icon {
		font-size: 1.25rem;
		font-weight: bold;
	}

	.change-icon.up {
		color: var(--monitor-active);
	}

	.change-icon.down {
		color: var(--monitor-triggered);
	}

	.change-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.change-percentage {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.change-timeframe {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.chart-preview {
		flex: 1;
		min-height: 80px;
		background: var(--surface);
		border-radius: 0.375rem;
		padding: 0.75rem;
		border: 1px solid #E5E7EB;
	}

	.chart-container {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.chart-svg {
		width: 100%;
		height: 60px;
		overflow: visible;
	}

	.chart-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-secondary);
	}

	.chart-icon {
		font-size: 1.5rem;
	}

	.chart-text {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.monitor-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-btn {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
		border: 1px solid;
		cursor: pointer;
		transition: all 0.2s ease;
		flex: 1;
		text-align: center;
	}

	.action-btn.primary {
		background: var(--primary);
		color: white;
		border-color: var(--primary);
	}

	.action-btn.primary:hover {
		background: #2563EB;
		border-color: #2563EB;
	}

	.action-btn.secondary {
		background: white;
		color: var(--text-secondary);
		border-color: #D1D5DB;
	}

	.action-btn.secondary:hover {
		background: var(--surface);
		border-color: var(--text-secondary);
	}

	.action-btn:focus {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	@media (max-width: 768px) {
		.historical-monitor-card {
			padding: 1rem;
		}

		.monitor-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.change-summary {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.chart-preview {
			min-height: 100px;
		}
	}
</style>