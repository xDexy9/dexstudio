import { toast } from 'sonner';

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred. Please try again.';
}

export function handleError(
  error: unknown,
  context?: string,
  options?: { showToast?: boolean; toastTitle?: string }
): void {
  const message = getErrorMessage(error);
  if (context) { console.error(`[${context}]`, error); } else { console.error(error); }
  if (options?.showToast ?? true) {
    toast.error(options?.toastTitle || 'Error', { description: message });
  }
}

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
  options?: { showToast?: boolean; toastTitle?: string; rethrow?: boolean }
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    handleError(error, context, options);
    if (options?.rethrow) throw error;
    return null;
  }
}

export function showSuccess(title: string, description?: string): void {
  toast.success(title, { description });
}

export function showError(title: string, description?: string): void {
  toast.error(title, { description });
}
