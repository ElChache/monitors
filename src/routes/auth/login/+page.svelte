<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let email = '';
	let password = '';
	let loading = false;
	let error = '';

	async function handleSubmit() {
		if (!email || !password) {
			error = 'Please fill in all fields';
			return;
		}

		loading = true;
		error = '';

		try {
			const result = await signIn('credentials', {
				email,
				password,
				redirect: false
			});

			if (result?.error) {
				error = 'Invalid email or password';
			} else {
				// Redirect to app or callback URL
				const callbackUrl = $page.url.searchParams.get('callbackUrl') || '/app';
				goto(callbackUrl);
			}
		} catch (err) {
			error = 'Login failed. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function handleGoogleSignIn() {
		await signIn('google', {
			callbackUrl: $page.url.searchParams.get('callbackUrl') || '/app'
		});
	}
</script>

<svelte:head>
	<title>Login - MonitorHub</title>
</svelte:head>

<div class="login-container">
	<div class="login-card">
		<div class="logo">
			<h1>MonitorHub</h1>
			<p>Combination Intelligence Monitoring</p>
		</div>

		<form on:submit|preventDefault={handleSubmit}>
			<div class="form-group">
				<label for="email">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					placeholder="Enter your email"
					required
					disabled={loading}
				/>
			</div>

			<div class="form-group">
				<label for="password">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					placeholder="Enter your password"
					required
					disabled={loading}
				/>
			</div>

			{#if error}
				<div class="error">{error}</div>
			{/if}

			<button type="submit" class="btn-primary" disabled={loading}>
				{loading ? 'Signing in...' : 'Sign In'}
			</button>
		</form>

		<div class="divider">
			<span>or</span>
		</div>

		<button type="button" class="btn-google" on:click={handleGoogleSignIn} disabled={loading}>
			<svg class="google-icon" viewBox="0 0 24 24">
				<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
				<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
				<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
				<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
			</svg>
			Continue with Google
		</button>

		<div class="auth-links">
			<a href="/auth/register">Don't have an account? Sign up</a>
			<a href="/auth/reset">Forgot your password?</a>
		</div>
	</div>
</div>

<style>
	.login-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 1rem;
	}

	.login-card {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		width: 100%;
		max-width: 400px;
	}

	.logo {
		text-align: center;
		margin-bottom: 2rem;
	}

	.logo h1 {
		color: #3b82f6;
		margin: 0;
		font-size: 2rem;
		font-weight: 700;
	}

	.logo p {
		color: #6b7280;
		margin: 0.5rem 0 0 0;
		font-size: 0.875rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: #374151;
		font-weight: 500;
		font-size: 0.875rem;
	}

	input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 1rem;
		transition: border-color 0.2s, box-shadow 0.2s;
		box-sizing: border-box;
	}

	input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	input:disabled {
		background-color: #f9fafb;
		cursor: not-allowed;
	}

	.btn-primary {
		width: 100%;
		background: #3b82f6;
		color: white;
		border: none;
		padding: 0.75rem;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
		margin-bottom: 1rem;
	}

	.btn-primary:hover:not(:disabled) {
		background: #2563eb;
	}

	.btn-primary:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.btn-google {
		width: 100%;
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
		padding: 0.75rem;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s, border-color 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.btn-google:hover:not(:disabled) {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	.btn-google:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.google-icon {
		width: 20px;
		height: 20px;
	}

	.divider {
		text-align: center;
		margin: 1.5rem 0;
		position: relative;
	}

	.divider::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
		background: #e5e7eb;
	}

	.divider span {
		background: white;
		padding: 0 1rem;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 0.75rem;
		border-radius: 6px;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.auth-links {
		text-align: center;
		margin-top: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.auth-links a {
		color: #3b82f6;
		text-decoration: none;
		font-size: 0.875rem;
		transition: color 0.2s;
	}

	.auth-links a:hover {
		color: #2563eb;
	}
</style>