<!-- MonitorHub Authenticated App Layout -->
<script lang="ts">
	import { page } from '$app/stores';
	import { signOut } from '@auth/sveltekit/client';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	// Extract user information from page data
	$: user = data.session?.user;
	$: isAdmin = (user as any)?.isAdmin || false;

	async function handleSignOut() {
		await signOut({ callbackUrl: '/' });
	}
</script>

<!-- Main Application Layout -->
<div class="app-layout">
	<!-- Header Navigation -->
	<header class="app-header">
		<div class="header-content">
			<div class="logo">
				<h1>MonitorHub</h1>
				<span class="beta-badge">Beta</span>
			</div>

			<nav class="main-nav">
				<a href="/app" class:active={$page.url.pathname === '/app'}>
					Dashboard
				</a>
				<a href="/app/monitors" class:active={$page.url.pathname.startsWith('/app/monitors')}>
					Monitors
				</a>
				<a href="/app/templates" class:active={$page.url.pathname === '/app/templates'}>
					Templates
				</a>
				{#if isAdmin}
					<a href="/admin" class:active={$page.url.pathname.startsWith('/admin')}>
						Admin
					</a>
				{/if}
			</nav>

			<div class="user-menu">
				<div class="user-info">
					<span class="user-name">{user?.name}</span>
					<span class="user-email">{user?.email}</span>
				</div>
				<button on:click={handleSignOut} class="sign-out-btn">
					Sign Out
				</button>
			</div>
		</div>
	</header>

	<!-- Main Content Area -->
	<main class="app-main">
		<slot />
	</main>
</div>

<style>
	.app-layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.app-header {
		background: #fff;
		border-bottom: 1px solid #e5e7eb;
		padding: 0 2rem;
	}

	.header-content {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 4rem;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.logo h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0;
	}

	.beta-badge {
		background: #3b82f6;
		color: white;
		padding: 0.125rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.main-nav {
		display: flex;
		gap: 2rem;
	}

	.main-nav a {
		color: #6b7280;
		text-decoration: none;
		font-weight: 500;
		padding: 0.5rem 0;
		border-bottom: 2px solid transparent;
		transition: all 0.2s;
	}

	.main-nav a:hover,
	.main-nav a.active {
		color: #3b82f6;
		border-bottom-color: #3b82f6;
	}

	.user-menu {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.user-info {
		text-align: right;
	}

	.user-name {
		display: block;
		font-weight: 600;
		color: #1f2937;
		font-size: 0.875rem;
	}

	.user-email {
		display: block;
		color: #6b7280;
		font-size: 0.75rem;
	}

	.sign-out-btn {
		background: #f3f4f6;
		border: 1px solid #d1d5db;
		color: #374151;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.sign-out-btn:hover {
		background: #e5e7eb;
	}

	.app-main {
		flex: 1;
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
	}

	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			height: auto;
			padding: 1rem 0;
			gap: 1rem;
		}

		.main-nav {
			order: 3;
			gap: 1rem;
		}

		.app-main {
			padding: 1rem;
		}
	}
</style>