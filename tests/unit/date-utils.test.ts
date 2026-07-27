import { describe, expect, it } from 'vitest';
import { formatArchiveMonth, formatDate } from '../../src/utils/dateUtils';

describe('date utilities', () => {
  it('renders dates using the fixed blog timezone', () => {
    const boundary = new Date('2025-06-30T16:00:00.000Z');

    expect(formatArchiveMonth(boundary)).toBe('2025-07');
    expect(formatDate(boundary)).toBe('2025年7月1日');
  });
});
