<!-- MonitorCreationForm.svelte - Natural language monitor creation interface -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { z } from 'zod';
	import { Play, Lightbulb, Sparkles, Clock, TrendingUp, Activity } from 'lucide-svelte';
	
	const dispatch = createEventDispatcher<{
		submit: { 
			prompt: string;
			monitorType: 'CURRENT_STATE' | 'HISTORICAL_CHANGE';
			frequency: number;
			name: string;
		};
		preview: { prompt: string };
	}>();
	
	// Form state
	let prompt = '';
	let monitorType: 'CURRENT_STATE' | 'HISTORICAL_CHANGE' = 'CURRENT_STATE';
	let frequency = 60; // Default 60 minutes
	let customName = '';
	let isSubmitting = false;
	let showAdvanced = false;
	
	// Validation schema
	const monitorSchema = z.object({
		prompt: z.string()
			.min(10, 'Prompt must be at least 10 characters')
			.max(1000, 'Prompt must be less than 1000 characters')
			.refine(
				(val) => val.toLowerCase().includes('when') || val.toLowerCase().includes('if'),
				'Prompt should describe a condition using "when" or "if"'
			),
		name: z.string()
			.min(3, 'Name must be at least 3 characters')
			.max(100, 'Name must be less than 100 characters')
			.optional(),
		monitorType: z.enum(['CURRENT_STATE', 'HISTORICAL_CHANGE']),
		frequency: z.number().min(5).max(1440) // 5 minutes to 24 hours
	});
	
	// Form validation state
	let errors: Record<string, string> = {};
	let isValid = false;
	
	// Example prompts for inspiration
	const examplePrompts = {
		CURRENT_STATE: [
			"Alert me when Tesla stock drops below $200 per share",
			"Notify me when Bitcoin price exceeds $50,000",
			"Tell me when Apple announces a new iPhone",
			"Alert me when unemployment rate falls below 4%"
		],
		HISTORICAL_CHANGE: [
			"Alert me when Tesla stock drops more than 10% in a single day",
			"Notify me when Bitcoin gains more than 15% in 24 hours",
			"Tell me when any major tech stock has its biggest gain in 6 months",
			"Alert me when oil prices change more than 5% in a week"
		]
	};
	
	// Reactive validation
	$: {
		try {
			const data = {
				prompt,
				name: customName || generateNameFromPrompt(prompt),
				monitorType,
				frequency
			};
			
			monitorSchema.parse(data);
			errors = {};
			isValid = true;
		} catch (error) {
			if (error instanceof z.ZodError) {
				errors = error.issues.reduce((acc: Record<string, string>, err) => {
					if (err.path.length > 0) {
						acc[err.path[0] as string] = err.message;
					}
					return acc;
				}, {} as Record<string, string>);
			}
			isValid = false;
		}
	}
	
	// Generate monitor name from prompt
	function generateNameFromPrompt(prompt: string): string {
		if (prompt.length < 10) return '';
		
		// Extract key parts for a concise name
		const words = prompt.toLowerCase()
			.replace(/alert me|notify me|tell me|when|if/g, '')
			.trim()
			.split(' ')
			.filter(word => word.length > 2)
			.slice(0, 4);
			
		return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
	}
	
	// Handle form submission
	async function handleSubmit() {
		if (!isValid || isSubmitting) return;
		
		isSubmitting = true;
		
		try {
			const data = {
				prompt,
				monitorType,
				frequency,
				name: customName || generateNameFromPrompt(prompt)
			};
			
			dispatch('submit', data);
		} catch (error) {
			console.error('Form submission error:', error);
		} finally {
			isSubmitting = false;
		}
	}
	
	// Handle preview/validation
	function handlePreview() {
		if (prompt.length > 10) {
			dispatch('preview', { prompt });
		}
	}
	
	// Use example prompt
	function useExample(example: string) {
		prompt = example;
		showAdvanced = false;
	}
	
	// Character count and progress
	$: characterCount = prompt.length;
	$: characterProgress = Math.min((characterCount / 100) * 100, 100);
	$: progressColor = characterCount < 10 ? '#ef4444' : characterCount > 500 ? '#f59e0b' : '#10b981';
	
	// Frequency options
	const frequencyOptions = [
		{ value: 5, label: '5 minutes', description: 'Very frequent updates' },
		{ value: 15, label: '15 minutes', description: 'Frequent updates' },
		{ value: 30, label: '30 minutes', description: 'Regular updates' },
		{ value: 60, label: '1 hour', description: 'Hourly updates' },
		{ value: 360, label: '6 hours', description: 'Daily check-ins' },
		{ value: 1440, label: '24 hours', description: 'Daily updates' }
	];
