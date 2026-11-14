import { format as formatOriginal, startOfMonth, toDate } from 'date-fns';
import { getDateFNSLocale } from '@/utils/get-date-fns-locale';

type LocalizedFormat = (...a: Parameters<typeof formatOriginal>) => string;

/**
 * date-fns has no week-of-month token, so the unicode TR35 `W` symbol is replaced with the
 * week number as a quoted literal. Quoted text is left untouched.
 */
function replaceWeekOfMonth(date: Date, format: string, weekStartsOn: number): string {
	const leadingDays = (startOfMonth(date).getDay() - weekStartsOn + 7) % 7;
	const weekOfMonth = Math.ceil((date.getDate() + leadingDays) / 7);

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
	const resolvedFormat = replaceWeekOfMonth(toDate(date), format, weekStartsOn);

	return formatOriginal(date, resolvedFormat, {
		...options,
		locale,
	});
};
