<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  
  const dispatch = createEventDispatcher<{
    save: { template: EmailTemplate };
    test: { template: EmailTemplate; testEmail: string };
    preview: { template: EmailTemplate };
    reset: void;
  }>();
  
  export let template: EmailTemplate = {
    id: '',
    name: 'Default Notification',
    subject: '{{monitor_name}} Alert: {{trigger_reason}}',
    htmlContent: `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d47a1;">{{monitor_name}} Alert</h2>
          <p><strong>Monitor Status:</strong> {{monitor_status}}</p>
          <p><strong>Current Value:</strong> {{current_value}}</p>
          <p><strong>Trigger Condition:</strong> {{trigger_condition}}</p>
          <p><strong>Time:</strong> {{timestamp}}</p>
          <hr>
          <p><a href="{{monitor_url}}" style="background: #0d47a1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Monitor</a></p>
        </body>
      </html>
    `,
    textContent: `{{monitor_name}} Alert
    
Monitor Status: {{monitor_status}}
Current Value: {{current_value}}
Trigger Condition: {{trigger_condition}}
Time: {{timestamp}}

View Monitor: {{monitor_url}}`,
    variables: [
      { name: 'monitor_name', description: 'Name of the monitor', example: 'Tesla Stock Price' },
      { name: 'monitor_status', description: 'Current status', example: 'Alert Triggered' },
      { name: 'current_value', description: 'Current monitored value', example: '$195.50' },
      { name: 'trigger_condition', description: 'What triggered the alert', example: 'Price dropped below $200' },
      { name: 'timestamp', description: 'When the alert was triggered', example: '2024-01-15 10:30 AM' },
      { name: 'monitor_url', description: 'Link to monitor details', example: 'https://monitors.app/monitor/123' }
    ]
  };
  
  export let loading = false;
  export let showPreview = false;
  
  interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    htmlContent: string;
    textContent: string;
    variables: Array<{
      name: string;
      description: string;
      example: string;
    }>;
  }
  
  let activeTab: 'html' | 'text' = 'html';
  let showVariables = false;
  let testEmail = '';
  let previewHtml = '';
  let validation = {
    isValid: true,
    errors: [] as string[]
  };
  
  // Rich text editor state
  let htmlEditor: HTMLTextAreaElement;
  let textEditor: HTMLTextAreaElement;
  
  // Auto-resize textareas
  function autoResize(element: HTMLTextAreaElement) {
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
  }
  
  // Insert variable at cursor position
  function insertVariable(variableName: string) {
    const editor = activeTab === 'html' ? htmlEditor : textEditor;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const variable = `{{${variableName}}}`;
    
    const currentContent = activeTab === 'html' ? template.htmlContent : template.textContent;
    const newContent = currentContent.substring(0, start) + variable + currentContent.substring(end);
    
    if (activeTab === 'html') {
      template.htmlContent = newContent;
    } else {
      template.textContent = newContent;
    }
    
    // Set cursor position after inserted variable
    setTimeout(() => {
      editor.focus();
      editor.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
    
    showVariables = false;
  }
  
  // Validate template
  function validateTemplate() {
    const errors: string[] = [];
    
    if (!template.name.trim()) {
      errors.push('Template name is required');
    }
    
    if (!template.subject.trim()) {
      errors.push('Subject line is required');
    }
    
    if (!template.htmlContent.trim() && !template.textContent.trim()) {
      errors.push('At least one content type (HTML or Text) is required');
    }
    
    // Check for unmatched variables
    const allContent = `${template.subject} ${template.htmlContent} ${template.textContent}`;
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const usedVariables = Array.from(allContent.matchAll(variableRegex))
      .map(match => match[1].trim());
    
    const validVariables = template.variables.map(v => v.name);
    const invalidVariables = usedVariables.filter(v => !validVariables.includes(v));
    
    if (invalidVariables.length > 0) {
      errors.push(`Invalid variables: ${invalidVariables.join(', ')}`);
    }
    
    validation = {
      isValid: errors.length === 0,
      errors
    };
    
    return validation.isValid;
  }
  
  // Generate preview with sample data
  function generatePreview() {
    let preview = template.htmlContent;
    
    // Replace variables with example values
    template.variables.forEach(variable => {
      const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
      preview = preview.replace(regex, variable.example);
    });
    
    previewHtml = preview;
    showPreview = true;
    dispatch('preview', { template });
  }
  
  // Handle save
  function handleSave() {
    if (!validateTemplate()) {
      return;
    }
    
    dispatch('save', { template });
  }
  
  // Handle test email
  function handleTest() {
    if (!validateTemplate()) {
      return;
    }
    
    if (!testEmail.trim()) {
      validation.errors = ['Test email address is required'];
      validation.isValid = false;
      return;
    }
    
    dispatch('test', { template, testEmail });
  }
  
  // Handle reset
  function handleReset() {
    if (confirm('Are you sure you want to reset to default template? This will lose all changes.')) {
      dispatch('reset');
    }
  }
  
  // Auto-validate on changes
  $: if (template) {
    validateTemplate();
  }
  
  // Auto-resize textareas
  onMount(() => {
    if (htmlEditor) autoResize(htmlEditor);
    if (textEditor) autoResize(textEditor);
  });
</script>

<div class="email-template-editor">
  <!-- Header -->
  <div class="editor-header">
    <div class="header-left">
      <h2 class="editor-title">Email Template Configuration</h2>
      <p class="editor-description">Customize notification email templates with dynamic variables</p>
    </div>
    
    <div class="header-actions">
      <button 
        class="btn-secondary"
        on:click={() => showVariables = !showVariables}
        aria-expanded={showVariables}
      >
        Variables {showVariables ? '▼' : '▶'}
      </button>
      
      <button 
        class="btn-outline"
        on:click={generatePreview}
        disabled={!validation.isValid}
      >
        📋 Preview
      </button>
      
      <button 
        class="btn-outline"
        on:click={handleReset}
      >
        🔄 Reset
      </button>
    </div>
  </div>
  
  <!-- Variables panel -->
  {#if showVariables}
    <div class="variables-panel">
      <h3 class="variables-title">Available Variables</h3>
      <div class="variables-grid">
        {#each template.variables as variable}
          <div class="variable-item">
            <button
              class="variable-button"
              on:click={() => insertVariable(variable.name)}
              title={`Click to insert: {{${variable.name}}}`}
            >
              <code class="variable-code">{`{{${variable.name}}}`}</code>
              <span class="variable-description">{variable.description}</span>
              <span class="variable-example">Example: {variable.example}</span>
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  
  <!-- Template form -->
  <div class="template-form">
    <!-- Basic settings -->
    <div class="form-section">
      <div class="form-group">
        <label for="template-name" class="form-label">Template Name</label>
        <input
          id="template-name"
          type="text"
          bind:value={template.name}
          class="form-input"
          placeholder="Enter template name"
        />
      </div>
      
      <div class="form-group">
        <label for="template-subject" class="form-label">
          Subject Line
          <span class="field-hint">Use {{variables}} for dynamic content</span>
        </label>
        <input
          id="template-subject"
          type="text"
          bind:value={template.subject}
          class="form-input"
          placeholder="{{monitor_name}} Alert: {{trigger_reason}}"
        />
      </div>
    </div>
    
    <!-- Content editors -->
    <div class="form-section">
      <div class="content-tabs">
        <button
          class="tab-button"
          class:active={activeTab === 'html'}
          on:click={() => activeTab = 'html'}
        >
          📄 HTML Content
        </button>
        <button
          class="tab-button"
          class:active={activeTab === 'text'}
          on:click={() => activeTab = 'text'}
        >
          📝 Plain Text
        </button>
      </div>
      
      <div class="content-editor">
        {#if activeTab === 'html'}
          <div class="editor-wrapper">
            <label for="html-editor" class="form-label">HTML Email Content</label>
            <textarea
              id="html-editor"
              bind:this={htmlEditor}
              bind:value={template.htmlContent}
              class="content-textarea html-editor"
              placeholder="<html><body>Your HTML email content with {{variables}}</body></html>"
              on:input={() => autoResize(htmlEditor)}
              spellcheck="false"
            ></textarea>
          </div>
        {:else}
          <div class="editor-wrapper">
            <label for="text-editor" class="form-label">Plain Text Content</label>
            <textarea
              id="text-editor"
              bind:this={textEditor}
              bind:value={template.textContent}
              class="content-textarea text-editor"
              placeholder="Your plain text email content with {{variables}}"
              on:input={() => autoResize(textEditor)}
            ></textarea>
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Validation errors -->
    {#if !validation.isValid}
      <div class="validation-errors">
        <h4 class="errors-title">⚠️ Validation Errors</h4>
        <ul class="errors-list">
          {#each validation.errors as error}
            <li class="error-item">{error}</li>
          {/each}
        </ul>
      </div>
    {/if}
    
    <!-- Test email section -->
    <div class="form-section test-section">
      <h3 class="section-title">Test Email</h3>
      <div class="test-controls">
        <div class="form-group">
          <label for="test-email" class="form-label">Test Email Address</label>
          <input
            id="test-email"
            type="email"
            bind:value={testEmail}
            class="form-input"
            placeholder="your@email.com"
          />
        </div>
        <button
          class="btn-outline test-btn"
          on:click={handleTest}
          disabled={loading || !validation.isValid || !testEmail.trim()}
        >
          {#if loading}
            <span class="loading-spinner"></span>
          {/if}
          📧 Send Test
        </button>
      </div>
    </div>
    
    <!-- Actions -->
    <div class="form-actions">
      <button
        class="btn-primary save-btn"
        on:click={handleSave}
        disabled={loading || !validation.isValid}
      >
        {#if loading}
          <span class="loading-spinner"></span>
        {/if}
        💾 Save Template
      </button>
    </div>
  </div>
</div>

<!-- Preview modal -->
{#if showPreview}
  <div class="preview-overlay" on:click={() => showPreview = false}>
    <div class="preview-modal" on:click|stopPropagation>
      <div class="preview-header">
        <h3 class="preview-title">Email Preview</h3>
        <button
          class="close-preview"
          on:click={() => showPreview = false}
          aria-label="Close preview"
        >
          ✕
        </button>
      </div>
      
      <div class="preview-content">
        <div class="preview-subject">
          <strong>Subject:</strong> 
          {template.subject.replace(/\{\{([^}]+)\}\}/g, (_, varName) => 
            template.variables.find(v => v.name === varName)?.example || `{{${varName}}}`
          )}
        </div>
        
        <div class="preview-body">
          {@html previewHtml}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .email-template-editor {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
    background: white;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
  }
  
  /* Header */
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    gap: 2rem;
  }
  
  .header-left {
    flex: 1;
  }
  
  .editor-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }
  
  .editor-description {
    color: #6b7280;
    margin: 0;
    font-size: 0.9375rem;
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  /* Variables panel */
  .variables-panel {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .variables-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 1rem 0;
  }
  
  .variables-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 0.75rem;
  }
  
  .variable-item {
    display: block;
  }
  
  .variable-button {
    display: block;
    width: 100%;
    padding: 0.75rem;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }
  
  .variable-button:hover,
  .variable-button:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(13, 71, 161, 0.1);
  }
  
  .variable-code {
    display: block;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.875rem;
    color: var(--primary);
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  
  .variable-description {
    display: block;
    font-size: 0.8125rem;
    color: #1f2937;
    font-weight: 500;
    margin-bottom: 0.25rem;
  }
  
  .variable-example {
    display: block;
    font-size: 0.75rem;
    color: #6b7280;
    font-style: italic;
  }
  
  /* Form sections */
  .template-form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .form-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .form-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .field-hint {
    font-size: 0.75rem;
    font-weight: 400;
    color: #9ca3af;
    font-style: italic;
  }
  
  .form-input {
    padding: 0.875rem 1rem;
    border: 2px solid #d1d5db;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s ease;
    background: white;
  }
  
  .form-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(13, 71, 161, 0.1);
  }
  
  /* Content tabs */
  .content-tabs {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 1rem;
  }
  
  .tab-button {
    padding: 0.75rem 1.5rem;
    border: 2px solid #e5e7eb;
    background: #f9fafb;
    color: #6b7280;
    font-weight: 500;
    font-size: 0.875rem;
    border-radius: 8px 8px 0 0;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: none;
  }
  
  .tab-button.active {
    background: white;
    color: var(--primary);
    border-color: var(--primary);
    border-bottom: 2px solid white;
  }
  
  .tab-button:not(.active):hover {
    background: #f3f4f6;
    color: #374151;
  }
  
  /* Content editor */
  .content-editor {
    border: 2px solid var(--primary);
    border-radius: 0 8px 8px 8px;
    background: white;
  }
  
  .editor-wrapper {
    padding: 1rem;
  }
  
  .content-textarea {
    width: 100%;
    min-height: 300px;
    max-height: 600px;
    padding: 1rem;
    border: none;
    border-radius: 6px;
    background: #f9fafb;
    font-size: 0.9375rem;
    line-height: 1.5;
    resize: vertical;
    font-family: inherit;
  }
  
  .html-editor {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.875rem;
  }
  
  .content-textarea:focus {
    outline: none;
    background: white;
    box-shadow: 0 0 0 2px rgba(13, 71, 161, 0.1);
  }
  
  /* Validation errors */
  .validation-errors {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 1rem;
  }
  
  .errors-title {
    color: #991b1b;
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }
  
  .errors-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .error-item {
    color: #991b1b;
    font-size: 0.8125rem;
  }
  
  /* Test section */
  .test-section {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 8px;
    padding: 1.5rem;
  }
  
  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #0369a1;
    margin: 0 0 1rem 0;
  }
  
  .test-controls {
    display: flex;
    gap: 1rem;
    align-items: end;
  }
  
  .test-controls .form-group {
    flex: 1;
  }
  
  .test-btn {
    flex-shrink: 0;
    height: fit-content;
  }
  
  /* Buttons */
  .btn-primary,
  .btn-secondary,
  .btn-outline {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 2px solid transparent;
    text-decoration: none;
    justify-content: center;
    min-height: 44px;
  }
  
  .btn-primary {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #1565c0;
    border-color: #1565c0;
  }
  
  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
    border-color: #d1d5db;
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: #e5e7eb;
    border-color: #9ca3af;
  }
  
  .btn-outline {
    background: transparent;
    color: var(--primary);
    border-color: var(--primary);
  }
  
  .btn-outline:hover:not(:disabled) {
    background: rgba(13, 71, 161, 0.05);
  }
  
  .btn-primary:disabled,
  .btn-secondary:disabled,
  .btn-outline:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: currentColor;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  /* Form actions */
  .form-actions {
    display: flex;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .save-btn {
    min-width: 160px;
  }
  
  /* Preview modal */
  .preview-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  
  .preview-modal {
    background: white;
    border-radius: 12px;
    max-width: 600px;
    width: 100%;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  
  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .preview-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }
  
  .close-preview {
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    color: #6b7280;
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
    transition: all 0.2s ease;
  }
  
  .close-preview:hover,
  .close-preview:focus {
    background: rgba(0, 0, 0, 0.05);
    color: #374151;
  }
  
  .preview-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }
  
  .preview-subject {
    padding: 1rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: #1f2937;
  }
  
  .preview-body {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 1rem;
    background: white;
  }
  
  /* Mobile responsive */
  @media (max-width: 768px) {
    .email-template-editor {
      padding: 1rem;
      margin: 0;
      border-radius: 0;
      border: none;
    }
    
    .editor-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }
    
    .header-actions {
      flex-wrap: wrap;
      justify-content: flex-start;
    }
    
    .variables-grid {
      grid-template-columns: 1fr;
    }
    
    .test-controls {
      flex-direction: column;
      align-items: stretch;
    }
    
    .content-textarea {
      min-height: 200px;
      font-size: 16px; /* Prevents iOS zoom */
    }
    
    .form-input {
      font-size: 16px; /* Prevents iOS zoom */
    }
    
    .preview-modal {
      margin: 0;
      border-radius: 0;
      height: 100vh;
      max-height: none;
    }
  }
  
  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .btn-primary,
    .btn-secondary,
    .btn-outline,
    .form-input,
    .content-textarea,
    .variable-button {
      transition: none;
    }
    
    .loading-spinner {
      animation: none;
    }
  }
</style>