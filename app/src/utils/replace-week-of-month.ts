import { getWeekOfMonth } from 'date-fns';
import { getDateFNSLocale } from '@/utils/get-date-fns-locale';

/**
 * date-fns does not support the Unicode TR35 week-of-month symbol `W` and throws on it.
 * Replaces unquoted `W` tokens with the week of the month, keeping quoted literals untouched.
 */
export function replaceWeekOfMonth(format: string, date: Date): string {
	if (!format.includes('W')) return format;

	const weekOfMonth = getWeekOfMonth(date, { locale: getDateFNSLocale() });
	let result = '';
	let quoted = false;

	for (let i = 0; i < format.length; i++) {
		const char = format.charAt(i);

		if (char === "'") quoted = !quoted;

		if (!quoted && char === 'W') {
			result += `'${weekOfMonth}'`;

			while (format.charAt(i + 1) === 'W') i++;
		} else {
			result += char;
		}
	}

	return result;
}
