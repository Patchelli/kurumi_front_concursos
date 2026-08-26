import axios from 'axios';

export function getRequestErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const response = error.response?.data;
  if (Array.isArray(response)) {
    const notifications = response as Array<{ value?: string }>;
    const messages = notifications.map(notification => notification.value).filter(Boolean);
    if (messages.length) return messages.join(' ');
  }
  const detail = response as { message?: string; detail?: string } | undefined;
  return detail?.message ?? detail?.detail ?? fallback;
}
