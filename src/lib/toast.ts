import { toast } from 'sonner';

export function showError(error: unknown, fallbackMessage = '오류가 발생했습니다') {
  const message = error instanceof Error ? error.message : fallbackMessage;
  toast.error(message);
}

export function showSuccess(message: string) {
  toast.success(message);
}

export function showInfo(message: string) {
  toast.info(message);
}
