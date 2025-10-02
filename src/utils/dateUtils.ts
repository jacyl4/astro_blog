import { DATE_FORMAT, UI_TEXT } from '@/consts';

type DateInput = Date | string | number | undefined | null;

function toDate(value: DateInput): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(input: DateInput): string {
  const date = toDate(input);
  if (!date) {
    return UI_TEXT.unknownDate;
  }

  try {
    return date.toLocaleDateString(
      DATE_FORMAT.locale,
      DATE_FORMAT.options as Intl.DateTimeFormatOptions,
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[dateUtils] Failed to format date', error);
    }
    return UI_TEXT.unknownDate;
  }
}