</script>

<div class="monitor-creation-form">
	<!-- Header -->
	<div class="form-header">
		<div class="header-content">
			<h1 class="form-title">
				<Sparkles size={24} class="title-icon" />
				Create Your Monitor
			</h1>
			<p class="form-subtitle">
				Describe what you want to track in natural language. Our AI will understand and set up intelligent monitoring for you.
			</p>
		</div>
	</div>

	<form on:submit|preventDefault={handleSubmit} class="creation-form">
		<!-- Main Prompt Input -->
		<div class="input-section">
			<label for="prompt" class="input-label">
				<Lightbulb size={16} />
				What would you like to monitor?
			</label>
			
			<div class="prompt-input-container">
				<textarea
					id="prompt"
					bind:value={prompt}
					placeholder="Example: Alert me when Tesla stock drops below $200 AND Elon Musk tweets about innovation..."
					class="prompt-textarea"
					class:error={errors.prompt}
					on:input={handlePreview}
					rows="4"
					maxlength="1000"
				></textarea>
				
				<div class="input-footer">
					<div class="character-count">
						<div class="progress-bar">
							<div 
								class="progress-fill" 
								style="width: {characterProgress}%; background-color: {progressColor};"
							></div>
						</div>
						<span class="count-text" style="color: {progressColor};">
							{characterCount}/1000
						</span>
					</div>
					
					{#if errors.prompt}
						<div class="error-text">{errors.prompt}</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Monitor Type Selection -->
		<div class="input-section">
			<label class="input-label">Monitor Type</label>
			<div class="radio-group">
				<label class="radio-option" class:selected={monitorType === 'CURRENT_STATE'}>
					<input 
						type="radio" 
						bind:group={monitorType} 
						value="CURRENT_STATE"
						name="monitorType"
					/>
					<div class="radio-content">
						<Activity size={20} class="radio-icon" />
						<div class="radio-text">
							<div class="radio-title">Current State</div>
							<div class="radio-description">Monitor when conditions are met right now</div>
						</div>
					</div>
				</label>
				
				<label class="radio-option" class:selected={monitorType === 'HISTORICAL_CHANGE'}>
					<input 
						type="radio" 
						bind:group={monitorType} 
						value="HISTORICAL_CHANGE"
						name="monitorType"
					/>
					<div class="radio-content">
						<TrendingUp size={20} class="radio-icon" />
						<div class="radio-text">
							<div class="radio-title">Historical Change</div>
							<div class="radio-description">Monitor when things change over time</div>
						</div>
					</div>
				</label>
			</div>
		</div>

		<!-- Example Prompts -->
		<div class="examples-section">
			<h3 class="examples-title">Need inspiration? Try these examples:</h3>
			<div class="examples-grid">
				{#each examplePrompts[monitorType] as example}
					<button
						type="button"
						class="example-prompt"
						on:click={() => useExample(example)}
					>
						{example}
					</button>
				{/each}
			</div>
		</div>

		<!-- Advanced Options -->
		<div class="advanced-section">
			<button
				type="button"
				class="advanced-toggle"
				on:click={() => showAdvanced = !showAdvanced}
			>
				<span>Advanced Options</span>
				<span class="toggle-icon" class:rotated={showAdvanced}>▼</span>
			</button>
			
			{#if showAdvanced}
				<div class="advanced-content">
					<!-- Check Frequency -->
					<div class="input-section">
						<label class="input-label">
							<Clock size={16} />
							Check Frequency
						</label>
						<select bind:value={frequency} class="frequency-select">
							{#each frequencyOptions as option}
								<option value={option.value}>
									{option.label} - {option.description}
								</option>
							{/each}
						</select>
					</div>

					<!-- Custom Name -->
					<div class="input-section">
						<label for="customName" class="input-label">
							Monitor Name (optional)
						</label>
						<input
							id="customName"
							type="text"
							bind:value={customName}
							placeholder={generateNameFromPrompt(prompt) || 'Auto-generated from your prompt'}
							class="text-input"
							class:error={errors.name}
							maxlength="100"
						/>
						{#if errors.name}
							<div class="error-text">{errors.name}</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Form Actions -->
		<div class="form-actions">
			<button
				type="button"
				class="secondary-btn"
				on:click={() => history.back()}
			>
				Cancel
			</button>
			
			<button
				type="submit"
				class="primary-btn"
				disabled={!isValid || isSubmitting}
			>
				{#if isSubmitting}
					<div class="loading-spinner"></div>
					Creating Monitor...
				{:else}
					<Play size={16} />
					Create Monitor
				{/if}
			</button>
		</div>
	</form>
</div>

<style>
	.monitor-creation-form {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}
	
	/* Header */
	.form-header {
		text-align: center;
		margin-bottom: 3rem;
	}
	
	.form-title {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		font-size: 2rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 1rem 0;
	}
	
	.title-icon {
		color: #3b82f6;
	}
	
	.form-subtitle {
		font-size: 1.125rem;
		color: #6b7280;
		margin: 0;
		line-height: 1.6;
	}
	
	/* Form */
	.creation-form {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	
	.input-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.input-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
	}
	
	/* Prompt Input */
	.prompt-input-container {
		position: relative;
	}
	
	.prompt-textarea {
		width: 100%;
		padding: 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.75rem;
		font-size: 1rem;
		line-height: 1.6;
		resize: vertical;
		transition: all 0.2s;
		font-family: inherit;
	}
	
	.prompt-textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	
	.prompt-textarea.error {
		border-color: #ef4444;
	}
	
	.input-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.5rem;
	}
	
	.character-count {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.progress-bar {
		width: 60px;
		height: 4px;
		background: #e5e7eb;
		border-radius: 2px;
		overflow: hidden;
	}
	
	.progress-fill {
		height: 100%;
		transition: all 0.3s ease;
	}
	
	.count-text {
		font-size: 0.75rem;
		font-weight: 500;
	}
	
	.error-text {
		color: #ef4444;
		font-size: 0.75rem;
		font-weight: 500;
	}
	
	/* Radio Group */
	.radio-group {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	
	.radio-option {
		display: flex;
		align-items: center;
		padding: 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
		background: #fff;
	}
	
	.radio-option:hover {
		border-color: #d1d5db;
		background: #f9fafb;
	}
	
	.radio-option.selected {
		border-color: #3b82f6;
		background: #eff6ff;
	}
	
	.radio-option input[type="radio"] {
		display: none;
	}
	
	.radio-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
	}
	
	.radio-icon {
		color: #6b7280;
		flex-shrink: 0;
	}
	
	.radio-option.selected .radio-icon {
		color: #3b82f6;
	}
	
	.radio-text {
		flex: 1;
	}
	
	.radio-title {
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.25rem;
	}
	
	.radio-description {
		font-size: 0.75rem;
		color: #6b7280;
	}
	
	/* Examples */
	.examples-section {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		padding: 1.5rem;
	}
	
	.examples-title {
		font-size: 1rem;
		font-weight: 600;
		color: #374151;
		margin: 0 0 1rem 0;
	}
	
	.examples-grid {
		display: grid;
		gap: 0.75rem;
	}
	
	.example-prompt {
		padding: 0.75rem 1rem;
		background: #fff;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
		color: #374151;
	}
	
	.example-prompt:hover {
		border-color: #3b82f6;
		background: #eff6ff;
		color: #1e40af;
	}
	
	/* Advanced Options */
	.advanced-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: none;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
		color: #6b7280;
		transition: all 0.2s;
	}
	
	.advanced-toggle:hover {
		border-color: #9ca3af;
		color: #374151;
	}
	
	.toggle-icon {
		transition: transform 0.2s;
	}
	
	.toggle-icon.rotated {
		transform: rotate(180deg);
	}
	
	.advanced-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding-top: 1rem;
	}
	
	.frequency-select,
	.text-input {
		padding: 0.75rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		transition: all 0.2s;
	}
	
	.frequency-select:focus,
	.text-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	
	.text-input.error {
		border-color: #ef4444;
	}
	
	/* Form Actions */
	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		padding-top: 2rem;
		border-top: 1px solid #e5e7eb;
	}
	
	.secondary-btn,
	.primary-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}
	
	.secondary-btn {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
	}
	
	.secondary-btn:hover {
		background: #e5e7eb;
		border-color: #9ca3af;
	}
	
	.primary-btn {
		background: #3b82f6;
		color: #fff;
	}
	
	.primary-btn:hover:not(:disabled) {
		background: #2563eb;
		transform: translateY(-1px);
	}
	
	.primary-btn:disabled {
		background: #9ca3af;
		cursor: not-allowed;
		transform: none;
	}
	
	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	
	/* Responsive */
	@media (max-width: 768px) {
		.monitor-creation-form {
			padding: 1rem;
		}
		
		.form-title {
			font-size: 1.5rem;
		}
		
		.radio-group {
			grid-template-columns: 1fr;
		}
		
		.form-actions {
			flex-direction: column;
		}
		
		.secondary-btn,
		.primary-btn {
			justify-content: center;
		}
	}
</style>