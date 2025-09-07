
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```sh
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const DATABASE_HOST: string;
	export const DATABASE_PORT: string;
	export const DATABASE_NAME: string;
	export const DATABASE_USER: string;
	export const DATABASE_PASSWORD: string;
	export const REDIS_HOST: string;
	export const REDIS_PORT: string;
	export const NODE_ENV: string;
	export const PORT: string;
	export const SESSION_SECRET: string;
	export const AWS_REGION: string;
	export const AWS_ACCESS_KEY_ID: string;
	export const AWS_SECRET_ACCESS_KEY: string;
	export const AWS_SES_FROM_EMAIL: string;
	export const OPENAI_API_KEY: string;
	export const ANTHROPIC_API_KEY: string;
	export const NVM_INC: string;
	export const TERM_PROGRAM: string;
	export const CLAUDE_CODE_ENTRYPOINT: string;
	export const NODE: string;
	export const NVM_CD_FLAGS: string;
	export const INIT_CWD: string;
	export const SHELL: string;
	export const TERM: string;
	export const HOMEBREW_REPOSITORY: string;
	export const TMPDIR: string;
	export const TERM_PROGRAM_VERSION: string;
	export const TERM_SESSION_ID: string;
	export const npm_config_registry: string;
	export const PNPM_HOME: string;
	export const ZSH: string;
	export const GIT_EDITOR: string;
	export const NVM_DIR: string;
	export const USER: string;
	export const LS_COLORS: string;
	export const PNPM_SCRIPT_SRC_DIR: string;
	export const SSH_AUTH_SOCK: string;
	export const __CF_USER_TEXT_ENCODING: string;
	export const npm_execpath: string;
	export const PAGER: string;
	export const TMUX: string;
	export const LSCOLORS: string;
	export const npm_config_frozen_lockfile: string;
	export const npm_config_verify_deps_before_run: string;
	export const PATH: string;
	export const LaunchInstanceID: string;
	export const npm_package_json: string;
	export const __CFBundleIdentifier: string;
	export const PWD: string;
	export const npm_command: string;
	export const ENABLE_BACKGROUND_TASKS: string;
	export const OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
	export const npm_config__jsr_registry: string;
	export const npm_lifecycle_event: string;
	export const LANG: string;
	export const npm_package_name: string;
	export const NODE_PATH: string;
	export const TMUX_PANE: string;
	export const XPC_FLAGS: string;
	export const npm_package_engines_node: string;
	export const npm_config_node_gyp: string;
	export const XPC_SERVICE_NAME: string;
	export const npm_package_version: string;
	export const pnpm_config_verify_deps_before_run: string;
	export const HOME: string;
	export const SHLVL: string;
	export const HOMEBREW_PREFIX: string;
	export const LESS: string;
	export const LOGNAME: string;
	export const npm_lifecycle_script: string;
	export const COREPACK_ENABLE_AUTO_PIN: string;
	export const BUN_INSTALL: string;
	export const NVM_BIN: string;
	export const npm_config_user_agent: string;
	export const HOMEBREW_CELLAR: string;
	export const INFOPATH: string;
	export const SECURITYSESSIONID: string;
	export const CLAUDECODE: string;
	export const npm_node_execpath: string;
	export const VITE_USER_NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	export const PUBLIC_BASE_URL: string;
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		DATABASE_HOST: string;
		DATABASE_PORT: string;
		DATABASE_NAME: string;
		DATABASE_USER: string;
		DATABASE_PASSWORD: string;
		REDIS_HOST: string;
		REDIS_PORT: string;
		NODE_ENV: string;
		PORT: string;
		SESSION_SECRET: string;
		AWS_REGION: string;
		AWS_ACCESS_KEY_ID: string;
		AWS_SECRET_ACCESS_KEY: string;
		AWS_SES_FROM_EMAIL: string;
		OPENAI_API_KEY: string;
		ANTHROPIC_API_KEY: string;
		NVM_INC: string;
		TERM_PROGRAM: string;
		CLAUDE_CODE_ENTRYPOINT: string;
		NODE: string;
		NVM_CD_FLAGS: string;
		INIT_CWD: string;
		SHELL: string;
		TERM: string;
		HOMEBREW_REPOSITORY: string;
		TMPDIR: string;
		TERM_PROGRAM_VERSION: string;
		TERM_SESSION_ID: string;
		npm_config_registry: string;
		PNPM_HOME: string;
		ZSH: string;
		GIT_EDITOR: string;
		NVM_DIR: string;
		USER: string;
		LS_COLORS: string;
		PNPM_SCRIPT_SRC_DIR: string;
		SSH_AUTH_SOCK: string;
		__CF_USER_TEXT_ENCODING: string;
		npm_execpath: string;
		PAGER: string;
		TMUX: string;
		LSCOLORS: string;
		npm_config_frozen_lockfile: string;
		npm_config_verify_deps_before_run: string;
		PATH: string;
		LaunchInstanceID: string;
		npm_package_json: string;
		__CFBundleIdentifier: string;
		PWD: string;
		npm_command: string;
		ENABLE_BACKGROUND_TASKS: string;
		OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
		npm_config__jsr_registry: string;
		npm_lifecycle_event: string;
		LANG: string;
		npm_package_name: string;
		NODE_PATH: string;
		TMUX_PANE: string;
		XPC_FLAGS: string;
		npm_package_engines_node: string;
		npm_config_node_gyp: string;
		XPC_SERVICE_NAME: string;
		npm_package_version: string;
		pnpm_config_verify_deps_before_run: string;
		HOME: string;
		SHLVL: string;
		HOMEBREW_PREFIX: string;
		LESS: string;
		LOGNAME: string;
		npm_lifecycle_script: string;
		COREPACK_ENABLE_AUTO_PIN: string;
		BUN_INSTALL: string;
		NVM_BIN: string;
		npm_config_user_agent: string;
		HOMEBREW_CELLAR: string;
		INFOPATH: string;
		SECURITYSESSIONID: string;
		CLAUDECODE: string;
		npm_node_execpath: string;
		VITE_USER_NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		PUBLIC_BASE_URL: string;
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
