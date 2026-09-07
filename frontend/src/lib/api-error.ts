/** Convert API errors, including field validation errors, into readable text. */
export function apiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object' || !('detail' in data)) return fallback;
  const detail = data.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((entry: unknown) => {
        if (!entry || typeof entry !== 'object' || !('msg' in entry)) return '';
        return typeof entry.msg === 'string' ? entry.msg.replace(/^Value error, /, '') : '';
      })
      .filter(Boolean);
    if (messages.length) return messages.join('. ');
  }
  return fallback;
}
