import { describe, expect, test } from 'vitest';
import { localizedFormat } from '@/utils/localized-format';

describe('localizedFormat', () => {
	// 2026-04-15 falls in the third week of April 2026 (April 1st is a Wednesday)
	const date = new Date(2026, 3, 15, 12, 0, 0);

	test('should render the week of month for the W symbol', () => {
		expect(localizedFormat(date, "'week' W 'of' MMM")).toBe('week 3 of Apr');
	});

	test('should render the week of month when W is used without quotes', () => {
		expect(localizedFormat(date, 'W-MMM')).toBe('3-Apr');
	});

	test('should keep W inside quoted literals as text', () => {
		expect(localizedFormat(date, "'W' W")).toBe('W 3');
	});
});
