import { writable } from 'svelte/store';
import type { ToastNotification } from '$lib/components/ui/ToastContainer.svelte';

export const toasts = writable<ToastNotification[]>([]);

let toastId = 0;

export function addToast(
	message: string, 
	type: 'success' | 'error' | 'warning' | 'info' = 'info',
	duration?: number,
	persistent?: boolean
): string {
	const id = `toast-${++toastId}`;
	const toast: ToastNotification = {
		id,
		message,
		type,
		duration,
		persistent
	};

	toasts.update(current => [...current, toast]);

	return id;
}

export function removeToast(id: string): void {
	toasts.update(current => current.filter(toast => toast.id !== id));
}

export function clearToasts(): void {
	toasts.set([]);
}

// Convenience functions
export function showSuccess(message: string, duration?: number): string {
	return addToast(message, 'success', duration);
}

export function showError(message: string, persistent?: boolean): string {
	return addToast(message, 'error', undefined, persistent);
}

export function showWarning(message: string, duration?: number): string {
	return addToast(message, 'warning', duration);
}

export function showInfo(message: string, duration?: number): string {
	return addToast(message, 'info', duration);
}