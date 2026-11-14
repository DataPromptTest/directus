import { format as formatOriginal, toDate } from 'date-fns';
import { getDateFNSLocale } from '@/utils/get-date-fns-locale';

type LocalizedFormat = (...a: Parameters<typeof formatOriginal>) => string;

export function getWeekOfMonth(dayOfMonth: number, dayOfWeek: number, weekStartsOn: number): number {
	const offset = (dayOfWeek - dayOfMonth + 1) % 7;
	const firstDayOfMonth = (offset + 7) % 7;
	const leadingDays = (firstDayOfMonth - weekStartsOn + 7) % 7;

	return Math.ceil((dayOfMonth + leadingDays) / 7);
}

/**
 * date-fns has no week-of-month token, so the unicode TR35 `W` symbol is replaced with the
 * week number as a quoted literal. Quoted text is left untouched.
 */
export function replaceWeekOfMonth(format: string, weekOfMonth: number): string {
	let result = '';
	let inQuotes = false;

	for (const char of format) {
		if (char === "'") {
			inQuotes = !inQuotes;
			result += char;
		} else if (char === 'W' && !inQuotes) {
			result += `'${weekOfMonth}'`;
		} else {
			result += char;
		}
	}

	return result;
}

export const localizedFormat: LocalizedFormat = (date, format, options): string => {
	const locale = getDateFNSLocale();
	const weekStartsOn = options?.weekStartsOn ?? locale?.options?.weekStartsOn ?? 0;
	const jsDate = toDate(date);
	const weekOfMonth = getWeekOfMonth(jsDate.getDate(), jsDate.getDay(), weekStartsOn);
	const resolvedFormat = replaceWeekOfMonth(format, weekOfMonth);

	return formatOriginal(date, resolvedFormat, {
		...options,
		locale,
	});
};
