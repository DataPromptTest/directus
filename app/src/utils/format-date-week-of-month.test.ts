import { describe, expect, test } from 'vitest';
import { formatDate } from '@/utils/format-date';

describe('formatDate week of month', () => {
	test('should render the week of month for a timestamp in a timezone', () => {
		const options = { type: 'timestamp' as const, format: "'week' W 'of' MMM", tz: 'UTC' };

		expect(formatDate('2026-04-15T12:00:00.000Z', options)).toBe('week 3 of Apr');
	});

	test('should compute the week of month from the zoned date', () => {
		// 2026-04-01T01:00Z is still March 31 in New York, the fifth week of March 2026
		const options = { type: 'timestamp' as const, format: "'week' W 'of' MMM", tz: 'America/New_York' };

		expect(formatDate('2026-04-01T01:00:00.000Z', options)).toBe('week 5 of Mar');
	});
});
